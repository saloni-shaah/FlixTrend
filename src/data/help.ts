export type RelatedArticle = {
  title: string;
  slug: string;
};

export type HelpArticleSpec = {
  whatItIs: string;
  where: string;
  steps: string[];
  limits?: string[];
  after?: string[];
  related?: RelatedArticle[];
  troubleshooting?: string[];
};

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

const helpRoot = "/help";

export function getHelpCategoryHref(categorySlug: string) {
  return `${helpRoot}/${categorySlug}`;
}

export function getHelpArticleHref(categorySlug: string, articleSlug: string) {
  return `${helpRoot}/${categorySlug}/${articleSlug}`;
}

function buildRelatedLinks(categorySlug: string, related: RelatedArticle[] = []) {
  if (!related.length) return "";
  return related
    .filter((item) => Boolean(item.title && item.slug))
    .map((item) => `- [${item.title.trim()}](${getHelpArticleHref(categorySlug, item.slug.trim())})`)
    .join("\n");
}

function cleanText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function buildHelpContent(
  title: string,
  categorySlug: string,
  spec: HelpArticleSpec
) {
  const parts: string[] = [];

  parts.push(`# ${title}`);
  parts.push("");
  parts.push(cleanText(spec.whatItIs));
  parts.push("");
  parts.push("## Where to find it");
  parts.push("");
  parts.push(cleanText(spec.where));
  parts.push("");
  parts.push("## Steps");
  parts.push("");
  spec.steps.forEach((step, index) => {
    parts.push(`${index + 1}. ${cleanText(step)}`);
  });

  if (spec.limits?.length) {
    parts.push("");
    parts.push("## Limits");
    parts.push("");
      spec.limits.forEach((item) => parts.push(`- ${cleanText(item)}`));
  }

  if (spec.after?.length) {
    parts.push("");
    parts.push("## What happens next");
    parts.push("");
      spec.after.forEach((item) => parts.push(`- ${cleanText(item)}`));
  }

  if (spec.troubleshooting?.length) {
    parts.push("");
    parts.push("## Troubleshooting");
    parts.push("");
      spec.troubleshooting.forEach((item) => parts.push(`- ${cleanText(item)}`));
  }

  if (spec.related?.length) {
    parts.push("");
    parts.push("## Related articles");
    parts.push("");
    parts.push(buildRelatedLinks(categorySlug, spec.related));
  }

  return parts.join("\n");
}

function article(
  categorySlug: string,
  title: string,
  desc: string,
  slug: string,
  spec: HelpArticleSpec
): HelpArticle {
  return {
    title,
    desc,
    slug,
    content: buildHelpContent(title, categorySlug, spec),
  };
}

export const helpCategories: HelpCategory[] = [
  {
    title: "Account & Profile",
    slug: "account-profile",
    desc: "Guides for signing in, managing profile details, and keeping account settings up to date.",
    articles: [
      article(
        "account-profile",
        "Create a FlixTrend account",
        "Learn the setup steps for joining FlixTrend.",
        "create-a-flixtrend-account",
        {
          whatItIs:
            "A FlixTrend account gives you access to the full platform, including Vibes, Flashes, Drops, Flow, Signal, Search, Music, Games, and creator tools.",
          where: "Use Sign Up on FlixTrend web or mobile and follow the setup prompts that appear.",
          steps: [
            "Open FlixTrend.",
            "Select Sign Up.",
            "Enter your email address and any other details the form asks for.",
            "Verify your email address if prompted.",
            "Verify your phone number if the flow requires it.",
            "Choose a unique username.",
            "Select your interests so recommendations can start personalizing early.",
            "Complete your profile setup and confirm the account creation flow.",
          ],
          limits: [
            "A username must be unique.",
            "Phone verification is only required if the sign-up flow asks for it.",
          ],
          after: [
            "You can start creating Vibes, Flashes, Drops, and Flow posts.",
            "You can use Signal messaging, search, and creator tools.",
          ],
          related: [
            { title: "Sign in to your account", slug: "sign-in-to-your-account" },
            { title: "Verify your email address", slug: "verify-your-email-address" },
            { title: "Choose an account type", slug: "choose-an-account-type" },
          ],
        }
      ),
      article(
        "account-profile",
        "Sign in to your account",
        "Find the steps for accessing an existing FlixTrend account.",
        "sign-in-to-your-account",
        {
          whatItIs:
            "Sign in lets you open an existing FlixTrend account with your login details and return to your personalized experience.",
          where: "Use the Login screen on web or mobile and complete any verification prompt that appears.",
          steps: [
            "Open FlixTrend.",
            "Select Login.",
            "Enter the account details linked to your profile.",
            "Complete any verification step that appears.",
            "Use Forgot Password if you do not remember your password.",
          ],
          limits: [
            "Recovery is handled from the login flow.",
            "Use the exact account details linked to your profile.",
          ],
          after: [
            "You return to your account after sign-in is complete.",
            "If recovery is needed, the password reset flow can help.",
          ],
          related: [
            { title: "Create a FlixTrend account", slug: "create-a-flixtrend-account" },
            { title: "Reset your password", slug: "reset-your-password" },
            { title: "Manage account settings", slug: "manage-account-settings" },
          ],
        }
      ),
      article(
        "account-profile",
        "Reset your password",
        "Use this guide when you need to recover account access.",
        "reset-your-password",
        {
          whatItIs:
            "Password reset helps you recover login access when you cannot sign in and need a fresh password.",
          where: "Use Forgot Password from the Login screen and follow the recovery prompts.",
          steps: [
            "Open the Login screen.",
            "Select Forgot Password.",
            "Enter the email address linked to your account.",
            "Use the recovery steps sent to you.",
            "Create a new password when the reset flow asks you to.",
          ],
          limits: [
            "Recovery depends on access to the linked email address if required.",
          ],
          after: [
            "You can return to the Login screen with your new password.",
          ],
          related: [
            { title: "Sign in to your account", slug: "sign-in-to-your-account" },
            { title: "Keep your account secure", slug: "keep-your-account-secure" },
            { title: "Understand account recovery", slug: "understand-account-recovery" },
          ],
        }
      ),
      article(
        "account-profile",
        "Verify your email address",
        "Understand where email verification fits into account setup.",
        "verify-your-email-address",
        {
          whatItIs:
            "Email verification confirms the email address linked to your FlixTrend account.",
          where: "Use the verification link or code sent to your email.",
          steps: [
            "Open the email message from FlixTrend.",
            "Select the verification link or enter the verification code if prompted.",
            "Return to FlixTrend after verification is complete.",
          ],
          limits: [
            "Verification is usually part of account setup or recovery.",
          ],
          after: [
            "Your email is marked as verified when the flow succeeds.",
          ],
          related: [
            { title: "Create a FlixTrend account", slug: "create-a-flixtrend-account" },
            { title: "Reset your password", slug: "reset-your-password" },
            { title: "Keep your account secure", slug: "keep-your-account-secure" },
          ],
        }
      ),
      article(
        "account-profile",
        "Update your username",
        "Review how username changes should be handled.",
        "update-your-username",
        {
          whatItIs:
            "Your username is the account name people use to find and recognize you on FlixTrend.",
          where: "Go to your profile and edit the username field.",
          steps: [
            "Open your profile.",
            "Select Edit if available.",
            "Find the username field.",
            "Enter the new username.",
            "Save the change if the app asks you to confirm it.",
          ],
          limits: [
            "A username may need to be unique.",
            "The change is made from your profile area.",
          ],
          after: [
            "Your profile and discovery details use the updated username.",
          ],
          related: [
            { title: "Edit your profile information", slug: "edit-your-profile-information" },
            { title: "Choose an account type", slug: "choose-an-account-type" },
            { title: "Control profile visibility", slug: "control-profile-visibility" },
          ],
        }
      ),
      article(
        "account-profile",
        "Edit your profile information",
        "Manage profile details such as name, bio, and visible information.",
        "edit-your-profile-information",
        {
          whatItIs:
            "Profile editing lets you update the parts of your identity and personalization that appear on your profile.",
          where: "Open your profile and use the edit controls.",
          steps: [
            "Open your profile.",
            "Select Edit if available.",
            "Update your profile photo, banner, bio, interests, or links if those fields appear.",
            "Review privacy controls if they are shown on the same screen.",
            "Save the update if the app asks for confirmation.",
          ],
          limits: [
            "Available fields may depend on your account setup.",
          ],
          after: [
            "Your updated profile appears across FlixTrend where profile details are shown.",
          ],
          related: [
            { title: "Change your profile photo", slug: "change-your-profile-photo" },
            { title: "Update your username", slug: "update-your-username" },
            { title: "Manage account settings", slug: "manage-account-settings" },
          ],
        }
      ),
      article(
        "account-profile",
        "Change your profile photo",
        "Prepare profile image guidance for FlixTrend users.",
        "change-your-profile-photo",
        {
          whatItIs:
            "Your profile photo helps other people recognize your account in FlixTrend.",
          where: "Open your profile edit area and look for the photo field.",
          steps: [
            "Open your profile.",
            "Select Edit if available.",
            "Choose the profile photo field.",
            "Select or upload an image if that option appears.",
            "Confirm the update.",
          ],
          limits: [
            "Image options may depend on your device or account setup.",
          ],
          after: [
            "Your new photo appears on your profile and related surfaces.",
          ],
          related: [
            { title: "Edit your profile information", slug: "edit-your-profile-information" },
            { title: "Manage account settings", slug: "manage-account-settings" },
            { title: "Control profile visibility", slug: "control-profile-visibility" },
          ],
        }
      ),
      article(
        "account-profile",
        "Choose an account type",
        "Explain how users should think about personal and creator-style accounts.",
        "choose-an-account-type",
        {
          whatItIs:
            "Account type controls whether your profile is used as a personal account or a creator account.",
          where: "Use Settings → Account → Switch Account Type.",
          steps: [
            "Open Settings.",
            "Select Account.",
            "Choose Switch Account Type.",
            "Review the available account types.",
            "Confirm the type you want to use.",
          ],
          limits: [
            "The available account types are Personal and Creator.",
          ],
          after: [
            "Your profile and tools may change based on the selected account type.",
          ],
          related: [
            { title: "Edit your profile information", slug: "edit-your-profile-information" },
            { title: "Manage account settings", slug: "manage-account-settings" },
            { title: "Set up a creator profile", slug: "set-up-a-creator-profile" },
          ],
        }
      ),
      article(
        "account-profile",
        "Manage account settings",
        "Cover the account settings users are most likely to look for.",
        "manage-account-settings",
        {
          whatItIs:
            "Account settings is the place for basic account changes and account-level controls.",
          where: "Use Settings → Account.",
          steps: [
            "Open Settings.",
            "Select Account.",
            "Review the available options for your account.",
            "Open the setting you want to change.",
          ],
          limits: [
            "The exact options shown may vary by account type.",
          ],
          after: [
            "Your account uses the updated setting after the change is applied.",
          ],
          related: [
            { title: "Delete your account", slug: "delete-your-account" },
            { title: "Choose an account type", slug: "choose-an-account-type" },
            { title: "Keep your account secure", slug: "keep-your-account-secure" },
          ],
        }
      ),
      article(
        "account-profile",
        "Delete your account",
        "Reserve guidance for users who want to remove their account.",
        "delete-your-account",
        {
          whatItIs:
            "Account deletion removes your FlixTrend account through the account settings flow.",
          where: "Use Settings → Account → Delete Account.",
          steps: [
            "Open Settings.",
            "Select Account.",
            "Choose Delete Account.",
            "Review any confirmation prompts.",
            "Confirm the deletion if you want to continue.",
          ],
          limits: [
            "This action is handled from account settings.",
            "Make sure you want to remove the account before confirming.",
          ],
          after: [
            "Your account is removed after the deletion flow is completed.",
          ],
          related: [
            { title: "Manage account settings", slug: "manage-account-settings" },
            { title: "Understand account recovery", slug: "understand-account-recovery" },
            { title: "Keep your account secure", slug: "keep-your-account-secure" },
          ],
        }
      ),
    ],
  },

  {
    title: "Privacy & Security",
    slug: "privacy-security",
    desc: "Guides for account protection, visibility controls, reporting concerns, and safer use.",
    articles: [
      article(
        "privacy-security",
        "Keep your account secure",
        "Outline basic account safety steps for FlixTrend users.",
        "keep-your-account-secure",
        {
          whatItIs:
            "Security settings and safe habits help protect your FlixTrend account and profile.",
          where: "Review your account, login, and privacy settings.",
          steps: [
            "Use a strong password.",
            "Verify your email address.",
            "Review account activity if it is available.",
            "Keep your recovery details up to date.",
          ],
          limits: [
            "FlixTrend can help with security tools, but it does not promise perfect protection.",
          ],
          after: [
            "A safer account setup reduces risk from unwanted access.",
          ],
          related: [
            { title: "Create a stronger password", slug: "create-a-stronger-password" },
            { title: "Recognize suspicious login activity", slug: "recognize-suspicious-login-activity" },
            { title: "Understand account recovery", slug: "understand-account-recovery" },
          ],
        }
      ),
      article(
        "privacy-security",
        "Create a stronger password",
        "Help users choose and maintain safer login credentials.",
        "create-a-stronger-password",
        {
          whatItIs:
            "A stronger password helps protect your account from unwanted access.",
          where: "Update your password in account or login recovery flows.",
          steps: [
            "Choose a password that is hard to guess.",
            "Avoid reusing the same password on other services.",
            "Change your password if you think it has been exposed.",
            "Keep the password private.",
          ],
          limits: [
            "FlixTrend security guidance uses may, can, and helps rather than guarantees.",
          ],
          after: [
            "Your login is safer after you replace a weak or exposed password.",
          ],
          related: [
            { title: "Keep your account secure", slug: "keep-your-account-secure" },
            { title: "Reset your password", slug: "reset-your-password" },
            { title: "Recognize suspicious login activity", slug: "recognize-suspicious-login-activity" },
          ],
        }
      ),
      article(
        "privacy-security",
        "Recognize suspicious login activity",
        "Explain what users should do if account activity looks unfamiliar.",
        "recognize-suspicious-login-activity",
        {
          whatItIs:
            "Suspicious login activity is anything in your account history that does not look familiar.",
          where: "Review account activity if available in your settings or security area.",
          steps: [
            "Check recent account activity if the app shows it.",
            "Look for sign-ins you do not recognize.",
            "Change your password if anything looks wrong.",
            "Review email verification and recovery details.",
          ],
          limits: [
            "Activity details may depend on what FlixTrend shows in your account area.",
          ],
          after: [
            "You can keep watching for new activity after you update your security details.",
          ],
          related: [
            { title: "Keep your account secure", slug: "keep-your-account-secure" },
            { title: "Create a stronger password", slug: "create-a-stronger-password" },
            { title: "Understand account recovery", slug: "understand-account-recovery" },
          ],
        }
      ),
      article(
        "privacy-security",
        "Control profile visibility",
        "Describe the profile visibility choices users can review.",
        "control-profile-visibility",
        {
          whatItIs:
            "Profile visibility controls who can see your profile on FlixTrend.",
          where: "Open your privacy settings and review the public profile and private profile options.",
          steps: [
            "Open privacy settings.",
            "Review the public profile option.",
            "Review the private profile option.",
            "Choose the visibility that fits your account.",
          ],
          limits: [
            "The available visibility options are public profile and private profile.",
          ],
          after: [
            "Your profile visibility updates after you choose the setting.",
          ],
          related: [
            { title: "Manage content visibility", slug: "manage-content-visibility" },
            { title: "Block another user", slug: "block-another-user" },
            { title: "Report a privacy concern", slug: "report-a-privacy-concern" },
          ],
        }
      ),
      article(
        "privacy-security",
        "Manage content visibility",
        "Guide users through visibility decisions for posts and profile content.",
        "manage-content-visibility",
        {
          whatItIs:
            "Content visibility controls who can see your posts and profile content.",
          where: "Open privacy settings and review content visibility controls if they are available.",
          steps: [
            "Open privacy settings.",
            "Find content visibility controls.",
            "Review the available visibility options.",
            "Choose the option that fits your post or profile content.",
          ],
          limits: [
            "Content visibility options may vary by feature or account type.",
          ],
          after: [
            "Your visibility choice applies to the content settings you changed.",
          ],
          related: [
            { title: "Control profile visibility", slug: "control-profile-visibility" },
            { title: "Protect personal information", slug: "protect-personal-information" },
            { title: "Block another user", slug: "block-another-user" },
          ],
        }
      ),
      article(
        "privacy-security",
        "Block another user",
        "Prepare a guide for limiting contact from another account.",
        "block-another-user",
        {
          whatItIs:
            "Blocking helps limit contact from a user you do not want to interact with.",
          where: "Use the block control on the profile or interaction screen if available.",
          steps: [
            "Open the user profile or the place where the interaction appears.",
            "Select Block if the option is available.",
            "Review the confirmation prompt.",
            "Confirm the block.",
          ],
          limits: [
            "Blocking is part of the privacy and security tools FlixTrend provides.",
          ],
          after: [
            "The blocked account should have limited ability to contact or interact with you.",
          ],
          related: [
            { title: "Mute a conversation", slug: "mute-a-conversation" },
            { title: "Report a privacy concern", slug: "report-a-privacy-concern" },
            { title: "Report a message", slug: "report-a-message" },
          ],
        }
      ),
      article(
        "privacy-security",
        "Report a privacy concern",
        "Show users where privacy concerns should be sent.",
        "report-a-privacy-concern",
        {
          whatItIs:
            "Reporting a privacy concern sends an issue to FlixTrend for review.",
          where: "Use the report control if it is available in the profile, post, or message area.",
          steps: [
            "Open the item that raises the privacy concern.",
            "Select Report if available.",
            "Choose the reason that best matches the issue.",
            "Send the report for review.",
          ],
          limits: [
            "FlixTrend may review reports and decide what action to take.",
          ],
          after: [
            "The report moves into the moderation or review flow.",
          ],
          related: [
            { title: "Control profile visibility", slug: "control-profile-visibility" },
            { title: "Protect personal information", slug: "protect-personal-information" },
            { title: "Report a profile", slug: "report-a-profile" },
          ],
        }
      ),
      article(
        "privacy-security",
        "Protect personal information",
        "Share practical privacy guidance for what users post and share.",
        "protect-personal-information",
        {
          whatItIs:
            "Personal information protection is about choosing what to share in your profile, posts, and messages.",
          where: "Review your profile, links, bio, and content visibility settings.",
          steps: [
            "Check your profile photo, banner, bio, and links.",
            "Review what appears in public profile areas.",
            "Use privacy settings for content visibility when available.",
            "Avoid sharing details you do not want public.",
          ],
          limits: [
            "Protection depends on the visibility settings and content you choose to share.",
          ],
          after: [
            "Your account stays easier to manage when you review shared details often.",
          ],
          related: [
            { title: "Edit your profile information", slug: "edit-your-profile-information" },
            { title: "Control profile visibility", slug: "control-profile-visibility" },
            { title: "Manage content visibility", slug: "manage-content-visibility" },
          ],
        }
      ),
      article(
        "privacy-security",
        "Manage notifications safely",
        "Cover notification settings that may affect privacy and attention.",
        "manage-notifications-safely",
        {
          whatItIs:
            "Notification settings help you control what FlixTrend sends to your device or browser if those options are available.",
          where: "Open your notification settings if FlixTrend shows them.",
          steps: [
            "Open notification settings.",
            "Review the notification options shown.",
            "Turn off the notifications you do not want.",
            "Keep the alerts that help you stay aware of account activity.",
          ],
          limits: [
            "Notification controls may vary by platform.",
          ],
          after: [
            "Your alert preferences update after you change the setting.",
          ],
          related: [
            { title: "Keep your account secure", slug: "keep-your-account-secure" },
            { title: "Manage account settings", slug: "manage-account-settings" },
            { title: "Troubleshoot notification problems", slug: "fix-notification-problems" },
          ],
        }
      ),
      article(
        "privacy-security",
        "Understand account recovery",
        "Reserve a guide for recovering access while protecting account ownership.",
        "understand-account-recovery",
        {
          whatItIs:
            "Account recovery helps you get back into your account through the login support flow.",
          where: "Start from Login → Forgot Password.",
          steps: [
            "Open the Login screen.",
            "Select Forgot Password.",
            "Use the recovery steps shown to you.",
            "Return to sign in after the recovery flow finishes.",
          ],
          limits: [
            "Recovery works through the login flow that FlixTrend provides.",
          ],
          after: [
            "You can sign in again once recovery is complete.",
          ],
          related: [
            { title: "Reset your password", slug: "reset-your-password" },
            { title: "Keep your account secure", slug: "keep-your-account-secure" },
            { title: "Sign in to your account", slug: "sign-in-to-your-account" },
          ],
        }
      ),
    ],
  },

  {
    title: "Vibes & Posting",
    slug: "vibes-posting",
    desc: "Guides for creating, publishing, editing, and managing everyday FlixTrend posts.",
    articles: [
      article(
        "vibes-posting",
        "Create a Vibe",
        "Explain the basic workflow for publishing a Vibe.",
        "create-a-vibe",
        {
          whatItIs:
            "A Vibe is the main FlixTrend post format for text, images, videos, and polls.",
          where: "Use Squad → Flix Your Fit → Choose type, or Create Post → Choose type.",
          steps: [
            "Open Squad.",
            "Select Flix Your Fit.",
            "Choose the post type you want to publish.",
            "Add your text, image, video, or poll content.",
            "Publish the Vibe.",
          ],
          limits: [
            "Vibes support text, images, videos, and polls.",
            "Videos can be up to 500 MB.",
            "Images can be up to 65.",
          ],
          after: [
            "Your Vibe can appear in discovery through tags, search, or recommendations.",
          ],
          related: [
            { title: "Upload media for a post", slug: "upload-media-for-a-post" },
            { title: "Add tags to a post", slug: "add-tags-to-a-post" },
            { title: "Share a post", slug: "share-a-post" },
          ],
        }
      ),
      article(
        "vibes-posting",
        "Upload media for a post",
        "Cover how users should add media to a new post.",
        "upload-media-for-a-post",
        {
          whatItIs:
            "Media upload lets you add images or videos to a Vibe.",
          where: "Use the post creation flow when you add media.",
          steps: [
            "Start a new Vibe.",
            "Choose image or video media.",
            "Add the files you want to post.",
            "Review the preview if it appears.",
            "Publish the post when it is ready.",
          ],
          limits: [
            "Videos can be up to 500 MB.",
            "Images can be up to 65.",
          ],
          after: [
            "Your media becomes part of the published post.",
          ],
          related: [
            { title: "Create a Vibe", slug: "create-a-vibe" },
            { title: "Write a post caption", slug: "write-a-post-caption" },
            { title: "Troubleshoot posting issues", slug: "troubleshoot-posting-issues" },
          ],
        }
      ),
      article(
        "vibes-posting",
        "Write a post caption",
        "Help users prepare helpful captions without overexplaining features.",
        "write-a-post-caption",
        {
          whatItIs:
            "A caption adds text to a Vibe, Flash, or other post type where text is supported.",
          where: "Use the text area in the post creation flow.",
          steps: [
            "Open the post composer.",
            "Tap or click the caption field.",
            "Write the text you want to share.",
            "Review the caption before publishing.",
          ],
          limits: [
            "Caption limits may depend on the post type and screen you are using.",
          ],
          after: [
            "The caption appears with the post after publishing.",
          ],
          related: [
            { title: "Create a Vibe", slug: "create-a-vibe" },
            { title: "Add tags to a post", slug: "add-tags-to-a-post" },
            { title: "Share a post", slug: "share-a-post" },
          ],
        }
      ),
      article(
        "vibes-posting",
        "Add tags to a post",
        "Guide users through simple tagging and discovery basics.",
        "add-tags-to-a-post",
        {
          whatItIs:
            "Tags help people find your post through search and recommendations.",
          where: "Use the tag field in the post creation flow if it is available.",
          steps: [
            "Open the post composer.",
            "Find the tag field if it is shown.",
            "Add the tags that match your post.",
            "Review the tags before you publish.",
          ],
          limits: [
            "Tags are used for discovery with search and recommendations.",
          ],
          after: [
            "Your post can appear in tag-based discovery surfaces.",
          ],
          related: [
            { title: "Create a Vibe", slug: "create-a-vibe" },
            { title: "Search", slug: "search" },
            { title: "Share a post", slug: "share-a-post" },
          ],
        }
      ),
      article(
        "vibes-posting",
        "Edit a published post",
        "Reserve instructions for post changes after publishing.",
        "edit-a-published-post",
        {
          whatItIs:
            "Editing lets you update a post after it has been published if the edit option is available.",
          where: "Open the post actions menu and select edit.",
          steps: [
            "Open the published post.",
            "Select Edit if available.",
            "Update the text or media fields you need to change.",
            "Review the update.",
            "Save the change if the app asks you to confirm it.",
          ],
          limits: [
            "Post editing depends on the controls available for that post.",
          ],
          after: [
            "The updated post replaces the earlier version if editing succeeds.",
          ],
          related: [
            { title: "Delete a post", slug: "delete-a-post" },
            { title: "Save a draft", slug: "save-a-draft" },
            { title: "Troubleshoot posting issues", slug: "troubleshoot-posting-issues" },
          ],
        }
      ),
      article(
        "vibes-posting",
        "Delete a post",
        "Explain how users can remove content they no longer want visible.",
        "delete-a-post",
        {
          whatItIs:
            "Deleting a post removes it from view through the post actions menu.",
          where: "Open the post and use the delete option if available.",
          steps: [
            "Open the post you want to remove.",
            "Select Delete if available.",
            "Review the confirmation prompt.",
            "Confirm the deletion.",
          ],
          limits: [
            "Deletion depends on the post actions that appear for your content.",
          ],
          after: [
            "The post is removed after the delete action is confirmed.",
          ],
          related: [
            { title: "Edit a published post", slug: "edit-a-published-post" },
            { title: "Save a draft", slug: "save-a-draft" },
            { title: "Report a post", slug: "report-a-post" },
          ],
        }
      ),
      article(
        "vibes-posting",
        "Save a draft",
        "Prepare draft guidance if the posting flow supports it.",
        "save-a-draft",
        {
          whatItIs:
            "A draft saves post work before you publish it if the draft option is available.",
          where: "Use the post creation flow and look for Save Draft.",
          steps: [
            "Start a new post.",
            "Add the text or media you want to keep.",
            "Select Save Draft if available.",
            "Return to the draft later from your posting area if the app shows it.",
          ],
          limits: [
            "Draft support depends on the posting flow you are using.",
          ],
          after: [
            "Your draft stays available until you publish or remove it.",
          ],
          related: [
            { title: "Create a Vibe", slug: "create-a-vibe" },
            { title: "Edit a published post", slug: "edit-a-published-post" },
            { title: "Troubleshoot posting issues", slug: "troubleshoot-posting-issues" },
          ],
        }
      ),
      article(
        "vibes-posting",
        "Find your posts",
        "Show users where their published content appears.",
        "find-your-posts",
        {
          whatItIs:
            "Your posts are the Vibes, Flashes, or Flow items you have published on FlixTrend.",
          where: "Check your profile or the content area where your posts appear if available.",
          steps: [
            "Open your profile.",
            "Look for your published content area.",
            "Open the post you want to review.",
          ],
          limits: [
            "The exact location may depend on how your profile is arranged.",
          ],
          after: [
            "You can review, edit, share, or delete a post from its actions menu if available.",
          ],
          related: [
            { title: "Create a Vibe", slug: "create-a-vibe" },
            { title: "Edit a published post", slug: "edit-a-published-post" },
            { title: "Delete a post", slug: "delete-a-post" },
          ],
        }
      ),
      article(
        "vibes-posting",
        "Share a post",
        "Cover the basics of sharing FlixTrend content.",
        "share-a-post",
        {
          whatItIs:
            "Sharing sends a FlixTrend post to another place or person if the share control is available.",
          where: "Use the share option in the post actions menu.",
          steps: [
            "Open the post you want to share.",
            "Select Share if available.",
            "Choose where you want to send or place the post.",
            "Confirm the share action.",
          ],
          limits: [
            "Share options may depend on the post and the screen you are using.",
          ],
          after: [
            "The post is shared through the option you selected.",
          ],
          related: [
            { title: "Share a post in a message", slug: "share-a-post-in-a-message" },
            { title: "Create a Vibe", slug: "create-a-vibe" },
            { title: "Search", slug: "search" },
          ],
        }
      ),
      article(
        "vibes-posting",
        "Troubleshoot posting issues",
        "Collect common fixes for upload and publish problems.",
        "troubleshoot-posting-issues",
        {
          whatItIs:
            "Posting troubleshooting helps when a Vibe, image, or video does not upload or publish correctly.",
          where: "Check the post creation flow and your device or network connection.",
          steps: [
            "Check your connection.",
            "Refresh the page or app.",
            "Update FlixTrend if an update is available.",
            "Clear cache if you are using the web app.",
            "Retry the upload or publish action.",
            "Visit /help if the issue continues.",
          ],
          limits: [
            "Videos can be up to 500 MB.",
            "Images can be up to 65.",
          ],
          troubleshooting: [
            "Collect the device model, the steps you took, screenshots if available, and the time the issue happened before you contact support.",
          ],
          related: [
            { title: "Upload media for a post", slug: "upload-media-for-a-post" },
            { title: "Report a bug", slug: "report-a-bug" },
            { title: "Contact FlixTrend support", slug: "contact-flixtrend-support" },
          ],
        }
      ),
    ],
  },

  {
    title: "Flashes & Drops",
    slug: "flashes-drops",
    desc: "Guides for short updates, temporary moments, and quick content interactions.",
    articles: [
      article(
        "flashes-drops",
        "Create a Flash",
        "Introduce the workflow for posting a Flash.",
        "create-a-flash",
        {
          whatItIs:
            "A Flash is a fast, lightweight, temporary sharing format for moments you want to post quickly.",
          where: "Use the Flash creation flow if it is available in your app.",
          steps: [
            "Open the Flash creation flow if it appears in your app.",
            "Add an image or video.",
            "Add a caption if the field is shown.",
            "Publish the Flash.",
          ],
          limits: [
            "Flashes support image, video, and captions.",
            "Flashes are separate from Vibes.",
          ],
          after: [
            "Your Flash appears as a temporary update.",
          ],
          related: [
            { title: "View Flashes", slug: "view-flashes" },
            { title: "Create a Drop", slug: "create-a-drop" },
            { title: "Add media to a Drop", slug: "add-media-to-a-drop" },
          ],
        }
      ),
      article(
        "flashes-drops",
        "View Flashes",
        "Explain where users can find and watch Flashes.",
        "view-flashes",
        {
          whatItIs:
            "Flashes are temporary updates that you can watch from the Flash rail.",
          where: "Open the Flash rail at the top of Squad.",
          steps: [
            "Open Squad.",
            "Look for the Flash rail at the top.",
            "Tap a Flash to watch it.",
            "Move through the temporary updates as they appear.",
          ],
          limits: [
            "Flashes are temporary.",
            "Flashes are separate from Vibes.",
          ],
          after: [
            "You return to the rail or feed after watching a Flash.",
          ],
          related: [
            { title: "Create a Flash", slug: "create-a-flash" },
            { title: "Create a Vibe", slug: "create-a-vibe" },
            { title: "Search", slug: "search" },
          ],
        }
      ),
      article(
        "flashes-drops",
        "Create a Drop",
        "Guide users through making a Drop.",
        "create-a-drop",
        {
          whatItIs:
            "A Drop is a daily participation format where users post first and then unlock other Drops.",
          where: "Use the Drop prompt and create your response in the Drop flow if it is available.",
          steps: [
            "Wait for the daily prompt to be released.",
            "Create your Drop response.",
            "Publish your Drop.",
            "Open other Drops after you post.",
            "Use the poll step if you are one of the first 50 users and the poll option appears.",
            "Watch the most voted poll become the next day’s Drop if that flow is shown.",
          ],
          limits: [
            "Drops disappear after 24 hours.",
            "Only the first 50 users may create one poll if that feature is available.",
          ],
          after: [
            "Your Drop joins the community participation flow for that day.",
          ],
          related: [
            { title: "Add media to a Drop", slug: "add-media-to-a-drop" },
            { title: "View Flashes", slug: "view-flashes" },
            { title: "Create a Vibe", slug: "create-a-vibe" },
          ],
        }
      ),
      article(
        "flashes-drops",
        "Add media to a Drop",
        "Reserve instructions for attaching media to Drop content.",
        "add-media-to-a-drop",
        {
          whatItIs:
            "Media in a Drop can include text, image, or video content.",
          where: "Add media inside the Drop creation flow if the option is shown.",
          steps: [
            "Start a Drop response.",
            "Choose the media type you want to add.",
            "Attach the image or video if that field appears.",
            "Review the Drop before you publish it.",
          ],
          limits: [
            "Drops support text, image, and video.",
          ],
          after: [
            "The media becomes part of your Drop response.",
          ],
          related: [
            { title: "Create a Drop", slug: "create-a-drop" },
            { title: "View Flashes", slug: "view-flashes" },
            { title: "Share a post", slug: "share-a-post" },
          ],
        }
      ),
      article(
        "flashes-drops",
        "React to a Drop",
        "Cover the basics of responding to Drops.",
        "react-to-a-drop",
        {
          whatItIs:
            "Drop reactions are the ways you may respond to community participation if response controls are available.",
          where: "Open a Drop and look for any response option that appears.",
          steps: [
            "Open the Drop.",
            "Review the response controls if they are shown.",
            "Choose the response that fits your action.",
            "Submit it if the app asks for confirmation.",
          ],
          limits: [
            "Response controls may depend on the Drop flow you are using.",
          ],
          after: [
            "Your response is added to the Drop experience if the option is available.",
          ],
          related: [
            { title: "Create a Drop", slug: "create-a-drop" },
            { title: "Add media to a Drop", slug: "add-media-to-a-drop" },
            { title: "Search", slug: "search" },
          ],
        }
      ),
      article(
        "flashes-drops",
        "Manage your Drops",
        "Explain where users can review or change their Drops.",
        "manage-your-drops",
        {
          whatItIs:
            "Managing your Drops means reviewing, updating, or removing your Drop content if those controls are available.",
          where: "Check your profile, your Drop area, or the item actions menu if available.",
          steps: [
            "Open your Drop-related content area if it appears.",
            "Find the Drop you want to review.",
            "Use the available actions such as edit or delete if they are shown.",
          ],
          limits: [
            "Drop controls may depend on the current state of the Drop.",
            "Drops disappear after 24 hours.",
          ],
          after: [
            "Your Drop updates apply through the actions you choose.",
          ],
          related: [
            { title: "Create a Drop", slug: "create-a-drop" },
            { title: "Remove a Flash or Drop", slug: "remove-a-flash-or-drop" },
            { title: "Understand Drop visibility", slug: "understand-drop-visibility" },
          ],
        }
      ),
      article(
        "flashes-drops",
        "Remove a Flash or Drop",
        "Help users remove short-form content when needed.",
        "remove-a-flash-or-drop",
        {
          whatItIs:
            "Removing a Flash or Drop takes the temporary content out of view through the available delete or remove action.",
          where: "Open the Flash or Drop and use the remove option if it appears.",
          steps: [
            "Open the Flash or Drop.",
            "Open the actions menu if available.",
            "Select Remove or Delete if shown.",
            "Confirm the change.",
          ],
          limits: [
            "The available action depends on the content type and screen.",
          ],
          after: [
            "The content is removed from view after confirmation.",
          ],
          related: [
            { title: "Create a Flash", slug: "create-a-flash" },
            { title: "Create a Drop", slug: "create-a-drop" },
            { title: "Manage your Drops", slug: "manage-your-drops" },
          ],
        }
      ),
      article(
        "flashes-drops",
        "Understand Drop visibility",
        "Prepare guidance on who can see Drop activity.",
        "understand-drop-visibility",
        {
          whatItIs:
            "Drop visibility is about how your participation appears while the 24-hour Drop cycle is active.",
          where: "Look at the Drop flow and any visibility details shown there.",
          steps: [
            "Review the Drop before posting.",
            "Check any visibility note shown in the Drop flow.",
            "Post first to unlock other Drops.",
          ],
          limits: [
            "Drops disappear after 24 hours.",
            "Drops are community participation, not normal posts.",
          ],
          after: [
            "Your Drop is shown during the active daily cycle.",
          ],
          related: [
            { title: "Create a Drop", slug: "create-a-drop" },
            { title: "Manage your Drops", slug: "manage-your-drops" },
            { title: "Create a Vibe", slug: "create-a-vibe" },
          ],
        }
      ),
      article(
        "flashes-drops",
        "Use quick posting tools",
        "Describe fast posting options without inventing unsupported features.",
        "use-quick-posting-tools",
        {
          whatItIs:
            "Quick posting tools help you share content with less setup when the feature is available.",
          where: "Check the post, Flash, or Drop creation flow for fast posting options.",
          steps: [
            "Open the posting flow.",
            "Look for quick options that are shown on the screen.",
            "Add the content you want to share.",
            "Publish when you are ready.",
          ],
          limits: [
            "Only the options shown in the app should be used.",
          ],
          after: [
            "Your content appears in the format you selected.",
          ],
          related: [
            { title: "Create a Flash", slug: "create-a-flash" },
            { title: "Create a Drop", slug: "create-a-drop" },
            { title: "Create a Vibe", slug: "create-a-vibe" },
          ],
        }
      ),
      article(
        "flashes-drops",
        "Fix Flash or Drop problems",
        "Collect troubleshooting steps for short-form content issues.",
        "fix-flash-or-drop-problems",
        {
          whatItIs:
            "This help path covers common issues when a Flash or Drop does not load, publish, or appear correctly.",
          where: "Check the Flashes or Drops area and your device connection.",
          steps: [
            "Check your connection.",
            "Refresh the app or page.",
            "Update FlixTrend if an update is available.",
            "Clear cache if you are on web.",
            "Retry the action.",
          ],
          troubleshooting: [
            "If the issue continues, collect your device, the steps you took, screenshots if available, and the time of the issue before you contact support.",
          ],
          related: [
            { title: "Create a Flash", slug: "create-a-flash" },
            { title: "Create a Drop", slug: "create-a-drop" },
            { title: "Contact FlixTrend support", slug: "contact-flixtrend-support" },
          ],
        }
      ),
    ],
  },

  {
    title: "Messaging & Calls",
    slug: "messaging-calls",
    desc: "Guides for Pings, conversations, sharing, and call-related support where available.",
    articles: [
      article(
        "messaging-calls",
        "Send a Ping",
        "Explain how users start a simple message or conversation.",
        "send-a-ping",
        {
          whatItIs:
            "A Ping is a Signal message that starts or continues a conversation.",
          where: "Use Signal to send messages.",
          steps: [
            "Open Signal.",
            "Start or open a conversation.",
            "Type your message.",
            "Add an image, video, or post if needed.",
            "Send the Ping.",
          ],
          limits: [
            "Signal supports messages, images, videos, shared posts, conversations, and message controls.",
          ],
          after: [
            "Your message appears in the conversation thread.",
          ],
          related: [
            { title: "Open your conversations", slug: "open-your-conversations" },
            { title: "Share a post in a message", slug: "share-a-post-in-a-message" },
            { title: "Mute a conversation", slug: "mute-a-conversation" },
          ],
        }
      ),
      article(
        "messaging-calls",
        "Open your conversations",
        "Show users where messages and conversation threads live.",
        "open-your-conversations",
        {
          whatItIs:
            "Your conversations are the message threads you keep in Signal.",
          where: "Open Signal and look for your conversation list.",
          steps: [
            "Open Signal.",
            "Look for your conversation list or inbox area.",
            "Select the conversation you want to open.",
          ],
          limits: [
            "Conversation layout may vary by device or screen size.",
          ],
          after: [
            "You can read, reply, share, mute, delete, or report from the conversation if those controls appear.",
          ],
          related: [
            { title: "Send a Ping", slug: "send-a-ping" },
            { title: "Share a post in a message", slug: "share-a-post-in-a-message" },
            { title: "Report a message", slug: "report-a-message" },
          ],
        }
      ),
      article(
        "messaging-calls",
        "Share a post in a message",
        "Guide users through sending content inside a conversation.",
        "share-a-post-in-a-message",
        {
          whatItIs:
            "Sharing a post in Signal sends FlixTrend content inside a conversation.",
          where: "Use the share action from a post or from Signal if it is available.",
          steps: [
            "Open the post you want to send.",
            "Select Share if available.",
            "Choose Signal as the destination if shown.",
            "Pick the conversation.",
            "Send the post.",
          ],
          limits: [
            "The share flow depends on whether the share option is shown.",
          ],
          after: [
            "The post appears in the conversation thread.",
          ],
          related: [
            { title: "Send a Ping", slug: "send-a-ping" },
            { title: "Open your conversations", slug: "open-your-conversations" },
            { title: "Share a post", slug: "share-a-post" },
          ],
        }
      ),
      article(
        "messaging-calls",
        "Manage message requests",
        "Reserve guidance for accepting or handling new message requests.",
        "manage-message-requests",
        {
          whatItIs:
            "Message requests are incoming conversations that may need your review before you reply if the feature is available.",
          where: "Check Signal for any request area if it is shown.",
          steps: [
            "Open Signal.",
            "Look for message requests if the feature is present.",
            "Review the sender and message content.",
            "Accept, mute, delete, or report if those options are available.",
          ],
          limits: [
            "Message request controls may not appear in every account or view.",
          ],
          after: [
            "The request moves into the action you chose.",
          ],
          related: [
            { title: "Mute a conversation", slug: "mute-a-conversation" },
            { title: "Delete a conversation", slug: "delete-a-conversation" },
            { title: "Report a message", slug: "report-a-message" },
          ],
        }
      ),
      article(
        "messaging-calls",
        "Mute a conversation",
        "Explain how users can quiet a conversation.",
        "mute-a-conversation",
        {
          whatItIs:
            "Muting helps reduce notifications from a Signal conversation.",
          where: "Use the conversation controls in Signal.",
          steps: [
            "Open the conversation.",
            "Find the mute control if it is shown.",
            "Turn on mute for that conversation.",
          ],
          limits: [
            "Mute controls are part of the message controls FlixTrend provides.",
          ],
          after: [
            "The conversation becomes quieter in your inbox.",
          ],
          related: [
            { title: "Open your conversations", slug: "open-your-conversations" },
            { title: "Delete a conversation", slug: "delete-a-conversation" },
            { title: "Control who can contact you", slug: "control-who-can-contact-you" },
          ],
        }
      ),
      article(
        "messaging-calls",
        "Delete a conversation",
        "Prepare guidance for removing conversation history from view.",
        "delete-a-conversation",
        {
          whatItIs:
            "Deleting a conversation removes the thread from your view if the delete control is available.",
          where: "Open the conversation and look for Delete in the actions menu.",
          steps: [
            "Open Signal.",
            "Open the conversation you want to remove.",
            "Select Delete if available.",
            "Confirm the action.",
          ],
          limits: [
            "Deletion depends on the controls shown in the conversation.",
          ],
          after: [
            "The conversation is removed from view after confirmation.",
          ],
          related: [
            { title: "Mute a conversation", slug: "mute-a-conversation" },
            { title: "Report a message", slug: "report-a-message" },
            { title: "Open your conversations", slug: "open-your-conversations" },
          ],
        }
      ),
      article(
        "messaging-calls",
        "Report a message",
        "Show how users can report inappropriate or harmful messages.",
        "report-a-message",
        {
          whatItIs:
            "Reporting a message sends the conversation or message to FlixTrend for review.",
          where: "Use the report control in Signal if it is available.",
          steps: [
            "Open the message or conversation.",
            "Select Report if shown.",
            "Choose the reason that fits the issue.",
            "Submit the report.",
          ],
          limits: [
            "FlixTrend may review and act on reports.",
          ],
          after: [
            "The report enters moderation review.",
          ],
          related: [
            { title: "Block another user", slug: "block-another-user" },
            { title: "Delete a conversation", slug: "delete-a-conversation" },
            { title: "Contact moderation support", slug: "contact-moderation-support" },
          ],
        }
      ),
      article(
        "messaging-calls",
        "Start a call",
        "Reserve call setup guidance for implemented calling flows.",
        "start-a-call",
        {
          whatItIs:
            "Calling is only mentioned if it is available in Signal.",
          where: "Look for call controls in Signal if the feature appears.",
          steps: [
            "Open Signal.",
            "Open the conversation you want to use.",
            "Select the call control if it is available.",
            "Follow the call screen if it appears.",
          ],
          limits: [
            "FlixTrend does not promise group calls or recording.",
            "Calling should only be described when it is available.",
          ],
          after: [
            "The call begins only if the feature is present on your account.",
          ],
          related: [
            { title: "Fix call connection issues", slug: "fix-call-connection-issues" },
            { title: "Open your conversations", slug: "open-your-conversations" },
            { title: "Send a Ping", slug: "send-a-ping" },
          ],
        }
      ),
      article(
        "messaging-calls",
        "Fix call connection issues",
        "Collect help steps for calls that do not connect correctly.",
        "fix-call-connection-issues",
        {
          whatItIs:
            "This helps when a call in Signal does not connect or load correctly if calling is available.",
          where: "Check Signal, your device connection, and the call screen.",
          steps: [
            "Check your internet connection.",
            "Refresh the app or page.",
            "Update FlixTrend if an update is available.",
            "Retry the call.",
          ],
          troubleshooting: [
            "If it still fails, collect your device, the steps you took, screenshots if available, and the time of the issue before contacting support.",
          ],
          related: [
            { title: "Start a call", slug: "start-a-call" },
            { title: "Send a Ping", slug: "send-a-ping" },
            { title: "Contact FlixTrend support", slug: "contact-flixtrend-support" },
          ],
        }
      ),
      article(
        "messaging-calls",
        "Control who can contact you",
        "Explain messaging and contact controls in one place.",
        "control-who-can-contact-you",
        {
          whatItIs:
            "Contact controls help limit who can message or reach you through Signal and related privacy tools.",
          where: "Check privacy settings, message controls, and profile controls if they are available.",
          steps: [
            "Open privacy settings.",
            "Review message and contact controls.",
            "Use mute, block, or report when needed.",
            "Keep the settings that match how you want to be contacted.",
          ],
          limits: [
            "The exact controls shown may vary by account or platform.",
          ],
          after: [
            "Your contact preferences apply after the setting changes.",
          ],
          related: [
            { title: "Mute a conversation", slug: "mute-a-conversation" },
            { title: "Block another user", slug: "block-another-user" },
            { title: "Manage message requests", slug: "manage-message-requests" },
          ],
        }
      ),
    ],
  },

  {
    title: "Search",
    slug: "search",
    desc: "Guides for fast discovery across creators, posts, profiles, trends, and topics.",
    articles: [
      article(
        "search",
        "Search",
        "Explain the main discovery feature and what it can find.",
        "search",
        {
          whatItIs:
            "Search is FlixTrend’s fast discovery tool for creators, posts, profiles, trends, and topics.",
          where: "Use the Search area in FlixTrend.",
          steps: [
            "Open Search.",
            "Type the name, topic, or keyword you want to find.",
            "Review the results for creators, posts, profiles, trends, or topics.",
            "Open the item you want to view.",
          ],
          limits: [
            "Search is powered by Algolia.",
            "Use Search for fast and relevant discovery.",
          ],
          after: [
            "You can move from search results into the content or profile you selected.",
          ],
          related: [
            { title: "Find relevant creators", slug: "find-relevant-creators" },
            { title: "Understand trending signals", slug: "understand-trending-signals" },
            { title: "Almighty AI", slug: "understand-almighty-ai" },
          ],
        }
      ),
    ],
  },

  {
    title: "Fast Checking",
    slug: "fast-checking",
    desc: "Guides for understanding fast content checks and how users should respond to review signals.",
    articles: [
      article(
        "fast-checking",
        "Understand Fast Checking",
        "Explain the purpose of Fast Checking in plain language.",
        "understand-fast-checking",
        {
          whatItIs:
            "Fast Checking helps improve content quality by providing context, surfacing references, and flagging possible issues.",
          where: "Use the Fast Checking area if it is shown on the content screen.",
          steps: [
            "Open the content you want to review.",
            "Look for the Fast Checking information if it appears.",
            "Read the context, references, and flags that are shown.",
          ],
          limits: [
            "Fast Checking cannot guarantee truth.",
            "It supports review instead of replacing human judgment.",
          ],
          after: [
            "You can use the signal as one part of your review process.",
          ],
          related: [
            { title: "Read a Fast Checking result", slug: "read-a-fast-checking-result" },
            { title: "Understand check limits", slug: "understand-check-limits" },
            { title: "Report misleading content", slug: "report-misleading-content" },
          ],
        }
      ),
      article(
        "fast-checking",
        "Read a Fast Checking result",
        "Help users interpret a check result without overstating certainty.",
        "read-a-fast-checking-result",
        {
          whatItIs:
            "A Fast Checking result gives you review signals, not perfect truth.",
          where: "Open the result shown by Fast Checking.",
          steps: [
            "Open the check result.",
            "Read the context that is shown.",
            "Review any references that appear.",
            "Look for possible issues or flags.",
          ],
          limits: [
            "Results help support review and do not guarantee accuracy.",
          ],
          after: [
            "Use the result to guide your next review step.",
          ],
          related: [
            { title: "Understand Fast Checking", slug: "understand-fast-checking" },
            { title: "Understand check limits", slug: "understand-check-limits" },
            { title: "Correct a post after a check", slug: "correct-a-post-after-a-check" },
          ],
        }
      ),
      article(
        "fast-checking",
        "Submit content for checking",
        "Reserve guidance for checking content when the workflow is available.",
        "submit-content-for-checking",
        {
          whatItIs:
            "Submitting content for checking sends it into the Fast Checking review flow if that workflow is available.",
          where: "Use the checking action if it appears on the content screen.",
          steps: [
            "Open the content you want reviewed.",
            "Select the checking option if it is shown.",
            "Review the context or reference data that appears.",
            "Submit the item for checking.",
          ],
          limits: [
            "The checking workflow depends on the screen and feature availability.",
          ],
          after: [
            "The content moves into the review process.",
          ],
          related: [
            { title: "Understand Fast Checking", slug: "understand-fast-checking" },
            { title: "Review flagged content", slug: "review-flagged-content" },
            { title: "Report misleading content", slug: "report-misleading-content" },
          ],
        }
      ),
      article(
        "fast-checking",
        "Review flagged content",
        "Explain what users should do when a post receives a review signal.",
        "review-flagged-content",
        {
          whatItIs:
            "Flagged content is content that Fast Checking has marked for extra review.",
          where: "Open the flagged item and review the signal details.",
          steps: [
            "Open the flagged content.",
            "Read the context and references that are shown.",
            "Check whether the post needs an update or correction.",
            "Make changes if needed.",
          ],
          limits: [
            "Fast Checking can flag issues, but it cannot guarantee truth.",
          ],
          after: [
            "The item is either corrected or kept under review based on your actions.",
          ],
          related: [
            { title: "Read a Fast Checking result", slug: "read-a-fast-checking-result" },
            { title: "Correct a post after a check", slug: "correct-a-post-after-a-check" },
            { title: "Understand check limits", slug: "understand-check-limits" },
          ],
        }
      ),
      article(
        "fast-checking",
        "Correct a post after a check",
        "Guide users through updating content after review.",
        "correct-a-post-after-a-check",
        {
          whatItIs:
            "Correcting a post means updating the content after Fast Checking points out a possible issue.",
          where: "Use the published post or draft edit controls if they are available.",
          steps: [
            "Open the post that needs correction.",
            "Edit the text, media, or reference that needs attention.",
            "Review the change.",
            "Save or publish the updated post.",
          ],
          limits: [
            "Editing depends on the controls that appear for that post.",
          ],
          after: [
            "The corrected post replaces the earlier version if the edit succeeds.",
          ],
          related: [
            { title: "Edit a published post", slug: "edit-a-published-post" },
            { title: "Review flagged content", slug: "review-flagged-content" },
            { title: "Understand Fast Checking", slug: "understand-fast-checking" },
          ],
        }
      ),
      article(
        "fast-checking",
        "Report misleading content",
        "Show users how to send potentially misleading content for review.",
        "report-misleading-content",
        {
          whatItIs:
            "Reporting misleading content sends the item to FlixTrend for review.",
          where: "Use the report control on the content item if it is available.",
          steps: [
            "Open the content.",
            "Select Report if shown.",
            "Choose the reason that best matches the issue.",
            "Submit the report.",
          ],
          limits: [
            "FlixTrend may review the report and decide what action to take.",
          ],
          after: [
            "The item enters moderation or review.",
          ],
          related: [
            { title: "Understand Fast Checking", slug: "understand-fast-checking" },
            { title: "Report a post", slug: "report-a-post" },
            { title: "Appeal a moderation decision", slug: "appeal-a-moderation-decision" },
          ],
        }
      ),
      article(
        "fast-checking",
        "Understand check limits",
        "Reserve guidance for what Fast Checking can and cannot evaluate.",
        "understand-check-limits",
        {
          whatItIs:
            "Fast Checking supports review, but it does not guarantee truth or replace judgment.",
          where: "Look at the check information shown on the content item.",
          steps: [
            "Open the check result.",
            "Read the context and references.",
            "Use the flag as a review signal rather than a final answer.",
          ],
          limits: [
            "Fast Checking is not perfect.",
            "It helps rather than guarantees.",
          ],
          after: [
            "You can keep reviewing the content with the signal in mind.",
          ],
          related: [
            { title: "Understand Fast Checking", slug: "understand-fast-checking" },
            { title: "Read a Fast Checking result", slug: "read-a-fast-checking-result" },
            { title: "Use Fast Checking responsibly", slug: "use-fast-checking-responsibly" },
          ],
        }
      ),
      article(
        "fast-checking",
        "Appeal a Fast Checking result",
        "Prepare a placeholder for challenging an incorrect result.",
        "appeal-a-fast-checking-result",
        {
          whatItIs:
            "An appeal lets you challenge a check result if that option is available.",
          where: "Look for an appeal control in the result view if it appears.",
          steps: [
            "Open the Fast Checking result.",
            "Look for an appeal option if it is shown.",
            "Add any details you want FlixTrend to review.",
            "Submit the appeal.",
          ],
          limits: [
            "Appeal controls may not appear for every result.",
          ],
          after: [
            "Your request enters the review flow if the appeal option is available.",
          ],
          related: [
            { title: "Read a Fast Checking result", slug: "read-a-fast-checking-result" },
            { title: "Report misleading content", slug: "report-misleading-content" },
            { title: "Understand Fast Checking", slug: "understand-fast-checking" },
          ],
        }
      ),
      article(
        "fast-checking",
        "Use Fast Checking responsibly",
        "Set expectations for responsible use of verification signals.",
        "use-fast-checking-responsibly",
        {
          whatItIs:
            "Fast Checking should be used as a support tool, not as a perfect truth signal.",
          where: "Use the check result alongside your own review.",
          steps: [
            "Review the context and references.",
            "Treat flags as signals to investigate further.",
            "Correct or report content when needed.",
          ],
          limits: [
            "Fast Checking cannot guarantee truth.",
          ],
          after: [
            "Responsible use helps keep content quality stronger.",
          ],
          related: [
            { title: "Understand Fast Checking", slug: "understand-fast-checking" },
            { title: "Read a Fast Checking result", slug: "read-a-fast-checking-result" },
            { title: "Report misleading content", slug: "report-misleading-content" },
          ],
        }
      ),
      article(
        "fast-checking",
        "Troubleshoot Fast Checking",
        "Collect fixes for unavailable or delayed check results.",
        "troubleshoot-fast-checking",
        {
          whatItIs:
            "This helps when Fast Checking does not load or does not show the result you expect.",
          where: "Check the content screen and your device connection.",
          steps: [
            "Check your connection.",
            "Refresh the page or app.",
            "Update FlixTrend if an update is available.",
            "Retry the check.",
          ],
          troubleshooting: [
            "If it still does not work, collect the device, the steps you took, screenshots if available, and the time of the issue before contacting support.",
          ],
          related: [
            { title: "Understand Fast Checking", slug: "understand-fast-checking" },
            { title: "Report a bug", slug: "report-a-bug" },
            { title: "Contact FlixTrend support", slug: "contact-flixtrend-support" },
          ],
        }
      ),
    ],
  },

  {
    title: "Almighty AI",
    slug: "almighty-ai",
    desc: "Guides for FlixTrend recommendations, discovery signals, and AI-assisted user experiences.",
    articles: [
      article(
        "almighty-ai",
        "Understand Almighty AI",
        "Introduce Almighty AI as a FlixTrend discovery and assistance area.",
        "understand-almighty-ai",
        {
          whatItIs:
            "Almighty AI is FlixTrend’s AI assistant for conversations, assistance, recommendations, and exploration.",
          where: "Use the Almighty AI area if it is available in the app.",
          steps: [
            "Open Almighty AI.",
            "Start a conversation or ask for help.",
            "Use suggestions or recommendations if they appear.",
            "Continue exploring creators, posts, or topics with the assistant.",
          ],
          limits: [
            "Almighty AI should not be described as having emotions, human behavior, or memory.",
          ],
          after: [
            "You can keep using the assistant for help and discovery.",
          ],
          related: [
            { title: "How recommendations are shaped", slug: "how-recommendations-are-shaped" },
            { title: "Find relevant creators", slug: "find-relevant-creators" },
            { title: "Protect privacy with AI features", slug: "protect-privacy-with-ai-features" },
          ],
        }
      ),
      article(
        "almighty-ai",
        "How recommendations are shaped",
        "Prepare a clear guide for recommendation factors without hidden claims.",
        "how-recommendations-are-shaped",
        {
          whatItIs:
            "Recommendations help surface content, creators, and topics that may fit what you explore on FlixTrend.",
          where: "Look for recommendation surfaces in Almight AI, Search, or discovery areas if they are shown.",
          steps: [
            "Open the recommendation area if it appears.",
            "Review the content you are shown.",
            "Use your browsing and interaction history to guide what you explore next.",
          ],
          limits: [
            "Do not claim hidden ranking rules or guaranteed accuracy.",
          ],
          after: [
            "The content you see may change as your activity changes.",
          ],
          related: [
            { title: "Improve your recommendations", slug: "improve-your-recommendations" },
            { title: "Hide content you do not want", slug: "hide-content-you-do-not-want" },
            { title: "Search", slug: "search" },
          ],
        }
      ),
      article(
        "almighty-ai",
        "Improve your recommendations",
        "Show users how their activity may help tune what they see.",
        "improve-your-recommendations",
        {
          whatItIs:
            "Your activity can help FlixTrend show more relevant recommendations if that system is active.",
          where: "Use FlixTrend normally and review the recommendations you get.",
          steps: [
            "Follow creators and topics you like.",
            "Open the content you want to explore more often.",
            "Use the results and suggestions that appear.",
            "Review unwanted content using the available controls if shown.",
          ],
          limits: [
            "Recommendations may change based on your activity.",
          ],
          after: [
            "Future suggestions may reflect the activity you choose to keep.",
          ],
          related: [
            { title: "How recommendations are shaped", slug: "how-recommendations-are-shaped" },
            { title: "Hide content you do not want", slug: "hide-content-you-do-not-want" },
            { title: "Find relevant creators", slug: "find-relevant-creators" },
          ],
        }
      ),
      article(
        "almighty-ai",
        "Hide content you do not want",
        "Reserve guidance for reducing unwanted recommendations.",
        "hide-content-you-do-not-want",
        {
          whatItIs:
            "Hiding content helps reduce what you keep seeing in recommendation surfaces if that control is available.",
          where: "Use the content actions or recommendation controls if they are shown.",
          steps: [
            "Open the item you do not want to see.",
            "Look for a hide or not relevant control if available.",
            "Choose the option that reduces similar content.",
          ],
          limits: [
            "The exact control depends on the screen and feature availability.",
          ],
          after: [
            "Similar content may appear less often over time.",
          ],
          related: [
            { title: "How recommendations are shaped", slug: "how-recommendations-are-shaped" },
            { title: "Use AI suggestions carefully", slug: "use-ai-suggestions-carefully" },
            { title: "Report a recommendation problem", slug: "report-a-recommendation-problem" },
          ],
        }
      ),
      article(
        "almighty-ai",
        "Find relevant creators",
        "Explain discovery paths for accounts and creators.",
        "find-relevant-creators",
        {
          whatItIs:
            "Creator discovery helps you find accounts that match your interests.",
          where: "Use Search or Almighty AI discovery surfaces if they are shown.",
          steps: [
            "Open Search or Almighty AI.",
            "Look for creator results.",
            "Review the profile, posts, and interests shown in the results.",
            "Open the creator profile you want to follow.",
          ],
          limits: [
            "Discovery depends on the creators and topics available in FlixTrend.",
          ],
          after: [
            "You can follow or revisit the creators you discover.",
          ],
          related: [
            { title: "Search", slug: "search" },
            { title: "Understand trending signals", slug: "understand-trending-signals" },
            { title: "Set up a creator profile", slug: "set-up-a-creator-profile" },
          ],
        }
      ),
      article(
        "almighty-ai",
        "Understand trending signals",
        "Prepare a guide for trend and discovery signals.",
        "understand-trending-signals",
        {
          whatItIs:
            "Trending signals help show what is getting attention in FlixTrend.",
          where: "Look in Search, discovery surfaces, or Almighty AI if trending items are shown.",
          steps: [
            "Open the trending area if it appears.",
            "Review the topics, creators, or posts shown.",
            "Use the results to explore more content.",
          ],
          limits: [
            "Trending signals are discovery tools, not guaranteed ranking rules.",
          ],
          after: [
            "You can keep exploring through the topics that interest you.",
          ],
          related: [
            { title: "Search", slug: "search" },
            { title: "How recommendations are shaped", slug: "how-recommendations-are-shaped" },
            { title: "Find relevant creators", slug: "find-relevant-creators" },
          ],
        }
      ),
      article(
        "almighty-ai",
        "Use AI suggestions carefully",
        "Set expectations around AI suggestions and user judgment.",
        "use-ai-suggestions-carefully",
        {
          whatItIs:
            "AI suggestions can help with discovery, creation, and learning, but you should still review them yourself.",
          where: "Use suggestions in Almighty AI or related discovery areas if they are shown.",
          steps: [
            "Review the suggestion before acting on it.",
            "Check whether the result matches what you need.",
            "Edit, change, or ignore the suggestion if needed.",
          ],
          limits: [
            "AI suggestions can help, but they are not perfect.",
          ],
          after: [
            "You decide whether to use the suggestion or continue exploring.",
          ],
          related: [
            { title: "Understand Almighty AI", slug: "understand-almighty-ai" },
            { title: "Fast Checking", slug: "understand-fast-checking" },
            { title: "Search", slug: "search" },
          ],
        }
      ),
      article(
        "almighty-ai",
        "Report a recommendation problem",
        "Show users where to report incorrect or unwanted suggestions.",
        "report-a-recommendation-problem",
        {
          whatItIs:
            "A recommendation problem is when FlixTrend suggests something that does not fit or looks incorrect.",
          where: "Use the available report or feedback option if it appears on the suggestion.",
          steps: [
            "Open the recommendation or suggestion.",
            "Select Report or feedback if available.",
            "Choose the reason that fits the problem.",
            "Send the report.",
          ],
          limits: [
            "The feedback option may not appear on every recommendation surface.",
          ],
          after: [
            "FlixTrend may use the report to improve the suggestion system.",
          ],
          related: [
            { title: "Hide content you do not want", slug: "hide-content-you-do-not-want" },
            { title: "How recommendations are shaped", slug: "how-recommendations-are-shaped" },
            { title: "Contact FlixTrend support", slug: "contact-flixtrend-support" },
          ],
        }
      ),
      article(
        "almighty-ai",
        "Protect privacy with AI features",
        "Reserve privacy guidance for AI-assisted product areas.",
        "protect-privacy-with-ai-features",
        {
          whatItIs:
            "Privacy with AI features means checking what you share when using Almighty AI or other AI-assisted tools.",
          where: "Review privacy, profile, and content settings before using AI-assisted features.",
          steps: [
            "Check what content you want to share with the assistant.",
            "Review your privacy settings.",
            "Use only the data you are comfortable sharing.",
          ],
          limits: [
            "Almighty AI should not be described as having memory or human behavior.",
          ],
          after: [
            "You can continue using AI features with your chosen privacy settings.",
          ],
          related: [
            { title: "Understand Almighty AI", slug: "understand-almighty-ai" },
            { title: "Control profile visibility", slug: "control-profile-visibility" },
            { title: "Protect personal information", slug: "protect-personal-information" },
          ],
        }
      ),
      article(
        "almighty-ai",
        "Troubleshoot Almighty AI",
        "Collect fixes for recommendation or AI-related display issues.",
        "troubleshoot-almighty-ai",
        {
          whatItIs:
            "This helps when Almighty AI or its suggestions do not load correctly.",
          where: "Check the AI area and your device connection.",
          steps: [
            "Check your connection.",
            "Refresh the page or app.",
            "Update FlixTrend if an update is available.",
            "Retry the action.",
          ],
          troubleshooting: [
            "If the issue continues, collect your device, the steps you took, screenshots if available, and the time of the issue before contacting support.",
          ],
          related: [
            { title: "Understand Almighty AI", slug: "understand-almighty-ai" },
            { title: "Report a bug", slug: "report-a-bug" },
            { title: "Contact FlixTrend support", slug: "contact-flixtrend-support" },
          ],
        }
      ),
    ],
  },

  {
    title: "Creator Tools",
    slug: "creator-tools",
    desc: "Guides for creator profiles, post management, lightweight analytics, and creator workflows.",
    articles: [
      article(
        "creator-tools",
        "Set up a creator profile",
        "Explain how a creator-oriented profile should be prepared.",
        "set-up-a-creator-profile",
        {
          whatItIs:
            "A creator profile is the account setup used for creator work and profile presentation.",
          where: "Switch to Creator from Settings → Account, then review your profile.",
          steps: [
            "Open Settings.",
            "Select Account.",
            "Choose Switch Account Type.",
            "Select Creator.",
            "Update the creator profile details if needed.",
          ],
          limits: [
            "Creator tools are available depending on account type and availability.",
          ],
          after: [
            "Your profile can show creator-focused tools and analytics if available.",
          ],
          related: [
            { title: "Choose an account type", slug: "choose-an-account-type" },
            { title: "Read creator analytics", slug: "read-creator-analytics" },
            { title: "Manage creator settings", slug: "manage-creator-settings" },
          ],
        }
      ),
      article(
        "creator-tools",
        "Manage creator posts",
        "Guide creators through reviewing and organizing published content.",
        "manage-creator-posts",
        {
          whatItIs:
            "Creator post management helps you review, edit, delete, or organize your published content if those tools are available.",
          where: "Use the creator dashboard or your published posts area.",
          steps: [
            "Open your creator dashboard if it is available.",
            "Review your published posts.",
            "Open the post you want to manage.",
            "Use the available actions such as edit or delete.",
          ],
          limits: [
            "The available controls depend on the post and the feature screen.",
          ],
          after: [
            "Your content changes after you confirm the action.",
          ],
          related: [
            { title: "Read creator analytics", slug: "read-creator-analytics" },
            { title: "Track post performance", slug: "track-post-performance" },
            { title: "Prepare content for discovery", slug: "prepare-content-for-discovery" },
          ],
        }
      ),
      article(
        "creator-tools",
        "Read creator analytics",
        "Reserve guidance for interpreting available creator metrics.",
        "read-creator-analytics",
        {
          whatItIs:
            "Creator analytics show performance information for your profile or posts if those metrics are available.",
          where: "Open the creator dashboard and check the analytics area.",
          steps: [
            "Open the creator dashboard.",
            "Select Analytics if it is shown.",
            "Review the metrics that appear.",
            "Use the numbers to understand recent activity.",
          ],
          limits: [
            "Analytics may include views, reach, engagement, and activity.",
            "Available metrics may depend on feature availability.",
          ],
          after: [
            "You can use the metrics to guide future content decisions.",
          ],
          related: [
            { title: "Track post performance", slug: "track-post-performance" },
            { title: "Review audience activity", slug: "review-audience-activity" },
            { title: "Manage creator settings", slug: "manage-creator-settings" },
          ],
        }
      ),
      article(
        "creator-tools",
        "Track post performance",
        "Help creators understand how individual posts are performing.",
        "track-post-performance",
        {
          whatItIs:
            "Post performance shows how a specific post is doing in views, reach, engagement, or activity if those metrics are available.",
          where: "Open the post or analytics view in the creator dashboard.",
          steps: [
            "Open the creator dashboard or the post itself.",
            "Look for the performance information shown.",
            "Review views, reach, engagement, or activity if available.",
            "Compare performance across posts if that view exists.",
          ],
          limits: [
            "Performance metrics depend on availability.",
          ],
          after: [
            "You can use the numbers to plan future content.",
          ],
          related: [
            { title: "Read creator analytics", slug: "read-creator-analytics" },
            { title: "Manage creator posts", slug: "manage-creator-posts" },
            { title: "Prepare content for discovery", slug: "prepare-content-for-discovery" },
          ],
        }
      ),
      article(
        "creator-tools",
        "Use creator profile links",
        "Prepare a guide for profile links and public creator identity.",
        "use-creator-profile-links",
        {
          whatItIs:
            "Creator profile links let you connect your profile to other places if link fields are available.",
          where: "Open your profile edit area and find the links section if it appears.",
          steps: [
            "Open your creator profile.",
            "Select Edit if available.",
            "Find the links field.",
            "Add or update the link details.",
            "Save the profile update.",
          ],
          limits: [
            "Links depend on the profile fields shown in your account.",
          ],
          after: [
            "Your profile shows the updated link details if the change is accepted.",
          ],
          related: [
            { title: "Edit your profile information", slug: "edit-your-profile-information" },
            { title: "Set up a creator profile", slug: "set-up-a-creator-profile" },
            { title: "Manage creator settings", slug: "manage-creator-settings" },
          ],
        }
      ),
      article(
        "creator-tools",
        "Organize content ideas",
        "Offer guide structure for planning and managing content ideas.",
        "organize-content-ideas",
        {
          whatItIs:
            "Content ideas are the drafts, topics, or post plans you keep before publishing.",
          where: "Use your creator workflow, notes, or post planning process.",
          steps: [
            "List the ideas you want to post.",
            "Group ideas by topic or format.",
            "Use drafts or planning notes if available.",
            "Choose the next idea to publish.",
          ],
          limits: [
            "FlixTrend only supports the planning tools that are available in your account.",
          ],
          after: [
            "Your content plan becomes easier to manage.",
          ],
          related: [
            { title: "Save a draft", slug: "save-a-draft" },
            { title: "Manage creator posts", slug: "manage-creator-posts" },
            { title: "Prepare content for discovery", slug: "prepare-content-for-discovery" },
          ],
        }
      ),
      article(
        "creator-tools",
        "Review audience activity",
        "Reserve a guide for understanding visible audience engagement.",
        "review-audience-activity",
        {
          whatItIs:
            "Audience activity is the visible interaction data for your creator content if it is available.",
          where: "Open the creator analytics or post performance view.",
          steps: [
            "Open creator analytics.",
            "Look for activity, engagement, or reach information.",
            "Review how your audience is interacting with your content.",
          ],
          limits: [
            "Available data depends on the analytics shown in your account.",
          ],
          after: [
            "You can use the activity view to plan future posts.",
          ],
          related: [
            { title: "Read creator analytics", slug: "read-creator-analytics" },
            { title: "Track post performance", slug: "track-post-performance" },
            { title: "Manage creator posts", slug: "manage-creator-posts" },
          ],
        }
      ),
      article(
        "creator-tools",
        "Manage creator settings",
        "Show creators where account and profile settings fit together.",
        "manage-creator-settings",
        {
          whatItIs:
            "Creator settings connect your account type, profile details, and creator workflow options.",
          where: "Use Settings, Account, and your profile edit area.",
          steps: [
            "Open Settings.",
            "Review Account settings.",
            "Open your profile and edit creator details if needed.",
            "Check any creator tools that appear in your dashboard.",
          ],
          limits: [
            "Creator options depend on availability.",
          ],
          after: [
            "Your creator setup reflects the settings you changed.",
          ],
          related: [
            { title: "Set up a creator profile", slug: "set-up-a-creator-profile" },
            { title: "Read creator analytics", slug: "read-creator-analytics" },
            { title: "Use creator profile links", slug: "use-creator-profile-links" },
          ],
        }
      ),
      article(
        "creator-tools",
        "Handle creator support requests",
        "Explain how creators can contact support for account or content issues.",
        "handle-creator-support-requests",
        {
          whatItIs:
            "Creator support requests are issues you send to FlixTrend about your account, content, or analytics.",
          where: "Use /help or the support path shown in the app.",
          steps: [
            "Open /help or the support area.",
            "Choose the topic that matches your issue.",
            "Include details about your creator account or content.",
            "Send the request.",
          ],
          limits: [
            "Support categories depend on what is shown in /help.",
          ],
          after: [
            "Your request enters the support flow.",
          ],
          related: [
            { title: "Contact FlixTrend support", slug: "contact-flixtrend-support" },
            { title: "Report a bug", slug: "report-a-bug" },
            { title: "Find service updates", slug: "find-service-updates" },
          ],
        }
      ),
      article(
        "creator-tools",
        "Prepare content for discovery",
        "Guide creators on basic discoverability without promising reach.",
        "prepare-content-for-discovery",
        {
          whatItIs:
            "Discovery preparation helps your content fit tags, search, and recommendation surfaces.",
          where: "Use the post creation flow, tags, and profile details.",
          steps: [
            "Choose a clear post topic.",
            "Add tags that match the content.",
            "Review your caption and media.",
            "Use profile details that help people recognize your account.",
          ],
          limits: [
            "FlixTrend does not promise growth.",
            "Discovery depends on tags, search, and recommendations.",
          ],
          after: [
            "Your content is easier to find when it matches search and tag discovery.",
          ],
          related: [
            { title: "Add tags to a post", slug: "add-tags-to-a-post" },
            { title: "Search", slug: "search" },
            { title: "How recommendations are shaped", slug: "how-recommendations-are-shaped" },
          ],
        }
      ),
    ],
  },

  {
    title: "Community & Moderation",
    slug: "community-moderation",
    desc: "Guides for reporting, blocking, content review, and keeping FlixTrend healthier.",
    articles: [
      article(
        "community-moderation",
        "Report a post",
        "Show users how to report content that may need review.",
        "report-a-post",
        {
          whatItIs:
            "Reporting a post sends it to FlixTrend for moderation review.",
          where: "Open the post and use the report control if it is available.",
          steps: [
            "Open the post.",
            "Select Report if available.",
            "Choose the reason that best matches the issue.",
            "Submit the report.",
          ],
          limits: [
            "FlixTrend may review and take action on reports.",
          ],
          after: [
            "The post enters the moderation flow.",
          ],
          related: [
            { title: "Report a profile", slug: "report-a-profile" },
            { title: "Report a comment", slug: "report-a-comment" },
            { title: "Understand content review", slug: "understand-content-review" },
          ],
        }
      ),
      article(
        "community-moderation",
        "Report a profile",
        "Guide users through reporting an account or profile concern.",
        "report-a-profile",
        {
          whatItIs:
            "Reporting a profile sends the account to FlixTrend for review.",
          where: "Open the profile and use the report control if it appears.",
          steps: [
            "Open the profile.",
            "Select Report if available.",
            "Choose the reason that fits the concern.",
            "Submit the report.",
          ],
          limits: [
            "Reports may be reviewed and acted on by FlixTrend.",
          ],
          after: [
            "The report enters moderation review.",
          ],
          related: [
            { title: "Report a post", slug: "report-a-post" },
            { title: "Block or unblock someone", slug: "block-or-unblock-someone" },
            { title: "Contact moderation support", slug: "contact-moderation-support" },
          ],
        }
      ),
      article(
        "community-moderation",
        "Report a comment",
        "Reserve instructions for comment-level reporting.",
        "report-a-comment",
        {
          whatItIs:
            "Reporting a comment sends the comment to FlixTrend for review.",
          where: "Open the comment and use the report control if available.",
          steps: [
            "Open the comment.",
            "Select Report if available.",
            "Choose the reason that fits the issue.",
            "Submit the report.",
          ],
          limits: [
            "Comment reporting depends on the controls shown on that screen.",
          ],
          after: [
            "The comment moves into moderation review.",
          ],
          related: [
            { title: "Report a post", slug: "report-a-post" },
            { title: "Report a profile", slug: "report-a-profile" },
            { title: "Manage comment safety", slug: "manage-comment-safety" },
          ],
        }
      ),
      article(
        "community-moderation",
        "Block or unblock someone",
        "Explain how users can manage blocked accounts.",
        "block-or-unblock-someone",
        {
          whatItIs:
            "Blocking limits contact from an account, and unblocking restores contact if you choose to allow it.",
          where: "Use the profile controls for the user you want to block or unblock.",
          steps: [
            "Open the user profile.",
            "Select Block or Unblock if available.",
            "Confirm the action.",
          ],
          limits: [
            "The available control depends on the profile screen.",
          ],
          after: [
            "Your contact preference changes after the action is confirmed.",
          ],
          related: [
            { title: "Block another user", slug: "block-another-user" },
            { title: "Mute a conversation", slug: "mute-a-conversation" },
            { title: "Report a message", slug: "report-a-message" },
          ],
        }
      ),
      article(
        "community-moderation",
        "Understand content review",
        "Prepare a guide for what happens after users report content.",
        "understand-content-review",
        {
          whatItIs:
            "Content review is the process FlixTrend uses after a report is submitted.",
          where: "It starts after you send a report for a post, profile, comment, or message.",
          steps: [
            "Submit the report.",
            "Wait while the item enters review.",
            "Check the item again if you receive an update.",
          ],
          limits: [
            "FlixTrend may limit, remove, review, or label content.",
            "Internal moderation systems are not revealed.",
          ],
          after: [
            "A moderation outcome may be applied after review.",
          ],
          related: [
            { title: "Report a post", slug: "report-a-post" },
            { title: "Appeal a moderation decision", slug: "appeal-a-moderation-decision" },
            { title: "Contact moderation support", slug: "contact-moderation-support" },
          ],
        }
      ),
      article(
        "community-moderation",
        "Appeal a moderation decision",
        "Reserve guidance for challenging moderation outcomes.",
        "appeal-a-moderation-decision",
        {
          whatItIs:
            "An appeal lets you ask FlixTrend to review a moderation outcome again if that option is available.",
          where: "Use the appeal flow if it appears with the moderation result.",
          steps: [
            "Open the moderation result.",
            "Look for an appeal option if it is shown.",
            "Add the details needed for review.",
            "Submit the appeal.",
          ],
          limits: [
            "Appeal controls may not be available for every case.",
          ],
          after: [
            "Your appeal enters the moderation review flow.",
          ],
          related: [
            { title: "Understand content review", slug: "understand-content-review" },
            { title: "Report a post", slug: "report-a-post" },
            { title: "Contact moderation support", slug: "contact-moderation-support" },
          ],
        }
      ),
      article(
        "community-moderation",
        "Manage comment safety",
        "Help users understand tools for keeping comments healthier.",
        "manage-comment-safety",
        {
          whatItIs:
            "Comment safety uses moderation tools and personal controls to reduce unwanted comments.",
          where: "Use report, block, and privacy controls where comments appear.",
          steps: [
            "Review the comment.",
            "Use report if the comment should be reviewed.",
            "Use block or mute if you want to limit contact.",
            "Adjust privacy settings if available.",
          ],
          limits: [
            "The controls you see may vary by screen.",
          ],
          after: [
            "Your comment experience becomes easier to manage after the action you choose.",
          ],
          related: [
            { title: "Report a comment", slug: "report-a-comment" },
            { title: "Block or unblock someone", slug: "block-or-unblock-someone" },
            { title: "Control who can contact you", slug: "control-who-can-contact-you" },
          ],
        }
      ),
      article(
        "community-moderation",
        "Respond to harassment",
        "Guide users toward reporting, blocking, and support steps.",
        "respond-to-harassment",
        {
          whatItIs:
            "Responding to harassment means using FlixTrend’s reporting and blocking tools when another account is causing harm.",
          where: "Use the post, profile, comment, or message screen where the issue appears.",
          steps: [
            "Save the item or details if you need them for a report.",
            "Report the account or content.",
            "Block the account if you want to limit contact.",
            "Use support if the issue continues.",
          ],
          limits: [
            "FlixTrend may review and act on reports, but it does not reveal internal systems.",
          ],
          after: [
            "The harmful contact is easier to manage after you block or report it.",
          ],
          related: [
            { title: "Report a message", slug: "report-a-message" },
            { title: "Block another user", slug: "block-another-user" },
            { title: "Contact moderation support", slug: "contact-moderation-support" },
          ],
        }
      ),
      article(
        "community-moderation",
        "Protect younger users",
        "Reserve family and youth safety guidance without inventing policy detail.",
        "protect-younger-users",
        {
          whatItIs:
            "Younger user protection uses the same reporting, blocking, privacy, and account controls available in FlixTrend.",
          where: "Check privacy settings, profile visibility, and moderation tools.",
          steps: [
            "Review profile visibility.",
            "Use block or mute if needed.",
            "Report harmful content or contact.",
            "Review account and privacy settings often.",
          ],
          limits: [
            "Do not add policy details that are not defined in the knowledge base.",
          ],
          after: [
            "Safety becomes easier to manage when the available controls are used together.",
          ],
          related: [
            { title: "Control profile visibility", slug: "control-profile-visibility" },
            { title: "Block another user", slug: "block-another-user" },
            { title: "Report a profile", slug: "report-a-profile" },
          ],
        }
      ),
      article(
        "community-moderation",
        "Contact moderation support",
        "Show where users can ask for moderation help.",
        "contact-moderation-support",
        {
          whatItIs:
            "Moderation support is the help path for account, report, or review issues.",
          where: "Use /help or the support route shown in FlixTrend.",
          steps: [
            "Open /help.",
            "Choose the moderation or safety topic that matches your issue.",
            "Share the details requested by the support flow.",
            "Submit the request.",
          ],
          limits: [
            "Support topics depend on what /help shows.",
          ],
          after: [
            "Your issue enters the support or moderation review flow.",
          ],
          related: [
            { title: "Report a post", slug: "report-a-post" },
            { title: "Appeal a moderation decision", slug: "appeal-a-moderation-decision" },
            { title: "Find service updates", slug: "find-service-updates" },
          ],
        }
      ),
    ],
  },

  {
    title: "Troubleshooting & Support",
    slug: "troubleshooting-support",
    desc: "Guides for common errors, device issues, contact paths, and launch support.",
    articles: [
      article(
        "troubleshooting-support",
        "Fix sign-in problems",
        "Collect common fixes when users cannot access an account.",
        "fix-sign-in-problems",
        {
          whatItIs:
            "Sign-in troubleshooting helps when you cannot get into your FlixTrend account.",
          where: "Start from the Login screen and your account recovery flow.",
          steps: [
            "Check your email and password.",
            "Use Forgot Password if needed.",
            "Check your connection.",
            "Refresh the app or page.",
            "Try again.",
          ],
          troubleshooting: [
            "If the problem continues, collect your device, the steps you took, screenshots if available, and the time of the issue before contacting support.",
          ],
          related: [
            { title: "Reset your password", slug: "reset-your-password" },
            { title: "Understand account recovery", slug: "understand-account-recovery" },
            { title: "Contact FlixTrend support", slug: "contact-flixtrend-support" },
          ],
        }
      ),
      article(
        "troubleshooting-support",
        "Fix upload problems",
        "Prepare troubleshooting steps for failed or delayed uploads.",
        "fix-upload-problems",
        {
          whatItIs:
            "Upload troubleshooting helps when images or videos do not finish uploading.",
          where: "Check the post or media upload flow.",
          steps: [
            "Check your connection.",
            "Refresh the app or page.",
            "Update FlixTrend if an update is available.",
            "Clear cache if you are on web.",
            "Retry the upload.",
          ],
          troubleshooting: [
            "Collect the device, the steps you took, screenshots if available, and the time of the issue before contacting support.",
          ],
          related: [
            { title: "Upload media for a post", slug: "upload-media-for-a-post" },
            { title: "Troubleshoot posting issues", slug: "troubleshoot-posting-issues" },
            { title: "Report a bug", slug: "report-a-bug" },
          ],
        }
      ),
      article(
        "troubleshooting-support",
        "Fix playback problems",
        "Help users address videos that do not load or play correctly.",
        "fix-playback-problems",
        {
          whatItIs:
            "Playback troubleshooting helps when a video does not load or play correctly.",
          where: "Check the video, your connection, and the app or browser.",
          steps: [
            "Check your connection.",
            "Refresh the page or app.",
            "Update FlixTrend if an update is available.",
            "Retry playback.",
          ],
          troubleshooting: [
            "If the problem continues, collect your device, screenshots if available, and the time of the issue before contacting support.",
          ],
          related: [
            { title: "Fix upload problems", slug: "fix-upload-problems" },
            { title: "Fix slow loading", slug: "fix-slow-loading" },
            { title: "Find service updates", slug: "find-service-updates" },
          ],
        }
      ),
      article(
        "troubleshooting-support",
        "Fix slow loading",
        "Reserve steps for performance or connection-related issues.",
        "fix-slow-loading",
        {
          whatItIs:
            "Slow loading troubleshooting helps when pages or screens take longer than expected to open.",
          where: "Check the page, app, and your connection.",
          steps: [
            "Check your connection.",
            "Refresh the page or app.",
            "Close and reopen the screen if needed.",
            "Update FlixTrend if an update is available.",
            "Retry the action.",
          ],
          troubleshooting: [
            "If it still loads slowly, collect your device, the steps you took, screenshots if available, and the time of the issue before contacting support.",
          ],
          related: [
            { title: "Clear browser cache", slug: "clear-browser-cache" },
            { title: "Check supported browsers", slug: "check-supported-browsers" },
            { title: "Find service updates", slug: "find-service-updates" },
          ],
        }
      ),
      article(
        "troubleshooting-support",
        "Fix notification problems",
        "Guide users through notification delivery and settings checks.",
        "fix-notification-problems",
        {
          whatItIs:
            "Notification troubleshooting helps when alerts do not arrive or do not look right.",
          where: "Check your notification settings and the device or browser alerts.",
          steps: [
            "Review your notification settings.",
            "Check whether alerts are allowed on your device or browser.",
            "Refresh FlixTrend.",
            "Update the app if needed.",
          ],
          troubleshooting: [
            "If notifications still do not work, collect your device, the steps you took, screenshots if available, and the time of the issue before contacting support.",
          ],
          related: [
            { title: "Manage notifications safely", slug: "manage-notifications-safely" },
            { title: "Fix slow loading", slug: "fix-slow-loading" },
            { title: "Contact FlixTrend support", slug: "contact-flixtrend-support" },
          ],
        }
      ),
      article(
        "troubleshooting-support",
        "Clear browser cache",
        "Explain when clearing cache may help web users.",
        "clear-browser-cache",
        {
          whatItIs:
            "Clearing browser cache may help if the web version of FlixTrend is not loading correctly.",
          where: "Use your browser settings on the web app.",
          steps: [
            "Open your browser settings.",
            "Find the cache or browsing data area.",
            "Clear the cached files if needed.",
            "Return to FlixTrend and try again.",
          ],
          limits: [
            "This guidance is for web users.",
          ],
          after: [
            "The site may load normally after cache is cleared.",
          ],
          related: [
            { title: "Check supported browsers", slug: "check-supported-browsers" },
            { title: "Fix slow loading", slug: "fix-slow-loading" },
            { title: "Fix upload problems", slug: "fix-upload-problems" },
          ],
        }
      ),
      article(
        "troubleshooting-support",
        "Check supported browsers",
        "Prepare browser support guidance for the web app.",
        "check-supported-browsers",
        {
          whatItIs:
            "Supported browsers help the web version of FlixTrend run correctly.",
          where: "Check your browser before using the web app.",
          steps: [
            "Open FlixTrend in your browser.",
            "If something looks wrong, try another supported browser if you have one.",
            "Refresh the page and try again.",
          ],
          limits: [
            "Browser support can affect loading, playback, and uploads.",
          ],
          after: [
            "Using a compatible browser may improve how FlixTrend works on web.",
          ],
          related: [
            { title: "Clear browser cache", slug: "clear-browser-cache" },
            { title: "Fix slow loading", slug: "fix-slow-loading" },
            { title: "Report a bug", slug: "report-a-bug" },
          ],
        }
      ),
      article(
        "troubleshooting-support",
        "Report a bug",
        "Show users what details to include when reporting a product issue.",
        "report-a-bug",
        {
          whatItIs:
            "A bug report sends a product issue to FlixTrend so it can be reviewed.",
          where: "Use /help or the support path shown in the app.",
          steps: [
            "Open /help.",
            "Choose the issue that matches your bug.",
            "Add the device, steps, screenshots, and time of issue.",
            "Send the report.",
          ],
          limits: [
            "Bug reports work best when you include clear steps and screenshots if available.",
          ],
          after: [
            "The issue enters the support review flow.",
          ],
          related: [
            { title: "Contact FlixTrend support", slug: "contact-flixtrend-support" },
            { title: "Find service updates", slug: "find-service-updates" },
            { title: "Fix upload problems", slug: "fix-upload-problems" },
          ],
        }
      ),
      article(
        "troubleshooting-support",
        "Contact FlixTrend support",
        "Give users a support path without mixing it into FAQ answers.",
        "contact-flixtrend-support",
        {
          whatItIs:
            "Support contact is the path for problems that need help from FlixTrend.",
          where: "Use /help or the support route shown in the app.",
          steps: [
            "Open /help.",
            "Choose the issue that matches your problem.",
            "Add the details requested by the support flow.",
            "Send the request.",
          ],
          limits: [
            "Support options depend on what /help shows.",
          ],
          after: [
            "Your request enters the support flow.",
          ],
          related: [
            { title: "Report a bug", slug: "report-a-bug" },
            { title: "Find service updates", slug: "find-service-updates" },
            { title: "Contact moderation support", slug: "contact-moderation-support" },
          ],
        }
      ),
      article(
        "troubleshooting-support",
        "Find service updates",
        "Reserve a guide for status, maintenance, and known issue updates.",
        "find-service-updates",
        {
          whatItIs:
            "Service updates help you check for maintenance or known issues that may affect FlixTrend.",
          where: "Use /help or the service update area if it is shown.",
          steps: [
            "Open /help.",
            "Look for service status or update information.",
            "Review the current notice if one is shown.",
          ],
          limits: [
            "Service update availability depends on the support surfaces FlixTrend shows.",
          ],
          after: [
            "You can retry the app once the issue is resolved or the update is over.",
          ],
          related: [
            { title: "Report a bug", slug: "report-a-bug" },
            { title: "Contact FlixTrend support", slug: "contact-flixtrend-support" },
            { title: "Fix slow loading", slug: "fix-slow-loading" },
          ],
        }
      ),
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

export function getAllHelpArticles() {
  return helpCategories.flatMap((category) =>
    category.articles.map((article) => ({
      ...article,
      categorySlug: category.slug,
      categoryTitle: category.title,
      href: getHelpArticleHref(category.slug, article.slug),
    }))
  );
}
