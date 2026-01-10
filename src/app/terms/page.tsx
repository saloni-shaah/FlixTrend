import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions | FlixTrend",
  description:
    "The terms that govern your use of FlixTrend. Clear, fair, and designed to protect both you and the platform.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-16">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-4xl font-semibold tracking-tight mb-4">
            Terms & Conditions
          </h1>
          <p className="text-muted-foreground text-sm">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </header>

        {/* Introduction */}
        <section className="space-y-6 text-base leading-relaxed">
          <p>
            Welcome to <strong>FlixTrend</strong>.
          </p>
          <p>
            These Terms & Conditions (“Terms”) govern your access to and use of
            the FlixTrend website, mobile applications, and related services
            (collectively, the “Platform”).
          </p>
          <p>
            By accessing or using FlixTrend, you agree to be bound by these
            Terms. If you do not agree, please do not use the Platform.
          </p>
        </section>

        {/* Eligibility */}
        <section className="mt-12 space-y-4">
          <h2 className="text-2xl font-medium">Eligibility</h2>

          <p>
            You must be at least <strong>13 years old</strong> to use FlixTrend.
          </p>

          <p>
            If you are using the Platform on behalf of an organization, you
            confirm that you have the authority to bind that organization to
            these Terms.
          </p>
        </section>

        {/* Account Responsibility */}
        <section className="mt-12 space-y-4">
          <h2 className="text-2xl font-medium">Your Account</h2>

          <p>
            You are responsible for maintaining the confidentiality of your
            account credentials and for all activity that occurs under your
            account.
          </p>

          <p>
            You agree to provide accurate and up-to-date information and to
            notify us of any unauthorized access or security breach.
          </p>
        </section>

        {/* User Content */}
        <section className="mt-12 space-y-4">
          <h2 className="text-2xl font-medium">User Content</h2>

          <p>
            You retain ownership of the content you create or share on
            FlixTrend.
          </p>

          <p>
            By posting content, you grant FlixTrend a non-exclusive, worldwide,
            royalty-free license to host, store, display, and distribute that
            content solely for operating and improving the Platform.
          </p>

          <p>
            You are responsible for ensuring your content does not violate any
            laws or infringe on the rights of others.
          </p>
        </section>

        {/* Prohibited Activities */}
        <section className="mt-12 space-y-4">
          <h2 className="text-2xl font-medium">Prohibited Activities</h2>

          <p>You agree not to:</p>

          <ul className="list-disc pl-6 space-y-2">
            <li>Post harmful, abusive, misleading, or illegal content</li>
            <li>Impersonate others or misrepresent your identity</li>
            <li>Attempt to access systems or data without authorization</li>
            <li>Disrupt or interfere with the Platform’s operation</li>
            <li>Use FlixTrend for unlawful or malicious purposes</li>
          </ul>
        </section>

        {/* Moderation */}
        <section className="mt-12 space-y-4">
          <h2 className="text-2xl font-medium">Content Moderation</h2>

          <p>
            FlixTrend reserves the right to review, restrict, or remove content
            that violates these Terms or harms the Platform or its users.
          </p>

          <p>
            We may suspend or terminate accounts that repeatedly violate our
            rules, with or without notice.
          </p>
        </section>

        {/* Intellectual Property */}
        <section className="mt-12 space-y-4">
          <h2 className="text-2xl font-medium">Intellectual Property</h2>

          <p>
            All trademarks, logos, designs, and platform elements are the
            property of FlixTrend or its licensors.
          </p>

          <p>
            You may not copy, modify, distribute, or exploit any part of the
            Platform without prior written permission.
          </p>
        </section>

        {/* Third-Party Services */}
        <section className="mt-12 space-y-4">
          <h2 className="text-2xl font-medium">Third-Party Services</h2>

          <p>
            FlixTrend may include links or integrations with third-party
            services.
          </p>

          <p>
            We are not responsible for the content, policies, or practices of
            third-party platforms.
          </p>
        </section>

        {/* Disclaimer */}
        <section className="mt-12 space-y-4">
          <h2 className="text-2xl font-medium">Disclaimer</h2>

          <p>
            FlixTrend is provided on an “as is” and “as available” basis.
          </p>

          <p>
            We do not guarantee uninterrupted access, error-free operation, or
            absolute security.
          </p>
        </section>

        {/* Limitation of Liability */}
        <section className="mt-12 space-y-4">
          <h2 className="text-2xl font-medium">Limitation of Liability</h2>

          <p>
            To the maximum extent permitted by law, FlixTrend shall not be
            liable for indirect, incidental, or consequential damages arising
            from your use of the Platform.
          </p>
        </section>

        {/* Termination */}
        <section className="mt-12 space-y-4">
          <h2 className="text-2xl font-medium">Termination</h2>

          <p>
            You may stop using FlixTrend at any time.
          </p>

          <p>
            We reserve the right to suspend or terminate access if these Terms
            are violated or if required by law.
          </p>
        </section>

        {/* Changes */}
        <section className="mt-12 space-y-4">
          <h2 className="text-2xl font-medium">Changes to These Terms</h2>

          <p>
            We may update these Terms from time to time. Changes will be posted
            on this page with an updated date.
          </p>

          <p>
            Continued use of FlixTrend means you accept the revised Terms.
          </p>
        </section>

        {/* Governing Law */}
        <section className="mt-12 space-y-4">
          <h2 className="text-2xl font-medium">Governing Law</h2>

          <p>
            These Terms are governed by applicable laws without regard to
            conflict of law principles.
          </p>
        </section>

        {/* Contact */}
        <section className="mt-12 space-y-4">
          <h2 className="text-2xl font-medium">Contact</h2>

          <p>
            If you have questions about these Terms, contact us at:
          </p>

          <p className="font-medium">
            📧 legal@flixtrend.in
          </p>
        </section>
      </div>
    </main>
  );
}
