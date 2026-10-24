# FlixTrend

**FlixTrend** is a modern, feature-rich social media platform designed to connect people and build communities. Our goal is to provide a seamless and engaging user experience, allowing users to share their moments, connect with friends, and discover new content.

## Key Features

*   **User Authentication:** Secure sign-up and login functionality with email and password.
*   **Create and Share Posts:** Users can create and share various types of content, including text, images, and videos.
*   **Real-time Chat:** Engage in one-on-one or group conversations with our real-time chat feature.
*   **Live Streaming:** Broadcast live video to your followers and interact with them in real-time.
*   **Gaming Hub:** Play a variety of mini-games directly within the platform.
*   **Music Discovery:** Discover and listen to new music without leaving the app.
*   **Premium Features:** Unlock exclusive features and content with a premium subscription.

## Getting Started

To get a local copy up and running, follow these simple steps:

### Prerequisites

*   Node.js and npm installed on your machine.
*   A Firebase project set up for the backend.

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/saloni-shaah/flixtrend.git
    ```
2.  **Navigate to the project directory:**
    ```sh
    cd flixtrend
    ```
3.  **Install the dependencies:**
    ```sh
    npm install
    ```
4.  **Run the development server:**
    ```sh
    npm run dev
    ```
5.  **Open your browser** and navigate to `http://localhost:3000` to see the application in action.

## Contributing

We welcome contributions from the community! If you'd like to contribute, please follow these steps:

1.  **Fork the repository.**
2.  **Create a new branch** for your feature or bug fix.
3.  **Make your changes** and commit them with a descriptive message.
4.  **Push your changes** to your forked repository.
5.  **Create a pull request** with a detailed description of your changes.

---

Thank you for your interest in FlixTrend! We're excited to see what you'll build with us. If you have any questions or feedback, feel free to reach out to our team.

The future of social media is here.

## Daily Drop prompt automation

Vercel Cron runs `/api/cron/drop-prompt` daily at 23:00 India Standard Time. It promotes the current Drop poll winner first; if a founder prompt is queued within the next day, a curated bridge challenge runs only until that prompt's scheduled time. Gemini Search grounding is used only when neither exists. If AI is unavailable, disabled, over budget, or returns an invalid/duplicate prompt, the route uses a curated prompt instead. It sends no user posts or personal data to Gemini.

Configure these Vercel environment variables:

- `CRON_SECRET`: a long random secret used to authenticate the Vercel Cron request.
- `FIREBASE_SERVICE_ACCOUNT_KEY`: the Firebase service-account JSON used by the existing server-side Firebase Admin helper. Keep this server-only; do not prefix it with `NEXT_PUBLIC_`.
- `GEMINI_API_KEY`: the Gemini API key. Keep it server-only.
- `DROP_AI_18_PLUS_CONFIRMED=true`: enable Gemini only after FlixTrend is genuinely restricted to adults and its audience complies with Gemini API terms. The current product describes child accounts, so leave this unset until that restriction is in place.
- `DROP_GEMINI_MODEL` (optional): model override; defaults to `gemini-flash-lite-latest`.

The route caps generated output, checks reported interaction usage against a 1,000-token per-run acceptance limit and a 2-million-token annual budget, and stores Google Search citation links with generated prompts. Search-grounding token use is only known after a response, so the per-run check cannot guarantee that Google will not bill for a response that exceeds the acceptance limit.

When migrating the schedule, remove the old Firebase scheduled function `selectNextPrompt` before enabling Vercel Cron, to avoid both schedulers advancing the Drop on the same day. Deploy the Firebase Functions update as well: `notifyScheduledDropPrompts` checks queued prompts every five minutes and sends their push when due, while the prompt-create trigger skips early notifications. Founder-scheduled prompts can be queued from the Admin page; the date-time input uses the founder's browser local time. No Firestore or Storage rules change is required.
