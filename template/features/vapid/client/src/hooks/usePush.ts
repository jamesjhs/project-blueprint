import { useEffect, useState } from 'react';

function base64ToUint8Array(value: string): Uint8Array {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const normalized = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(normalized);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

export function usePush(): {
  isSubscribed: boolean;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
} {
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    void navigator.serviceWorker?.ready.then(async (registration) => {
      const existing = await registration.pushManager.getSubscription();
      setIsSubscribed(Boolean(existing));
    });
  }, []);

  async function subscribe(): Promise<void> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push notifications are not supported in this browser');
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission was denied');
    }

    const keyResponse = await fetch('/api/push/vapid-key');
    if (!keyResponse.ok) {
      throw new Error('Unable to load VAPID public key');
    }

    const { publicKey } = (await keyResponse.json()) as { publicKey: string };
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64ToUint8Array(publicKey),
    });

    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    });

    setIsSubscribed(true);
  }

  async function unsubscribe(): Promise<void> {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      setIsSubscribed(false);
      return;
    }

    await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });

    await subscription.unsubscribe();
    setIsSubscribed(false);
  }

  return { isSubscribed, subscribe, unsubscribe };
}
