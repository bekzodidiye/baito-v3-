from sqlalchemy.orm import Session
from fastapi import HTTPException
from app import models
from app.models.audit_ledger import AuditLedger
from app.models.transaction import Transaction
import uuid

# Used only when nothing has been configured — a fresh database with no
# settings row yet. The live rate is the one an administrator set, and
# ``platform_fee_percent`` below is the only thing that should be read.
DEFAULT_PLATFORM_FEE_PERCENT = 10

# Kept for callers that imported it before the rate became configurable.
PLATFORM_FEE_PERCENT = DEFAULT_PLATFORM_FEE_PERCENT


def platform_fee_percent(db: Session) -> int:
    """The commission rate an administrator set, from the settings row.

    This used to be a module constant, so the "Platforma Komissiyasi (%)" field
    in the admin panel wrote a number that nothing ever read: every payout took
    10% no matter what was saved there.

    Falls back to the default when there is no settings row at all, which is
    only the case on a database nobody has configured yet.
    """
    row = (
        db.query(models.SystemSetting)
        .filter(models.SystemSetting.id == "singleton")
        .first()
    ) or db.query(models.SystemSetting).first()
    percent = getattr(row, "platformFeePercent", None)
    if percent is None:
        return DEFAULT_PLATFORM_FEE_PERCENT
    # The settings endpoint bounds this to 0..50 on the way in; clamp on the way
    # out too, so a row edited by hand cannot pay a worker a negative wage.
    return max(0, min(100, int(percent)))


def fee_for(amount_uzs: int, percent: int) -> int:
    """The commission on an amount, rounded down so the worker never loses a
    whole so'm to rounding that the platform then keeps."""
    return int(amount_uzs * (percent / 100.0))

class EscrowService:
    """Escrow vault for the marketplace.

    TRANSACTIONS: these methods never commit. They ``flush()`` so the caller can
    read back generated ids, and leave the commit to the request handler.

    They used to commit internally while their callers committed again, which
    meant a failure between the two left money frozen against a job nobody was
    hired for — and, when completing a multi-worker job, paid some workers and
    not others while the job was already marked complete. Holding one
    transaction per request makes each of those operations all-or-nothing.
    """
    @staticmethod
    def hold_funds(db: Session, employer_id: str, job_id: str, amount_uzs: int,
                   job_day_id: str | None = None) -> Transaction:
        employer = (db.query(models.User).filter(models.User.id == employer_id)
                    .populate_existing()
                    .with_for_update().first())
        if not employer or (employer.balance or 0) < amount_uzs:
            raise HTTPException(status_code=400, detail="Ish beruvchi balansida yetarli mablag' mavjud emas (Escrow HOLD)")

        # Deduct and freeze
        employer.balance = (employer.balance or 0) - amount_uzs
        db.add(employer)

        tx = Transaction(
            id=str(uuid.uuid4()),
            jobId=job_id,
            # One hold per day of the posting, so a day can be released when it
            # is worked and refunded when it is not. Null for a job booked
            # before days existed, which still has a single hold for the lot.
            jobDayId=job_day_id,
            employerId=employer.id,
            amount=amount_uzs * 100,
            # Pinned here, not read again at payout: the worker was quoted a net
            # wage against this rate when they applied.
            feePercent=platform_fee_percent(db),
            type="escrow_hold",
            status="held"
        )
        db.add(tx)

        # Audit ledger record
        ledger = AuditLedger(
            userId=employer.id,
            amountDelta=-amount_uzs,
            balanceAfter=employer.balance,
            entryType="escrow_hold",
            referenceType="job",
            referenceId=job_id,
            description=f"Ish e'loni uchun mablag' muzlatildi ({amount_uzs} so'm)"
        )
        db.add(ledger)
        db.flush()
        return tx

    @staticmethod
    def release_funds(db: Session, job_id: str, worker_id: str,
                      job_day_id: str | None = None,
                      count_completed_job: bool = True) -> Transaction:
        # Flush before taking any lock below. populate_existing() overwrites
        # what is in the session with the row as the database has it, which is
        # the point — but it cannot tell a stale attribute from one the caller
        # has just set and not yet written. The completion flow assigns the
        # worker's new rating and then calls this, and without the flush that
        # rating was silently thrown away.
        db.flush()

        # Find active escrow hold
        query = db.query(Transaction).filter(
            Transaction.jobId == job_id,
            Transaction.type == "escrow_hold",
            Transaction.status == "held",
        )
        if job_day_id:
            # Exactly this day's money. Without the filter, finishing one day of
            # a three-day shift would release whichever hold came back first —
            # so a day could be paid twice and another not at all.
            query = query.filter(Transaction.jobDayId == job_day_id)
        tx = query.populate_existing().with_for_update().first()

        if not tx:
            raise HTTPException(status_code=404, detail="Ushbu ish uchun muzlatilgan mablag' topilmadi")

        total_amount = tx.amount // 100 # convert tiyin to UZS
        # The rate this hold was taken under. Older holds carry none, and for
        # those the current setting is what they would have used anyway.
        percent = tx.feePercent if tx.feePercent is not None else platform_fee_percent(db)
        platform_fee = fee_for(total_amount, percent)
        worker_payout = total_amount - platform_fee

        worker = db.query(models.User).filter(models.User.id == worker_id).populate_existing().with_for_update().first()
        if not worker:
            raise HTTPException(status_code=404, detail="Ishchi topilmadi")

        # Credit worker balance
        worker.balance = (worker.balance or 0) + worker_payout
        # A three-day shift is one job the worker did, not three. The counter
        # is bumped once, when the posting as a whole finishes — otherwise a
        # single week's work would read as a career.
        if count_completed_job:
            worker.completedJobsCount = (worker.completedJobsCount or 0) + 1
        db.add(worker)

        # Update escrow tx
        tx.status = "released"
        tx.workerId = worker.id
        tx.platformFee = platform_fee * 100
        db.add(tx)

        # Ledger for worker
        ledger_worker = AuditLedger(
            userId=worker.id,
            amountDelta=worker_payout,
            balanceAfter=worker.balance,
            entryType="escrow_release",
            referenceType="job",
            referenceId=job_id,
            description=f"Ish muvaffaqiyatli yakunlandi: to'lov o'tkazildi ({worker_payout} so'm)"
        )
        db.add(ledger_worker)
        db.flush()
        return tx

    @staticmethod
    def pay_completion_bonus(
        db: Session, job_id: str, employer_id: str, worker_id: str, amount_uzs: int
    ) -> None:
        """Move a completion bonus from the employer to the worker.

        The bonus is decided at completion, so unlike the wage nothing was
        escrowed for it at hire — the employer is debited here, at the moment
        they choose to give it.

        No platform fee. The completion modal tells the employer "Kiritilgan
        summa ishchining balansiga qo'shiladi" — *the amount entered* is added
        to the worker's balance — and taking a cut would make that sentence
        false.

        Callers must check the employer can cover the total before changing
        any state; this raises rather than paying a partial bonus.
        """
        if amount_uzs <= 0:
            return

        employer = (db.query(models.User).filter(models.User.id == employer_id)
                    .populate_existing().with_for_update().first())
        if not employer or (employer.balance or 0) < amount_uzs:
            raise HTTPException(
                status_code=400,
                detail="Bonus uchun ish beruvchi balansida yetarli mablag' yo'q",
            )

        worker = (db.query(models.User).filter(models.User.id == worker_id)
                  .populate_existing().with_for_update().first())
        if not worker:
            raise HTTPException(status_code=404, detail="Ishchi topilmadi")

        employer.balance = (employer.balance or 0) - amount_uzs
        worker.balance = (worker.balance or 0) + amount_uzs
        db.add(employer)
        db.add(worker)

        db.add(Transaction(
            id=str(uuid.uuid4()),
            jobId=job_id,
            employerId=employer.id,
            workerId=worker.id,
            amount=amount_uzs * 100,
            type="completion_bonus",
            status="released",
        ))
        db.add(AuditLedger(
            userId=employer.id, amountDelta=-amount_uzs,
            balanceAfter=employer.balance, entryType="completion_bonus",
            referenceType="job", referenceId=job_id,
            description=f"Ishchiga bonus to'landi ({amount_uzs} so'm)",
        ))
        db.add(AuditLedger(
            userId=worker.id, amountDelta=amount_uzs,
            balanceAfter=worker.balance, entryType="completion_bonus",
            referenceType="job", referenceId=job_id,
            description=f"Ish yakunlangani uchun bonus ({amount_uzs} so'm)",
        ))
        db.flush()

    @staticmethod
    def refund_funds(db: Session, job_id: str) -> list[Transaction]:
        # Flush before taking any lock below. populate_existing() overwrites
        # what is in the session with the row as the database has it, which is
        # the point — but it cannot tell a stale attribute from one the caller
        # has just set and not yet written. The completion flow assigns the
        # worker's new rating and then calls this, and without the flush that
        # rating was silently thrown away.
        db.flush()

        # Every hold still outstanding, not just the first one found. A
        # multi-day posting has one hold per day, so cancelling it used to
        # refund a single day and quietly keep the rest of the employer's money
        # frozen against a job that no longer existed. Days already worked and
        # released are not "held" and are correctly left alone.
        holds = db.query(Transaction).filter(
            Transaction.jobId == job_id,
            Transaction.type == "escrow_hold",
            Transaction.status == "held"
        ).populate_existing().with_for_update().all()

        if not holds:
            raise HTTPException(status_code=404, detail="Muzlatilgan mablag' topilmadi")

        # The employer is fetched once, outside the loop. populate_existing()
        # overwrites the in-session row with what the database holds, so
        # re-fetching per hold threw away the credit from the previous
        # iteration: three days were marked refunded and reported refunded, and
        # one day's money actually arrived.
        employers: dict[str, models.User] = {}
        for tx in holds:
            refund_amount = tx.amount // 100
            employer = employers.get(tx.employerId)
            if employer is None:
                employer = db.query(models.User).filter(
                    models.User.id == tx.employerId
                ).populate_existing().with_for_update().first()
                if employer is not None:
                    employers[tx.employerId] = employer

            if employer:
                employer.balance = (employer.balance or 0) + refund_amount
                db.add(employer)

            tx.status = "refunded"
            db.add(tx)

            db.add(AuditLedger(
                userId=tx.employerId,
                amountDelta=refund_amount,
                balanceAfter=employer.balance if employer else 0,
                entryType="refund",
                referenceType="job",
                referenceId=job_id,
                description=f"Bekor qilingan ish bo'yicha mablag' qaytarildi ({refund_amount} so'm)"
            ))

        db.flush()
        return holds
