"use client";

import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/flixtrend/logo";

export function MainHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const getTitle = () => {
    if (pathname === "/") return <Logo />;
    if (pathname.startsWith("/scope")) return "Scope";
    if (pathname.startsWith("/squad")) return "Squad";
    if (pathname.startsWith("/messages")) return "Signal";
    if (pathname.startsWith("/create-post")) return "Create Post";
    return "Flixtrend";
  };

  const showBackButton = pathname !== "/";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      {showBackButton && (
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back</span>
        </Button>
      )}
      <h1 className="flex-1 text-xl font-bold font-headline">{getTitle()}</h1>
      <Button variant="ghost" size="icon">
        <Bell className="h-5 w-5" />
        <span className="sr-only">Notifications</span>
      </Button>
    </header>
  );
}
