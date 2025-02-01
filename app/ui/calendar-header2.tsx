'use client'

import { useState, useContext } from "react";
import { MONTHS } from "../lib/utils";
import { DateContext } from "../lib/date-context";

export default function CalendarHeader() {
  const { month, setMonth, year, setYear } = useContext(DateContext);

  const handleMonthIncrement = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const handleMonthDecrement = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };


  return (
    <div className="flex items-center grow">
      <h5 className="text-xl leading-8 font-semibold min-w-[190px] text-gray-900">{MONTHS[month - 1] + ' ' + year}</h5>
      <div className="flex items-center">
        <button onClick={handleMonthDecrement} className="text-indigo-600 p-1 rounded transition-all duration-300 hover:text-white hover:bg-indigo-600">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10.0002 11.9999L6 7.99971L10.0025 3.99719" stroke="currentcolor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
        </button>
        <button onClick={handleMonthIncrement} className="text-indigo-600 p-1 rounded transition-all duration-300 hover:text-white hover:bg-indigo-600">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6.00236 3.99707L10.0025 7.99723L6 11.9998" stroke="currentcolor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
        </button>
      </div>
    </div>
  )
}