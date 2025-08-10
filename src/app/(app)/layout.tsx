
import { AlmightyAiPanel } from "@/components/flixtrend/almighty-ai-panel";
import { BottomNav } from "@/components/layout/bottom-nav";
import { DesktopNav } from "@/components/layout/desktop-nav";
import { MainHeader } from "@/components/layout/main-header";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="relative flex min-h-screen flex-col md:flex-row">
        <DesktopNav />
        <div className="relative flex flex-1 flex-col">
          <div className="animated-gradient fixed inset-0 -z-10" />
          <MainHeader />
          <main className="flex-1 pb-20 md:pb-0">{children}</main>
          <AlmightyAiPanel />
          <BottomNav />
        </div>
      </div>
    </SidebarProvider>
  );
}
