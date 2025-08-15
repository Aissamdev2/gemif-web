"use client";

import { Subject } from "@/app/lib/definitions";
import { useState } from "react";


export default function SubjectSelectClient({ subjects }: { subjects: Subject[] }) {
  const [selected, setSelected] = useState("11111111");

  return (
    <select
      className="block w-full max-w-xs px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm"
      value={selected}
      onChange={(e) => setSelected(e.target.value)}
    >
      <option value="11111111">General</option>
      {subjects
        .filter((s) => s.primitiveid !== "00000000")
        .map((subject) => (
          <option key={subject.id} value={subject.id}>
            {subject.name}
          </option>
        ))}
    </select>
  );
}
