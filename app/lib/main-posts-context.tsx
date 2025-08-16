"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { MainPost } from "@/app/lib/definitions";

interface MainPostsContextType {
  mainPosts: MainPost[] | null;
  setMainPosts: (u: MainPost[]) => void;
}

const MainPostsContext = createContext<MainPostsContextType>({
  mainPosts: null,
  setMainPosts: () => {},
});

export const MainPostsProvider = ({
  children,
  initialMainPosts,
}: {
  children: ReactNode;
  initialMainPosts: MainPost[];
}) => {
  const [mainPosts, setMainPosts] = useState<MainPost[]>(initialMainPosts);

  return (
    <MainPostsContext.Provider value={{ mainPosts, setMainPosts }}>
      {children}
    </MainPostsContext.Provider>
  );
};

export const useMainPosts = () => useContext(MainPostsContext);
