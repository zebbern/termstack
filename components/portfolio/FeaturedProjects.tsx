'use client'

import { ExternalLink, Github } from 'lucide-react'

interface WorkflowCard {
  id: number
  title: string
  eyebrow: string
  visual: string
  visualSubtext: string
  description: string
  tags: string[]
  accentClass: string
  ctaHref: string
  ctaLabel: string
  githubUrl: string
}

const workflows: WorkflowCard[] = [
  {
    id: 1,
    title: 'Prompt to working UI',
    eyebrow: 'Act mode',
    visual: 'Prompt -> Files -> Preview',
    visualSubtext: 'Describe the product, let the agent edit the repo, and inspect the result beside the chat.',
    description: 'termstack operates on a real project directory, so every generated screen, route, and component is immediately inspectable.',
    tags: ['Next.js 15', 'React 19', 'Live preview', 'File tree'],
    accentClass: 'from-cyan-600/40 via-slate-900 to-slate-950',
    ctaHref: '#contact',
    ctaLabel: 'Run the quick start',
    githubUrl: 'https://github.com/zebbern/termstack',
  },
  {
    id: 2,
    title: 'Wire real services',
    eyebrow: 'Integrations',
    visual: 'GitHub + Vercel + Supabase',
    visualSubtext: 'Move from local iteration to repo sync, deployment, and database setup without changing tools.',
    description: 'Once the preview looks right, connect the services you need and keep shipping from the same workspace.',
    tags: ['GitHub', 'Vercel', 'Supabase', 'Environment settings'],
    accentClass: 'from-emerald-600/40 via-slate-900 to-slate-950',
    ctaHref: '#skills',
    ctaLabel: 'See capabilities',
    githubUrl: 'https://github.com/zebbern/termstack',
  },
  {
    id: 3,
    title: 'Stay in the loop',
    eyebrow: 'Workspace',
    visual: 'Chat, inspect, iterate, publish',
    visualSubtext: 'Keep agent output, request tracking, preview controls, and editor context visible in one place.',
    description: 'termstack is designed for repeated cycles of prompting, reviewing, and refining instead of one-shot code dumps.',
    tags: ['Chat mode', 'Preview router', 'Desktop build', 'Request tracking'],
    accentClass: 'from-amber-500/30 via-slate-900 to-slate-950',
    ctaHref: '#about',
    ctaLabel: 'See the stack',
    githubUrl: 'https://github.com/zebbern/termstack',
  },
]

const FeaturedProjects = () => {
  return (
    <section id="projects" className="section">
      <div className="max-w-6xl mx-auto">
        <div className="space-y-12">
          <div className="space-y-2">
            <h2 className="text-4xl md:text-5xl font-bold">Build Flows</h2>
            <p className="text-slate-400 text-lg max-w-2xl">
              The product loop is simple: describe the outcome, watch the workspace change, then connect the services you need.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className="card card-hover group"
              >
                <div className={`relative mb-4 overflow-hidden rounded-lg h-48 border border-slate-700 bg-gradient-to-br ${workflow.accentClass}`}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_42%)]"></div>
                  <div className="relative h-full flex flex-col justify-between p-5">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-300">{workflow.eyebrow}</p>
                    <div className="space-y-2">
                      <p className="text-3xl font-bold text-slate-50 leading-tight">{workflow.visual}</p>
                      <p className="text-sm text-slate-300 leading-relaxed">{workflow.visualSubtext}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-slate-100">{workflow.title}</h3>
                  <p className="text-slate-400 text-sm line-clamp-3">{workflow.description}</p>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {workflow.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 text-xs rounded-full bg-slate-800 text-slate-300 border border-slate-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-slate-700">
                    <a
                      href={workflow.ctaHref}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-slate-300"
                    >
                      <ExternalLink size={16} />
                      <span className="text-sm">{workflow.ctaLabel}</span>
                    </a>
                    <a
                      href={workflow.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-slate-300"
                    >
                      <Github size={16} />
                      <span className="text-sm">Source</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-8">
            <a href="https://github.com/zebbern/termstack" target="_blank" rel="noopener noreferrer" className="btn-secondary inline-flex items-center gap-2">
              Open the GitHub repository <ExternalLink size={18} />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FeaturedProjects
