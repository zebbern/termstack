'use client'

import { Briefcase, GraduationCap, Award } from 'lucide-react'

const workflowSteps = [
  {
    icon: Briefcase,
    title: 'Prompt',
    subtitle: 'Start with an idea, not a scaffold',
    detail: 'Describe the product, paste constraints, or attach a screenshot. termstack forwards the request to the selected CLI and tracks the run.',
  },
  {
    icon: GraduationCap,
    title: 'Review',
    subtitle: 'Inspect the same workspace the agent edits',
    detail: 'Open files, follow tool output, switch routes, and keep the preview visible while you decide what the next turn should change.',
  },
  {
    icon: Award,
    title: 'Ship',
    subtitle: 'Move from local iteration to deployment',
    detail: 'When the preview is ready, connect GitHub, wire Vercel, add Supabase, and keep using the same per-project workspace.',
  },
]

const stackFacts = [
  { number: 'Next.js 15', label: 'App router workspace' },
  { number: 'React 19', label: 'UI foundation' },
  { number: 'Electron 39', label: 'Desktop runtime' },
  { number: 'Prisma + local data', label: 'Project and message state' },
]

const About = () => {
  return (
    <section id="about" className="section">
      <div className="max-w-6xl mx-auto">
        <div className="space-y-12">
          <div className="space-y-2">
            <h2 className="text-4xl md:text-5xl font-bold">How termstack works</h2>
            <p className="text-slate-400 text-lg max-w-2xl">
              A real project directory, a live preview, and a connected agent loop all stay visible at the same time.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <p className="text-slate-300 text-lg leading-relaxed">
                termstack is designed for iterative product work, not one-shot demos. Each project gets its own workspace,
                message history, preview process, and integration state so you can keep refining the app across multiple runs.
              </p>
              <p className="text-slate-300 text-lg leading-relaxed">
                Because the agent works against a real repo, you can inspect the exact files it touched, review tool output,
                and decide whether to keep iterating, edit by hand, or publish the result.
              </p>
              <p className="text-slate-300 text-lg leading-relaxed">
                The stack underneath stays modern and familiar: Next.js, React, TypeScript, Prisma-backed local state, and
                an Electron shell for desktop workflows when the browser is not enough.
              </p>
            </div>

            <div className="space-y-6">
              {workflowSteps.map((step) => (
                <div key={step.title} className="card">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700">
                      <step.icon size={24} className="text-slate-200" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-slate-100">{step.title}</h4>
                      <p className="text-slate-400 text-sm">{step.subtitle}</p>
                      <p className="text-slate-300 text-sm pt-3 leading-relaxed">{step.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4 pt-8">
            {stackFacts.map((stat) => (
              <div key={stat.label} className="card text-center">
                <p className="text-3xl font-bold gradient-text">{stat.number}</p>
                <p className="text-slate-400 pt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default About
