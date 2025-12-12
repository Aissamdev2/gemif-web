import clsx from "clsx"



export default function Footer({ id }: { id?: string}) {


  return (
    <footer id={id} className={"w-full self-end mt-4 flex flex-col items-center text-center text-xs text-muted gap-1 p-2 border-t border-border"}>
      <div className="flex items-center gap-2">
        {/* Replace with your actual logo if available */}
        <span className="font-bold">GEMiF</span>
        <span className="text-sm">| GEMiFWeb</span>
      </div>
      <p className="text-xs">
        © 2025 GEMiF. Tods els drets reservats.
      </p>
      <p className="text-xs">
        Informació legal · Política de privacitat · Contacte
      </p>
    </footer>
  )
}