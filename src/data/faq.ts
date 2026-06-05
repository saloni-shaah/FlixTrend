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
      { q: "What is FlixTrend?", a: "FlixTrend is a social media platform designed for discovering content, sharing ideas, and connecting through interests.It focuses on user's trend making capabilities and helps users to make trend via poll in drop. Users can create and explore posts, videos, Flashes, and communities across topics like entertainment, technology, learning, and trends. FlixTrend focuses on making content discovery, participation, and social interaction feel faster, more personal, and more engaging."},
      { q: "Who is FlixTrend for?", a: "FlixTrend is built for people who want to discover, create, and connect through their interests. Whether you enjoy sharing moments, exploring trends, following creators, learning something new, or building communities around topics you care about, FlixTrend is designed to help you participate and express yourself in your own way." },
      { q: "Is FlixTrend free to use?", a: "FlixTrend is free to use. You can create an account, explore content, connect with others, and use core features without paying. Some advanced features, creator tools, or future premium experiences may become available later, but the core FlixTrend experience is designed to stay accessible to everyone." },
      { q: "How do I get started on FlixTrend?", a: "Getting started on FlixTrend is simple. Create your account, choose your interests, set up your profile, and start exploring content that matches what you enjoy. You can follow creators, publish your first Post, share Flashes, interact with posts via comment and replies and interact to people via signal, and personalize your experience as you use FlixTrend." },
      { q: "Can I use FlixTrend on the web?", a: "Yes, FlixTrend is available on the web so you can access your account, discover content, connect with others, and create posts directly from your browser. The web experience is designed to make exploring, creating, and staying connected easy across different devices." },
      { q: "What makes FlixTrend different from other social apps?", a: "FlixTrend combines multiple experiences into one platform instead of separating them across different apps. Share everyday moments through Flashes, post real-time Drops, express ideas with posts, chat through Signal the chatting feature of FlixTrend, listen together with Flix Music, and enjoy social gaming experiences with Flix Games. Rather than switching between apps for content, messaging, music, and entertainment, FlixTrend brings them together in a connected experience built around interests, participation, and discovery. and whats truly seperate us is our system that let anyone make trend and become TrendSetter" },
      { q: "Do I need an account to browse FlixTrend?", a: "No, you do not need an account to browse parts of FlixTrend. Visitors can explore selected public content, discover trends, and see what FlixTrend offers before signing up. Creating an account unlocks the full experience, including posting Vibes, sharing Flashes and Drops, using Signal, following creators, personalizing recommendations, and accessing interactive features." },
      { q: "Where can I find the latest FlixTrend updates?", a: "You can find the latest FlixTrend updates through announcements inside the app, release notes, feature updates, and official FlixTrend channels. New features, improvements, events, and platform changes are shared regularly so you can stay updated with everything happening across FlixTrend." },
    ],
  },
  {
    title: "Account & Profile",
    slug: "account-profile",
    questions: [
      { q: "How do I create a FlixTrend account?", a: "Creating a FlixTrend account is quick. Open FlixTrend, choose Sign Up, enter your details, select your interests, and set up your profile. Once your account is created, you can start posting Vibes, sharing Flashes and Drops, connecting through Signal, discovering creators, and personalizing your experience across FlixTrend." },
      { q: "How do I log in to FlixTrend?", a: "To log in to FlixTrend, open the app or website and select Log In. Enter your email, username, or linked login method and your password, then continue to access your account. Once signed in, you can continue exploring content, manage your profile, connect through Signal, and access your personalized FlixTrend experience." },
      { q: "What should I do if I forgot my password?", a: "If you forgot your password, go to the FlixTrend login page and select Forgot Password. Enter your email address or linked login method and follow the verification steps to create a new password. Once reset, you can sign back in and continue using your FlixTrend account normally." },
      { q: "How do I change my username?", a: "To change your username on FlixTrend, open your profile, go to Settings, and select additional settings. Update your username and save your changes. If the username is unavailable or does not meet FlixTrend requirements, you may need to choose a different one. and you can change your username after each 28 days" },
      { q: "How do I update my profile photo?", a: "To update your profile photo on FlixTrend, open your Squad and go to Edit Profile. Select your current profile picture, upload a new image, adjust it if needed, and save your changes. Your updated profile photo will appear across your FlixTrend profile, comments, Signal chats, and other connected experiences. well it may show some old posts with your old profile picture" },
      { q: "How do I edit my bio or profile details?", a: "To edit your bio or profile details on FlixTrend, open your profile and go to Edit Profile. From there, you can update your bio, display name, profile photo, interests, links, and other available profile details. Save your changes to keep your profile updated and help others discover and connect with you more easily on FlixTrend." },
      { q: "Can I make my profile public or private?", a: "Yes, FlixTrend gives you control over your profile visibility. You can choose between a public profile to help more people discover your content or a private profile to approve who can follow and interact with you. Privacy settings can be managed anytime from Settings to customize your FlixTrend experience. Well child account is private by default from age 13 to 16 and to update your age from a child to bigger child or to an adult you may need to verify yourself" },
      { q: "How do I delete my FlixTrend account?", a: "You can delete your FlixTrend account from Settings → Additional Settings→ Delete Account. Before deletion, FlixTrend may ask you to verify your identity and review what data will be removed. Once completed, your profile, content, and account access may no longer be recoverable depending on account deletion policies." },
    ],
  },
  {
    title: "Posting & Content",
    slug: "posting-content",
    questions: [
      { q: "How do I post on FlixTrend?", a: "To create a post go to your squad and then click on the prompt saying 'flix yor fit by dropping a post' you will get the option of different types of posts choose the right one and fill the details/data and then you can publish your post or schedule it." },
      { q: "What is Lens?", a: "The Flixtrend lens is where various Augmented reality and Virtual reality and filters meet its the best place to have fun with your camera!" },
      { q: "What is a Flash?", a: "A Flash is FlixTrend’s quick-sharing format for moments that happen now. Share photos, short videos, updates, or temporary content that appears separately from regular posts and helps friends and followers stay connected in real time. Flashes are designed for fast, lightweight sharing and everyday moments." },
      { q: "What is a Drop?", a: "A Drop is FlixTrend’s daily community challenge format designed around participation instead of passive scrolling. Each day, FlixTrend releases a prompt and users create their own Drop to join. To unlock and view other people’s Drops, you first need to post your own response. Every Drop automatically disappears after 24 hours to keep the experience fresh and focused on the moment. After the Drop period ends, the first 50 participating users can each create one poll for the next day’s theme, and the poll with the most votes becomes the official Drop prompt for the following day. This means users help decide what trends next and can directly shape the FlixTrend experience." },
      { q: "How do I upload a video or image?", a: "To upload images or videos on FlixTrend, open the post creator from Squad and select the Media option while creating your post. You can attach videos up to 500 MB and upload up to 65 images in supported formats before publishing. If you want faster sharing, you can also open the Create Post prompt directly and choose Media without using the “Flix Your Fit” flow. Media uploads are supported across multiple experiences on FlixTrend, including Vibes, Flashes, Drops (when the daily prompt allows media responses), and Signal messaging so you can send photos and videos directly in conversations." },
      { q: "Can I edit a post after publishing it?", a: "editing a post is very easy for notmal stuffs like caption and description just click the three dot and for updating other things like thubmnail and sub title you can do that with studio." },
      { q: "How do I delete a post?", a: "deleting a post is very easy you can delete a post by clcikng upon the three dot and then delete the post and for a scheduled post you can delete it in the squad in the draft section." },
      { q: "Why did my upload fail?", a: "uploading a post or comment may fail due to network issue or some voilation like using wrong words that may be not safe for childerns or that abuses a person or commmunity." },
      { q: "Can I save a post as a draft?", a: "yes you can schedule a post and save it as a draft in flixtrend it is currently avaiable for flash only but we will rolling out for all types of posts soon" },
      { q: "How do hashtags or tags work on FlixTrend?", a: "" },
    ],
  },
  {
    title: "Features",
    slug: "features",
    questions: [
      { q: "What is Fast Checking?", a: "Fast Checking is FlixTrend’s built-in verification system designed to improve content quality before information spreads. Depending on the type of content, Fast Checking may analyze claims, provide additional context, detect misleading patterns, or surface trusted references to help users make more informed decisions while exploring and sharing content." },
      { q: "What is Almighty AI?", a: "Almighty AI is FlixTrend’s intelligent assistant built to help users create, discover, learn, and stay productive inside the platform. Almighty can support conversations, content creation, recommendations, exploration, and future experiences across FlixTrend while adapting to different user needs and interests." },
      { q: "How do FlixTrend recommendations work?", a: "FlixTrend recommendations are personalized based on your interests, activity, interactions, followed creators, engagement patterns, and the content formats you enjoy most. The goal is to surface content that feels relevant while still helping you discover new communities and experiences." },
      { q: "How do I find creators or content to follow?", a: "To find creators or content to follow, use Search, explore trending spaces, browse recommendations, visit profiles, or discover posts, Flashes, Drops, and community activity. Following creators helps personalize your FlixTrend experience over time." },
      { q: "Can I hide content I do not want to see?", a: "Yes, you can control the content you see on FlixTrend. Use preferences, mute options, content controls, and interest settings to hide content you do not want, reduce unwanted recommendations, and create a more personalized experience." },
      { q: "How does search work on FlixTrend?", a: "Search on FlixTrend is powered by Algolia to make discovery fast and responsive. You can search for creators, posts, profiles, topics, media, and trends with instant results and relevant recommendations. Search improves over time based on activity, interests, and how people interact across FlixTrend." },
      { q: "What are trending posts?", a: "Trending posts are popular and fast-growing content discovered through engagement, participation, freshness, interactions, community activity, and ongoing conversations across FlixTrend. Trends are not only based on views—they can also reflect active participation through formats like Vibes, Flashes, Drops, and other platform experiences." },
      { q: "How do notifications work?", a: "Notifications on FlixTrend help you stay updated with activity that matters to you. Receive alerts for likes, replies, follows, messages in Signal, mentions, Drop updates, creator activity, announcements, and other important events. Notification preferences can be customized anytime from Settings." },
    ],
  },
  {
    title: "Privacy & Safety",
    slug: "privacy-safety",
    questions: [
      { q: "How do I report a post?", a: "To report a post on FlixTrend, open the post options menu and select Report. Choose the reason that best matches the issue and submit your report. Reports help FlixTrend review content and take action when posts violate platform guidelines or safety standards." },
      { q: "How do I report a profile?", a: "To report a profile on FlixTrend, visit the profile, open the options menu, and select Report Profile. Provide the appropriate reason and submit your report so the account can be reviewed when necessary." },
      { q: "How do I block someone?", a: "To block someone on FlixTrend, open their profile or Signal conversation, select More Options, and choose Block. Blocked users may lose the ability to contact you, interact with your content, or discover certain parts of your profile depending on your privacy settings." },
      { q: "How do I control who can see my content?", a: "You can control who sees your content from Privacy Settings. Choose whether your profile is public or private, manage audience visibility for posts, control interactions, and decide who can contact you across FlixTrend experiences including posts, Flashes, Drops, and Signal." },
      { q: "What should I do if someone is harassing me?", a: "If someone is harassing you on FlixTrend, avoid engaging if possible and use available tools such as Block, Mute, Restrict, or Report. You can also review your privacy settings to limit interactions and help create a safer experience while using FlixTrend." },
      { q: "How do I report a privacy issue?", a: "If you believe there is a privacy issue on FlixTrend, go to Signal → follow flixtrend and then message there its the fastent way we work for reporting a privacy concern." },
      { q: "How does FlixTrend handle unsafe content?", a: "FlixTrend uses a combination of moderation systems, reporting tools, account protections, and feature-level controls to help reduce unsafe content and to improve platform safety & we have our own system named 'Fast Checking for this purpose' . Content may be reviewed, limited, labeled, removed, or restricted when it violates platform rules or creates a harmful experience for users." },
      { q: "How can I keep my account safer?", a: "You can help keep your FlixTrend account safer by using a strong password, enabling two-factor authentication when available, reviewing privacy settings, controlling who can contact you, avoiding suspicious links, and keeping your account information updated. Regularly checking login activity and account settings can also improve security." },
    ],
  },
  {
    title: "Messages & Pings",
    slug: "Signal",
    questions: [
      { q: "What are Signal?", a: "The signal is the chatting option of flixtrend its the place where you could chat with your followers and followings you can write a text message or a voice message and could make video/voice call via the app to your mutuals and can even send video or an image its safe and we don't follow signal protocal right now and for that reason we have dissapearing messages on by default that deletes your messages you can protect it from dissapearing by starring a message and we delete a message compeletey don't keep it in the server." },
      { q: "How do I send a message?", a: "go to signal and the select a person you follow or is your follower and if your account is new then follow someone to start a conversation." },
      { q: "Can I share posts in a message?", a: "yes ofcourse you can go to share option in the posts click upon the share in signal and share posts you can share to as much person as you want." },
      { q: "How do I mute a conversation?", a: "you can mute a conversation by just setting the notification off for that specific chat or by archiving a chat." },
      { q: "How do I delete a conversation?", a: "delething a coversation is simple go to signal click on three dot click on the chat you want to delete and delete it well the better aproach is it archive a chat and cause you can get it back via the settings." },
      { q: "How do I report a message?", a: "reporting a message is easy as well select a chat and click the verify the identity button flixtrend will verify the chat starting with the lastest 5 response of both person by default we may try getting more messages for checking and if we find the person an abuse we may deactivate it and even delete it." },
      { q: "Can I call someone on FlixTrend?", a: "yes we do have video calls and voice calls support on the android and ios app for flixtrend where you can call your mutuals whom you follow and who follows you back." },
      { q: "How do I control who can contact me?", a: "you cna control it via making your account private by this only your mutuals can evetually contact and message you." },
    ],
  },
  {
    title: "Creators",
    slug: "creators",
    questions: [
      { q: "What is a creator account?", a: "A creator account on FlixTrend is designed for people who publish content regularly and want additional tools to grow and manage their audience. Creator profiles may include access to insights, content management features, discovery tools, audience controls, and other experiences built to help creators understand and expand their reach." },
      { q: "How do I set up a creator profile?", a: "To set up a creator profile on FlixTrend, open Settings and go to Account → Switch Account Type → Creator Profile. Complete your creator information, choose your category or interests, and customize your profile to help people discover your content more easily." },
      { q: "Where can creators manage their posts?", a: "Creators can manage their posts from Creator Dashboard or profile management tools inside FlixTrend. From there, creators can view published content, drafts, scheduled posts, engagement activity, and manage content across formats like Vibes, Flashes, Drops, Flow, and media posts." },
      { q: "Can creators see post analytics?", a: "Yes, creators can access analytics to better understand how their content performs. Depending on availability, analytics may include views, reach, engagement, interactions, audience activity, and performance trends to help improve future content decisions." },
      { q: "How do creators improve discoverability?", a: "Creators can improve discoverability on FlixTrend by creating consistent content, participating in trends, using relevant tags, engaging with communities, publishing across different formats, and building meaningful interactions with their audience over time." },
      { q: "How do creators contact support?", a: "Creators can contact support through Help & Support, Creator Dashboard, or available support channels inside FlixTrend. When submitting a request, include relevant details so issues related to content, account access, creator tools, or platform experiences can be reviewed more efficiently." },
      { q: "What should creators do if content is reported?", a: "If creator content is reported on FlixTrend, creators may receive information about the report and any actions taken depending on the situation. Review the reported content, follow platform guidelines, make updates if needed, and use available appeal options if you believe a decision was incorrect." },
    ],
  },
  {
    title: "Support",
    slug: "support",
    questions: [
      { q: "Where can I get help with FlixTrend?", a: "You can get help with FlixTrend anytime by visiting the /help page. The Help Center includes FAQs, troubleshooting steps, feature guides, account support, and resources to solve common issues and learn more about using FlixTrend." },
      { q: "How do I contact FlixTrend support?", a: "To contact FlixTrend support, open the /help page and navigate to the support options available for your issue. Provide clear details and any relevant information so the support team can review and assist more effectively." },
      { q: "How do I report a bug?", a: "To report a bug on FlixTrend, visit /help and open the bug report option. Include what happened, steps to reproduce the issue, affected device or platform, and screenshots if available to help speed up investigation." },
      { q: "What should I do if FlixTrend is loading slowly?", a: "If FlixTrend is loading slowly, check your internet connection, refresh the page, update the app if available, clear cache when supported, and try again. If the issue continues, visit /help for troubleshooting and support." },
      { q: "What should I do if videos are not playing?", a: "If videos are not playing on FlixTrend, check your connection, refresh the content, verify media permissions if required, and update the app or browser. If playback issues continue, visit /help for additional troubleshooting steps and support." },
      { q: "How do I fix notification problems?", a: "To fix notification problems on FlixTrend, review notification permissions on your device and check your in-app notification settings. Make sure alerts are enabled for the activity you want to receive. If problems continue, visit /help for assistance." },
      { q: "Where can I find deeper help guides?", a: "You can find deeper help guides, tutorials, troubleshooting articles, and feature explanations through the FlixTrend /help page. The Help Center is designed to make finding answers and learning platform features easier." },
      { q: "How do I request help with my account?", a: "If you need help with your account, visit /help and choose the account support option that matches your issue. Whether you need help with login, profile access, privacy settings, or account recovery, support resources are available there." },
    ],
  },
];

export const faqItems = faqCategories.flatMap((category) => category.questions);
