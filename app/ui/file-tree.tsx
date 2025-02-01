import { GitHubContent } from "../lib/definitions";
import FolderToggle from "./folder-toggle";
import { File } from "lucide-react";


const FileTree = ({ structure }: { structure: GitHubContent[] }) => {
  if (!structure || structure.length === 0) return null;

  return (

        <ul className="">
          {structure.map((item) => (
            <li key={item.path} className="">
              {item.type === "tree" ? (
                <FolderToggle title={item.name}>
                  {/* Render children recursively */}
                  <FileTree structure={item.children || []} />
                </FolderToggle>
              ) : (
                <a
                  href={`https://raw.githubusercontent.com/Aissamdev2/Archive/main/${item.path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex"
                >
                  <File className="min-w-[24px]"/>
                  <p className="truncate">
                    {item.name}
                  </p>
                </a>
              )}
            </li>
          ))}
        </ul>
  );
}

FileTree.displayName = "FileTree";

export default FileTree