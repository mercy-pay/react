import { embedCheckout, type Appearance, type EmbedCheckoutOptions } from '@mercy-pay/js';
import { useEffect, useRef, type CSSProperties } from 'react';

export type { Appearance, CheckoutEvent } from '@mercy-pay/js';

type Callbacks = Pick<EmbedCheckoutOptions, 'onReady' | 'onProcessing' | 'onSuccess' | 'onFailure' | 'onExpired' | 'onError' | 'onEvent'>;

export interface EmbeddedCheckoutProps extends Callbacks {
  /** The `client_secret` of a session created on your server with `ui_mode: "embedded"`. */
  clientSecret: string;
  appearance?: Appearance;
  /** Follows the form's height. `true` by default. */
  autoResize?: boolean;
  className?: string;
  style?: CSSProperties;
  /** @internal Another Mercy Pay address, for tests. */
  baseUrl?: string;
}

/**
 * The Mercy Pay payment form, in your page: mobile money, card with 3D Secure, Apple Pay and
 * Google Pay on your verified sites.
 *
 * ```tsx
 * <EmbeddedCheckout clientSecret={clientSecret} onSuccess={() => router.push('/merci')} />
 * ```
 */
export function EmbeddedCheckout({ clientSecret, appearance, autoResize, className, style, baseUrl, ...callbacks }: EmbeddedCheckoutProps) {
  const container = useRef<HTMLDivElement>(null);
  // The latest callbacks, without rebuilding the form each time the parent renders.
  const latest = useRef<Callbacks>(callbacks);
  latest.current = callbacks;

  const theme = appearance?.theme;
  const color = appearance?.color;
  const radius = appearance?.radius;

  useEffect(() => {
    if (container.current === null) {
      return;
    }

    const checkout = embedCheckout({
      clientSecret,
      appearance: { theme, color, radius },
      autoResize,
      baseUrl,
      onReady: (event) => latest.current.onReady?.(event),
      onProcessing: (event) => latest.current.onProcessing?.(event),
      onSuccess: (event) => latest.current.onSuccess?.(event),
      onFailure: (event) => latest.current.onFailure?.(event),
      onExpired: (event) => latest.current.onExpired?.(event),
      onError: (event) => latest.current.onError?.(event),
      onEvent: (event) => latest.current.onEvent?.(event),
    }).mount(container.current);

    return () => checkout.destroy();
  }, [clientSecret, theme, color, radius, autoResize, baseUrl]);

  return <div ref={container} className={className} style={style} />;
}
