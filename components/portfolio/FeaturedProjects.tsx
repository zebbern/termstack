'use client'

import { ExternalLink, Github } from 'lucide-react'

interface Project {
  id: number
  title: string
  description: string
  tags: string[]
  image: string
  liveUrl: string
  githubUrl: string
}

const projects: Project[] = [
  {
    id: 1,
    title: 'E-Commerce Platform',
    description: 'A full-featured e-commerce platform built with Next.js, featuring product listings, shopping cart, and payment integration.',
    tags: ['Next.js', 'React', 'Tailwind CSS', 'Stripe'],
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=300&fit=crop',
    liveUrl: 'https://example.com',
    githubUrl: 'https://github.com',
  },
  {
    id: 2,
    title: 'Task Management App',
    description: 'Real-time collaboration task management application with drag-and-drop functionality and team features.',
    tags: ['React', 'Firebase', 'TypeScript', 'Tailwind'],
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop',
    liveUrl: 'https://example.com',
    githubUrl: 'https://github.com',
  },
  {
    id: 3,
    title: 'Analytics Dashboard',
    description: 'Comprehensive analytics dashboard with real-time data visualization and custom reporting capabilities.',
    tags: ['Next.js', 'Chart.js', 'Prisma', 'PostgreSQL'],
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=300&fit=crop',
    liveUrl: 'https://example.com',
    githubUrl: 'https://github.com',
  },
]

const FeaturedProjects = () => {
  return (
    <section id="projects" className="section">
      <div className="max-w-6xl mx-auto">
        <div className="space-y-12">
          {/* Section Header */}
          <div className="space-y-2">
            <h2 className="text-4xl md:text-5xl font-bold">Featured Projects</h2>
            <p className="text-slate-400 text-lg max-w-2xl">
              A selection of recent projects showcasing my expertise in full-stack development
            </p>
          </div>

          {/* Projects Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="card card-hover group"
              >
                {/* Project Image */}
                <div className="relative mb-4 overflow-hidden rounded-lg h-48 bg-slate-800">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-slate-100">{project.title}</h3>
                  <p className="text-slate-400 text-sm line-clamp-3">{project.description}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 text-xs rounded-full bg-slate-800 text-slate-300 border border-slate-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Links */}
                  <div className="flex gap-3 pt-4 border-t border-slate-700">
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-slate-300"
                    >
                      <ExternalLink size={16} />
                      <span className="text-sm">Live</span>
                    </a>
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-slate-300"
                    >
                      <Github size={16} />
                      <span className="text-sm">Code</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* View All Button */}
          <div className="text-center pt-8">
            <a href="#" className="btn-secondary inline-flex items-center gap-2">
              View All Projects <ExternalLink size={18} />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FeaturedProjects
