"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: { sitekey: string; callback: (token: string) => void; "expired-callback"?: () => void }) => string;
    };
  }
}

/** E1.4: widget visible de Cloudflare Turnstile — el token que genera se
 * verifica de verdad contra la API de Cloudflare en el servidor
 * (`server/domain/captcha.ts`), esto solo lo recolecta. */
export function WidgetTurnstile({ onToken }: { onToken: (token: string) => void }) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const yaRenderizado = useRef(false);

  useEffect(() => {
    const intentarRenderizar = () => {
      if (yaRenderizado.current || !contenedorRef.current || !window.turnstile) return;
      yaRenderizado.current = true;
      window.turnstile.render(contenedorRef.current, {
        sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!,
        callback: onToken,
        "expired-callback": () => onToken(""),
      });
    };

    intentarRenderizar();
    const id = setInterval(intentarRenderizar, 300);
    return () => clearInterval(id);
  }, [onToken]);

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
      <div ref={contenedorRef} />
    </>
  );
}
