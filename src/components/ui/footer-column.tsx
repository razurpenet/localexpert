import { Mail, MapPin, Phone } from 'lucide-react'
import Link from 'next/link'

// Inline SVGs replace deprecated lucide-react brand icons
function IconFacebook() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
    </svg>
  )
}

function IconInstagram() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
    </svg>
  )
}

function IconX() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function IconLinkedIn() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

const socialLinks = [
  { Icon: IconFacebook, label: 'Facebook',   href: 'https://facebook.com/handbyuk' },
  { Icon: IconInstagram, label: 'Instagram', href: 'https://instagram.com/handbyuk' },
  { Icon: IconX,        label: 'X',          href: 'https://twitter.com/handbyuk' },
  { Icon: IconLinkedIn, label: 'LinkedIn',   href: 'https://linkedin.com/company/handby' },
]

const discoverLinks = [
  { text: 'Browse all providers', href: '/search' },
  { text: 'Plumbers',             href: '/search?category=plumbing' },
  { text: 'Electricians',         href: '/search?category=electrical' },
  { text: 'Cleaners',             href: '/search?category=cleaning' },
  { text: 'Gardeners',            href: '/search?category=gardening' },
  { text: 'All categories',       href: '/search' },
]

const providerLinks = [
  { text: 'List your services',    href: '/signup?role=provider' },
  { text: 'How it works',          href: '/#how-it-works' },
  { text: 'Provider dashboard',    href: '/dashboard/provider' },
  { text: 'Sign up as a provider', href: '/signup?role=provider' },
]

const legalLinks = [
  { text: 'Privacy Policy',   href: '/privacy' },
  { text: 'Terms of Service', href: '/terms' },
  { text: 'Cookie Policy',    href: '/cookies' },
  { text: 'Settings',         href: '/dashboard/settings' },
]

const contactInfo = [
  { icon: Mail,   text: 'hello@handby.uk',       href: 'mailto:hello@handby.uk' },
  { icon: Phone,  text: '+44 (0) 20 0000 0000',  href: 'tel:+442000000000' },
  { icon: MapPin, text: 'United Kingdom',         href: '#', isAddress: true },
]

export default function HandbyFooter() {
  return (
    <footer className="bg-slate-900 mt-16 w-full rounded-t-2xl">
      <div className="mx-auto max-w-6xl px-4 pt-16 pb-6 sm:px-6 lg:px-8 lg:pt-24">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

          {/* Brand column */}
          <div>
            <Link href="/" className="flex items-center gap-2">
              <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary">
                <MapPin className="h-5 w-5 text-white fill-white" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">
                Hand<span className="text-indigo-400">by</span>
              </span>
            </Link>

            <p className="text-slate-400 mt-6 max-w-xs text-sm leading-relaxed">
              The fastest way to find trusted local professionals in the UK.
              Plumbers, electricians, cleaners, and more — verified and near you.
            </p>

            <ul className="mt-8 flex gap-5">
              {socialLinks.map(({ Icon, label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-indigo-400 transition-colors"
                  >
                    <span className="sr-only">{label}</span>
                    <Icon />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-2">

            {/* Discover */}
            <div>
              <p className="text-sm font-semibold text-white uppercase tracking-wider">Discover</p>
              <ul className="mt-6 space-y-3 text-sm">
                {discoverLinks.map(({ text, href }) => (
                  <li key={text}>
                    <Link href={href} className="text-slate-400 hover:text-white transition-colors">
                      {text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* For Providers */}
            <div>
              <p className="text-sm font-semibold text-white uppercase tracking-wider">Providers</p>
              <ul className="mt-6 space-y-3 text-sm">
                {providerLinks.map(({ text, href }) => (
                  <li key={text}>
                    <Link href={href} className="text-slate-400 hover:text-white transition-colors">
                      {text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <p className="text-sm font-semibold text-white uppercase tracking-wider">Legal</p>
              <ul className="mt-6 space-y-3 text-sm">
                {legalLinks.map(({ text, href }) => (
                  <li key={text}>
                    <Link href={href} className="text-slate-400 hover:text-white transition-colors">
                      {text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <p className="text-sm font-semibold text-white uppercase tracking-wider">Contact</p>
              <ul className="mt-6 space-y-4 text-sm">
                {contactInfo.map(({ icon: Icon, text, href, isAddress }) => (
                  <li key={text}>
                    <a
                      href={href}
                      className="flex items-start gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                      <Icon className="h-4 w-4 mt-0.5 shrink-0 text-indigo-400" />
                      {isAddress ? (
                        <address className="not-italic">{text}</address>
                      ) : (
                        <span>{text}</span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Handby. All rights reserved.</p>
          <p>Registered in England and Wales · handby.uk</p>
        </div>
      </div>
    </footer>
  )
}
