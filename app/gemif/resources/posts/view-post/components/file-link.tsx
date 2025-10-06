"use client";

import React, { useState } from "react";
import { downloadFile } from "../actions/actions";
import { isFailure, success, unwrap } from "@/lib/errors/result";
import { SanitizedAppError } from "@/lib/errors/types";
import ErrorPopup from "@/app/ui/error-popup";

export default function FileLink({
  r2Key,
  label,
}: {
  r2Key: string;
  label?: string;
}) {
  const [errorMessage, setErrorMessage] = useState<SanitizedAppError | null>(null);
  const [pending, setPending] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    setPending(true);

    try {
      const formData = new FormData()
      formData.append("key", r2Key)
      const urlResult = await downloadFile(formData);
      if (isFailure(urlResult)) {
        setErrorMessage(urlResult.error);
        setPending(false);
        return;
      }
      const url = unwrap(urlResult);
      setDownloadUrl(url);

      // Trigger native download
      const a = document.createElement("a");
      a.href = url;
      a.download = r2Key.split("/").pop() ?? "download";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      setErrorMessage({
        message: "Error during download",
        details: String(err),
      } as SanitizedAppError);
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      {errorMessage && (
        <ErrorPopup error={errorMessage} onClose={() => setErrorMessage(null)} />
      )}
      <button
        onClick={handleClick}
        disabled={pending}
        className="block w-full cursor-pointer text-left text-muted bg-gray-50 rounded-lg px-3 py-1 hover:bg-surface-hover transition overflow-hidden text-ellipsis whitespace-nowrap"
        title={label}
      >
        {pending ? "Preparando descarga..." : label ?? r2Key.split("/").pop() ?? "download"}
      </button>
    </>
  );
}
