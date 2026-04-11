'use client'

import { ArrowRight } from 'lucide-react'

const highlights = [
  {
    title: 'Multi-CLI control',
    description: 'Switch between Claude Code, Codex CLI, Cursor CLI, Qwen Code, and GLM without leaving the workspace.',
  },
  {
    title: 'Preview-first loop',
    description: 'Watch files, routes, and the live preview update while the agent works through each request.',
  },
  {
    title: 'Real deployment hooks',
    description: 'Connect GitHub, Vercel, and Supabase when the generated app is ready to leave your machine.',
  },
]

const Hero = () => {
  return (
    <section id="hero" className="section pt-32 md:pt-40">
      <div className="max-w-6xl mx-auto">
        <div className="space-y-8">
          {/* Badge */}
          <div className="inline-block">
            <div className="glass px-4 py-2 rounded-full">
              <p className="text-sm text-slate-300">
                <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full mr-2"></span>
                Connect a supported coding CLI and start shipping
              </p>
            </div>
          </div>

          {/* Main Heading */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Build <span className="gradient-text">full-stack apps</span> from a prompt
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 max-w-2xl">
              termstack pairs your coding CLI with a live Next.js workspace, so prompts, file changes,
              preview updates, and deployment hooks all stay in the same loop.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col md:flex-row gap-4 pt-4">
            <a href="#projects" className="btn-primary inline-flex items-center justify-center gap-2">
              Explore Workflows <ArrowRight size={20} />
            </a>
            <a href="#contact" className="btn-secondary inline-flex items-center justify-center gap-2">
              Start Locally
            </a>
          </div>

          <div className="grid md:grid-cols-3 gap-4 pt-8">
            {highlights.map((highlight) => (
              <div key={highlight.title} className="card">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{highlight.title}</p>
                <p className="text-slate-200 pt-3 leading-relaxed">{highlight.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
