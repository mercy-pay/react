import { act, cleanup, render } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EmbeddedCheckout } from '../src/index.js';

afterEach(cleanup);

const SECRET = `cs_${'0'.repeat(26)}_secret_${'a'.repeat(32)}`;

describe('EmbeddedCheckout', () => {
  it('shows one form, even under StrictMode, and hands its events to the latest callbacks', () => {
    const first = vi.fn();
    const latest = vi.fn();
    const { container, rerender } = render(
      <StrictMode>
        <EmbeddedCheckout clientSecret={SECRET} onSuccess={first} className="paiement" />
      </StrictMode>,
    );

    expect(container.querySelectorAll('iframe')).toHaveLength(1);
    const iframe = container.querySelector('iframe')!;
    expect(new URL(iframe.src).searchParams.get('client_secret')).toBe(SECRET);

    rerender(
      <StrictMode>
        <EmbeddedCheckout clientSecret={SECRET} onSuccess={latest} className="paiement" />
      </StrictMode>,
    );
    expect(container.querySelector('iframe')).toBe(iframe);

    act(() => {
      window.dispatchEvent(new MessageEvent('message', {
        origin: 'https://mercy-pay.com',
        source: iframe.contentWindow,
        data: { source: 'mercy-pay', type: 'payment_succeeded', checkout_session: 'cs_1', payment: 'pay_1' },
      }));
    });

    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledWith(expect.objectContaining({ payment: 'pay_1' }));
  });

  it('builds a new form for a new session, and removes it on unmount', () => {
    const other = `cs_${'1'.repeat(26)}_secret_${'b'.repeat(32)}`;
    const { container, rerender, unmount } = render(<EmbeddedCheckout clientSecret={SECRET} />);

    rerender(<EmbeddedCheckout clientSecret={other} />);
    expect(container.querySelectorAll('iframe')).toHaveLength(1);
    expect(new URL(container.querySelector('iframe')!.src).searchParams.get('client_secret')).toBe(other);

    unmount();
    expect(document.querySelector('iframe')).toBeNull();
  });
});
