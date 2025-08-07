import { Check, Copy } from "lucide-react";
import { useState } from "react";

export default function CopyToClipboard({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // reset after 2s
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button onClick={handleCopy}>
      {
        copied ? (
          <Check className="w-4 h-4" />
        ) : (
          <Copy className="w-4 h-4" />
        )
      
      }
    </button>
  );
}
