"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { PrimitiveSubject, Subject } from "@/db/schema"
import { normalizeString } from "@/lib/utils"
import { X } from "lucide-react"

export default function SubjectCombobox({
  subjects,
  setSelected,
}: {
  subjects: Subject[]
  setSelected: React.Dispatch<React.SetStateAction<Subject | null>>
}) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [selected, setLocalSelected] = useState<Subject | null>(null)

  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Chained filtering logic
  const filtered = subjects
    .filter(
      (s) =>
        query === "" ||
        normalizeString(s.name).includes(normalizeString(query))
    )

  function handleSelect(subject: Subject | null) {
    setLocalSelected(subject)
    setSelected(subject)
    setQuery(subject ? subject.name : "")
    setOpen(false)
  }

  const handleClear = useCallback(() => {
    setLocalSelected(null)
    setSelected(null)
    setQuery("")
  }, [setSelected])

  useEffect(() => {
    if (selected && !filtered.some((s) => s.id === selected.id)) {
      handleClear()
    }
  }, [filtered, selected, handleClear])


  return (
    <div className="flex flex-col-reverse sm:flex-row w-full sm:items-end gap-4" ref={wrapperRef}>
      {/* Original Subject Combobox */}
      <div className="relative flex-grow">
        <label htmlFor="subject-combobox" className="label">
          Asignatura
        </label>

        <div className="relative">
          <input
            id="subject-combobox"
            type="text"
            value={query}
            placeholder="Buscar o seleccionar…"
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            autoComplete="off"
            className="input input-md w-full pr-10"
          />

          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {open && (
          <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-white text-body shadow-md">
            {filtered.map((subject) => (
              <li
                key={subject.id}
                className={`cursor-pointer border-b border-border px-3 py-2 hover:bg-indigo-600 hover:text-white ${
                  selected?.primitiveId === subject.primitiveId ? "font-medium" : ""
                }`}
                onClick={() => handleSelect(subject)}
              >
                {subject.name}
              </li>
            ))}
          </ul>
        )}
      </div>
      
    </div>
  )
}