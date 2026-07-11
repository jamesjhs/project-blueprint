import { useEffect, useId, useRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (element: string | HTMLElement, options: { sitekey: string; callback: (token: string) => void }) => string;
      remove: (widgetId: string) => void;
    };
  }
}

interface TurnstileWidgetProps {
  siteKey: string;
  onVerify: (token: string) => void;
}

const SCRIPT_ID = 'cf-turnstile-script';

export function TurnstileWidget({ siteKey, onVerify }: TurnstileWidgetProps): JSX.Element {
  const elementId = useId();
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const render = (): void => {
      const host = document.getElementById(elementId);
      if (!host || !window.turnstile || widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(host, {
        sitekey: siteKey,
        callback: onVerify,
      });
    };

    const timer = window.setInterval(render, 250);
    render();

    return () => {
      window.clearInterval(timer);
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, [elementId, onVerify, siteKey]);

  return <div id={elementId} />;
}
