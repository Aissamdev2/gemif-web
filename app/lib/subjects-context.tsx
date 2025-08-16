"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Subject } from "@/app/lib/definitions";

interface SubjectsContextType {
  subjects: Subject[] | null;
  setSubjects: (u: Subject[]) => void;
}

const SubjectsContext = createContext<SubjectsContextType>({
  subjects: null,
  setSubjects: () => {},
});

export const SubjectsProvider = ({
  children,
  initialSubjects,
}: {
  children: ReactNode;
  initialSubjects: Subject[];
}) => {
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);

  return (
    <SubjectsContext.Provider value={{ subjects, setSubjects }}>
      {children}
    </SubjectsContext.Provider>
  );
};

export const useSubjects = () => useContext(SubjectsContext);
