
"use client"
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/flixtrend/logo";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const handleSignIn = () => {
    // TODO: Implement actual login logic
    router.push("/vibespace");
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen">
       <div className="animated-gradient fixed inset-0 -z-10" />
      <div className="absolute top-8 left-8">
        <Logo />
      </div>
      <Card className="w-full max-w-md glassmorphism">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold font-headline">Welcome Back</CardTitle>
          <CardDescription>Sign in to continue to FlixTrend</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="email">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="phone">Phone</TabsTrigger>
            </TabsList>
            <TabsContent value="email">
              <div className="space-y-4 pt-4">
                 <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="phone">
               <div className="space-y-4 pt-4">
                 <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" placeholder="+1 (555) 123-4567" />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="password-phone">Password</Label>
                  <Input id="password-phone" type="password" />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <Button className="w-full mt-6 animated-glow" onClick={handleSignIn}>Sign In</Button>

          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="underline text-primary">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
