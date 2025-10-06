"use client";

import { Info } from "lucide-react";
import { cn } from "@/lib/utils"; // shadcn utility, optional

interface InfoBoxProps {
  children: React.ReactNode;
  className?: string;
  important?: boolean;
}

export default function InfoBox({ children, className, important }: InfoBoxProps) {
  return (
    <div
      className={cn(
        "flex cursor-help items-start gap-2 p-3 rounded-lg border bg-gray-100 hover:bg-gray-200 transition-colors text-body",
        important
          ? "border-border-hover"
          : "border-border",
        className
      )}
    >
      <Info
        className={"w-5 h-5 flex-none mt-0.5"}
        strokeWidth={important ? 2.5 : 2}
      />
      <div>
        {important && (
          <div className="text-body uppercase tracking-wide text-accent mb-1">
            Importante
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
