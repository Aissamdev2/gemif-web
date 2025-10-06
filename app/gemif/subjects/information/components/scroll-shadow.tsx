"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

export default function ScrollShadow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showTop, setShowTop] = useState(false);
  const [showBottom, setShowBottom] = useState(false);

  const updateShadows = () => {
    const el = containerRef.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    const tolerance = 2;

    setShowTop(scrollTop > tolerance);
    setShowBottom(scrollTop + clientHeight < scrollHeight - tolerance);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    updateShadows();
    el.addEventListener("scroll", updateShadows);
    window.addEventListener("resize", updateShadows);

    return () => {
      el.removeEventListener("scroll", updateShadows);
      window.removeEventListener("resize", updateShadows);
    };
  }, []);

  return (
    <div className={"relative overflow-hidden border border-border rounded"}>
      {/* Scrollable content */}
      <div ref={containerRef} className={clsx("h-full w-full overflow-y-auto", className)}>
        {children}
      </div>

      {/* Top shadow */}
      {showTop && (
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-3 bg-gradient-to-b from-black/10 to-transparent z-10" />
      )}

      {/* Bottom shadow */}
      {showBottom && (
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-t from-black/10 to-transparent z-10" />
      )}
    </div>
  );
}
