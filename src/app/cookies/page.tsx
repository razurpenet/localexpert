import PublicNavbar from '@/components/shared/PublicNavbar'
import Link from 'next/link'

export const metadata = {
  title: 'Cookie Policy — Handby',
  description: 'How Handby uses cookies and similar technologies.',
}

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="space-y-8 text-sm text-foreground leading-relaxed">

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Last updated: 5 March 2026</p>
            <h1 className="text-3xl font-bold">Cookie Policy</h1>
            <p className="text-muted-foreground">
              This policy explains what cookies and similar technologies Handby uses, why we use
              them, and how you can control them.
            </p>
          </div>

          <Section title="1. Who we are">
            <p>
              Handby (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates the platform at{' '}
              <strong>handby.uk</strong>. We are the data controller for cookies set on this site.
              For questions, contact us at{' '}
              <a href="mailto:privacy@handby.uk" className="text-primary hover:underline">
                privacy@handby.uk
              </a>
              .
            </p>
          </Section>

          <Section title="2. What are cookies?">
            <p>
              Cookies are small text files placed on your device when you visit a website. They
              allow the site to remember information about your visit — such as whether you are
              signed in — making your next visit easier and the site more useful.
            </p>
            <p>
              We also use <strong>localStorage</strong>, a similar browser technology that stores
              small amounts of data on your device but is not sent to our servers with each request.
            </p>
          </Section>

          <Section title="3. The cookies we use">
            <p>
              Handby currently uses only <strong>strictly necessary</strong> cookies. We do not use
              advertising cookies, tracking pixels, or third-party analytics at this time.
            </p>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-xs border border-border rounded-lg overflow-hidden">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Name</th>
                    <th className="text-left px-4 py-3 font-semibold">Type</th>
                    <th className="text-left px-4 py-3 font-semibold">Purpose</th>
                    <th className="text-left px-4 py-3 font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-4 py-3 font-mono">sb-*-auth-token</td>
                    <td className="px-4 py-3">Essential</td>
                    <td className="px-4 py-3">
                      Keeps you signed in. Set by Supabase, our authentication provider. Without
                      this cookie you would be signed out on every page load.
                    </td>
                    <td className="px-4 py-3">Session / up to 1 year</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono">handby_cookie_consent</td>
                    <td className="px-4 py-3">Essential (localStorage)</td>
                    <td className="px-4 py-3">
                      Stores your cookie consent preference so we do not show the consent banner on
                      every visit. No personal data is stored.
                    </td>
                    <td className="px-4 py-3">Until you clear browser storage</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="4. Strictly necessary cookies">
            <p>
              The cookies listed above are strictly necessary for the platform to function. Under
              UK GDPR and the Privacy and Electronic Communications Regulations (PECR), strictly
              necessary cookies do not require your consent. However, we still disclose them here
              for full transparency.
            </p>
          </Section>

          <Section title="5. Third-party cookies">
            <p>
              Handby does not currently embed third-party advertising, social media, or analytics
              scripts that would set cookies on your device. If this changes, we will update this
              policy before any new cookies are placed.
            </p>
          </Section>

          <Section title="6. How to manage and delete cookies">
            <p>
              You can control and delete cookies through your browser settings. Instructions for
              common browsers:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-2">
              <li>
                <strong className="text-foreground">Chrome</strong>: Settings → Privacy and
                security → Cookies and other site data
              </li>
              <li>
                <strong className="text-foreground">Firefox</strong>: Settings → Privacy &amp;
                Security → Cookies and Site Data
              </li>
              <li>
                <strong className="text-foreground">Safari</strong>: Preferences → Privacy →
                Manage Website Data
              </li>
              <li>
                <strong className="text-foreground">Edge</strong>: Settings → Cookies and site
                permissions
              </li>
            </ul>
            <p className="mt-3">
              Please note: deleting the authentication cookie will sign you out of Handby. You can
              sign back in at any time.
            </p>
            <p>
              To clear your cookie consent preference, open your browser&apos;s developer tools,
              go to Application → Local Storage → handby.uk, and delete the{' '}
              <code className="font-mono bg-slate-100 px-1 rounded">handby_cookie_consent</code>{' '}
              key.
            </p>
          </Section>

          <Section title="7. Changes to this policy">
            <p>
              We may update this Cookie Policy from time to time to reflect changes in the
              technologies we use or applicable law. The &quot;Last updated&quot; date at the top
              of this page shows when it was last revised. We encourage you to review this page
              periodically.
            </p>
          </Section>

          <Section title="8. Contact us">
            <p>
              If you have any questions about our use of cookies, please contact us:
            </p>
            <address className="not-italic mt-2 space-y-1 text-muted-foreground">
              <p><strong className="text-foreground">Handby</strong></p>
              <p>
                Email:{' '}
                <a href="mailto:privacy@handby.uk" className="text-primary hover:underline">
                  privacy@handby.uk
                </a>
              </p>
              <p>Website: handby.uk</p>
            </address>
          </Section>

          <div className="border-t border-border pt-6 flex gap-4 text-xs text-muted-foreground">
            <Link href="/privacy" className="hover:text-primary hover:underline">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-primary hover:underline">Terms of Service</Link>
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
