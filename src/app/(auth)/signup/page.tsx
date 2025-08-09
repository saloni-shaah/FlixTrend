
"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/flixtrend/logo";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Camera } from "lucide-react";

const steps = [
  { id: 1, title: "Create your account" },
  { id: 2, title: "Personalize your profile" },
  { id: 3, title: "Secure your account" },
  { id: 4, title: "Final details" },
];

export default function SignupPage() {
    const [step, setStep] = useState(1);
    const router = useRouter();
    const progress = (step / steps.length) * 100;

    const nextStep = () => {
      if (step === steps.length) {
        // TODO: Implement actual signup logic
        router.push("/");
      } else {
        setStep(s => Math.min(s + 1, steps.length));
      }
    };
    const prevStep = () => setStep(s => Math.max(s - 1, 1));
    
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen py-12">
      <div className="animated-gradient fixed inset-0 -z-10" />
       <div className="absolute top-8 left-8">
        <Logo />
      </div>
      <Card className="w-full max-w-md glassmorphism">
        <CardHeader className="text-center">
            <div className="w-full mb-4">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2 text-left">{`Step ${step} of ${steps.length}: ${steps[step - 1].title}`}</p>
            </div>
          <CardTitle className="text-2xl font-bold font-headline">Join FlixTrend</CardTitle>
          <CardDescription>Start your journey into a better social experience.</CardDescription>
        </CardHeader>
        <CardContent>
            {step === 1 && (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" placeholder="John Doe" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input id="username" placeholder="johndoe" />
                    </div>
                </div>
            )}
            {step === 2 && (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Profile Picture</Label>
                        <div className="flex items-center gap-4">
                            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                                <Camera className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <Button variant="outline">Upload</Button>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label>Banner Image</Label>
                        <div className="flex items-center gap-4">
                            <div className="h-20 w-full rounded-md bg-muted flex items-center justify-center">
                                <Camera className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <Button variant="outline">Upload</Button>
                        </div>
                    </div>
                </div>
            )}
             {step === 3 && (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="you@example.com" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" type="password" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" type="tel" placeholder="+1 (555) 123-4567" />
                    </div>
                </div>
            )}
            {step === 4 && (
                 <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="age">Age</Label>
                        <Input id="age" type="number" placeholder="18" />
                    </div>
                    <div className="text-center p-4 bg-primary/10 rounded-lg">
                        <h4 className="font-bold text-lg text-primary">🎉 Almost there! 🎉</h4>
                        <p className="text-sm text-primary/80">Complete your registration to unlock your first badge!</p>
                    </div>
                </div>
            )}

            <div className="flex gap-4 mt-6">
                {step > 1 && (
                    <Button variant="outline" className="w-full" onClick={prevStep}>Back</Button>
                )}
                <Button className="w-full animated-glow" onClick={nextStep}>
                    {step === steps.length ? "Finish Sign Up" : "Continue"}
                </Button>
            </div>

          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline text-primary">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
