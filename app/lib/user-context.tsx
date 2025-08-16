// app/context/UserContext.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { User } from "@/app/lib/definitions"; // your User type

interface UserContextType {
  user: User | null;
  setUser: (u: User) => void;
}

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
});

export const UserProvider = ({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser: User;
}) => {
  const [user, setUser] = useState<User>(initialUser);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
