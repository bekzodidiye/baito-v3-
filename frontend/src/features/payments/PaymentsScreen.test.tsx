import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('../../context/AppContext', () => ({ useApp: () => ({ language: 'uz' }) }));
vi.mock('../../hooks/useCurrentScreen', () => ({
  useCurrentScreen: () => ({ setCurrentScreen: vi.fn() }),
}));
vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: (sel: (s: unknown) => unknown) => sel({ userProfile: { name: 'Ishchi' } }),
}));
vi.mock('./PaymentModals', () => ({ PaymentModals: () => null }));
vi.mock('../../api/queries', () => ({
  fetchPaymentCardsApi: vi.fn().mockResolvedValue([]),
  addPaymentCardApi: vi.fn(),
  // A worker with no history at all — the state the screen used to fill in.
  fetchTransactionsApi: vi.fn().mockResolvedValue([]),
  requestWithdrawalApi: vi.fn(),
  fetchUserProfileApi: vi.fn().mockResolvedValue({ balance: 0 }),
}));

import { PaymentsScreen } from './PaymentsScreen';

afterEach(cleanup);

const renderScreen = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <PaymentsScreen />
    </QueryClientProvider>,
  );
};

describe('PaymentsScreen — an empty history stays empty', () => {
  it('shows the empty state', async () => {
    renderScreen();
    expect(await screen.findByText(/Tranzaksiyalar yo'q/i)).toBeTruthy();
  });

  it('invents no transactions to fill the space', async () => {
    renderScreen();
    await screen.findByText(/Tranzaksiyalar yo'q/i);
    const page = document.body.textContent ?? '';
    // The placeholder rows that used to render underneath the empty state.
    expect(page).not.toContain('Lobia Machida');
    expect(page).not.toContain('45,000');
    expect(page).not.toContain('20,000');
    expect(page).not.toContain('4521');
    expect(page).not.toContain('2023');
  });

  it('shows no completed-payment badge when nothing was paid', async () => {
    renderScreen();
    await screen.findByText(/Tranzaksiyalar yo'q/i);
    // "Bajarildi" is rendered only by a transaction row. ("Kutilmoqda" is not
    // a usable signal here — the balance summary cards above use it too.)
    expect(document.body.textContent ?? '').not.toContain('Bajarildi');
  });
});
