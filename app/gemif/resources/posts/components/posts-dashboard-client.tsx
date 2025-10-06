// components/posts-dashboard-client.tsx
"use client";
import React, { use, useEffect, useRef, useState } from "react";
import SubjectSelectClient from "./subject-select-client";
import PostsListClient from "./posts-list-client";
import { ResourcesPost, PrimitiveSubject, Subject } from "@/db/schema";
import { Search } from "lucide-react";
import SubjectCombobox from "./subject-combobox";

export default function PostsDashboardClient({
  posts,
  subjects,
}: {
  posts: ResourcesPost[];
  subjects: Subject[];
}) {
  const [selected, setSelected] = useState<Subject | null>(null);
  const [search, setSearch] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the search input when isSearching is true
    if (isSearching && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearching]);

  return (
    <div className="panel-body p-0 flex flex-col gap-1 flex-1 min-h-0 overflow-hidden">
      <div className="flex w-full items-end gap-3 mb-3">
        <div className="flex-grow grid grid-cols-1 grid-rows-1">
          <div
            className={`col-start-1 row-start-1 transition-all duration-300 ease-in-out ${
              isSearching
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 -translate-x-4 pointer-events-none'
            }`}
          >
            <div className="w-full">
              <label htmlFor="search-input" className="label">Buscar en los recursos</label>
              <div className="relative">
                <Search className="absolute w-5 h-5 left-1 top-1/2 -translate-y-1/2 opacity-30" />
                <input
                  ref={searchInputRef}
                  id="search-input"
                  className="input input-md w-full pl-7"
                  type="text"
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div
            className={`col-start-1 row-start-1 transition-all duration-300 ease-in-out ${
              isSearching
                ? 'opacity-0 translate-x-4 pointer-events-none'
                : 'opacity-100 translate-x-0'
            }`}
          >
            <SubjectCombobox subjects={subjects} setSelected={setSelected} />
          </div>
        </div>

        <button
          className={`btn btn-secondary btn-md flex items-center transition-all duration-300 ease-in-out
            ${isSearching ? 'border-surface shadow-none btn-icon-md' : ''}`}
          onClick={() => {
            if (isSearching) setSearch("");
            setIsSearching(!isSearching);
          }}
        >
          <span
            className={`transition-all duration-300 flex items-center justify-center ${
              isSearching ? 'opacity-100 w-6' : 'opacity-0 w-0'
            }`}
            aria-hidden={!isSearching}
          >
            <svg className="h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </span>
          <div
            className="grid transition-all duration-300 ease-in-out"
            style={{ gridTemplateColumns: isSearching ? '0fr' : '1fr' }}
            aria-hidden={isSearching}
          >
            <span className="overflow-hidden whitespace-nowrap">
              Buscar
            </span>
          </div>
        </button>
      </div>
      <div className="h-full flex-1 min-h-0 flex flex-col bg-gray-100 p-1 rounded">
        <div className="flex-1 overflow-y-auto min-h-0">
          <PostsListClient posts={posts} selected={selected} search={search} />
        </div>
      </div>
    </div>
  );
}










// // components/posts-dashboard-client.tsx
// "use client";
// import React, { useState } from "react";
// import AddMainPostButton from "./add-main-post-button";
// import SubjectSelectClient from "./subject-select-client";
// import PostsListClient from "./posts-list-client";
// import { MainPost, Subject } from "@/app/db/schema";

// export default function PostsDashboardClient({
//   posts,
//   subjects,
// }: {
//   posts: MainPost[];
//   subjects: Subject[];
// }) {
//   const [selected, setSelected] = useState<string>("11111111");
//   const [search, setSearch] = useState<string>("");
//   const [isSearching, setIsSearching] = useState<boolean>(false);

//   return (
//     <>
//       <div className="flex items-center gap-3 mb-3">
//         {isSearching ? (
//           <div className="relative grow">
//             <input
//               type="text"
//               placeholder="Buscar..."
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               className="input input-sm pl-8 w-full"
//             />
//             <svg className="w-4 h-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
//             <button
//               onClick={() => {
//                 setIsSearching(false);
//                 setSearch("");
//               }}
//               className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
//             >
//               <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
//             </button>
//           </div>
//         ) : (
//           <>
//             <SubjectSelectClient subjects={subjects} setSelected={setSelected} />
//             <div className="ml-auto flex items-center gap-2">
//               <button
//                 type="button"
//                 className="btn btn-ghost btn-sm"
//                 onClick={() => setIsSearching(true)}
//               >
//                 Buscar
//               </button>
//             </div>
//           </>
//         )}
//       </div>

//       {/* POSTS AREA: critical part for scrolling */}
//       <div className="posts-area flex-1 min-h-0 flex flex-col">
//         <div className="posts-scroll flex-1 overflow-y-auto min-h-0">
//           <PostsListClient posts={posts} selected={selected} search={search} />
//         </div>
//       </div>
//     </>
//   );
// }