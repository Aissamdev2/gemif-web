// import { memo } from "react";
// import { GitHubContent } from "../lib/definitions";
// import FolderToggle from "./folder-toggle";
// import { File } from "lucide-react";


// export default function MainFiles({ structure }: { structure: GitHubContent[] }) {
//   if (!structure || structure.length === 0) return null;
  

//   return (

//         <ul className="">
//           {structure.map((item) => (
//             <li key={item.path} className="">
//                 <a
//                   href={`https://raw.githubusercontent.com/Aissamdev2/Archive/main/${item.path}`}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="flex"
//                 >
//                   <p className="truncate">
//                     {item.name}
//                   </p>
//                 </a>
//             </li>
//           ))}
//         </ul>
//   );
// }