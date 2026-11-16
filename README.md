# Mercy Pay pour React

Un bouton et un hook qui envoient le client sur la page de paiement hébergée de [Mercy Pay](https://mercy-pay.com). Aucun style imposé, aucune donnée de carte dans votre app.

```sh
npm install @mercy-pay/react
```

La session de paiement se crée **sur votre serveur**, avec votre clé API ([`@mercy-pay/node`](https://github.com/mercy-pay/mercy-pay-node), [`@mercy-pay/next`](https://github.com/mercy-pay/next) ou un autre SDK). Le bouton appelle votre serveur, puis ouvre la page renvoyée.

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
