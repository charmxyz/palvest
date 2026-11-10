import type { Metadata } from "next";
import { CONTACT_EMAIL, LegalPage, type LegalSection } from "@/components/legal-page";

export const metadata: Metadata = { title: "Privacy Policy", alternates: { canonical: "/privacy" } };

const mail = <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;

const SECTIONS: LegalSection[] = [
  {
    heading: "What we collect",
    body: (
      <>
        <p>We keep what the product needs to work, and nothing for advertising.</p>
        <ul>
          <li>
            <strong>When you back a project:</strong> your name and email address, and the PayPal order, capture and payer IDs that PayPal returns. We
            never see or store your card or bank details; PayPal handles payment.
          </li>
          <li>
            <strong>When you receive a payout:</strong> your name, email address and the amount, so a PayPal Payouts batch can pay you and we can keep a
            ledger of every distribution.
          </li>
          <li>
            <strong>Creators:</strong> the public YouTube channel you connect (name, handle, subscriber count and public video statistics) and the
            proposals you write, including the idea text you submit for drafting.
          </li>
        </ul>
      </>
    ),
  },
  {
    heading: "Cookies",
    body: (
      <>
        <p>We use two first-party cookies and no tracking or analytics cookies.</p>
        <ul>
          <li>
            <strong>palvest_pal</strong> remembers which Pal (by email) you are viewing as, for up to 30 days.
          </li>
          <li>
            <strong>palvest_gate</strong> keeps you signed in to the creator studio after you enter its access password, for up to a year.
          </li>
        </ul>
      </>
    ),
  },
  {
    heading: "How we use it",
    body: (
      <ul>
        <li>To record backings and show funding progress.</li>
        <li>To calculate each Pal&apos;s share of revenue and send payouts.</li>
        <li>To forecast a video&apos;s views from the creator&apos;s public channel data.</li>
        <li>To draft proposals from a creator&apos;s description.</li>
        <li>To answer you when you contact us.</li>
      </ul>
    ),
  },
  {
    heading: "Who we share it with",
    body: (
      <>
        <p>We don&apos;t sell personal data. We share it only with the services that run Palvest, and only what each one needs:</p>
        <ul>
          <li><strong>PayPal</strong> processes backings and payouts.</li>
          <li><strong>Anthropic</strong> (Claude) receives the text of a creator&apos;s idea to draft a proposal. Backer data is never sent to it.</li>
          <li><strong>Google</strong> (YouTube Data API) is queried for public channel and video statistics.</li>
          <li><strong>Supabase</strong> hosts our database.</li>
          <li><strong>Vercel</strong> hosts the website.</li>
        </ul>
        <p>On a project page, other visitors can see how much has been raised and how many Pals have backed it. Creators can see the names of their Pals and what each one received.</p>
        <p>
          <strong>While Palvest is a demo,</strong> there are no accounts: the Pal switcher in the navigation lists Pals by name and email so anyone can
          explore the app as them, including their portfolio. Don&apos;t back a project with details you want kept private.
        </p>
      </>
    ),
  },
  {
    heading: "How long we keep it",
    body: <p>We keep backing and payout records for as long as a project&apos;s revenue share runs and as long afterwards as we need them for accounting. You can ask us to delete your data at any time; we&apos;ll remove what we aren&apos;t required to keep.</p>,
  },
  {
    heading: "Your choices",
    body: <p>You can ask to see, correct or delete the personal data we hold about you by emailing {mail}. You can clear our cookies from your browser at any time.</p>,
  },
  {
    heading: "Prototype status",
    body: <p>Palvest is a prototype. Payments currently run on PayPal Sandbox, so no real money moves, and demo data may be reset at any time.</p>,
  },
  {
    heading: "Changes and contact",
    body: <p>If we change this policy, we&apos;ll update the date at the top of this page. Questions? Email {mail}.</p>,
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="November 10, 2026"
      intro={<p>This policy explains what Palvest collects when you use palvest.xyz, why, and who else sees it.</p>}
      sections={SECTIONS}
    />
  );
}
