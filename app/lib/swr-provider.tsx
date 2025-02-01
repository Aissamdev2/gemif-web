'use client'
import { SWRConfig, Cache } from "swr"

export const SWRProvider = ({ children }: { children: React.ReactNode }) => {

  const localStorageProvider = (cache: Readonly<Cache<any>>): Cache<any> => {
    const map = new Map<string, any>(JSON.parse(localStorage.getItem("app-cache") || "[]"));
  
    window.addEventListener("beforeunload", () => {
      const appCache = JSON.stringify(Array.from(map.entries()));
      localStorage.setItem("app-cache", appCache);
    });
  
    return map;
  };

  return (
    <SWRConfig
      value={{
        provider: localStorageProvider
      }}
    >
      {children}
    </SWRConfig>
  )
}