'use client'

import { Briefcase, GraduationCap, Award } from 'lucide-react'

const About = () => {
  return (
    <section id="about" className="section">
      <div className="max-w-6xl mx-auto">
        <div className="space-y-12">
          {/* Section Header */}
          <div className="space-y-2">
            <h2 className="text-4xl md:text-5xl font-bold">About Me</h2>
            <p className="text-slate-400 text-lg max-w-2xl">
              Learn more about my journey and experience in web development
            </p>
          </div>

          {/* About Content */}
          <div className="grid md:grid-cols-2 gap-12">
            {/* Text Content */}
            <div className="space-y-6">
              <p className="text-slate-300 text-lg leading-relaxed">
                I&apos;m a passionate full-stack developer with 5+ years of experience building modern web applications. I specialize in creating responsive, user-friendly interfaces and scalable backend systems.
              </p>
              <p className="text-slate-300 text-lg leading-relaxed">
                My journey in tech started with a curiosity about how things work on the web. Since then, I&apos;ve developed expertise across the entire stack, from frontend frameworks like React and Next.js to backend technologies like Node.js and databases.
              </p>
              <p className="text-slate-300 text-lg leading-relaxed">
                When I&apos;m not coding, I enjoy contributing to open-source projects, writing technical blog posts, and exploring new technologies to stay at the forefront of web development.
              </p>
            </div>

            {/* Experience & Education */}
            <div className="space-y-6">
              {/* Experience */}
              <div className="card">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-purple-500/20">
                    <Briefcase size={24} className="text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-slate-100">Senior Developer</h4>
                    <p className="text-slate-400 text-sm">Tech Company Inc.</p>
                    <p className="text-slate-500 text-sm pt-1">2022 - Present</p>
                  </div>
                </div>
              </div>

              {/* Education */}
              <div className="card">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-blue-500/20">
                    <GraduationCap size={24} className="text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-slate-100">Bachelor of Science</h4>
                    <p className="text-slate-400 text-sm">Computer Science</p>
                    <p className="text-slate-500 text-sm pt-1">University of Technology</p>
                  </div>
                </div>
              </div>

              {/* Achievement */}
              <div className="card">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-pink-500/20">
                    <Award size={24} className="text-pink-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-slate-100">5+ Years Experience</h4>
                    <p className="text-slate-400 text-sm">Full-Stack Development</p>
                    <p className="text-slate-500 text-sm pt-1">50+ Projects Completed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-4 pt-8">
            {[
              { number: '50+', label: 'Projects' },
              { number: '30+', label: 'Clients' },
              { number: '5+', label: 'Years Exp.' },
              { number: '100%', label: 'Satisfaction' },
            ].map((stat) => (
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
