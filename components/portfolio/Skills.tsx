'use client'

interface SkillCategory {
  name: string
  skills: string[]
}

const skillCategories: SkillCategory[] = [
  {
    name: 'Supported Agents',
    skills: ['Claude Code', 'Codex CLI', 'Cursor CLI', 'Qwen Code', 'Z.AI GLM'],
  },
  {
    name: 'Workspace Loop',
    skills: ['Chat mode', 'Act mode', 'Live preview', 'File tree', 'Route controls', 'Request tracking'],
  },
  {
    name: 'Shipping Hooks',
    skills: ['GitHub integration', 'Vercel deployment', 'Environment settings', 'Electron packaging', 'Preview server', 'Project settings'],
  },
  {
    name: 'Data & Config',
    skills: ['Supabase', 'Prisma schema', 'Local project storage', 'Service tokens', 'Global settings', 'Per-project env vars'],
  },
]

const capabilityStats = [
  { value: '5', label: 'Supported CLI agents' },
  { value: 'Live', label: 'Preview feedback loop' },
  { value: 'Browser + desktop', label: 'Ways to run termstack' },
  { value: '1 workspace', label: 'Shared chat, files, and preview context' },
]

const Skills = () => {
  return (
    <section id="skills" className="section">
      <div className="max-w-6xl mx-auto">
        <div className="space-y-12">
          <div className="space-y-2">
            <h2 className="text-4xl md:text-5xl font-bold">Capabilities</h2>
            <p className="text-slate-400 text-lg max-w-2xl">
              termstack keeps the agent, the codebase, and the preview connected so you can review real changes instead of mock output.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {skillCategories.map((category) => (
              <div key={category.name} className="space-y-4">
                <h3 className="text-xl font-bold text-slate-100">{category.name}</h3>
                <div className="flex flex-wrap gap-2">
                  {category.skills.map((skill) => (
                    <div
                      key={skill}
                      className="glass px-4 py-2 rounded-lg text-slate-300 text-sm border border-slate-700 hover:border-slate-500 transition-colors duration-300"
                    >
                      {skill}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {capabilityStats.map((stat) => (
              <div key={stat.label} className="card text-center">
                <p className="text-2xl font-bold gradient-text">{stat.value}</p>
                <p className="text-slate-400 pt-2 text-sm leading-relaxed">{stat.label}</p>
              </div>
            ))}
            </div>
        </div>
      </div>
    </section>
  )
}

export default Skills
