import PublicNavbar from '@/components/shared/PublicNavbar'
import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service — Handby',
  description: 'The terms that govern your use of the Handby platform.',
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="space-y-8 text-sm text-foreground leading-relaxed">

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Last updated: 5 March 2026</p>
            <h1 className="text-3xl font-bold">Terms of Service</h1>
            <p className="text-muted-foreground">
              Please read these Terms of Service (&quot;Terms&quot;) carefully before using
              Handby. By creating an account or using our platform you agree to be bound by
              these Terms. If you do not agree, do not use Handby.
            </p>
          </div>

          <Section title="1. About Handby">
            <p>
              Handby (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is an introduction platform
              that connects customers who need local services (&quot;Customers&quot;) with
              self-employed professionals and businesses (&quot;Providers&quot;).
            </p>
            <p>
              <strong>Handby is not a party to any contract for services</strong> between a
              Customer and a Provider. We do not employ Providers, and we are not responsible for
              the quality, safety, legality, or any other aspect of the services they deliver.
              Providers are independent contractors who set their own prices and terms.
            </p>
          </Section>

          <Section title="2. Eligibility">
            <p>To use Handby you must:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-1">
              <li>Be at least 18 years old</li>
              <li>Be a resident of the United Kingdom</li>
              <li>Provide accurate and complete registration information</li>
              <li>Have the legal capacity to enter into a binding contract</li>
            </ul>
          </Section>

          <Section title="3. Your account">
            <p>
              You are responsible for maintaining the confidentiality of your login credentials
              and for all activity that occurs under your account. Notify us immediately at{' '}
              <a href="mailto:hello@handby.uk" className="text-primary hover:underline">
                hello@handby.uk
              </a>{' '}
              if you suspect unauthorised access.
            </p>
            <p>
              You may not create an account on behalf of another person without their explicit
              authority, or operate multiple accounts to circumvent any restriction we have placed
              on your account.
            </p>
          </Section>

          <Section title="4. Customer terms">
            <p>As a Customer you agree to:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-1">
              <li>Provide accurate information when submitting quote requests</li>
              <li>Deal honestly and courteously with Providers</li>
              <li>Only submit reviews for services you have genuinely received</li>
              <li>Not use Handby to solicit services for illegal purposes</li>
              <li>
                Understand that Handby facilitates introductions only — you contract directly with
                the Provider and should agree scope, price, and timeline before work begins
              </li>
            </ul>
            <p>
              Your statutory rights as a consumer under the Consumer Rights Act 2015 and
              Consumer Contracts Regulations 2013 apply to contracts you enter into directly with
              Providers. These rights are not affected by these Terms.
            </p>
          </Section>

          <Section title="5. Provider terms">
            <p>As a Provider you agree to:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-1">
              <li>
                Hold all licences, registrations, and qualifications legally required to offer
                your listed services (e.g. Gas Safe registration for gas work, Part P for
                electrical, ADI for driving instruction, DBS check for childcare)
              </li>
              <li>
                Hold adequate public liability insurance before accepting any job through Handby
              </li>
              <li>Only list services you are genuinely qualified and able to deliver</li>
              <li>Respond to quote requests promptly and professionally</li>
              <li>Keep your availability status accurate</li>
              <li>Honour the price and scope agreed with Customers before work begins</li>
              <li>Comply with all applicable consumer protection and trading standards laws</li>
              <li>
                Not contact Customers outside of Handby to circumvent any future commission or
                subscription model we may introduce
              </li>
            </ul>
            <p>
              You are solely responsible for your tax affairs including self-assessment, VAT
              (where applicable), and National Insurance. Handby does not withhold or remit tax
              on your behalf.
            </p>
          </Section>

          <Section title="6. Prohibited conduct">
            <p>You must not use Handby to:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-1">
              <li>Post false, misleading, or fraudulent information</li>
              <li>Harass, abuse, or threaten other users</li>
              <li>Submit fake reviews or ratings</li>
              <li>Scrape, crawl, or extract data from the platform without written permission</li>
              <li>Attempt to gain unauthorised access to any account or system</li>
              <li>Use the platform for any unlawful purpose</li>
              <li>Infringe the intellectual property rights of any person</li>
            </ul>
            <p>
              We reserve the right to suspend or permanently ban any account that breaches these
              prohibitions without prior notice.
            </p>
          </Section>

          <Section title="7. Reviews and content">
            <p>
              By submitting a review or any other content to Handby, you grant us a non-exclusive,
              royalty-free, worldwide licence to display, reproduce, and adapt that content on the
              platform and in our marketing materials.
            </p>
            <p>
              Reviews must be honest and based on genuine experience. We reserve the right to
              remove any review that we reasonably believe to be fake, defamatory, or in breach of
              these Terms. Under the Digital Markets, Competition and Consumers Act 2024, it is
              unlawful to submit or commission fake reviews.
            </p>
          </Section>

          <Section title="8. Limitation of liability">
            <p>
              To the fullest extent permitted by law, Handby&apos;s total liability to you for any
              claim arising from your use of the platform shall not exceed <strong>£100</strong> or
              the amount you have paid to us in the 12 months preceding the claim, whichever is
              greater.
            </p>
            <p>Handby is not liable for:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-1">
              <li>The quality, safety, or legality of any service provided by a Provider</li>
              <li>Any loss or damage arising from your reliance on Provider profiles or reviews</li>
              <li>Indirect, consequential, or economic loss</li>
              <li>Service interruptions, bugs, or data loss</li>
            </ul>
            <p>
              Nothing in these Terms limits liability for death or personal injury caused by our
              negligence, fraud, or any other liability that cannot be excluded by law.
            </p>
          </Section>

          <Section title="9. Intellectual property">
            <p>
              The Handby name, logo, platform, and all associated content (excluding user-generated
              content) are owned by or licensed to Handby. You may not reproduce, distribute, or
              create derivative works from any of our intellectual property without our written
              consent.
            </p>
          </Section>

          <Section title="10. Platform availability">
            <p>
              We aim to keep Handby available at all times but do not guarantee uninterrupted
              access. We may suspend the platform for maintenance, upgrades, or circumstances
              beyond our control. We will try to give reasonable notice of planned downtime.
            </p>
          </Section>

          <Section title="11. Changes to these Terms">
            <p>
              We may update these Terms from time to time. We will notify you of material changes
              by email or by a prominent notice on the platform at least 14 days before they take
              effect. Continued use of Handby after the effective date constitutes acceptance of
              the revised Terms.
            </p>
          </Section>

          <Section title="12. Termination">
            <p>
              You may close your account at any time via Settings → Delete account. We may
              suspend or terminate your account if you breach these Terms or if we are required to
              do so by law.
            </p>
            <p>
              On termination, your right to use the platform ceases immediately. Clauses that by
              their nature should survive termination (including limitation of liability, reviews
              licence, and governing law) will continue to apply.
            </p>
          </Section>

          <Section title="13. Governing law and disputes">
            <p>
              These Terms are governed by the law of <strong>England and Wales</strong>. Any
              dispute arising from or relating to these Terms or your use of Handby shall be
              subject to the exclusive jurisdiction of the courts of England and Wales.
            </p>
            <p>
              Before pursuing legal action, we encourage you to contact us at{' '}
              <a href="mailto:hello@handby.uk" className="text-primary hover:underline">
                hello@handby.uk
              </a>{' '}
              so we can try to resolve the matter informally.
            </p>
          </Section>

          <Section title="14. Contact">
            <address className="not-italic space-y-1 text-muted-foreground">
              <p><strong className="text-foreground">Handby</strong></p>
              <p>General enquiries: <a href="mailto:hello@handby.uk" className="text-primary hover:underline">hello@handby.uk</a></p>
              <p>Privacy / data: <a href="mailto:privacy@handby.uk" className="text-primary hover:underline">privacy@handby.uk</a></p>
              <p>Website: handby.uk</p>
            </address>
          </Section>

          <div className="border-t border-border pt-6 flex gap-4 text-xs text-muted-foreground">
            <Link href="/privacy" className="hover:text-primary hover:underline">Privacy Policy</Link>
            <Link href="/cookies" className="hover:text-primary hover:underline">Cookie Policy</Link>
            <Link href="/" className="hover:text-primary hover:underline">Back to home</Link>
          </div>

        </div>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="space-y-2 text-muted-foreground">{children}</div>
    </section>
  )
}
