'use client'

import { ArrowRight, Github, Linkedin, Mail } from 'lucide-react'

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
                Available for work
              </p>
            </div>
          </div>

          {/* Main Heading */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Hi, I&apos;m <span className="gradient-text">Alex Developer</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 max-w-2xl">
              Full-stack developer creating beautiful, high-performance web experiences with modern technologies
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col md:flex-row gap-4 pt-4">
            <a href="#projects" className="btn-primary inline-flex items-center justify-center gap-2">
              View My Work <ArrowRight size={20} />
            </a>
            <a href="#contact" className="btn-secondary inline-flex items-center justify-center gap-2">
              Get In Touch
            </a>
          </div>

          {/* Social Links */}
          <div className="flex gap-4 pt-8">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="glass p-3 rounded-lg hover:border-slate-500 hover:border-opacity-100 transition-all duration-300"
            >
              <Github size={20} className="text-slate-300" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="glass p-3 rounded-lg hover:border-slate-500 hover:border-opacity-100 transition-all duration-300"
            >
              <Linkedin size={20} className="text-slate-300" />
            </a>
            <a
              href="mailto:hello@example.com"
              className="glass p-3 rounded-lg hover:border-slate-500 hover:border-opacity-100 transition-all duration-300"
            >
              <Mail size={20} className="text-slate-300" />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
