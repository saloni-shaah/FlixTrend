import { AlmightyAiPanel } from "@/components/flixtrend/almighty-ai-panel";
import { BottomNav } from "@/components/layout/bottom-nav";
import { MainHeader } from "@/components/layout/main-header";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="animated-gradient fixed inset-0 -z-10" />
      <MainHeader />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <AlmightyAiPanel />
      <BottomNav />
    </div>
  );
}
