import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CreditCard } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useQuery } from '@tanstack/react-query';
import { fetchUserProfileApi } from '../../api/queries';
import { createPaymentCheckout, validTopUpAmount } from './paymentCheckout';

export const TopUpScreen: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useApp();
  const text = (uz: string, ru: string, en: string) => language === 'uz' ? uz : language === 'ru' ? ru : en;
  const [amount, setAmount] = useState('500000');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const amountInput = useRef<HTMLInputElement>(null);
  const submitting = useRef(false);
  const { data: me, isPending, isError } = useQuery({ queryKey: ['currentUser'], queryFn: fetchUserProfileApi });
  const proceed = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting.current || !validTopUpAmount(Number(amount))) return;
    submitting.current = true;
    setIsSubmitting(true);
    setError('');
    try {
      const checkout = await createPaymentCheckout(Number(amount));
      window.location.assign(checkout.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : text("To'lovni boshlash imkoni bo'lmadi. Qayta urinib ko'ring.", 'Не удалось начать оплату. Попробуйте ещё раз.', 'Could not start payment. Please try again.'));
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  };
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 md:py-10">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <header className="flex items-center gap-3"><button onClick={() => navigate('/payments')} aria-label={text('Orqaga', 'Назад', 'Back')} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white focus-visible:ring-2 focus-visible:ring-brand-primary"><ArrowLeft /></button><h1 className="text-2xl font-bold">{text("Balansni to'ldirish", 'Пополнение баланса', 'Top up balance')}</h1></header>
        <section className="rounded-2xl bg-gradient-to-br from-[#010766] to-[#4858ab] p-6 text-white"><h2 className="text-sm font-semibold text-blue-100">{text('Joriy balans', 'Текущий баланс', 'Current balance')}</h2><p className="mt-2 text-3xl font-bold" aria-live="polite">{isPending ? text('Yuklanmoqda…', 'Загрузка…', 'Loading…') : isError ? text('Balans yuklanmadi', 'Не удалось загрузить баланс', 'Balance unavailable') : `${Number(me?.balance ?? 0).toLocaleString()} UZS`}</p></section>
        <form onSubmit={proceed} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
          <fieldset className="space-y-4"><legend className="font-semibold">{text("To'lov summasini tanlang", 'Выберите сумму оплаты', 'Select payment amount')}</legend><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{[50000, 100000, 500000, 1000000].map(value => <button key={value} type="button" aria-pressed={amount === String(value)} onClick={() => setAmount(String(value))} className={`min-h-12 rounded-xl border px-2 py-3 font-semibold focus-visible:ring-2 focus-visible:ring-brand-primary ${amount === String(value) ? 'border-brand-primary bg-brand-primary text-white' : 'border-slate-300 text-slate-700'}`}>{value.toLocaleString()}</button>)}<button type="button" onClick={() => { amountInput.current?.focus(); amountInput.current?.select(); }} className="min-h-12 rounded-xl border border-slate-300 px-2 py-3 font-semibold sm:col-span-2">{text('Boshqa summa', 'Другая сумма', 'Other amount')}</button></div></fieldset>
          <div className="space-y-2"><label htmlFor="top-up-amount" className="block font-semibold">{text("Summa (so'm)", 'Сумма (сум)', 'Amount (UZS)')}</label><input ref={amountInput} id="top-up-amount" type="text" inputMode="numeric" autoComplete="off" required value={amount} onChange={event => setAmount(event.target.value.replace(/\D/g, '').slice(0, 9))} aria-describedby="amount-limit" className="w-full rounded-xl border border-slate-300 p-4 text-xl font-bold focus-visible:ring-2 focus-visible:ring-brand-primary" /><p id="amount-limit" className="text-sm text-slate-600">1 000 – 100 000 000 UZS</p></div>
          <div className="flex gap-3 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600"><CreditCard aria-hidden="true" className="mt-1 shrink-0" /><p>{text("To'lov usuli va karta ma'lumotlarini provayder sahifasida tanlaysiz. Balans faqat provayder to'lovni tasdiqlagandan keyin yangilanadi.", 'Вы выберете способ оплаты и введёте данные карты на странице провайдера. Баланс обновится после подтверждения оплаты провайдером.', 'Choose your payment method and enter card details on the provider’s page. Your balance updates after the provider confirms payment.')}</p></div>
          {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
          <button type="submit" disabled={isSubmitting || !validTopUpAmount(Number(amount))} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-primary p-4 font-bold text-white disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2">{isSubmitting ? text('Yuklanmoqda…', 'Загрузка…', 'Loading…') : text("To'lovga o'tish", 'Перейти к оплате', 'Continue to payment')}<ArrowRight aria-hidden="true" size={20} /></button>
        </form>
      </div>
    </div>
  );
};
