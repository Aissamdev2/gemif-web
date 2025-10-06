import { Subject } from "../lib/definitions";

export default function SubjectTag({ subject }: { subject: any }) {
  
  return (
    <div 
      // style={{
      //   background: `linear-gradient(to right, ${subject?.bgcolor}, white)`,
      //   borderColor: subject?.bordercolor,
      //   color: subject?.color
      // }}
      className={`cursor-pointer border text-xs truncate  font-medium mr-2 px-1.5 rounded-[4px] py-0`}
      >
        {subject}
    </div>
  )
}