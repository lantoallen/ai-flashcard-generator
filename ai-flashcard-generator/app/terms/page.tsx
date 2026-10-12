import type { Metadata } from "next";
import { LegalPage, REPO_URL } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: "The rules for using Flashly.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms and Conditions"
      intro="These terms explain how you may use Flashly. By using the app, or by creating an account, you agree to them. If you don’t agree, please don’t use Flashly."
    >
      <section>
        <h2>1. What Flashly is</h2>
        <p className="mt-3">
          Flashly is a free study tool that helps you make and practise
          flashcards. It can generate cards with AI, but it is a learning aid,
          not a source of professional, legal, medical or financial advice.
        </p>
      </section>

      <section>
        <h2>2. Using Flashly</h2>
        <ul>
          <li>Use Flashly lawfully and respectfully.</li>
          <li>
            Only add content you have the right to use, and avoid pasting
            personal, confidential or sensitive information about yourself or
            other people.
          </li>
          <li>
            Don’t try to break, overload or misuse the service, including
            automated scraping or attempts to bypass its limits.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Accounts</h2>
        <ul>
          <li>An account is optional. Flashly works without one.</li>
          <li>You must be at least 13 years old to create an account.</li>
          <li>
            Give an email address you control and keep your password private.
            You are responsible for activity on your account.
          </li>
          <li>
            You must accept these terms and the Privacy Policy to create an
            account. We keep a record of which version you accepted and when.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Your content</h2>
        <p className="mt-3">
          The sets you create are yours. By using Flashly you allow it to store
          your content on your device (and in your account, if you sign in) and
          to send the text you submit to AI providers so they can generate cards
          and explanations. If you create a share link, anyone who has the link
          can read that set.
        </p>
      </section>

      <section>
        <h2>5. AI-generated content</h2>
        <p className="mt-3">
          AI can be wrong, incomplete or out of date. Check generated cards
          against reliable sources before you rely on them, especially for exams
          or anything with real-world consequences.
        </p>
      </section>

      <section>
        <h2>6. Availability and your data</h2>
        <ul>
          <li>
            Flashly is provided “as is”, with no promise that it will always be
            available, error-free, or free of limits.
          </li>
          <li>
            Features and free-tier AI limits can change, and the service may
            stop at any time.
          </li>
          <li>
            Without an account, your sets live only in your browser and are lost
            if you clear site data. Use Backup or an account to keep a copy.
          </li>
        </ul>
      </section>

      <section>
        <h2>7. Liability</h2>
        <p className="mt-3">
          To the extent the law allows, Flashly and its maker are not liable for
          any loss arising from your use of the app, including lost data or
          reliance on AI-generated content. Nothing in these terms limits
          rights you have by law that cannot be limited.
        </p>
      </section>

      <section>
        <h2>8. Changes and contact</h2>
        <p className="mt-3">
          We may update these terms. When we do, the version date above changes
          and you may be asked to accept them again. Questions or concerns?
          Open an issue on the{' '}
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            project page
          </a>
          .
        </p>
        <p className="mt-3 text-sm">
          If you run your own copy of Flashly, replace this contact point with
          your own and review these terms for your region.
        </p>
      </section>
    </LegalPage>
  );
}
