import { useState } from "react";
import { Folder, FolderOpen } from "lucide-react";

const FolderToggle = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    setIsOpen(e.currentTarget.open);
  };

  return (
    <details className="" onToggle={toggleOpen}>
      <summary className="flex items-center gap-2 cursor-pointer border-b border-[#e1cfff] hover:border-[#d8c0ff]">
        {isOpen ? (
          <FolderOpen className="text-[#4A90E2] transition-transform min-w-[24px] duration-300" />
        ) : (
          <Folder className="text-slate-700 transition-transform min-w-[24px] duration-300" />
        )}
        <span className="text-lg text-slate-700 font-medium">{title}</span>
      </summary>
      <div className="pl-6 pt-2 truncate">{children}</div>
    </details>
  );
};

export default FolderToggle;
