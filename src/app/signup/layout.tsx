
'use client';

// This layout component is specific to the signup flow.
// It ensures that the main app's navigation (like the bottom bar)
// does not appear during the multi-step signup process.
// It provides a clean, isolated container for all signup screens.

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background text-white min-h-screen">
      {children}
    </div>
  );
}
