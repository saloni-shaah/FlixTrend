import { AppShell } from '@/components/app-shell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { SendHorizonal } from 'lucide-react';

const conversations = [
  {
    id: 1,
    name: 'Alex Johnson',
    avatarUrl: 'https://picsum.photos/id/1005/40/40',
    lastMessage: 'Hey, are you free this weekend?',
    time: '2m',
  },
  {
    id: 2,
    name: 'Samantha Miller',
    avatarUrl: 'https://picsum.photos/id/1011/40/40',
    lastMessage: 'Thanks for sending that over!',
    time: '1h',
  },
  {
    id: 3,
    name: 'Tech Geeks Group',
    avatarUrl: 'https://picsum.photos/seed/group1/40/40',
    lastMessage: 'Bob: Anyone see the latest keynote?',
    time: '3h',
  },
  {
    id: 4,
    name: 'Emily Carter',
    avatarUrl: 'https://picsum.photos/id/1027/40/40',
    lastMessage: 'See you tomorrow!',
    time: '1d',
  },
];

const messages = [
  {
    id: 1,
    text: 'Hey Alex! Not sure yet, what did you have in mind?',
    isSender: true,
  },
  {
    id: 2,
    text: 'Was thinking of going for a hike on Saturday morning. Interested?',
    isSender: false,
  },
  { id: 3, text: 'That sounds great! I should be free. What time?', isSender: true },
  { id: 4, text: 'How about 9 AM at the trailhead?', isSender: false },
];

export default function MessagesPage() {
  return (
    <AppShell>
      <div className="h-[calc(100vh-120px)]">
        <Card className="h-full">
          <div className="grid h-full grid-cols-1 md:grid-cols-[280px_1fr]">
            <div className="flex flex-col border-r">
              <CardHeader className="p-4">
                <h2 className="text-xl font-bold">Messages</h2>
              </CardHeader>
              <ScrollArea className="flex-1">
                <div className="p-2 pt-0">
                  {conversations.map((conv, index) => (
                    <div
                      key={conv.id}
                      className={cn(
                        'flex items-center gap-4 p-2 rounded-lg cursor-pointer',
                        index === 0 ? 'bg-muted' : 'hover:bg-muted/50'
                      )}
                    >
                      <Avatar>
                        <AvatarImage
                          src={conv.avatarUrl}
                          alt={conv.name}
                          width={40}
                          height={40}
                          data-ai-hint="person face"
                        />
                        <AvatarFallback>{conv.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 overflow-hidden">
                        <p className="font-semibold truncate">{conv.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.lastMessage}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {conv.time}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <div className="hidden md:flex flex-col">
              <CardHeader className="flex flex-row items-center gap-4 border-b p-4">
                <Avatar>
                  <AvatarImage
                    src={conversations[0].avatarUrl}
                    alt={conversations[0].name}
                    width={40}
                    height={40}
                    data-ai-hint="person face"
                  />
                  <AvatarFallback>
                    {conversations[0].name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <p className="font-semibold">{conversations[0].name}</p>
              </CardHeader>
              <ScrollArea className="flex-1 bg-secondary/30">
                <div className="p-6 space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex items-end gap-2',
                        msg.isSender ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {!msg.isSender && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={conversations[0].avatarUrl}
                            alt={conversations[0].name}
                            width={32}
                            height={32}
                            data-ai-hint="person face"
                          />
                          <AvatarFallback>
                            {conversations[0].name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          'max-w-xs rounded-lg p-3 text-sm',
                          msg.isSender
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card'
                        )}
                      >
                        <p>{msg.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="p-4 border-t bg-card">
                <div className="relative">
                  <Input placeholder="Type a message..." className="pr-12" />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  >
                    <SendHorizonal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
