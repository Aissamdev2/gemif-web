import { SUBJECTS_BG_COLORS, SUBJECTS_BORDER_COLORS, SUBJECTS_COLORS } from "../lib/utils";
import { SUBJECTS_PLAIN } from "../lib/subjects";
import clsx from "clsx";
import { Subject, PrimitiveSubject, User } from "../lib/definitions";

export default function SubjectTag({ subject }: { subject: Subject | undefined }) {
  
  return (
    <div 
      style={{
        background: `linear-gradient(to right, ${subject?.bgcolor}, white)`,
        borderColor: subject?.bordercolor,
        color: subject?.color
      }}
      className={`cursor-pointer border text-xs truncate font-medium mr-2 px-1.5 rounded-[4px] py-0`}
      >
        {subject?.name}
    </div>
  )
}