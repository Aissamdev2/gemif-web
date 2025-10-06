"use client";

import { useState, useEffect, ReactNode } from "react";
import { X, Menu, ChevronsLeft, ChevronsRight } from "lucide-react";

interface SidebarWrapperProps {
  children: ReactNode;
}

export default function SidebarWrapper({ children }: SidebarWrapperProps) {
  const [isOpen, setIsOpen] = useState(false); // for mobile
  const [isCollapsed, setIsCollapsed] = useState(true); // for desktop
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  

  // width classes: small collapsed width vs full width
  const desktopWidthClass = isCollapsed ? "w-10" : "w-60";

  return (
    <>
      {
        (isMobile === undefined || isMobile) && (
          <div />
        )
      }
      {/* Mobile toggle button */}
      {isMobile && (
        <button
          className="fixed top-2 left-4 z-50 p-2 rounded-md bg-sidebar text-white shadow-lg"
          onClick={() => setIsOpen(true)}
        >
          <Menu size={20} color="black" />
        </button>
      )}

      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar container: wrapper controls width and positioning.
          We use a div here (not <aside>) so the inside SidebarServer can keep its own <aside> semantics. */}
      <div
        className={`
          ${isMobile ? "fixed top-0  left-0 h-full z-50": isMobile === undefined ? "fixed" : "sticky top-0"}
          ${isMobile ? (isOpen ? "w-2/3" : "w-0") : "w-0"}
          ${isMobile ? "" : isMobile === undefined ? "w-0" : desktopWidthClass}
          bg-sidebar border-r border-sidebar-border
          transform transition-all duration-300 ease-in-out
          flex flex-col
        `}
        style={{ zIndex: isMobile ? 60 : undefined}}
      >
        {/* Desktop collapse button */}
        {isMobile === false && (
          <div className="flex justify-end p-2">
            <button
              className="p-1 rounded-md bg-gray-100 hover:bg-gray-200 transition"
              onClick={() => setIsCollapsed((s) => !s)}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
            </button>
          </div>
        )}

        {/* Mobile close button */}
        {isMobile && (
          <div className={`flex justify-end p-3 ${isOpen ? "" : "opacity-0 pointer-events-none"}`}>
            <button
              className="p-1 rounded-md bg-gray-100 hover:bg-gray-200 transition"
              onClick={() => setIsOpen(false)}
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Sidebar content: allow it to grow and make inner nav scrollable */}
        <div className={`flex-1 overflow-hidden transition-all ${isCollapsed && isMobile === false ? "pointer-events-none opacity-0" : ""}`}>
          {children}
        </div>
      </div>
    </>
  );
}



// "use client";

// import React, { useEffect, useRef, useState, ReactNode } from "react";
// import { createPortal } from "react-dom";
// import { X, Menu, ChevronsLeft, ChevronsRight } from "lucide-react";

// interface SidebarWrapperProps {
//   children: ReactNode;
// }

// export default function SidebarWrapper({ children }: SidebarWrapperProps) {
//   const [isOpen, setIsOpen] = useState(false);
//   const [isCollapsed, setIsCollapsed] = useState(true);
//   const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);
//   const scrollYRef = useRef(0);
//   const portalElRef = useRef<HTMLDivElement | null>(null);

//   const desktopWidthClass = isCollapsed ? "w-10" : "w-60";

//   // detect mobile
//   useEffect(() => {
//     const handleResize = () => setIsMobile(window.innerWidth < 640);
//     handleResize();
//     window.addEventListener("resize", handleResize);
//     return () => window.removeEventListener("resize", handleResize);
//   }, []);

//   // create portal container for mobile sidebar (so it's outside app layout)
//   useEffect(() => {
//     const el = document.createElement("div");
//     el.id = "sidebar-portal";
//     portalElRef.current = el;
//     document.body.appendChild(el);
//     return () => {
//       if (portalElRef.current) {
//         document.body.removeChild(portalElRef.current);
//         portalElRef.current = null;
//       }
//     };
//   }, []);


//   // Render the mobile sidebar in portal so it doesn't interact with app layout
//   const mobileSidebar = (
//     <>
//       {/* overlay */}
//       <div
//         className={`fixed inset-0 bg-black/40 z-40 transition-opacity ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
//         onClick={() => setIsOpen(false)}
//         aria-hidden={!isOpen}
//       />

//       {/* actual sidebar: translate-based so doesn't trigger layout reflow */}
//       <aside
//         className={`fixed h-full inset-y-0 left-0 z-50 w-2/3 max-w-xs transform transition-transform duration-300 ease-in-out bg-sidebar border-r border-sidebar-border ${
//           isOpen ? "translate-x-0" : "-translate-x-full"
//         }`}
//         style={{ willChange: "transform" }}
//         role="dialog"
//         aria-modal="true"
//       >
//         <div className="flex justify-end p-3">
//           <button
//             className="p-1 rounded-md bg-gray-100 hover:bg-gray-200 transition"
//             onClick={() => setIsOpen(false)}
//             aria-label="Close sidebar"
//           >
//             <X size={20} />
//           </button>
//         </div>

//         <div className="flex-1 overflow-auto">
//           {children}
//         </div>
//       </aside>
//     </>
//   );

//   return (
//     <>
//       { (isMobile === undefined || isMobile) && (
//         <div />
//       )
//       }
//       {/* mobile toggle button */}
//       {isMobile && (
//         <button
//           className="fixed top-2 left-4 z-50 p-2 rounded-md bg-sidebar text-white shadow-lg"
//           onClick={() => setIsOpen(true)}
//           aria-label="Open sidebar"
//         >
//           <Menu size={20} color="black" />
//         </button>
//       )}

//       {/* Desktop (sticky) sidebar in normal flow so it pushes content like before */}
//       {isMobile === false ? (
//         <div
//           className={`sticky top-0 ${desktopWidthClass} bg-sidebar border-r border-sidebar-border transform transition-all duration-300 ease-in-out flex flex-col`}
//         >
//           <div className="flex justify-end p-2">
//             <button
//               className="p-1 rounded-md bg-gray-100 hover:bg-gray-200 transition"
//               onClick={() => setIsCollapsed((s) => !s)}
//               aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
//             >
//               {isCollapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
//             </button>
//           </div>

//           <div className={`flex-1 overflow-hidden ${isCollapsed ? "pointer-events-none opacity-0" : ""}`}>
//             {children}
//           </div>
//         </div>
//       ) : null}

//       {/* Mobile: render via portal so it doesn't change layout */}
//       {isMobile && portalElRef.current ? createPortal(mobileSidebar, portalElRef.current) : null}
//     </>
//   );
// }
