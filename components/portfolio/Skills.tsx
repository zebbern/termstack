'use client'

interface SkillCategory {
  name: string
  skills: string[]
}

const skillCategories: SkillCategory[] = [
  {
    name: 'Frontend',
    skills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Vue.js', 'HTML/CSS'],
  },
  {
    name: 'Backend',
    skills: ['Node.js', 'Express', 'Python', 'PostgreSQL', 'MongoDB', 'Firebase'],
  },
  {
    name: 'Tools & Tech',
    skills: ['Git', 'Docker', 'AWS', 'GraphQL', 'REST APIs', 'Webpack'],
  },
  {
    name: 'Design',
    skills: ['Figma', 'UI/UX', 'Responsive Design', 'Accessibility', 'Animation', 'Prototyping'],
  },
]

const Skills = () => {
  return (
    <section id="skills" className="section">
      <div className="max-w-6xl mx-auto">
        <div className="space-y-12">
          {/* Section Header */}
          <div className="space-y-2">
            <h2 className="text-4xl md:text-5xl font-bold">Skills & Expertise</h2>
            <p className="text-slate-400 text-lg max-w-2xl">
              Proficient in modern web technologies and best practices for building scalable applications
            </p>
          </div>

          {/* Skills Grid */}
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

          {/* Proficiency Bars */}
          <div className="space-y-8">
            <h3 className="text-2xl font-bold text-slate-100">Proficiency</h3>
            <div className="space-y-6">
              {[
                { label: 'React & Next.js', percentage: 95 },
                { label: 'TypeScript', percentage: 90 },
                { label: 'Full-Stack Development', percentage: 88 },
                { label: 'UI/UX Design', percentage: 82 },
              ].map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-slate-300 font-medium">{item.label}</p>
                    <p className="text-slate-400 text-sm">{item.percentage}%</p>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Skills
