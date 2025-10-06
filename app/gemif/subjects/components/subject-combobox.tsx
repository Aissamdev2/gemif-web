"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { PrimitiveSubject } from "@/db/schema"
import { normalizeString } from "@/lib/utils"
import { X } from "lucide-react"

export default function SubjectCombobox({
  primtiveSubjects,
  setSelected,
}: {
  primtiveSubjects: PrimitiveSubject[]
  setSelected: React.Dispatch<React.SetStateAction<PrimitiveSubject | null>>
}) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [selected, setLocalSelected] = useState<PrimitiveSubject | null>(null)

  // State for the new filters
  const [quadriFilter, setQuadriFilter] = useState<string>("")
  const [yearFilter, setYearFilter] = useState<string>("")
  const [typeFilter, setTypeFilter] = useState<string>("")

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
  const filtered = primtiveSubjects
    .filter((subject) => {
      if (quadriFilter && subject.quadri !== parseInt(quadriFilter)) {
        return false
      }
      return true
    })
    .filter((subject) => {
      if (yearFilter && subject.year !== parseInt(yearFilter)) {
        return false
      }
      return true
    })
    .filter((subject) => {
      if (typeFilter === "Obligatòria" && subject.year === null) {
        return false
      }
      if (typeFilter === "Optativa" && subject.year !== null) {
        return false
      }
      return true
    })
    .filter(
      (s) =>
        query === "" ||
        normalizeString(s.name).includes(normalizeString(query))
    )

  function handleSelect(subject: PrimitiveSubject | null) {
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
  }, [quadriFilter, yearFilter, typeFilter, filtered, selected, handleClear])

  // Handle side-effects when changing subject type
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOpen(true) // <-- Open the list on change
    const newType = e.target.value
    setTypeFilter(newType)
    if (newType === "Optativa") {
      setYearFilter("")
    }
  }

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
                  selected?.id === subject.id ? "font-medium" : ""
                }`}
                onClick={() => handleSelect(subject)}
              >
                {subject.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* New Filter Comboboxes */}
      <div className="flex items-end gap-4">
        <div>
          <label htmlFor="type-select" className="label">
            Tipus
          </label>
          <select
            id="type-select"
            value={typeFilter}
            onChange={handleTypeChange} // This handler now opens the list
            className="input input-md w-full"
          >
            <option value="">Tots</option>
            <option value="Obligatòria">Obligatòria</option>
            <option value="Optativa">Optativa</option>
          </select>
        </div>

        <div>
          <label htmlFor="quadri-select" className="label">
            Quadri
          </label>
          <select
            id="quadri-select"
            value={quadriFilter}
            onChange={(e) => {
              setQuadriFilter(e.target.value)
              setOpen(true) // <-- Open the list on change
            }}
            className="input input-md w-full"
          >
            <option value="">Tots</option>
            <option value="1">1</option>
            <option value="2">2</option>
          </select>
        </div>

        <div>
          <label htmlFor="year-select" className="label">
            Any
          </label>
          <select
            id="year-select"
            value={yearFilter}
            onChange={(e) => {
              setYearFilter(e.target.value)
              setOpen(true) // <-- Open the list on change
            }}
            className="input input-md w-full"
            disabled={typeFilter === "Optativa"}
          >
            <option value="">Tots</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>
        </div>
      </div>
    </div>
  )
}