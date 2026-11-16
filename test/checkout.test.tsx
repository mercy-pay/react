import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CheckoutButton, checkoutUrlFrom } from '../src/index.js';

afterEach(cleanup);

describe('CheckoutButton', () => {
  it('asks the server for a session, then goes to its page', async () => {
    const navigate = vi.fn();
    let resolve!: (value: { checkout_url: string }) => void;
    const createSession = vi.fn(() => new Promise<{ checkout_url: string }>((done) => (resolve = done)));

    render(<CheckoutButton createSession={createSession} navigate={navigate} pendingLabel="Un instant…">Payer</CheckoutButton>);
    fireEvent.click(screen.getByRole('button', { name: 'Payer' }));

    const button = await screen.findByRole('button', { name: 'Un instant…' });
    expect(button).toHaveProperty('disabled', true);
    expect(button.getAttribute('aria-busy')).toBe('true');

    await act(async () => resolve({ checkout_url: 'https://mercy-pay.com/paiement/01J9' }));
    expect(navigate).toHaveBeenCalledWith('https://mercy-pay.com/paiement/01J9');
    expect(createSession).toHaveBeenCalledOnce();
  });

  it('gives the error back and lets the customer try again', async () => {
    const onError = vi.fn();
    const navigate = vi.fn();
    render(<CheckoutButton createSession={() => Promise.reject(new Error('Serveur indisponible'))} onError={onError} navigate={navigate}>Payer</CheckoutButton>);

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Serveur indisponible' })));
    await waitFor(() => expect(screen.getByRole('button')).toHaveProperty('disabled', false));
    expect(navigate).not.toHaveBeenCalled();
  });
});

describe('checkoutUrlFrom', () => {
  it('only follows http and https addresses', () => {
    expect(checkoutUrlFrom('https://mercy-pay.com/paiement/x')).toBe('https://mercy-pay.com/paiement/x');
    expect(() => checkoutUrlFrom('javascript:alert(1)')).toThrow();
    expect(() => checkoutUrlFrom({ checkout_url: 'pas une adresse' })).toThrow();
  });
});
