import SectionNav from "./SectionNav";

export default function SectionWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 w-full">
      {children}
      <SectionNav />
    </div>
  );
}
