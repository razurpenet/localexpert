import PublicNavbar from '@/components/shared/PublicNavbar'
import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — Handby',
  description: 'How Handby collects, uses, and protects your personal data.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="space-y-8 text-sm text-foreground leading-relaxed">

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Last updated: 5 March 2026</p>
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
            <p className="text-muted-foreground">
              Handby is committed to protecting your personal data. This policy explains what we
              collect, why we collect it, and your rights under the UK General Data Protection
              Regulation (UK GDPR) and the Data Protection Act 2018.
            </p>
          </div>

          <Section title="1. Who we are">
            <p>
              <strong className="text-foreground">Handby</strong> is the data controller for
              personal data processed through handby.uk. We are registered with the Information
              Commissioner&apos;s Office (ICO).
            </p>
            <p>
              Contact:{' '}
              <a href="mailto:privacy@handby.uk" className="text-primary hover:underline">
                privacy@handby.uk
              </a>
            </p>
          </Section>

          <Section title="2. Data we collect">
            <p>We collect the following categories of personal data:</p>
            <Table
              headers={['Data', 'Source', 'Why we collect it']}
              rows={[
                ['Full name', 'You provide it at registration', 'To identify your account and display on your profile'],
                ['Email address', 'You provide it at registration', 'To authenticate your account and send service notifications'],
                ['Password (hashed)', 'You provide it at registration', 'To secure your account — we never store plain-text passwords'],
                ['Profile photo', 'You upload it optionally', 'To display on your public provider profile'],
                ['Location / postcode', 'You provide it or via GPS', 'To match customers with nearby providers'],
                ['Business name & bio', 'Providers provide it optionally', 'To display on your public provider profile'],
                ['Service listings', 'Providers create them', 'To show customers what you offer and at what price'],
                ['Quote request messages', 'Customers write them', 'To facilitate the introduction between customer and provider'],
                ['Reviews and ratings', 'Customers submit after a job', 'To build trust and help other customers choose providers'],
                ['IP address & device info', 'Collected automatically', 'For security, fraud prevention, and service reliability'],
              ]}
            />
          </Section>

          <Section title="3. Legal basis for processing">
            <p>We rely on the following lawful bases under UK GDPR:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-2">
              <li><strong className="text-foreground">Contract</strong> — processing necessary to provide the Handby service to you (e.g. account creation, matching, quote requests)</li>
              <li><strong className="text-foreground">Legitimate interests</strong> — fraud prevention, platform security, and improving our service</li>
              <li><strong className="text-foreground">Legal obligation</strong> — where we are required to retain records by law</li>
              <li><strong className="text-foreground">Consent</strong> — for any marketing communications (you may withdraw consent at any time)</li>
            </ul>
          </Section>

          <Section title="4. How we use your data">
            <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-1">
              <li>To create and manage your account</li>
              <li>To display provider profiles in search results</li>
              <li>To facilitate quote requests between customers and providers</li>
              <li>To display and moderate reviews</li>
              <li>To send transactional emails (e.g. new quote request notification)</li>
              <li>To detect and prevent fraud or abuse</li>
              <li>To comply with legal obligations</li>
            </ul>
            <p className="mt-2">
              We do <strong>not</strong> sell your personal data to third parties, nor do we use it
              for automated decision-making that produces legal or similarly significant effects.
            </p>
          </Section>

          <Section title="5. Who we share data with">
            <p>We share data only where necessary:</p>
            <Table
              headers={['Recipient', 'Reason', 'Location']}
              rows={[
                ['Supabase Inc.', 'Cloud database and authentication provider (data processor)', 'EU / USA (adequacy decision applies)'],
                ['Vercel Inc.', 'Web hosting and deployment platform', 'USA (adequacy decision applies)'],
                ['postcodes.io', 'Free UK postcode lookup API — no personal data sent', 'UK'],
                ['Law enforcement / regulators', 'Where required by law or court order', 'UK'],
              ]}
            />
            <p>
              All processors are bound by data processing agreements and are required to protect
              your data to at least the same standard as Handby.
            </p>
          </Section>

          <Section title="6. How long we keep your data">
            <Table
              headers={['Data', 'Retention period']}
              rows={[
                ['Account and profile data', 'Until you delete your account'],
                ['Quote request messages', '2 years after the request closes'],
                ['Reviews', 'Until you delete your account or request removal'],
                ['Authentication logs', '90 days for security purposes'],
                ['Financial/transaction records', '7 years (legal obligation)'],
              ]}
            />
            <p>
              When you delete your account, all personal data is removed within 30 days, except
              where we are legally required to retain it.
            </p>
          </Section>

          <Section title="7. Your rights">
            <p>Under UK GDPR you have the following rights:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-2">
              <li><strong className="text-foreground">Access</strong> — request a copy of the personal data we hold about you</li>
              <li><strong className="text-foreground">Rectification</strong> — ask us to correct inaccurate or incomplete data</li>
              <li><strong className="text-foreground">Erasure</strong> — ask us to delete your data (&quot;right to be forgotten&quot;). You can also do this directly via Settings → Delete account</li>
              <li><strong className="text-foreground">Restriction</strong> — ask us to limit how we use your data in certain circumstances</li>
              <li><strong className="text-foreground">Portability</strong> — receive your data in a structured, machine-readable format</li>
              <li><strong className="text-foreground">Objection</strong> — object to processing based on legitimate interests</li>
              <li><strong className="text-foreground">Withdraw consent</strong> — where processing is based on consent, withdraw it at any time without affecting prior lawful processing</li>
            </ul>
            <p className="mt-2">
              To exercise any of these rights, email{' '}
              <a href="mailto:privacy@handby.uk" className="text-primary hover:underline">
                privacy@handby.uk
              </a>
              . We will respond within <strong>30 days</strong>. We may ask you to verify your
              identity before fulfilling a request.
            </p>
          </Section>

          <Section title="8. Complaints">
            <p>
              If you are unhappy with how we have handled your data, you have the right to lodge a
              complaint with the UK supervisory authority:
            </p>
            <address className="not-italic mt-2 space-y-1 text-muted-foreground">
              <p><strong className="text-foreground">Information Commissioner&apos;s Office (ICO)</strong></p>
              <p>Website: <a href="https://ico.org.uk" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">ico.org.uk</a></p>
              <p>Helpline: 0303 123 1113</p>
            </address>
            <p className="mt-2">
              We would appreciate the opportunity to address your concerns first — please contact
              us at{' '}
              <a href="mailto:privacy@handby.uk" className="text-primary hover:underline">
                privacy@handby.uk
              </a>{' '}
              before escalating to the ICO.
            </p>
          </Section>

          <Section title="9. Security">
            <p>
              We use industry-standard security measures including encrypted connections (HTTPS),
              hashed passwords, and access controls to protect your data. However, no method of
              transmission over the internet is 100% secure. If you believe your account has been
              compromised, contact us immediately at{' '}
              <a href="mailto:privacy@handby.uk" className="text-primary hover:underline">
                privacy@handby.uk
              </a>
              .
            </p>
          </Section>

          <Section title="10. Changes to this policy">
            <p>
              We may update this Privacy Policy from time to time. We will notify registered users
              of material changes by email. The &quot;Last updated&quot; date at the top shows when
              this policy was last revised.
            </p>
          </Section>

          <div className="border-t border-border pt-6 flex gap-4 text-xs text-muted-foreground">
            <Link href="/terms" className="hover:text-primary hover:underline">Terms of Service</Link>
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

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto mt-3">
      <table className="w-full text-xs border border-border rounded-lg overflow-hidden">
        <thead className="bg-slate-50">
          <tr>
            {headers.map((h) => (
              <th key={h} className="text-left px-4 py-3 font-semibold text-foreground">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className={`px-4 py-3 ${j === 0 ? 'font-medium text-foreground' : ''}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
