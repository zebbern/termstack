export interface DesignTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  color: string;
}

export const DESIGN_CATEGORIES = [
  'AI & LLM Platforms',
  'Developer Tools & IDEs',
  'Backend, Database & DevOps',
  'Productivity & SaaS',
  'Design & Creative Tools',
  'Fintech & Crypto',
  'E-commerce & Retail',
  'Media & Consumer Tech',
  'Automotive',
] as const;

export type DesignCategory = (typeof DESIGN_CATEGORIES)[number];

export const DESIGN_CATALOG: DesignTemplate[] = [
  // AI & LLM Platforms
  { id: 'claude', name: 'Claude', description: 'Warm terracotta accent, clean editorial layout', category: 'AI & LLM Platforms', color: '#D97706' },
  { id: 'cohere', name: 'Cohere', description: 'Vibrant gradients, data-rich dashboard aesthetic', category: 'AI & LLM Platforms', color: '#D946EF' },
  { id: 'elevenlabs', name: 'ElevenLabs', description: 'Dark cinematic UI, audio-waveform aesthetics', category: 'AI & LLM Platforms', color: '#4C1D95' },
  { id: 'minimax', name: 'Minimax', description: 'Bold dark interface with neon accents', category: 'AI & LLM Platforms', color: '#00D4FF' },
  { id: 'mistral.ai', name: 'Mistral AI', description: 'French-engineered minimalism, purple-toned', category: 'AI & LLM Platforms', color: '#FF7000' },
  { id: 'ollama', name: 'Ollama', description: 'Terminal-first, monochrome simplicity', category: 'AI & LLM Platforms', color: '#EEEEEE' },
  { id: 'opencode.ai', name: 'OpenCode AI', description: 'Developer-centric dark theme', category: 'AI & LLM Platforms', color: '#3B82F6' },
  { id: 'replicate', name: 'Replicate', description: 'Clean white canvas, code-forward', category: 'AI & LLM Platforms', color: '#3B82F6' },
  { id: 'runwayml', name: 'RunwayML', description: 'Cinematic dark UI, media-rich layout', category: 'AI & LLM Platforms', color: '#6366F1' },
  { id: 'together.ai', name: 'Together AI', description: 'Technical, blueprint-style design', category: 'AI & LLM Platforms', color: '#3B82F6' },
  { id: 'voltagent', name: 'VoltAgent', description: 'Void-black canvas, emerald accent, terminal-native', category: 'AI & LLM Platforms', color: '#10B981' },
  { id: 'x.ai', name: 'xAI', description: 'Stark monochrome, futuristic minimalism', category: 'AI & LLM Platforms', color: '#A0A0A0' },

  // Developer Tools & IDEs
  { id: 'cursor', name: 'Cursor', description: 'Sleek dark interface, gradient accents', category: 'Developer Tools & IDEs', color: '#8B5CF6' },
  { id: 'expo', name: 'Expo', description: 'Dark theme, tight letter-spacing, code-centric', category: 'Developer Tools & IDEs', color: '#4630EB' },
  { id: 'lovable', name: 'Lovable', description: 'Playful gradients, friendly dev aesthetic', category: 'Developer Tools & IDEs', color: '#EC4899' },
  { id: 'raycast', name: 'Raycast', description: 'Sleek dark chrome, vibrant gradient accents', category: 'Developer Tools & IDEs', color: '#FF6363' },
  { id: 'superhuman', name: 'Superhuman', description: 'Premium dark UI, keyboard-first, purple glow', category: 'Developer Tools & IDEs', color: '#6C63FF' },
  { id: 'vercel', name: 'Vercel', description: 'Black and white precision, Geist font', category: 'Developer Tools & IDEs', color: '#171717' },
  { id: 'warp', name: 'Warp', description: 'Dark IDE-like interface, block-based command UI', category: 'Developer Tools & IDEs', color: '#01A4EF' },

  // Backend, Database & DevOps
  { id: 'clickhouse', name: 'ClickHouse', description: 'Yellow-accented, technical documentation style', category: 'Backend, Database & DevOps', color: '#FACC15' },
  { id: 'composio', name: 'Composio', description: 'Modern dark with colorful integration icons', category: 'Backend, Database & DevOps', color: '#7C3AED' },
  { id: 'hashicorp', name: 'HashiCorp', description: 'Enterprise-clean, black and white', category: 'Backend, Database & DevOps', color: '#171717' },
  { id: 'mongodb', name: 'MongoDB', description: 'Green leaf branding, developer documentation focus', category: 'Backend, Database & DevOps', color: '#00ED64' },
  { id: 'posthog', name: 'PostHog', description: 'Playful hedgehog branding, developer-friendly dark UI', category: 'Backend, Database & DevOps', color: '#1D4AFF' },
  { id: 'sanity', name: 'Sanity', description: 'Red accent, content-first editorial layout', category: 'Backend, Database & DevOps', color: '#F03E2F' },
  { id: 'sentry', name: 'Sentry', description: 'Dark dashboard, data-dense, pink-purple accent', category: 'Backend, Database & DevOps', color: '#362D59' },
  { id: 'supabase', name: 'Supabase', description: 'Dark emerald theme, code-first', category: 'Backend, Database & DevOps', color: '#3ECF8E' },

  // Productivity & SaaS
  { id: 'cal', name: 'Cal.com', description: 'Clean neutral UI, developer-oriented simplicity', category: 'Productivity & SaaS', color: '#292929' },
  { id: 'intercom', name: 'Intercom', description: 'Friendly blue palette, conversational UI patterns', category: 'Productivity & SaaS', color: '#0057FF' },
  { id: 'linear.app', name: 'Linear', description: 'Ultra-minimal, precise, purple accent', category: 'Productivity & SaaS', color: '#5E6AD2' },
  { id: 'mintlify', name: 'Mintlify', description: 'Clean, green-accented, reading-optimized', category: 'Productivity & SaaS', color: '#0D9373' },
  { id: 'notion', name: 'Notion', description: 'Warm minimalism, serif headings, soft surfaces', category: 'Productivity & SaaS', color: '#E6E6E4' },
  { id: 'resend', name: 'Resend', description: 'Minimal dark theme, monospace accents', category: 'Productivity & SaaS', color: '#171717' },
  { id: 'zapier', name: 'Zapier', description: 'Warm orange, friendly illustration-driven', category: 'Productivity & SaaS', color: '#FF4A00' },

  // Design & Creative Tools
  { id: 'airtable', name: 'Airtable', description: 'Colorful, friendly, structured data aesthetic', category: 'Design & Creative Tools', color: '#FCB400' },
  { id: 'clay', name: 'Clay', description: 'Organic shapes, soft gradients, art-directed layout', category: 'Design & Creative Tools', color: '#8B5CF6' },
  { id: 'figma', name: 'Figma', description: 'Vibrant multi-color, playful yet professional', category: 'Design & Creative Tools', color: '#F24E1E' },
  { id: 'framer', name: 'Framer', description: 'Bold black and blue, motion-first, design-forward', category: 'Design & Creative Tools', color: '#0055FF' },
  { id: 'miro', name: 'Miro', description: 'Bright yellow accent, infinite canvas aesthetic', category: 'Design & Creative Tools', color: '#FFD02F' },
  { id: 'webflow', name: 'Webflow', description: 'Blue-accented, polished marketing site aesthetic', category: 'Design & Creative Tools', color: '#4353FF' },

  // Fintech & Crypto
  { id: 'binance', name: 'Binance', description: 'Bold Binance Yellow on monochrome, trading-floor urgency', category: 'Fintech & Crypto', color: '#F0B90B' },
  { id: 'coinbase', name: 'Coinbase', description: 'Clean blue identity, trust-focused, institutional feel', category: 'Fintech & Crypto', color: '#0052FF' },
  { id: 'kraken', name: 'Kraken', description: 'Purple-accented dark UI, data-dense dashboards', category: 'Fintech & Crypto', color: '#5741D9' },
  { id: 'revolut', name: 'Revolut', description: 'Sleek dark interface, gradient cards, fintech precision', category: 'Fintech & Crypto', color: '#0666EB' },
  { id: 'stripe', name: 'Stripe', description: 'Signature purple gradients, weight-300 elegance', category: 'Fintech & Crypto', color: '#635BFF' },
  { id: 'wise', name: 'Wise', description: 'Bright green accent, friendly and clear', category: 'Fintech & Crypto', color: '#9FE870' },

  // E-commerce & Retail
  { id: 'airbnb', name: 'Airbnb', description: 'Warm coral accent, photography-driven, rounded UI', category: 'E-commerce & Retail', color: '#FF5A5F' },
  { id: 'meta', name: 'Meta', description: 'Photography-first, binary light/dark surfaces, Meta Blue CTAs', category: 'E-commerce & Retail', color: '#0082FB' },
  { id: 'nike', name: 'Nike', description: 'Monochrome UI, massive uppercase Futura, full-bleed photography', category: 'E-commerce & Retail', color: '#111111' },
  { id: 'shopify', name: 'Shopify', description: 'Dark-first cinematic, neon green accent, ultra-light display type', category: 'E-commerce & Retail', color: '#96BF48' },

  // Media & Consumer Tech
  { id: 'apple', name: 'Apple', description: 'Premium white space, SF Pro, cinematic imagery', category: 'Media & Consumer Tech', color: '#A2AAAD' },
  { id: 'ibm', name: 'IBM', description: 'Carbon design system, structured blue palette', category: 'Media & Consumer Tech', color: '#0F62FE' },
  { id: 'nvidia', name: 'NVIDIA', description: 'Green-black energy, technical power aesthetic', category: 'Media & Consumer Tech', color: '#76B900' },
  { id: 'pinterest', name: 'Pinterest', description: 'Red accent, masonry grid, image-first', category: 'Media & Consumer Tech', color: '#E60023' },
  { id: 'playstation', name: 'PlayStation', description: 'Three-surface channel layout, cyan hover-scale interaction', category: 'Media & Consumer Tech', color: '#003791' },
  { id: 'spacex', name: 'SpaceX', description: 'Stark black and white, full-bleed imagery, futuristic', category: 'Media & Consumer Tech', color: '#A0A0A0' },
  { id: 'spotify', name: 'Spotify', description: 'Vibrant green on dark, bold type, album-art-driven', category: 'Media & Consumer Tech', color: '#1DB954' },
  { id: 'theverge', name: 'The Verge', description: 'Acid-mint and ultraviolet accents, Manuka display type', category: 'Media & Consumer Tech', color: '#DA00FF' },
  { id: 'uber', name: 'Uber', description: 'Bold black and white, tight type, urban energy', category: 'Media & Consumer Tech', color: '#276EF1' },
  { id: 'wired', name: 'WIRED', description: 'Paper-white broadsheet density, custom serif, ink-blue links', category: 'Media & Consumer Tech', color: '#333333' },

  // Automotive
  { id: 'bmw', name: 'BMW', description: 'Dark premium surfaces, precise German engineering aesthetic', category: 'Automotive', color: '#1C69D4' },
  { id: 'bugatti', name: 'Bugatti', description: 'Cinema-black canvas, monochrome austerity, monumental display type', category: 'Automotive', color: '#1A1A1A' },
  { id: 'ferrari', name: 'Ferrari', description: 'Chiaroscuro black-white editorial, Ferrari Red with extreme sparseness', category: 'Automotive', color: '#DC0000' },
  { id: 'lamborghini', name: 'Lamborghini', description: 'True black cathedral, gold accent, LamboType custom Neo-Grotesk', category: 'Automotive', color: '#DDB321' },
  { id: 'renault', name: 'Renault', description: 'Vivid aurora gradients, NouvelR proprietary typeface, zero-radius buttons', category: 'Automotive', color: '#FFCC33' },
  { id: 'tesla', name: 'Tesla', description: 'Radical subtraction, cinematic full-viewport photography, Universal Sans', category: 'Automotive', color: '#E82127' },
];

export function getDesignsByCategory(): Record<string, DesignTemplate[]> {
  const grouped: Record<string, DesignTemplate[]> = {};
  for (const cat of DESIGN_CATEGORIES) {
    grouped[cat] = DESIGN_CATALOG.filter((d) => d.category === cat);
  }
  return grouped;
}
