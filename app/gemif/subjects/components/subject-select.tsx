// app/asignaturas/components/asignatura-select.tsx
"use client"

import { useState } from "react"

const asignaturas = [
  "Álgebra",
  "Cálculo I",
  "Cálculo II",
  "Física I",
  "Física II",
  "Ecuaciones diferenciales",
]

export default function AsignaturaSelect() {
  const [selected, setSelected] = useState(asignaturas[0])

  return (
    <div className="panel p-4 border-border bg-surface rounded-lg w-full md:w-1/2 mx-auto flex flex-col items-start gap-3">
      <label htmlFor="asignatura" className="heading-sm">
        Seleccione una asignatura
      </label>
      <select
        id="asignatura"
        className="select select-bordered w-full"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
      >
        {asignaturas.map((asig) => (
          <option key={asig} value={asig}>
            {asig}
          </option>
        ))}
      </select>
    </div>
  )
}
