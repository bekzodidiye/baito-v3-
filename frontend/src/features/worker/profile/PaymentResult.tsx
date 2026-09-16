import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { translations } from '../../../translations';
import { useQuery } from '@tanstack/react-query';
import { fetchTransactionsApi } from '../../../api/queries';

export const PaymentResult: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useApp();
  const t = translations[language];
  
  const transactionId = new URLSearchParams(location.search).get('transaction_id');
  const isSuccessPath = location.pathname.includes('success');
  const { data: transactions = [], isPending, isError } = useQuery({
    queryKey: ['paymentTransactions'], queryFn: fetchTransactionsApi, enabled: Boolean(transactionId),
  });
  const transaction = transactionId ? transactions.find((item: any) => item.id === transactionId) : undefined;
  const isSuccess = isSuccessPath && transaction?.status === 'paid';
  const isPendingResult = isSuccessPath && !isSuccess && !isError && (!transactionId || isPending || transaction?.status === 'pending');
  const title = isPendingResult
    ? (language === 'uz' ? 'To‘lov tekshirilmoqda' : language === 'ru' ? 'Платёж проверяется' : 'Payment is being verified')
    : isSuccess ? t.paymentSuccessTitle : t.paymentErrorTitle;
  const body = isPendingResult
    ? (language === 'uz' ? 'Balans provayder tasdig‘idan keyin yangilanadi.' : language === 'ru' ? 'Баланс обновится после подтверждения провайдера.' : 'Your balance will update after the provider confirms the payment.')
    : isSuccess ? t.paymentSuccessBody : t.paymentErrorBody;

  return (
    <div className="w-full max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 flex flex-col items-center text-center w-full max-w-sm">
        
        {isPendingResult ? (
          <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6" role="status" aria-label={title}>⏳</div>
        ) : isSuccess ? (
          <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 size={40} className="stroke-[2.5]" />
          </div>
        ) : (
          <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
            <XCircle size={40} className="stroke-[2.5]" />
          </div>
        )}

        <h1 className="font-display font-black text-2xl text-slate-800 mb-2">
          {title}
        </h1>

        <p className="text-sm text-slate-500 font-medium mb-8">
          {body}
        </p>

        <button 
          onClick={() => navigate('/payments')}
          className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft size={18} />
          {t.paymentResultBack}
        </button>
      </div>
    </div>
  );
};

export default PaymentResult;
