export default function Header() {
  return (
    <header className="w-full h-24 sm:h-14 flex flex-col sm:flex-row items-center justify-between bg-bg px-4">
      {/* Left: Page name */}
      <div className="heading-lg font-extrabold text-text-primary">
        GEMiFWeb Playground
      </div>

      {/* Center: Playground */}
      <div className="sm:absolute sm:left-1/2  sm:-translate-x-1/2 text-muted text-sm">
        Espacio de simulaciones y herramientas
      </div>
    </header>
  );
}
