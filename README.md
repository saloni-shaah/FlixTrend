# FlixTrend

**FlixTrend** is a Gen-Z-focused, futuristic social media web app MVP. It features a real-time feed, ephemeral stories (Flashes), and a modern, vibrant UI inspired by platforms like GitHub and Hulu.

## 🚀 Features
- **Modern Landing Page**: Animated, bold, and engaging hero section with feature highlights and testimonials.
- **Authentication**: Email/password signup and login with instant redirect to home.
- **Home Feed (VibeSpace)**: Real-time posts, flashes, and interactive FABs (for logged-in users only).
- **Explore, Profile, Signal (Chat)**: Discover trends, manage your profile, and chat with mutuals.
- **Mobile-First, Responsive Design**: Beautiful on all devices.

## 🛠️ Tech Stack
- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Firebase Auth & Firestore**
- **Vercel** (deployment)

## 🧑‍💻 Getting Started
1. **Clone the repo:**
   ```bash
   git clone https://github.com/saloni-shaah/FlixTrend.git
   cd FlixTrend
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Set up environment variables:**
   - Create a `.env.local` file with your Firebase keys:
     ```env
     NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
     # ...other Firebase keys
     ```
4. **Run locally:**
   ```bash
   npm run dev
   ```
5. **Deploy:**
   - Push to GitHub and connect to Vercel for instant deployment.

## 📦 MVP Notes
- TypeScript and ESLint errors are ignored for quick MVP deployment. For production, fix all types and lint issues.
- FABs and navigation are only visible to logged-in users.

## 📄 License
MIT
