import React, { useRef, useState } from 'react';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addPaymentCardApi } from '../../api/queries';
import { useApp } from '../../context/AppContext';

// This API stores a card reference, not payment credentials. Authentication
// belongs to the provider; never collect or send PAN, CVV or expiry here.
export const AddCardScreen: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useApp();
  const queryClient = useQueryClient();
  const text = (uz: string, ru: string, en: string) => language === 'uz' ? uz : language === 'ru' ? ru : en;
  const [type, setType] = useState('uzcard');
  const [last4, setLast4] = useState('');
  const [bank, setBank] = useState('');
  const [agreed, setAgreed] = useState(false);
  const submitting = useRef(false);
  const addCard = useMutation({
    mutationFn: addPaymentCardApi,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['paymentCards'] });
      navigate('/payments/my-cards');
    },
  });
  const valid = /^\d{4}$/.test(last4) && bank.trim().length > 0 && bank.trim().length <= 60 && agreed;
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid || submitting.current) return;
    submitting.current = true;
    try { await addCard.mutateAsync({ type, last4, bank: bank.trim() }); }
    catch { /* Keep the form and show the mutation error. */ }
    finally { submitting.current = false; }
  };
  const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary';
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 md:py-10">
      <div className="mx-auto w-full max-w-xl space-y-6">
        <header className="flex items-center gap-3">
          <button onClick={() => navigate('/payments')} aria-label={text('Orqaga', 'Назад', 'Back')} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white focus-visible:ring-2 focus-visible:ring-brand-primary"><ArrowLeft /></button>
          <h1 className="text-2xl font-bold text-slate-900">{text("Karta ma'lumotlarini saqlash", 'Сохранить сведения о карте', 'Save a card reference')}</h1>
        </header>
        <div className="rounded-2xl bg-brand-primary p-6 text-white">
          <CreditCard aria-hidden="true" className="mb-4" />
          <p className="text-lg font-semibold">{bank || text('Bank nomi', 'Название банка', 'Bank name')}</p>
          <p className="mt-4 font-mono text-xl tracking-widest">•••• •••• •••• {last4.padEnd(4, '•')}</p>
          <p className="mt-3 text-sm uppercase">{type}</p>
        </div>
        <form onSubmit={submit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
          <p className="text-sm leading-6 text-slate-600">{text("Bu yozuv kartangizni tanib olish uchun saqlanadi. To'lovni tasdiqlash provayder sahifasida amalga oshiriladi. To'liq karta raqami, amal qilish muddati va CVV bu yerda so'ralmaydi.", 'Эта запись помогает распознать карту. Подтверждение платежа проходит на странице провайдера. Полный номер, срок действия и CVV здесь не запрашиваются.', 'This reference helps you identify your card. Payments are authorised on the provider’s page. We do not ask for the full card number, expiry date or CVV here.')}</p>
          <div className="space-y-2"><label htmlFor="card-type" className="block font-semibold">{text('Karta turi', 'Тип карты', 'Card type')}</label><select id="card-type" value={type} onChange={event => setType(event.target.value)} className={inputClass}><option value="uzcard">Uzcard</option><option value="humo">Humo</option><option value="visa">Visa</option><option value="mastercard">Mastercard</option></select></div>
          <div className="space-y-2"><label htmlFor="card-last4" className="block font-semibold">{text('Kartaning oxirgi 4 raqami', 'Последние 4 цифры карты', 'Last 4 digits of the card')}</label><input id="card-last4" inputMode="numeric" autoComplete="off" pattern="[0-9]{4}" maxLength={4} required value={last4} onChange={event => setLast4(event.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="1234" className={inputClass} /></div>
          <div className="space-y-2"><label htmlFor="card-bank" className="block font-semibold">{text('Bank nomi', 'Название банка', 'Bank name')}</label><input id="card-bank" required maxLength={60} value={bank} onChange={event => setBank(event.target.value)} placeholder="Kapitalbank" className={inputClass} /></div>
          <div className="flex items-start gap-3"><input id="card-consent" type="checkbox" required checked={agreed} onChange={event => setAgreed(event.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary" /><div className="text-sm leading-6"><label htmlFor="card-consent">{text("Ushbu ma'lumotlarni saqlashga roziman.", 'Я согласен сохранить эти сведения.', 'I agree to save this information.')}</label>{' '}<Link to="/terms" className="text-brand-primary underline" target="_blank" rel="noopener noreferrer">{text('Foydalanish shartlari', 'Условия использования', 'Terms of use')}</Link></div></div>
          {addCard.isError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{addCard.error instanceof Error ? addCard.error.message : text("Saqlanmadi. Qayta urinib ko'ring.", 'Не удалось сохранить. Попробуйте ещё раз.', 'Could not save. Please try again.')}</p>}
          <button type="submit" disabled={!valid || addCard.isPending} className="min-h-12 w-full rounded-xl bg-brand-primary px-4 py-3 font-bold text-white disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2">{addCard.isPending ? text('Saqlanmoqda…', 'Сохранение…', 'Saving…') : text('Saqlash', 'Сохранить', 'Save reference')}</button>
        </form>
      </div>
    </div>
  );
};
