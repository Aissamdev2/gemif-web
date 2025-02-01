'use client'

import { createContext, useState } from 'react'

type DateContextType = {
  date: number
  setDate: React.Dispatch<React.SetStateAction<number>>
  month: number
  setMonth: React.Dispatch<React.SetStateAction<number>>
  year: number
  setYear: React.Dispatch<React.SetStateAction<number>>
}

export const DateContext = createContext<DateContextType>({
  date: new Date().getDate(),
  setDate: () => {},
  month: new Date().getMonth() + 1,
  setMonth: () => {},
  year: new Date().getFullYear(),
  setYear: () => {},
})

export function DateProvider ({
  children }:
  { children: React.ReactNode }) {

    const [date, setDate] = useState(new Date().getDate())
    const [month, setMonth] = useState(new Date().getMonth() + 1)
    const [year, setYear] = useState(new Date().getFullYear())

    return (
      <DateContext.Provider value={{ date, setDate, month, setMonth, year, setYear }}>
        {children}
      </DateContext.Provider>
    )
}