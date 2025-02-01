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
    <div className='flex items-center lg:gap-8 md:gap-4 gap-2 justify-center flex-grow-[1]'>
      <button type='button' onClick={handleMonthDecrement} className='w-11 h-11 text-[#5551FF] bg-indigo-50 rounded-full flex items-center justify-center cursor-pointer transition-all duration-500  hover:bg-indigo-100'>
      {'<'}
      </button>
      <span className="w-[200px] h-11 px-2 text-[#5551FF] bg-indigo-50 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-500  hover:bg-indigo-100">{MONTHS[month - 1] + ' ' + year}</span>
      <button type='button' onClick={handleMonthIncrement} className='w-11 h-11 text-[#5551FF] bg-indigo-50 rounded-full flex items-center justify-center cursor-pointer transition-all duration-500  hover:bg-indigo-100'>
      {'>'}
      </button>
    </div>
  )
}