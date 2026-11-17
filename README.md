# Mercy Pay pour React

Deux façons d'encaisser avec [Mercy Pay](https://mercy-pay.com), sans donnée de carte dans votre app :

- `<EmbeddedCheckout>` affiche le formulaire de paiement dans votre page : mobile money, carte avec la 3D Secure, Apple Pay et Google Pay sur vos sites vérifiés ;
- `<CheckoutButton>` et `useCheckout()` envoient le client sur la page de paiement hébergée.

```sh
npm install @mercy-pay/react
```

La session de paiement se crée **sur votre serveur**, avec votre clé API ([`@mercy-pay/node`](https://github.com/mercy-pay/mercy-pay-node), [`@mercy-pay/next`](https://github.com/mercy-pay/next) ou un autre SDK). Le bouton appelle votre serveur, puis ouvre la page renvoyée.

## Le formulaire dans votre page

Votre serveur crée la session avec `ui_mode: "embedded"` et renvoie son `client_secret`. Votre site doit être déclaré dans **Paramètres > Paiements** ; en sandbox, `localhost` marche tout de suite.

```tsx
import { EmbeddedCheckout } from '@mercy-pay/react';

<EmbeddedCheckout
  clientSecret={clientSecret}
  appearance={{ theme: 'light', radius: 12 }}
  onSuccess={() => router.push('/commande/4821/merci')}
  onError={() => setClientSecret(null)}
/>
```

Le cadre suit la hauteur du formulaire. Les événements : `onReady`, `onProcessing`, `onSuccess`, `onFailure`, `onExpired`, `onError`, et `onEvent` pour tous. Voir le [guide du paiement intégré](https://docs.mercy-pay.com/payments/embedded).

## Le bouton

```tsx
import { CheckoutButton } from '@mercy-pay/react';

<CheckoutButton
  className="btn btn-primary"
  createSession={() => fetch('/api/checkout', { method: 'POST' }).then((response) => response.json())}
  pendingLabel="Un instant…"
  onError={() => toast("Le paiement n'a pas pu démarrer, réessayez.")}
>
  Payer 15 000 FCFA
</CheckoutButton>
```

`createSession` renvoie l'adresse `checkout_url`, ou la session entière. Pendant l'attente, le bouton est désactivé et porte `aria-busy`. Seule une adresse `http` ou `https` est suivie.

Avec une action serveur Next.js : `createSession={() => createCheckout(order.id)}`, où l'action renvoie `session.checkout_url`.

## Le hook

```tsx
import { useCheckout } from '@mercy-pay/react';

function PayButton({ orderId }: { orderId: string }) {
  const { start, pending, error } = useCheckout(() => createCheckout(orderId));

  return (
    <>
      <button onClick={start} disabled={pending}>{pending ? 'Un instant…' : 'Payer'}</button>
      {error && <p role="alert">Le paiement n'a pas pu démarrer.</p>}
    </>
  );
}
```

## Après le paiement

Le client revient sur votre `success_url`. Ne marquez pas la commande comme payée sur ce retour : attendez le webhook `payment.succeeded`, signé, reçu par votre serveur.
