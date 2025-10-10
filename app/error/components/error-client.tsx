
"use client";

import { useState } from "react";

export default function ClientActions({ errorCode, shortMsg, longDetails, origin }: { errorCode: string; shortMsg: string; longDetails: string; origin: string }) {
  const [copied, setCopied] = useState(false);
  const [reporting, setReporting] = useState(false);

  const payload = `Error code: ${errorCode}\nMessage: ${shortMsg}\n\nDetails:\n${longDetails}`;

  function handleRetry() {
    if (typeof window !== "undefined") {
      if (origin) {
        window.location.href = origin;
      } else {
        window.location.href = "/";
      }
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
    }
  }

  function handleReport() {
    setReporting(true);
    const subject = encodeURIComponent(`Bug report — ${errorCode}`);
    const body = encodeURIComponent(`${payload}\n\nURL: ${window.location.href}\nTime: ${new Date().toISOString()}`);
    const mailto = `mailto:hello@example.com?subject=${subject}&body=${body}`;
    // open mail client
    window.location.href = mailto;
    setTimeout(() => setReporting(false), 1500);
  }

  return (
    <>
      <button onClick={handleRetry} className="btn btn-primary btn-sm">Reintentar</button>
      <button onClick={handleCopy} className="btn btn-secondary btn-sm">{copied ? 'Copiado' : 'Copiar'}</button>
      <button onClick={handleReport} className="btn btn-ghost btn-sm">{reporting ? 'Reportando...' : 'Reportar'}</button>
    </>
  );
}
