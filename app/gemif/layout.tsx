import Footer from "../ui/footer/footer";
import Breadcrumb from "./components/breadcrumb/breadcrumb";
import SidebarServer from "./components/sidebar/sidebar-server";
import SidebarWrapper from "./components/sidebar/sidebar-wrapper";

export const metadata = {
  title: "GEMiFWeb",
  robots: {
    index: false,
    follow: false,
  }
};


export default async function GemifLayout({ children }: { children: React.ReactNode }) {

  return (
    <div className="flex gap-2 min-h-screen">
      <SidebarWrapper>
        <SidebarServer />
      </SidebarWrapper>
      <div className="flex flex-col h-full gap-4 py-3 mr-2 flex-1">
        <Breadcrumb />
        {children}
      </div>
    </div>
  );
}