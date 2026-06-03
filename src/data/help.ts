export type HelpArticle = {
  title: string;
  desc: string;
  slug: string;
  content: string;
};

export type HelpCategory = {
  title: string;
  slug: string;
  desc: string;
  articles: HelpArticle[];
};

export const helpCategories: HelpCategory[] = [
  {
    title: "Account & Profile",
    slug: "account-profile",
    desc: "Guides for signing in, managing profile details, and keeping account basics current.",
    articles: [
      { title: "Create a FlixTrend account", desc: "Learn the account setup steps for joining FlixTrend.", slug: "create-a-flixtrend-account", content: "" },
      { title: "Sign in to your account", desc: "Find the steps for accessing an existing FlixTrend account.", slug: "sign-in-to-your-account", content: "" },
      { title: "Reset your password", desc: "Use this guide when you need to recover account access.", slug: "reset-your-password", content: "" },
      { title: "Verify your email address", desc: "Understand where email verification fits into account setup.", slug: "verify-your-email-address", content: "" },
      { title: "Update your username", desc: "Review how username changes should be handled.", slug: "update-your-username", content: "" },
      { title: "Edit your profile information", desc: "Manage profile details such as name, bio, and visible information.", slug: "edit-your-profile-information", content: "" },
      { title: "Change your profile photo", desc: "Prepare profile image guidance for FlixTrend users.", slug: "change-your-profile-photo", content: "" },
      { title: "Choose an account type", desc: "Explain how users should think about personal and creator-style accounts.", slug: "choose-an-account-type", content: "" },
      { title: "Manage account settings", desc: "Cover the account settings users are most likely to look for.", slug: "manage-account-settings", content: "" },
      { title: "Delete your account", desc: "Reserve guidance for users who want to remove their account.", slug: "delete-your-account", content: "" },
    ],
  },
  {
    title: "Privacy & Security",
    slug: "privacy-security",
    desc: "Guides for account protection, visibility controls, reporting concerns, and safer use.",
    articles: [
      { title: "Keep your account secure", desc: "Outline basic account safety steps for FlixTrend users.", slug: "keep-your-account-secure", content: "" },
      { title: "Create a stronger password", desc: "Help users choose and maintain safer login credentials.", slug: "create-a-stronger-password", content: "" },
      { title: "Recognize suspicious login activity", desc: "Explain what users should do if account activity looks unfamiliar.", slug: "recognize-suspicious-login-activity", content: "" },
      { title: "Control profile visibility", desc: "Describe the profile visibility choices users can review.", slug: "control-profile-visibility", content: "" },
      { title: "Manage content visibility", desc: "Guide users through visibility decisions for posts and profile content.", slug: "manage-content-visibility", content: "" },
      { title: "Block another user", desc: "Prepare a guide for limiting contact from another account.", slug: "block-another-user", content: "" },
      { title: "Report a privacy concern", desc: "Show users where privacy concerns should be sent.", slug: "report-a-privacy-concern", content: "" },
      { title: "Protect personal information", desc: "Share practical privacy guidance for what users post and share.", slug: "protect-personal-information", content: "" },
      { title: "Manage notifications safely", desc: "Cover notification settings that may affect privacy and attention.", slug: "manage-notifications-safely", content: "" },
      { title: "Understand account recovery", desc: "Reserve a guide for recovering access while protecting account ownership.", slug: "understand-account-recovery", content: "" },
    ],
  },
  {
    title: "Vibes & Posting",
    slug: "vibes-posting",
    desc: "Guides for creating, publishing, editing, and managing everyday FlixTrend posts.",
    articles: [
      { title: "Create a Vibe", desc: "Explain the basic workflow for publishing a Vibe.", slug: "create-a-vibe", content: "" },
      { title: "Upload media for a post", desc: "Cover how users should add media to a new post.", slug: "upload-media-for-a-post", content: "" },
      { title: "Write a post caption", desc: "Help users prepare helpful captions without overexplaining features.", slug: "write-a-post-caption", content: "" },
      { title: "Add tags to a post", desc: "Guide users through simple tagging and discovery basics.", slug: "add-tags-to-a-post", content: "" },
      { title: "Edit a published post", desc: "Reserve instructions for post changes after publishing.", slug: "edit-a-published-post", content: "" },
      { title: "Delete a post", desc: "Explain how users can remove content they no longer want visible.", slug: "delete-a-post", content: "" },
      { title: "Save a draft", desc: "Prepare draft guidance if the posting flow supports it.", slug: "save-a-draft", content: "" },
      { title: "Find your posts", desc: "Show users where their published content appears.", slug: "find-your-posts", content: "" },
      { title: "Share a post", desc: "Cover the basics of sharing FlixTrend content.", slug: "share-a-post", content: "" },
      { title: "Troubleshoot posting issues", desc: "Collect common fixes for upload and publish problems.", slug: "troubleshoot-posting-issues", content: "" },
    ],
  },
  {
    title: "Flashes & Drops",
    slug: "flashes-drops",
    desc: "Guides for short updates, temporary moments, and quick content interactions.",
    articles: [
      { title: "Create a Flash", desc: "Introduce the workflow for posting a Flash.", slug: "create-a-flash", content: "" },
      { title: "View Flashes", desc: "Explain where users can find and watch Flashes.", slug: "view-flashes", content: "" },
      { title: "Create a Drop", desc: "Guide users through making a Drop.", slug: "create-a-drop", content: "" },
      { title: "Add media to a Drop", desc: "Reserve instructions for attaching media to Drop content.", slug: "add-media-to-a-drop", content: "" },
      { title: "React to a Drop", desc: "Cover the basics of responding to Drops.", slug: "react-to-a-drop", content: "" },
      { title: "Manage your Drops", desc: "Explain where users can review or change their Drops.", slug: "manage-your-drops", content: "" },
      { title: "Remove a Flash or Drop", desc: "Help users remove short-form content when needed.", slug: "remove-a-flash-or-drop", content: "" },
      { title: "Understand Drop visibility", desc: "Prepare guidance on who can see Drop activity.", slug: "understand-drop-visibility", content: "" },
      { title: "Use quick posting tools", desc: "Describe fast posting options without inventing unsupported features.", slug: "use-quick-posting-tools", content: "" },
      { title: "Fix Flash or Drop problems", desc: "Collect troubleshooting steps for short-form content issues.", slug: "fix-flash-or-drop-problems", content: "" },
    ],
  },
  {
    title: "Messaging & Calls",
    slug: "messaging-calls",
    desc: "Guides for Pings, conversations, sharing, and call-related support where available.",
    articles: [
      { title: "Send a Ping", desc: "Explain how users start a simple message or conversation.", slug: "send-a-ping", content: "" },
      { title: "Open your conversations", desc: "Show users where messages and conversation threads live.", slug: "open-your-conversations", content: "" },
      { title: "Share a post in a message", desc: "Guide users through sending content inside a conversation.", slug: "share-a-post-in-a-message", content: "" },
      { title: "Manage message requests", desc: "Reserve guidance for accepting or handling new message requests.", slug: "manage-message-requests", content: "" },
      { title: "Mute a conversation", desc: "Explain how users can quiet a conversation.", slug: "mute-a-conversation", content: "" },
      { title: "Delete a conversation", desc: "Prepare guidance for removing conversation history from view.", slug: "delete-a-conversation", content: "" },
      { title: "Report a message", desc: "Show how users can report inappropriate or harmful messages.", slug: "report-a-message", content: "" },
      { title: "Start a call", desc: "Reserve call setup guidance for implemented calling flows.", slug: "start-a-call", content: "" },
      { title: "Fix call connection issues", desc: "Collect help steps for calls that do not connect correctly.", slug: "fix-call-connection-issues", content: "" },
      { title: "Control who can contact you", desc: "Explain messaging and contact controls in one place.", slug: "control-who-can-contact-you", content: "" },
    ],
  },
  {
    title: "Fast Checking",
    slug: "fast-checking",
    desc: "Guides for understanding fast content checks and how users should respond to review signals.",
    articles: [
      { title: "Understand Fast Checking", desc: "Explain the purpose of Fast Checking in plain language.", slug: "understand-fast-checking", content: "" },
      { title: "Read a Fast Checking result", desc: "Help users interpret a check result without overstating certainty.", slug: "read-a-fast-checking-result", content: "" },
      { title: "Submit content for checking", desc: "Reserve guidance for checking content when the workflow is available.", slug: "submit-content-for-checking", content: "" },
      { title: "Review flagged content", desc: "Explain what users should do when a post receives a review signal.", slug: "review-flagged-content", content: "" },
      { title: "Correct a post after a check", desc: "Guide users through updating content after review.", slug: "correct-a-post-after-a-check", content: "" },
      { title: "Report misleading content", desc: "Show users how to send potentially misleading content for review.", slug: "report-misleading-content", content: "" },
      { title: "Understand check limits", desc: "Reserve guidance for what Fast Checking can and cannot evaluate.", slug: "understand-check-limits", content: "" },
      { title: "Appeal a Fast Checking result", desc: "Prepare a placeholder for challenging an incorrect result.", slug: "appeal-a-fast-checking-result", content: "" },
      { title: "Use Fast Checking responsibly", desc: "Set expectations for responsible use of verification signals.", slug: "use-fast-checking-responsibly", content: "" },
      { title: "Troubleshoot Fast Checking", desc: "Collect fixes for unavailable or delayed check results.", slug: "troubleshoot-fast-checking", content: "" },
    ],
  },
  {
    title: "Almighty AI",
    slug: "almighty-ai",
    desc: "Guides for FlixTrend recommendations, discovery signals, and AI-assisted user experiences.",
    articles: [
      { title: "Understand Almighty AI", desc: "Introduce Almighty AI as a FlixTrend discovery and assistance area.", slug: "understand-almighty-ai", content: "" },
      { title: "How recommendations are shaped", desc: "Prepare a clear guide for recommendation factors without hidden claims.", slug: "how-recommendations-are-shaped", content: "" },
      { title: "Improve your recommendations", desc: "Show users how their activity may help tune what they see.", slug: "improve-your-recommendations", content: "" },
      { title: "Hide content you do not want", desc: "Reserve guidance for reducing unwanted recommendations.", slug: "hide-content-you-do-not-want", content: "" },
      { title: "Find relevant creators", desc: "Explain discovery paths for accounts and creators.", slug: "find-relevant-creators", content: "" },
      { title: "Understand trending signals", desc: "Prepare a guide for trend and discovery signals.", slug: "understand-trending-signals", content: "" },
      { title: "Use AI suggestions carefully", desc: "Set expectations around AI suggestions and user judgment.", slug: "use-ai-suggestions-carefully", content: "" },
      { title: "Report a recommendation problem", desc: "Show users where to report incorrect or unwanted suggestions.", slug: "report-a-recommendation-problem", content: "" },
      { title: "Protect privacy with AI features", desc: "Reserve privacy guidance for AI-assisted product areas.", slug: "protect-privacy-with-ai-features", content: "" },
      { title: "Troubleshoot Almighty AI", desc: "Collect fixes for recommendation or AI-related display issues.", slug: "troubleshoot-almighty-ai", content: "" },
    ],
  },
  {
    title: "Creator Tools",
    slug: "creator-tools",
    desc: "Guides for creator profiles, post management, lightweight analytics, and creator workflows.",
    articles: [
      { title: "Set up a creator profile", desc: "Explain how a creator-oriented profile should be prepared.", slug: "set-up-a-creator-profile", content: "" },
      { title: "Manage creator posts", desc: "Guide creators through reviewing and organizing published content.", slug: "manage-creator-posts", content: "" },
      { title: "Read creator analytics", desc: "Reserve guidance for interpreting available creator metrics.", slug: "read-creator-analytics", content: "" },
      { title: "Track post performance", desc: "Help creators understand how individual posts are performing.", slug: "track-post-performance", content: "" },
      { title: "Use creator profile links", desc: "Prepare a guide for profile links and public creator identity.", slug: "use-creator-profile-links", content: "" },
      { title: "Organize content ideas", desc: "Offer guide structure for planning and managing content ideas.", slug: "organize-content-ideas", content: "" },
      { title: "Review audience activity", desc: "Reserve a guide for understanding visible audience engagement.", slug: "review-audience-activity", content: "" },
      { title: "Manage creator settings", desc: "Show creators where account and profile settings fit together.", slug: "manage-creator-settings", content: "" },
      { title: "Handle creator support requests", desc: "Explain how creators can contact support for account or content issues.", slug: "handle-creator-support-requests", content: "" },
      { title: "Prepare content for discovery", desc: "Guide creators on basic discoverability without promising reach.", slug: "prepare-content-for-discovery", content: "" },
    ],
  },
  {
    title: "Community & Moderation",
    slug: "community-moderation",
    desc: "Guides for reporting, blocking, content review, and keeping FlixTrend healthier.",
    articles: [
      { title: "Report a post", desc: "Show users how to report content that may need review.", slug: "report-a-post", content: "" },
      { title: "Report a profile", desc: "Guide users through reporting an account or profile concern.", slug: "report-a-profile", content: "" },
      { title: "Report a comment", desc: "Reserve instructions for comment-level reporting.", slug: "report-a-comment", content: "" },
      { title: "Block or unblock someone", desc: "Explain how users can manage blocked accounts.", slug: "block-or-unblock-someone", content: "" },
      { title: "Understand content review", desc: "Prepare a guide for what happens after users report content.", slug: "understand-content-review", content: "" },
      { title: "Appeal a moderation decision", desc: "Reserve guidance for challenging moderation outcomes.", slug: "appeal-a-moderation-decision", content: "" },
      { title: "Manage comment safety", desc: "Help users understand tools for keeping comments healthier.", slug: "manage-comment-safety", content: "" },
      { title: "Respond to harassment", desc: "Guide users toward reporting, blocking, and support steps.", slug: "respond-to-harassment", content: "" },
      { title: "Protect younger users", desc: "Reserve family and youth safety guidance without inventing policy detail.", slug: "protect-younger-users", content: "" },
      { title: "Contact moderation support", desc: "Show where users can ask for moderation help.", slug: "contact-moderation-support", content: "" },
    ],
  },
  {
    title: "Troubleshooting & Support",
    slug: "troubleshooting-support",
    desc: "Guides for common errors, device issues, contact paths, and launch support.",
    articles: [
      { title: "Fix sign-in problems", desc: "Collect common fixes when users cannot access an account.", slug: "fix-sign-in-problems", content: "" },
      { title: "Fix upload problems", desc: "Prepare troubleshooting steps for failed or delayed uploads.", slug: "fix-upload-problems", content: "" },
      { title: "Fix playback problems", desc: "Help users address videos that do not load or play correctly.", slug: "fix-playback-problems", content: "" },
      { title: "Fix slow loading", desc: "Reserve steps for performance or connection-related issues.", slug: "fix-slow-loading", content: "" },
      { title: "Fix notification problems", desc: "Guide users through notification delivery and settings checks.", slug: "fix-notification-problems", content: "" },
      { title: "Clear browser cache", desc: "Explain when clearing cache may help web users.", slug: "clear-browser-cache", content: "" },
      { title: "Check supported browsers", desc: "Prepare browser support guidance for the web app.", slug: "check-supported-browsers", content: "" },
      { title: "Report a bug", desc: "Show users what details to include when reporting a product issue.", slug: "report-a-bug", content: "" },
      { title: "Contact FlixTrend support", desc: "Give users a support path without mixing it into FAQ answers.", slug: "contact-flixtrend-support", content: "" },
      { title: "Find service updates", desc: "Reserve a guide for status, maintenance, and known issue updates.", slug: "find-service-updates", content: "" },
    ],
  },
];

export function getHelpCategory(slug: string) {
  return helpCategories.find((category) => category.slug === slug);
}

export function getHelpArticle(categorySlug: string, articleSlug: string) {
  const category = getHelpCategory(categorySlug);
  const article = category?.articles.find((item) => item.slug === articleSlug);
  return category && article ? { category, article } : null;
}
