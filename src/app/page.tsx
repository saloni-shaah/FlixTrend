"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { auth } from "@/utils/firebaseClient";
import Image from "next/image";
import { getGeminiText } from "@/utils/gemini";

function getAlmightyResponse(message: string): string {
  const msg = message.toLowerCase();
  if (["hi", "hello", "hey", "yo"].some((greet) => msg.includes(greet))) {
    return "Heyyy 👋! Welcome to FlixTrend, where the vibes are always trending!";
  }
  if (msg.includes("explain") && msg.includes("app")) {
    return "FlixTrend is a Gen-Z social app for sharing flashes (stories), vibing with posts, exploring trends, and chatting with Almighty AI. Create, connect, and vibe in style!";
  }
  if (msg.includes("joke") || msg.includes("laugh")) {
    const jokes = [
      "Why did the influencer go broke? Because they lost their followers! 😆",
      "Why don't secrets last on FlixTrend? Because the vibes are always trending!",
      "Why did the phone go to therapy? Too many toxic notifications!",
      "Why did the Gen-Z bring a ladder to the app? To reach the next level of hype!"
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
  }
  return "I'm Almighty AI 🤖 – your hype assistant! Ask me anything, or just vibe ✨.";
}

// CSS Swirl Logo component
function AlmightyLogoCSS({ size = 56 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 60% 40%, #E0F7FA 60%, #B388FF 100%)',
        boxShadow: '0 0 24px #00F0FF, 0 0 8px #BF00FF',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      className="almighty-swirl-logo"
    >
      <svg width={size * 0.9} height={size * 0.9} viewBox="0 0 100 100" style={{ position: 'absolute', left: '5%', top: '5%' }}>
        <path d="M50 20 Q65 25 60 40 Q55 55 70 60 Q85 65 80 80 Q75 95 60 90 Q45 85 40 70 Q35 55 20 60 Q5 65 10 80 Q15 95 30 90 Q45 85 50 70 Q55 55 40 60 Q25 65 20 80 Q15 95 30 90 Q45 85 50 70" stroke="#00F0FF" strokeWidth="4" fill="none" />
        <circle cx="50" cy="50" r="18" fill="url(#center)" stroke="#BF00FF" strokeWidth="2" />
        <path d="M50 38 Q56 40 54 50 Q52 60 60 62" stroke="#FF3CAC" strokeWidth="2" fill="none" />
        <path d="M50 62 Q44 60 46 50 Q48 40 40 38" stroke="#39FF14" strokeWidth="2" fill="none" />
        <defs>
          <radialGradient id="center" cx="0" cy="0" r="1" gradientTransform="translate(50 50) rotate(90) scale(18)">
            <stop stopColor="#FF3CAC" />
            <stop offset="1" stopColor="#00F0FF" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}

export default function Home() {
  const [firebaseUser, setFirebaseUser] = useState<any | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showAlmighty, setShowAlmighty] = useState(false);
  const [chat, setChat] = useState<{ sender: "user" | "ai"; text: string }[]>([
    { sender: "ai", text: "Hey! I'm Almighty AI. Ask me anything about FlixTrend, or just say hi!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Firebase may take a moment to populate currentUser
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setFirebaseUser(user);
      setCheckingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  if (checkingAuth) {
  return (
      <div className="flex min-h-screen items-center justify-center text-accent-cyan">Checking authentication...</div>
    );
  }

  if (firebaseUser) {
    // --- HOME FEED UI FOR LOGGED-IN USERS ---
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-accent-cyan font-body flex flex-col">
        {/* Flashes (Stories) */}
        <section className="w-full max-w-2xl mx-auto py-4 flex gap-3 overflow-x-auto scrollbar-hide">
          {/* Placeholder for flashes/stories */}
          {[...Array(8)].map((_, i) => (
            <div key={i} className="w-16 h-16 rounded-full bg-accent-pink/40 border-2 border-accent-cyan flex items-center justify-center text-2xl text-white shadow-fab-glow animate-pulse cursor-pointer">
              ⚡
            </div>
          ))}
        </section>
        {/* Feed */}
        <main className="flex-1 w-full max-w-2xl mx-auto px-2 py-2 flex flex-col gap-4">
          {/* Placeholder for posts/feed */}
          <div className="flex flex-col gap-4">
            {/* Example: Show empty state if no posts */}
            <div className="flex flex-col items-center justify-center py-16 text-accent-cyan opacity-80">
              <span className="text-5xl mb-2">🪐</span>
              <p className="text-lg font-semibold">No posts yet. Start the vibe!</p>
            </div>
            {/* TODO: Map real posts here */}
          </div>
        </main>
        {/* Top-right FABs */}
        <div className="fixed top-6 right-6 flex flex-col gap-4 z-50">
          <button className="bg-accent-cyan text-primary p-4 rounded-full shadow-fab-glow hover:scale-110 transition-all duration-200" aria-label="Notifications">
            <span className="text-2xl">🔔</span>
          </button>
          <button className="bg-accent-pink text-white p-4 rounded-full shadow-fab-glow hover:scale-110 transition-all duration-200" aria-label="Create Post">
            <span className="text-2xl">➕</span>
          </button>
        </div>
        {/* Bottom-right Almighty AI FAB */}
        <button
          className="fixed bottom-24 right-6 z-50 bg-gradient-to-tr from-accent-pink to-accent-cyan p-5 rounded-full shadow-fab-glow hover:scale-110 transition-all duration-200 animate-pulse"
          aria-label="Almighty AI"
          onClick={() => setShowAlmighty(true)}
        >
          <AlmightyLogoCSS size={48} />
        </button>
        {/* Almighty AI Chat Modal - ChatGPT-like UI */}
        {showAlmighty && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xl">
            <div className="w-full max-w-4xl h-[80vh] bg-gradient-to-br from-secondary via-primary to-accent-cyan/30 rounded-3xl shadow-fab-glow border-2 border-accent-cyan/40 flex animate-slide-in">
              {/* Sidebar */}
              <aside className="w-60 bg-black/60 border-r border-accent-cyan/20 rounded-l-3xl flex flex-col items-center py-6 gap-6">
                <AlmightyLogoCSS size={56} />
                <button className="w-44 py-2 rounded-xl bg-accent-cyan/80 text-primary font-bold mb-2 hover:bg-accent-pink/80 transition-all" onClick={() => { setChat([]); localStorage.removeItem('aiHistory'); }}>+ New Chat</button>
                <div className="w-44 flex flex-col gap-2">
                  <button className="rounded-lg py-2 px-3 bg-card/80 text-accent-cyan text-left hover:bg-accent-pink/30 transition-all" onClick={() => setChat(JSON.parse(localStorage.getItem('aiHistory')||'[]'))}>History</button>
                  <button className="rounded-lg py-2 px-3 bg-card/80 text-accent-cyan text-left hover:bg-accent-pink/30 transition-all" onClick={() => setInput('Explain this as if I am a student: ')}>Study Mode</button>
                  <button className="rounded-lg py-2 px-3 bg-card/80 text-accent-cyan text-left hover:bg-accent-pink/30 transition-all" onClick={() => setInput('Summarize: ')}>Summarize</button>
                  <button className="rounded-lg py-2 px-3 bg-card/80 text-accent-cyan text-left hover:bg-accent-pink/30 transition-all" onClick={() => setInput('Generate an image of: ')}>Image Gen</button>
                  <button className="rounded-lg py-2 px-3 bg-card/80 text-accent-cyan text-left hover:bg-accent-pink/30 transition-all" onClick={() => setInput('Summarize this code: ')}>Code Summarizer</button>
                  <button className="rounded-lg py-2 px-3 bg-card/80 text-accent-cyan text-left hover:bg-accent-pink/30 transition-all">Projects</button>
                  <button className="rounded-lg py-2 px-3 bg-card/80 text-accent-cyan text-left hover:bg-accent-pink/30 transition-all">Settings</button>
                </div>
              </aside>
              {/* Main Chat Area */}
              <section className="flex-1 flex flex-col h-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-headline text-2xl text-accent-cyan drop-shadow">Almighty AI Suite</h2>
                  <button onClick={() => setShowAlmighty(false)} className="text-accent-cyan hover:text-accent-pink text-3xl font-bold">×</button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide bg-black/20 rounded-xl p-4">
                  {chat.map((msg, i) => (
                    <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`px-4 py-3 rounded-2xl text-base max-w-[70%] shadow-fab-glow ${msg.sender === "ai" ? "bg-accent-cyan/20 text-accent-cyan" : "bg-accent-pink/80 text-white"}`}>{msg.text}</div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start"><div className="px-4 py-3 rounded-2xl text-base max-w-[70%] shadow-fab-glow bg-accent-cyan/20 text-accent-cyan animate-pulse">Almighty is thinking...</div></div>
                  )}
                </div>
                <form
                  className="flex items-center gap-3 mt-6"
                  onSubmit={async e => {
                    e.preventDefault();
                    if (!input.trim()) return;
                    setChat([...chat, { sender: "user", text: input }]);
                    setLoading(true);
                    let aiResponse = "";
                    if (input.toLowerCase().startsWith("summarize this code")) {
                      aiResponse = await getGeminiText(input + "\nExplain the code in simple terms.");
                    } else if (input.toLowerCase().startsWith("summarize")) {
                      aiResponse = await getGeminiText(input);
                    } else if (input.toLowerCase().startsWith("generate an image of") || input.toLowerCase().startsWith("image")) {
                      aiResponse = '[Image generation coming soon!]';
                    } else if (input.toLowerCase().includes("explain") || input.toLowerCase().includes("study")) {
                      aiResponse = await getGeminiText(input + "\nExplain as if I am a student.");
                    } else {
                      aiResponse = await getGeminiText(input);
                    }
                    console.log('Gemini AI response:', aiResponse); // Debug log
                    setLoading(false);
                    setChat(c => [...c, { sender: "ai", text: aiResponse }]);
                    localStorage.setItem('aiHistory', JSON.stringify([...chat, { sender: "user", text: input }, { sender: "ai", text: aiResponse }]));
                    setInput("");
                  }}
                >
                  <input
                    className="flex-1 rounded-full px-5 py-3 bg-black/60 text-white placeholder-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-cyan/60 shadow-fab-glow text-lg"
                    placeholder="Type your message, or try 'summarize', 'generate image', 'study mode', 'summarize this code'..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    autoFocus
                  />
                  <button type="submit" className="bg-accent-cyan text-primary px-6 py-3 rounded-full font-bold shadow-fab-glow hover:bg-accent-pink hover:text-white transition-all text-lg">Send</button>
                </form>
              </section>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- LANDING PAGE (LOGGED-OUT USERS) ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-accent-cyan font-body">
      {/* Top Navbar */}
      <nav className="w-full flex justify-between items-center px-8 py-4 bg-black/70 border-b border-accent-cyan/20 fixed top-0 left-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <AlmightyLogoCSS size={40} />
          <span className="font-headline text-2xl text-accent-cyan font-bold tracking-wide">FlixTrend</span>
        </div>
        <div className="flex gap-6 items-center">
          <Link href="/signup" className="px-5 py-2 rounded-full bg-accent-pink text-white font-bold shadow-fab-glow hover:scale-105 transition-all">Sign Up</Link>
          <Link href="/login" className="px-5 py-2 rounded-full border-2 border-accent-cyan text-accent-cyan font-bold bg-black/30 hover:bg-accent-cyan hover:text-primary transition-all">Log In</Link>
        </div>
      </nav>
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center h-[90vh] text-center overflow-hidden pt-32">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 z-0 animate-gradient-flow bg-gradient-to-tr from-accent-pink/40 via-primary/80 to-accent-cyan/40 blur-2xl opacity-80" />
        {/* Floating shapes */}
        <div className="absolute left-1/4 top-1/3 w-40 h-40 bg-accent-pink rounded-full opacity-30 blur-2xl animate-float" />
        <div className="absolute right-1/4 bottom-1/4 w-32 h-32 bg-accent-cyan rounded-full opacity-30 blur-2xl animate-float" />
        <div className="relative z-10 flex flex-col items-center gap-8">
          <h1 className="text-6xl md:text-7xl font-headline font-bold drop-shadow-[0_0_20px_#e600ff] animate-fade-in">Where Trends Find You First</h1>
          <p className="max-w-2xl text-2xl md:text-3xl font-semibold text-accent-cyan drop-shadow-[0_0_10px_#00fff7] animate-fade-in delay-200">A Gen-Z social media app for vibes, flash moments & real-time hype.</p>
          <div className="flex gap-6 mt-4 animate-fade-in delay-500">
            <Link href="/signup" className="px-10 py-4 rounded-full bg-accent-pink text-white font-bold text-xl shadow-fab-glow hover:scale-105 hover:shadow-lg transition-all duration-200">Get Started</Link>
            <Link href="/scope" className="px-10 py-4 rounded-full border-2 border-accent-cyan text-accent-cyan font-bold text-xl bg-black/30 hover:bg-accent-cyan hover:text-primary transition-all duration-200">Explore</Link>
          </div>
        </div>
      </section>
      {/* Feature Highlights */}
      <section className="max-w-6xl mx-auto py-20 px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        <FeatureCard icon="✨" title="VibeSpace" desc="A real-time feed where posts are ordered by vibe — no confusing algorithms, just pure energy." />
        <FeatureCard icon="⚡" title="Flashes" desc="Ephemeral stories that last 24 hours. Snap a moment, share the hype, and watch it disappear." />
        <FeatureCard icon="🎓" title="Almighty AI" desc="An integrated chatbot built to help you study, create projects, or vibe. Like ChatGPT, but cooler." />
        <FeatureCard icon="🛰️" title="Radar Page" desc="Discover trending content based on moods, interests, and viral tags. It's like having a social GPS." />
        <FeatureCard icon="🎨" title="Custom Themes" desc="Personalize the app with themes, dark mode, and Gen-Z neon vibes. It's your space, your way." />
        <FeatureCard icon="🔒" title="Privacy First" desc="Your data, your rules. End-to-end encrypted chats and full control over your content." />
      </section>
      {/* Social Proof / Testimonials */}
      <section className="max-w-4xl mx-auto py-16 px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-headline font-bold mb-8 text-accent-cyan drop-shadow">What Our Users Say</h2>
        <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
          <blockquote className="bg-card/80 rounded-2xl p-6 shadow-fab-glow border border-accent-pink/20 max-w-md mx-auto">
            <p className="text-lg italic mb-2">“FlixTrend is the only app where I feel my posts actually matter. The vibes are real!”</p>
            <span className="font-bold text-accent-pink">@genz_trender</span>
          </blockquote>
          <blockquote className="bg-card/80 rounded-2xl p-6 shadow-fab-glow border border-accent-cyan/20 max-w-md mx-auto">
            <p className="text-lg italic mb-2">“The Almighty AI is a game changer for my study sessions and creative projects.”</p>
            <span className="font-bold text-accent-cyan">@studyqueen</span>
          </blockquote>
        </div>
      </section>
      {/* Footer */}
      <footer className="w-full py-8 bg-black/60 text-center flex flex-col gap-2 items-center mt-8">
        <div className="flex gap-4 justify-center mb-2">
          <a href="#about" className="hover:text-accent-cyan">About</a>
          <a href="#contact" className="hover:text-accent-cyan">Contact</a>
          <a href="#terms" className="hover:text-accent-cyan">Terms</a>
          <a href="#privacy" className="hover:text-accent-cyan">Privacy Policy</a>
        </div>
        <div className="flex gap-3 justify-center">
          {/* Social icons placeholder */}
          <span className="hover:text-accent-pink cursor-pointer">🌐</span>
          <span className="hover:text-accent-pink cursor-pointer">🐦</span>
          <span className="hover:text-accent-pink cursor-pointer">📸</span>
        </div>
        <p className="text-xs">&copy; {new Date().getFullYear()} FlixTrend. All rights reserved.</p>
      </footer>
    </div>
  );
}

// FeatureCard component
function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="bg-card rounded-2xl p-6 shadow-fab-glow border border-accent-pink/20 flex flex-col items-center text-center hover:scale-105 hover:shadow-lg transition-all duration-200">
      <div className="text-4xl mb-3 drop-shadow-[0_0_10px_#e600ff]">{icon}</div>
      <h3 className="font-headline text-xl font-bold mb-2 text-accent-cyan">{title}</h3>
      <p className="text-base">{desc}</p>
    </div>
  );
}
