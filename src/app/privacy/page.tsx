
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | FlixTrend",
  description:
    "Learn how FlixTrend collects, uses, and protects your information. A calm, transparent, and people-first approach to privacy.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-16">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-4xl font-semibold tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground text-sm">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </header>

        {/* Intro */}
        <section className="space-y-6 text-base leading-relaxed">
          <p>
            At <strong>FlixTrend</strong>, your privacy is not an afterthought.
            It is a responsibility we take seriously.
          </p>
          <p>
            This Privacy Policy explains how we collect, use, store, and protect
            your information when you use our website, mobile applications, and
            related services (collectively, the “Platform”).
          </p>
          <p>
            By accessing or using FlixTrend, you agree to the practices described
            in this policy.
          </p>
        </section>

        {/* Information We Collect */}
        <section className="mt-12 space-y-4">
          <h2 className="text-2xl font-medium">Information We Collect</h2>

          <p>We collect information in the following ways:</p>

          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Information you provide:</strong> such as your name, email
              address, username, profile details, or any content you choose to
              share.
            </li>
            <li>
              <strong>Usage information:</strong> interactions with the platform,
              features used, pages viewed, and general activity.
            </li>
            <li>
              <strong>Device information:</strong> browser type, operating
              system, IP address, and device identifiers.
            </li>
          </ul>
        </section>

        {/* How We Use Information */}
        <section className="mt-12 space-y-4">
          <h2 className="text-2xl font-medium">How We Use Your Information</h2>

          <p>Your information is used to:</p>

          <ul className="list-disc pl-6 space-y-2">
            <li>Provide and improve our services</li>
            <li>Personalize your experience</li>
            <li>Communicate important updates or announcements</li>
            <li>Maintain safety, security, and platform integrity</li>
            <li>Comply with legal obligations</li>
          </ul>

          <p>
            We do not sell your personal data. We do not trade it. We do not
            misuse it.
          </p>
        </section>

        {/* Cookies */}
        <section className="mt-12 space-y-4">
          <h2 className="text-2xl font-medium">Cookies & Tracking</h2>

          <p>
            FlixTrend may use cookies or similar technologies to ensure the
            platform functions properly and to understand general usage trends.
          </p>

          <p>
            You can control or disable cookies through your browser settings,
            though some features may not work as intended.
          </p>
        </section>

        {/* Data Sharing */}
        <section className="mt-12 space-y-4">
          <h2 className="text-2xl font-medium">Data Sharing</h2>

          <p>
            We may share limited information only when necessary:
          </p>

          <ul className="list-disc pl-6 space-y-2">
            <li>With trusted service providers who help operate the platform</li>
            <li>When required by law or legal process</li>
            <li>To protect the rights, safety, or integrity of FlixTrend</li>
          </ul>

          <p>
            Any third parties we work with are required to respect user privacy
            and data protection standards.
          </p>
        </section>

        {/* Data Security */}
        <section className="mt-12 space-y-4">
          <h2 className="text-2xl font-medium">Data Security</h2>

          <p>
            We implement reasonable technical and organizational measures to
            protect your information.
          </p>

          <p>
            However, no digital system is completely secure. While we work hard
            to safeguard your data, we cannot guarantee absolute security.
          </p>
        </section>

        {/* Your Rights */}
        <section className="mt-12 space-y-4">
          <h2 className="text-2xl font-medium">Your Rights</h2>

          <p>
            Depending on your location, you may have rights to:
          </p>

          <ul className="list-disc pl-6 space-y-2">
            <li>Access your personal data</li>
            <li>Request correction or deletion</li>
            <li>Withdraw consent where applicable</li>
            <li>Object to certain data uses</li>
          </ul>

          <p>
            You can contact us anytime to exercise these rights.
          </p>
        </section>

        {/* Children */}
        <section className="mt-12 space-y-4">
          <h2 className="text-2xl font-medium">Children’s Privacy</h2>

          <p>
            FlixTrend is not intended for children under the age of 13.
          </p>

          <p>
            We do not knowingly collect personal data from children. If you
            believe a child has provided us information, please contact us so we
            can take appropriate action.
          </p>
        </section>

        {/* Changes */}
        <section className="mt-12 space-y-4">
          <h2 className="text-2xl font-medium">Changes to This Policy</h2>

          <p>
            We may update this Privacy Policy from time to time. Any changes will
            be posted on this page with an updated date.
          </p>

          <p>
            Continued use of FlixTrend after changes means you accept the
            revised policy.
          </p>
        </section>

        {/* Contact */}
        <section className="mt-12 space-y-4">
          <h2 className="text-2xl font-medium">Contact Us</h2>

          <p>
            If you have questions or concerns about this Privacy Policy, you can
            reach us at:
          </p>

          <p className="font-medium">
            📧 privacy@flixtrend.in
          </p>
        </section>
      </div>
    </main>
  );
}
