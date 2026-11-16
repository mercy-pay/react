import { useCallback, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';

/**
 * What your server answers when it has created the checkout session: its checkout_url, or
 * the whole session. Never create the session in the browser: the API key stays on your server.
 */
export type CreateSession = () => Promise<string | { checkout_url: string }>;

export interface UseCheckout {
  /** Asks your server for a session, then sends the customer to the payment page. */
  start: () => Promise<void>;
  /** True from the click until the page changes. */
  pending: boolean;
  error: Error | null;
}

/** Only an http(s) address is followed: a javascript: or data: URL is refused. */
export function checkoutUrlFrom(answer: string | { checkout_url: string }): string {
  const raw = typeof answer === 'string' ? answer : answer?.checkout_url;
  let url: URL;
  try {
    url = new URL(String(raw));
  } catch {
    throw new Error('Adresse de paiement invalide.');
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('Adresse de paiement invalide.');
  }
  return url.toString();
}

export function useCheckout(createSession: CreateSession, navigate: (url: string) => void = (url) => window.location.assign(url)): UseCheckout {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const start = useCallback(async () => {
    setPending(true);
    setError(null);
    try {
      navigate(checkoutUrlFrom(await createSession()));
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error(String(caught)));
      setPending(false);
    }
  }, [createSession, navigate]);

  return { start, pending, error };
}

export interface CheckoutButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'onError'> {
  createSession: CreateSession;
  /** Shown while the session is being created. The children stay by default. */
  pendingLabel?: ReactNode;
  onError?: (error: Error) => void;
  /** @internal for tests and custom routers. */
  navigate?: (url: string) => void;
}

/**
 * A plain button, styled by you, that opens the Mercy Pay payment page.
 *
 * ```tsx
 * <CheckoutButton createSession={() => fetch('/api/checkout', { method: 'POST' }).then((r) => r.json())}>
 *   Payer 15 000 FCFA
 * </CheckoutButton>
 * ```
 */
export function CheckoutButton({ createSession, pendingLabel, onError, navigate, children, disabled, type = 'button', ...props }: CheckoutButtonProps) {
  const { start, pending } = useCheckout(
    useCallback(async () => {
      try {
        return await createSession();
      } catch (error) {
        onError?.(error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    }, [createSession, onError]),
    navigate,
  );

  return (
    <button {...props} type={type} disabled={disabled || pending} aria-busy={pending || undefined} onClick={() => void start()}>
      {pending && pendingLabel !== undefined ? pendingLabel : children}
    </button>
  );
}
