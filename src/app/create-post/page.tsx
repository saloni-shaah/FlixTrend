import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Video, CheckCircle } from "lucide-react";
import AppLayout from "../(app)/layout";

export default function CreatePostPage() {
    return (
        <AppLayout>
            <div className="container max-w-2xl mx-auto py-8">
                <Card className="glassmorphism">
                    <CardHeader>
                        <CardTitle>Create a New Post</CardTitle>
                        <CardDescription>Share your vibes with your squad.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <Textarea 
                                placeholder="What's on your mind?" 
                                className="min-h-[120px] text-lg"
                            />
                            <div className="flex justify-between items-center">
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon">
                                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                    </Button>
                                     <Button variant="ghost" size="icon">
                                        <Video className="h-5 w-5 text-muted-foreground" />
                                    </Button>
                                </div>
                                 <div className="flex items-center gap-2 text-sm text-primary">
                                    <CheckCircle className="h-4 w-4" />
                                    <span>FastCheck AI enabled</span>
                                </div>
                            </div>
                            <Button className="w-full animated-glow">Post</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    )
}
