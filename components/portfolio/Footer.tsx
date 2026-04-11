'use client'

import Link from 'next/link'
import { ArrowUp } from 'lucide-react'

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resourceLinks = [
    { label: 'GitHub', href: 'https://github.com/zebbern/termstack' },
    { label: 'Claude Code docs', href: 'https://docs.anthropic.com/en/docs/claude-code/setup' },
    { label: 'Vercel', href: 'https://vercel.com' },
    { label: 'Supabase', href: 'https://supabase.com' },
  ]

  const navLinks = [
    { label: 'Overview', href: '#hero' },
    { label: 'Workflows', href: '#projects' },
    { label: 'Capabilities', href: '#skills' },
    { label: 'Stack', href: '#about' },
    { label: 'Start', href: '#contact' },
  ]

  return (
    <footer className="glass border-t border-slate-700 py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Main Footer Content */}
          <div className="grid md:grid-cols-3 gap-12">
            {/* Brand */}
            <div className="space-y-4">
              <Link href="/" className="text-2xl font-bold gradient-text inline-block">
                termstack
              </Link>
              <p className="text-slate-400 text-sm max-w-xs">
                Local AI app builder with a real Next.js workspace, preview-first iteration, and deploy hooks when you need them.
              </p>
            </div>

            {/* Navigation Links */}
            <div className="space-y-4">
              <h4 className="font-bold text-slate-100">Quick Links</h4>
              <ul className="space-y-2">
                {navLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-slate-400 hover:text-slate-200 transition-colors duration-300 text-sm"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              <h4 className="font-bold text-slate-100">Resources</h4>
              <ul className="space-y-2">
                {resourceLinks.map((resource) => (
                  <li key={resource.label}>
                    <a
                      href={resource.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-slate-200 transition-colors duration-300 text-sm"
                    >
                      {resource.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-700"></div>

          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-400 text-sm">
              termstack is open-source. Review CLI licenses and third-party hosting costs before deploying generated apps.
            </p>

            {/* Scroll to Top Button */}
            <button
              onClick={scrollToTop}
              className="p-3 rounded-lg bg-slate-900 border border-slate-700 hover:border-purple-500 hover:text-purple-400 text-slate-400 transition-all duration-300"
              aria-label="Scroll to top"
            >
              <ArrowUp size={18} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
