export type FaqItem = {
  q: string;
  a: string;
};

export type FaqCategory = {
  title: string;
  slug: string;
  questions: FaqItem[];
};

export const faqCategories: FaqCategory[] = [
  {
    title: "Getting Started",
    slug: "getting-started",
    questions: [
      { q: "What is FlixTrend?", a: "" },
      { q: "Who is FlixTrend for?", a: "" },
      { q: "Is FlixTrend free to use?", a: "" },
      { q: "How do I get started on FlixTrend?", a: "" },
      { q: "Can I use FlixTrend on the web?", a: "" },
      { q: "What makes FlixTrend different from other social apps?", a: "" },
      { q: "Do I need an account to browse FlixTrend?", a: "" },
      { q: "Where can I find the latest FlixTrend updates?", a: "" },
    ],
  },
  {
    title: "Account & Profile",
    slug: "account-profile",
    questions: [
      { q: "How do I create a FlixTrend account?", a: "" },
      { q: "How do I log in to FlixTrend?", a: "" },
      { q: "What should I do if I forgot my password?", a: "" },
      { q: "How do I change my username?", a: "" },
      { q: "How do I update my profile photo?", a: "" },
      { q: "How do I edit my bio or profile details?", a: "" },
      { q: "Can I make my profile public or private?", a: "" },
      { q: "How do I delete my FlixTrend account?", a: "" },
    ],
  },
  {
    title: "Posting & Content",
    slug: "posting-content",
    questions: [
      { q: "How do I post on FlixTrend?", a: "" },
      { q: "What is a Vibe?", a: "" },
      { q: "What is a Flash?", a: "" },
      { q: "What is a Drop?", a: "" },
      { q: "How do I upload a video or image?", a: "" },
      { q: "Can I edit a post after publishing it?", a: "" },
      { q: "How do I delete a post?", a: "" },
      { q: "Why did my upload fail?", a: "" },
      { q: "Can I save a post as a draft?", a: "" },
      { q: "How do hashtags or tags work on FlixTrend?", a: "" },
    ],
  },
  {
    title: "Features",
    slug: "features",
    questions: [
      { q: "What is Fast Checking?", a: "" },
      { q: "What is Almighty AI?", a: "" },
      { q: "How do FlixTrend recommendations work?", a: "" },
      { q: "How do I find creators or content to follow?", a: "" },
      { q: "Can I hide content I do not want to see?", a: "" },
      { q: "How does search work on FlixTrend?", a: "" },
      { q: "What are trending posts?", a: "" },
      { q: "How do notifications work?", a: "" },
    ],
  },
  {
    title: "Privacy & Safety",
    slug: "privacy-safety",
    questions: [
      { q: "How do I report a post?", a: "" },
      { q: "How do I report a profile?", a: "" },
      { q: "How do I block someone?", a: "" },
      { q: "How do I control who can see my content?", a: "" },
      { q: "What should I do if someone is harassing me?", a: "" },
      { q: "How do I report a privacy issue?", a: "" },
      { q: "How does FlixTrend handle unsafe content?", a: "" },
      { q: "How can I keep my account safer?", a: "" },
    ],
  },
  {
    title: "Messaging & Social",
    slug: "messaging-social",
    questions: [
      { q: "What are Pings?", a: "" },
      { q: "How do I send a message?", a: "" },
      { q: "Can I share posts in a message?", a: "" },
      { q: "How do I mute a conversation?", a: "" },
      { q: "How do I delete a conversation?", a: "" },
      { q: "How do I report a message?", a: "" },
      { q: "Can I call someone on FlixTrend?", a: "" },
      { q: "How do I control who can contact me?", a: "" },
    ],
  },
  {
    title: "Creators",
    slug: "creators",
    questions: [
      { q: "What is a creator account?", a: "" },
      { q: "How do I set up a creator profile?", a: "" },
      { q: "Where can creators manage their posts?", a: "" },
      { q: "Can creators see post analytics?", a: "" },
      { q: "How do creators improve discoverability?", a: "" },
      { q: "Can I switch from a regular account to a creator profile?", a: "" },
      { q: "How do creators contact support?", a: "" },
      { q: "What should creators do if content is reported?", a: "" },
    ],
  },
  {
    title: "Support",
    slug: "support",
    questions: [
      { q: "Where can I get help with FlixTrend?", a: "" },
      { q: "How do I contact FlixTrend support?", a: "" },
      { q: "How do I report a bug?", a: "" },
      { q: "What should I do if FlixTrend is loading slowly?", a: "" },
      { q: "What should I do if videos are not playing?", a: "" },
      { q: "How do I fix notification problems?", a: "" },
      { q: "Where can I find deeper help guides?", a: "" },
      { q: "How do I request help with my account?", a: "" },
    ],
  },
];

export const faqItems = faqCategories.flatMap((category) => category.questions);
