import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL, LegalPage, type LegalSection } from "@/components/legal-page";

export const metadata: Metadata = { title: "Terms of Service", alternates: { canonical: "/terms" } };

const mail = <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;

const SECTIONS: LegalSection[] = [
  {
    heading: "What Palvest is",
    body: (
      <p>
        Palvest lets creators propose a video, raise its budget from fans (&quot;Pals&quot;), and share a fixed percentage of the video&apos;s eligible
        revenue with those Pals for a fixed term. By using Palvest you agree to these terms.
      </p>
    ),
  },
  {
    heading: "Prototype, Sandbox payments",
    body: (
      <p>
        Palvest is a prototype. Payments currently run on PayPal Sandbox: no real money is charged or paid out, and balances, backings and payouts
        are for demonstration only. Demo data may be reset at any time.
      </p>
    ),
  },
  {
    heading: "No guaranteed returns",
    body: (
      <>
        <p>
          Forecasts are estimates computed from a channel&apos;s past public performance. They are not promises. A video can earn less than forecast, or
          nothing, and you may receive less than you put in.
        </p>
        <p>Nothing on Palvest is financial, investment, tax or legal advice.</p>
      </>
    ),
  },
  {
    heading: "What Pals get, and what they don't",
    body: (
      <p>
        A Pal&apos;s share is a pro-rata portion of the revenue pool a creator commits to, for the stated term. Pals do not own the video, the channel,
        or any part of the creator&apos;s business, and get no say in how the video is made.
      </p>
    ),
  },
  {
    heading: "Creators' responsibilities",
    body: (
      <ul>
        <li>Only propose videos for channels you own or are authorized to represent.</li>
        <li>Describe budgets and plans honestly, and use backed funds for the project you pitched.</li>
        <li>Report the video&apos;s revenue accurately and pay out the share you committed to.</li>
        <li>Review AI-drafted text before publishing; you are responsible for what you publish.</li>
      </ul>
    ),
  },
  {
    heading: "Payments",
    body: (
      <p>
        Backings and payouts are processed by PayPal and are also subject to PayPal&apos;s terms. A backing only counts once PayPal confirms the payment.
        We aren&apos;t responsible for delays or errors caused by PayPal.
      </p>
    ),
  },
  {
    heading: "Acceptable use",
    body: (
      <p>
        Don&apos;t use Palvest for anything unlawful, misleading or harmful. Don&apos;t try to access other people&apos;s accounts, interfere with the service,
        or get around the creator studio&apos;s access controls. We may remove content or block access that breaks these rules.
      </p>
    ),
  },
  {
    heading: "Liability",
    body: (
      <p>
        Palvest is provided &quot;as is&quot;, without warranties of any kind. To the extent the law allows, we aren&apos;t liable for indirect or consequential
        losses, or for losses arising from how a video performs.
      </p>
    ),
  },
  {
    heading: "Privacy",
    body: (
      <p>
        Our <Link href="/privacy">Privacy Policy</Link> explains what data we collect and how we use it.
      </p>
    ),
  },
  {
    heading: "Changes and contact",
    body: <p>We may update these terms; the date at the top of this page shows the latest version. Questions? Email {mail}.</p>,
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="November 10, 2026"
      intro={<p>The rules for using Palvest, in plain language.</p>}
      sections={SECTIONS}
    />
  );
}
