'use client'

import Navigation from '@/components/portfolio/Navigation'
import Hero from '@/components/portfolio/Hero'
import FeaturedProjects from '@/components/portfolio/FeaturedProjects'
import Skills from '@/components/portfolio/Skills'
import About from '@/components/portfolio/About'
import Contact from '@/components/portfolio/Contact'
import Footer from '@/components/portfolio/Footer'

export default function HomePage() {
  return (
    <>
      <Navigation />
      <Hero />
      <FeaturedProjects />
      <Skills />
      <About />
      <Contact />
      <Footer />
    </>
  )
}
