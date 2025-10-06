"use client"

import { Subject } from "@/db/schema"


export default function SubjectSelectClient({
  subjects,
  setSelected,
}: {
  subjects: Subject[]
  setSelected: React.Dispatch<React.SetStateAction<string>>
}) {
  return (
    <div className="w-full">
      <label htmlFor="subject-select" className="label"> Asignatura </label>
      <select
        id="subject-select"
        className="select select-md w-full"
        onChange={(e) => setSelected(e.target.value)}
      >
        <option value="11111111">General</option>
        {subjects.map((subject) => (
          <option key={subject.id} value={subject.primitiveId}>
            {subject.name}
          </option>
        ))}
      </select>
    </div>
  )
}
