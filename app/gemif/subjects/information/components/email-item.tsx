'use client'

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function EmailItem({ prof, email }: { prof: string; email?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <li className="flex flex-col px-2 py-1 border border-border rounded bg-surface-hover">
      <span className="text-bodyy">{prof}</span>
      <span className="text-muted flex items-center justify-between">
        {email ?? "—"}
        {email && (
          <button
            type="button"
            onClick={handleCopy}
            className="ml-2 text-muted hover:text-foreground transition"
          >
            {copied ? <Check size={16} /> : <Copy className="cursor-pointer" size={16} />}
          </button>
        )}
      </span>
    </li>
  );
}