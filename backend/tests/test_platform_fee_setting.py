"""The commission rate comes from the admin panel, and holds still to its deal.

"Platforma Komissiyasi (%)" has been a field on the settings screen all along.
It saved, it reloaded, and nothing read it: the rate lived in
``escrow_service.PLATFORM_FEE_PERCENT`` as the literal 10, so every payout took
10% whatever an administrator typed.

The second half of this is the timing. The rate can change between a worker
being hired and the shift being paid out, and the worker is quoted their net
wage when they apply. So the rate is pinned onto the escrow hold and read back
from there — a rate change applies to the next hire, never to money already
frozen.
"""

import uuid

from app.models.application import Application
from app.models.job import JobStatus
from app.models.system_setting import SystemSetting
from app.models.transaction import Transaction
from app.services.escrow_service import EscrowService, platform_fee_percent
from app.db.session import SessionLocal

from .conftest import login, make_job, make_user

WAGE = 300_000


def _phone():
    return f"+9989{uuid.uuid4().int % 10**8:08d}"


def _set_rate(percent: int) -> None:
    with SessionLocal() as db:
        row = db.query(SystemSetting).first()
        if not row:
            row = SystemSetting(id="singleton")
            db.add(row)
        row.platformFeePercent = percent
        db.commit()


def _hire(wage: int = WAGE):
    """An employer with a worker hired and the wage frozen in escrow."""
    employer = make_user(role="employer", phone=_phone(), balance=5_000_000)
    worker = make_user(phone=_phone(), balance=0)
    job = make_job(employer.id, status=JobStatus.CONFIRMED,
                   hiredWorkerId=worker.id, salary=str(wage))
    with SessionLocal() as db:
        db.add(Application(jobId=job.id, workerId=worker.id, status="hired"))
        db.commit()
        EscrowService.hold_funds(db, employer.id, job.id, wage)
        db.commit()
    return employer, worker, job


def _release(job_id: str, worker_id: str) -> None:
    with SessionLocal() as db:
        EscrowService.release_funds(db, job_id=job_id, worker_id=worker_id)
        db.commit()


def _balance(user_id: str) -> int:
    with SessionLocal() as db:
        from app.models.user import User
        return db.query(User).filter(User.id == user_id).first().balance or 0


# --- the rate an administrator sets is the rate that is taken ---------------

def test_the_configured_rate_is_what_comes_out_of_the_wage():
    _set_rate(20)
    _employer, worker, job = _hire()

    _release(job.id, worker.id)

    # 20% of 300 000, not the 10% that used to be compiled in.
    assert _balance(worker.id) == 240_000


def test_a_zero_rate_pays_the_whole_wage():
    """0 is a rate, not a missing value.

    Worth its own case because zero is exactly what a `x or default` reads as
    absent — the settings form had that bug, and the fee maths must not.
    """
    _set_rate(0)
    _employer, worker, job = _hire()

    _release(job.id, worker.id)

    assert _balance(worker.id) == WAGE


def test_with_no_settings_row_at_all_the_default_still_applies():
    """A database nobody has configured yet."""
    with SessionLocal() as db:
        db.query(SystemSetting).delete()
        db.commit()
        assert platform_fee_percent(db) == 10

    _employer, worker, job = _hire()
    _release(job.id, worker.id)

    assert _balance(worker.id) == 270_000


# --- and it holds to the rate the hire was made under -----------------------

def test_raising_the_rate_does_not_reach_back_into_frozen_money():
    """The worker agreed to a wage under one rate; that is the one they get."""
    _set_rate(10)
    _employer, worker, job = _hire()

    _set_rate(45)
    _release(job.id, worker.id)

    assert _balance(worker.id) == 270_000  # 10%, the rate at hiring


def test_the_new_rate_applies_to_the_next_hire():
    _set_rate(10)
    _employer_a, worker_a, job_a = _hire()

    _set_rate(30)
    _employer_b, worker_b, job_b = _hire()

    _release(job_a.id, worker_a.id)
    _release(job_b.id, worker_b.id)

    assert _balance(worker_a.id) == 270_000
    assert _balance(worker_b.id) == 210_000


def test_a_hold_taken_before_rates_were_recorded_uses_the_current_one():
    """Rows that predate the feePercent column carry no rate of their own."""
    _set_rate(10)
    _employer, worker, job = _hire()
    with SessionLocal() as db:
        hold = db.query(Transaction).filter(Transaction.jobId == job.id).first()
        hold.feePercent = None
        db.commit()

    _set_rate(25)
    _release(job.id, worker.id)

    assert _balance(worker.id) == 225_000


# --- what the worker is told matches what they are paid ---------------------

def test_the_worker_is_quoted_the_rate_their_job_was_hired_under(client):
    _set_rate(10)
    _employer, worker, job = _hire()

    _set_rate(50)
    login(client, worker)
    app_row = client.get("/api/v1/applications/worker").json()[0]

    # Quoted against the hire's own rate, not the one in force today.
    assert app_row["expectedAmount"] == 270_000


def test_a_finished_job_reports_the_fee_that_was_actually_taken(client):
    _set_rate(15)
    _employer, worker, job = _hire()
    _release(job.id, worker.id)
    with SessionLocal() as db:
        row = db.query(Application).filter(Application.jobId == job.id).first()
        row.status = "completed"
        db.commit()

    login(client, worker)
    app_row = client.get("/api/v1/applications/worker").json()[0]

    assert app_row["earnedAmount"] == _balance(worker.id) == 255_000


def test_an_unhired_application_is_quoted_at_todays_rate(client):
    """Nothing is frozen yet, so there is no agreed rate to hold to."""
    _set_rate(40)
    employer = make_user(role="employer", phone=_phone(), balance=5_000_000)
    worker = make_user(phone=_phone())
    job = make_job(employer.id, salary=str(WAGE))
    with SessionLocal() as db:
        db.add(Application(jobId=job.id, workerId=worker.id, status="applied"))
        db.commit()

    login(client, worker)
    app_row = client.get("/api/v1/applications/worker").json()[0]

    assert app_row["expectedAmount"] == 180_000


# --- the setting is reachable from the admin panel --------------------------

def test_saving_zero_percent_through_the_api_sticks(client):
    admin = make_user(role="admin", phone=_phone())
    login(client, admin)

    resp = client.put("/api/v1/admin/settings", json={"platformFeePercent": 0})

    assert resp.status_code == 200, resp.text
    with SessionLocal() as db:
        assert platform_fee_percent(db) == 0
