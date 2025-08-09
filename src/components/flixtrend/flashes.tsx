import { flashes } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export function Flashes() {
  return (
    <div className="py-4 px-2">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex w-max space-x-4 pb-4">
          {flashes.map((flash) => (
            <div key={flash.id} className="flex flex-col items-center gap-2 w-20">
              <div className="relative">
                <Avatar className="h-16 w-16 border-2 border-transparent">
                  <AvatarImage src={flash.user.avatar} alt={flash.user.name} />
                  <AvatarFallback>{flash.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="absolute -inset-1 rounded-full animated-glow" />
              </div>
              <p className="text-xs text-center truncate w-full">{flash.user.name}</p>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
