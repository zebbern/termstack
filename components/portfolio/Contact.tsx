'use client'

import { ExternalLink, Github, Rocket, Server, Terminal } from 'lucide-react'

const setupCards = [
  {
    icon: Terminal,
    label: 'Supported CLIs',
    value: 'Claude Code, Codex CLI, Cursor CLI, Qwen Code, and Z.AI GLM',
  },
  {
    icon: Rocket,
    label: 'Shipping hooks',
    value: 'Connect GitHub, deploy to Vercel, and wire Supabase from the same workspace.',
  },
  {
    icon: Server,
    label: 'Runtime',
    value: 'Next.js 15, React 19, Electron 39, Prisma-backed local project state.',
  },
]

const quickStart = [
  'git clone https://github.com/zebbern/termstack.git',
  'cd termstack',
  'npm install',
  'npm run dev',
].join('\n')

const Contact = () => {
  return (
    <section id="contact" className="section">
      <div className="max-w-6xl mx-auto">
        <div className="space-y-12">
          <div className="space-y-2">
            <h2 className="text-4xl md:text-5xl font-bold">Start Building</h2>
            <p className="text-slate-400 text-lg max-w-2xl">
              termstack runs locally. Authenticate a supported CLI, install dependencies, and open the workspace.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-6">
              {setupCards.map((card) => (
                <div key={card.label} className="card group">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 group-hover:from-cyan-500/30 group-hover:to-emerald-500/30 transition-all duration-300">
                      <card.icon size={24} className="text-cyan-300" />
                    </div>
                    <div>
                      <h4 className="text-slate-100 font-bold">{card.label}</h4>
                      <p className="text-slate-400 text-sm pt-1 leading-relaxed">{card.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="md:col-span-2 card space-y-6">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Quick start</p>
                <h3 className="text-2xl font-bold text-slate-100 pt-3">Run termstack locally in four commands</h3>
              </div>

              <pre className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-950/80 p-4 text-sm text-slate-200">
                <code>{quickStart}</code>
              </pre>

              <div className="space-y-3 text-slate-300">
                <p>Before you launch:</p>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li>Node.js 20+ and npm 10+ are required.</li>
                  <li>Authenticate at least one supported CLI before opening the app.</li>
                  <li>Use <code className="text-slate-200">npm run dev:desktop</code> if you want the Electron shell instead of the browser tab.</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <a
                  href="https://github.com/zebbern/termstack"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary inline-flex items-center justify-center gap-2"
                >
                  <Github size={18} />
                  Open GitHub
                </a>
                <a
                  href="https://docs.anthropic.com/en/docs/claude-code/setup"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary inline-flex items-center justify-center gap-2"
                >
                  Claude Code setup
                  <ExternalLink size={18} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Contact
