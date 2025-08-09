"use client"
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/flixtrend/logo";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Bot, Lock, BarChart } from "lucide-react";
import Image from "next/image";

const features = [
  {
    icon: CheckCircle,
    title: "FastCheck AI",
    description: "Instant content verification before posting (say goodbye to fake news).",
  },
  {
    icon: Bot,
    title: "Almighty AI Chatbot",
    description: "Study, create, chat, and manage your vibes. Your smart assistant is built in.",
  },
  {
    icon: Lock,
    title: "Data-Safe Tech",
    description: "No third-party data selling, ever. Full end-to-end encryption.",
  },
  {
    icon: BarChart,
    title: "Real-Time Vibes",
    description: "Posts appear in real time with zero delay — like real conversation.",
  }
];


export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <div className="animated-gradient fixed inset-0 -z-10" />
      <header className="sticky top-0 z-40 bg-background/30 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Logo />
          <nav className="hidden md:flex gap-6 items-center">
            <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</Link>
            <Link href="#mission" className="text-sm font-medium hover:text-primary transition-colors">Mission</Link>
            <Link href="#trust" className="text-sm font-medium hover:text-primary transition-colors">Trust & Safety</Link>
          </nav>
          <Button asChild>
            <Link href="/login">Join Beta</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto flex flex-col items-center justify-center gap-6 px-4 md:px-6 py-16 md:py-24 text-center">
            <div className="max-w-3xl">
                <h1 className="text-4xl md:text-6xl font-extrabold font-headline tracking-tighter">
                    <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">FlixTrend:</span> The Gen-Z Social App You Deserve
                </h1>
                <p className="mt-4 text-lg md:text-xl text-muted-foreground">
                    Where real vibes meet verified facts. Powered by AI. Built for you.
                </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <Button size="lg" asChild className="animated-glow">
                    <Link href="/signup">Join the Beta</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                    <Link href="#features">Explore Features</Link>
                </Button>
            </div>
             <div className="mt-12 w-full max-w-4xl relative">
                <Image 
                    src="https://placehold.co/1200x600.png"
                    width={1200}
                    height={600}
                    alt="FlixTrend app mockup"
                    className="rounded-2xl border-2 border-primary/20 shadow-2xl shadow-primary/20"
                    data-ai-hint="social media app"
                />
            </div>
        </section>

        <section id="mission" className="py-16 md:py-24 bg-background/50">
            <div className="container mx-auto px-4 md:px-6 text-center max-w-4xl">
                 <h2 className="text-3xl md:text-4xl font-bold font-headline">Our Mission: Making Social Safe, Fun & Real</h2>
                 <p className="mt-4 text-muted-foreground md:text-lg">
                    FlixTrend is redefining what social media means for Gen-Z and Gen-Alpha. We believe your voice matters — but so does truth, privacy, and impact. That’s why we’ve combined bold design, community-first features, and built-in AI moderation to ensure every post, vibe, and ping is respectful, safe, and meaningful.
                 </p>
            </div>
        </section>

         <section id="features" className="py-16 md:py-24">
            <div className="container mx-auto px-4 md:px-6">
                 <h2 className="text-3xl md:text-4xl font-bold font-headline text-center mb-12">What Makes FlixTrend Different?</h2>
                 <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature) => (
                        <Card key={feature.title} className="glassmorphism p-6 text-center">
                            <div className="flex justify-center mb-4">
                                <feature.icon className="h-10 w-10 text-primary animated-glow-sm" />
                            </div>
                            <h3 className="text-xl font-bold">{feature.title}</h3>
                            <p className="mt-2 text-muted-foreground text-sm">{feature.description}</p>
                        </Card>
                    ))}
                 </div>
            </div>
        </section>

        <section id="trust" className="py-16 md:py-24 bg-background/50">
            <div className="container mx-auto px-4 md:px-6 text-center max-w-4xl">
                 <h2 className="text-3xl md:text-4xl font-bold font-headline">Built for You. Built to Protect You.</h2>
                 <p className="mt-4 text-muted-foreground md:text-lg">
                    Your data is encrypted. Your content is verified. With AI-powered moderation and zero data resale, FlixTrend protects your privacy while elevating your voice. We’ve also partnered with verified fact-checkers to ensure your experience stays real, not manipulated.
                 </p>
                 <div className="mt-8 flex flex-wrap justify-center gap-4">
                    <span className="glassmorphism px-4 py-2 rounded-full text-sm font-medium">✔️ 100% AI moderation</span>
                    <span className="glassmorphism px-4 py-2 rounded-full text-sm font-medium">✔️ Custom reporting & block system</span>
                     <span className="glassmorphism px-4 py-2 rounded-full text-sm font-medium">✔️ No intrusive ads, ever</span>
                 </div>
            </div>
        </section>
        
        <section className="py-16 md:py-24">
            <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl">
                <h2 className="text-3xl md:text-4xl font-bold font-headline">Join the Movement</h2>
                <p className="mt-4 text-muted-foreground md:text-lg">
                    Ready to vibe smarter? Get early access to FlixTrend Beta and help shape the next big thing in social media.
                </p>
                <div className="mt-8">
                    <Button size="lg" asChild className="animated-glow">
                        <Link href="/signup">Get Early Access</Link>
                    </Button>
                </div>
            </div>
        </section>

      </main>

      <footer className="bg-background/80 border-t border-border/20">
          <div className="container mx-auto py-6 px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} FlixTrend. Made with 💙 by Bhuski & Team.</p>
              <div className="flex gap-4 text-sm">
                  <Link href="#" className="hover:text-primary">Privacy Policy</Link>
                  <Link href="#" className="hover:text-primary">Terms of Service</Link>
              </div>
          </div>
      </footer>
    </div>
  );
}
