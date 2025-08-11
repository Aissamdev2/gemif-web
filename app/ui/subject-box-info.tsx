

export default function SubjectBoxInfo({ title, info }: { title: string; info: string[] | string }) {
  return (
    <div className="flex justify-center  border bg-[#2C5AA0] border-[#2C5AA0]">
      <div className="flex bg-transparent items-center h-full w-fit">
        <p className="text-white px-1">{title}</p>
        <div className=" bg-white flex flex-col items-center justify-center gap-1 h-full w-fit p-2">
        {
          Array.isArray(info) ? info.map((i) => <p key={i}>{i}</p>) : <p>{info}</p>
        }
      </div>
      </div>
      
    </div>
  );
}