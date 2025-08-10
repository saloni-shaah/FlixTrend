import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getMessageThreads, type MessageThread } from "@/lib/data";
import { Badge } from "@/components/ui/badge";

export default async function MessagesPage() {
  const messageThreads = await getMessageThreads();

  return (
      <div className="divide-y divide-border/20">
        {messageThreads.map((thread: MessageThread) => (
          <Link href={`/messages/${thread.id}`} key={thread.id} className="flex items-center gap-4 p-4 hover:bg-card/50 transition-colors">
            <Avatar className="h-14 w-14">
              <AvatarImage src={thread.user.avatar} />
              <AvatarFallback>{thread.user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex justify-between">
                <p className="font-semibold">{thread.user.name}</p>
                <p className="text-xs text-muted-foreground">{thread.timestamp}</p>
              </div>
              <div className="flex justify-between mt-1">
                  <p className="text-sm text-muted-foreground truncate w-4/5">{thread.lastMessage}</p>
                  {thread.unreadCount > 0 && (
                      <Badge variant="default" className="bg-primary text-primary-foreground h-6 w-6 flex items-center justify-center p-0">{thread.unreadCount}</Badge>
                  )}
              </div>
            </div>
          </Link>
        ))}
      </div>
  );
}
