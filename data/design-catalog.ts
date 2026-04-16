export interface DesignTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  colors: string[];
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
  { id: 'claude', name: 'Claude', description: 'Warm terracotta accent, clean editorial layout', category: 'AI & LLM Platforms', colors: ['#c96442', '#d97757', '#b53333', '#3898ec'] },
  { id: 'cohere', name: 'Cohere', description: 'Vibrant gradients, data-rich dashboard aesthetic', category: 'AI & LLM Platforms', colors: ['#1863dc', '#4c6ee6', '#9b60aa', '#212121'] },
  { id: 'elevenlabs', name: 'ElevenLabs', description: 'Dark cinematic UI, audio-waveform aesthetics', category: 'AI & LLM Platforms', colors: ['#4e4e4e', '#777169', '#f5f5f5', '#f5f2ef'] },
  { id: 'minimax', name: 'Minimax', description: 'Bold dark interface with neon accents', category: 'AI & LLM Platforms', colors: ['#1456f0', '#3daeff', '#ea5ec1', '#60a5fa'] },
  { id: 'mistral.ai', name: 'Mistral AI', description: 'French-engineered minimalism, purple-toned', category: 'AI & LLM Platforms', colors: ['#fa520f', '#fb6424', '#ff8105', '#ffa110'] },
  { id: 'ollama', name: 'Ollama', description: 'Terminal-first, monochrome simplicity', category: 'AI & LLM Platforms', colors: ['#262626', '#fafafa', '#e5e5e5', '#737373'] },
  { id: 'opencode.ai', name: 'OpenCode AI', description: 'Developer-centric dark theme', category: 'AI & LLM Platforms', colors: ['#007aff', '#0056b3', '#201d1d', '#9a9898'] },
  { id: 'replicate', name: 'Replicate', description: 'Clean white canvas, code-forward', category: 'AI & LLM Platforms', colors: ['#ea2804', '#dd4425', '#2b9a66', '#202020'] },
  { id: 'runwayml', name: 'RunwayML', description: 'Cinematic dark UI, media-rich layout', category: 'AI & LLM Platforms', colors: ['#030303', '#fefefe', '#e9ecf2', '#27272a'] },
  { id: 'together.ai', name: 'Together AI', description: 'Technical, blueprint-style design', category: 'AI & LLM Platforms', colors: ['#ef2cc1', '#fc4c02', '#bdbbff', '#010120'] },
  { id: 'voltagent', name: 'VoltAgent', description: 'Void-black canvas, emerald accent, terminal-native', category: 'AI & LLM Platforms', colors: ['#00d992', '#10b981', '#818cf8', '#306cce'] },
  { id: 'x.ai', name: 'xAI', description: 'Stark monochrome, futuristic minimalism', category: 'AI & LLM Platforms', colors: ['#1f2228', '#a0a0a0'] },

  // Developer Tools & IDEs
  { id: 'cursor', name: 'Cursor', description: 'Sleek dark interface, gradient accents', category: 'Developer Tools & IDEs', colors: ['#f54e00', '#c08532', '#26251e', '#f2f1ed'] },
  { id: 'expo', name: 'Expo', description: 'Dark theme, tight letter-spacing, code-centric', category: 'Developer Tools & IDEs', colors: ['#0d74ce', '#476cff', '#47c2ff', '#8145b5'] },
  { id: 'lovable', name: 'Lovable', description: 'Playful gradients, friendly dev aesthetic', category: 'Developer Tools & IDEs', colors: ['#ec4899', '#f7f4ed', '#1c1c1c', '#5f5f5d'] },
  { id: 'raycast', name: 'Raycast', description: 'Sleek dark chrome, vibrant gradient accents', category: 'Developer Tools & IDEs', colors: ['#ff6363', '#55b3ff', '#5fc992', '#ffbc33'] },
  { id: 'superhuman', name: 'Superhuman', description: 'Premium dark UI, keyboard-first, purple glow', category: 'Developer Tools & IDEs', colors: ['#714cb6', '#cbb7fb', '#1b1938', '#e9e5dd'] },
  { id: 'vercel', name: 'Vercel', description: 'Black and white precision, Geist font', category: 'Developer Tools & IDEs', colors: ['#171717', '#ff5b4f', '#de1d8d', '#0070f3'] },
  { id: 'warp', name: 'Warp', description: 'Dark IDE-like interface, block-based command UI', category: 'Developer Tools & IDEs', colors: ['#01a4ef', '#353534', '#868584', '#faf9f6'] },

  // Backend, Database & DevOps
  { id: 'clickhouse', name: 'ClickHouse', description: 'Yellow-accented, technical documentation style', category: 'Backend, Database & DevOps', colors: ['#faff69', '#166534', '#14572f', '#f4f692'] },
  { id: 'composio', name: 'Composio', description: 'Modern dark with colorful integration icons', category: 'Backend, Database & DevOps', colors: ['#0007cd', '#00ffff', '#0089ff', '#0096ff'] },
  { id: 'hashicorp', name: 'HashiCorp', description: 'Enterprise-clean, black and white', category: 'Backend, Database & DevOps', colors: ['#15181e', '#f1f2f3', '#d5d7db', '#b2b6bd'] },
  { id: 'mongodb', name: 'MongoDB', description: 'Green leaf branding, developer documentation focus', category: 'Backend, Database & DevOps', colors: ['#00ed64', '#00684a', '#006cfa', '#001e2b'] },
  { id: 'posthog', name: 'PostHog', description: 'Playful hedgehog branding, developer-friendly dark UI', category: 'Backend, Database & DevOps', colors: ['#f54e00', '#f7a501', '#b17816', '#4d4f46'] },
  { id: 'sanity', name: 'Sanity', description: 'Red accent, content-first editorial layout', category: 'Backend, Database & DevOps', colors: ['#0052ef', '#55beff', '#19d600', '#afe3ff'] },
  { id: 'sentry', name: 'Sentry', description: 'Dark dashboard, data-dense, pink-purple accent', category: 'Backend, Database & DevOps', colors: ['#6a5fc1', '#422082', '#c2ef4e', '#ffb287'] },
  { id: 'supabase', name: 'Supabase', description: 'Dark emerald theme, code-first', category: 'Backend, Database & DevOps', colors: ['#3ecf8e', '#00c573', '#171717', '#242424'] },

  // Productivity & SaaS
  { id: 'cal', name: 'Cal.com', description: 'Clean neutral UI, developer-oriented simplicity', category: 'Productivity & SaaS', colors: ['#0099ff', '#3b82f6', '#242424', '#f5f5f5'] },
  { id: 'intercom', name: 'Intercom', description: 'Friendly blue palette, conversational UI patterns', category: 'Productivity & SaaS', colors: ['#ff5600', '#65b5ff', '#0bdf50', '#faf9f6'] },
  { id: 'linear.app', name: 'Linear', description: 'Ultra-minimal, precise, purple accent', category: 'Productivity & SaaS', colors: ['#5e6ad2', '#7170ff', '#828fff', '#7a7fad'] },
  { id: 'mintlify', name: 'Mintlify', description: 'Clean, green-accented, reading-optimized', category: 'Productivity & SaaS', colors: ['#18e299', '#0fa76e', '#c37d0d', '#0d0d0d'] },
  { id: 'notion', name: 'Notion', description: 'Warm minimalism, serif headings, soft surfaces', category: 'Productivity & SaaS', colors: ['#0075de', '#213183', '#005bab', '#f6f5f4'] },
  { id: 'resend', name: 'Resend', description: 'Minimal dark theme, monospace accents', category: 'Productivity & SaaS', colors: ['#ff5900', '#ff801f', '#22ff99', '#f0f0f0'] },
  { id: 'zapier', name: 'Zapier', description: 'Warm orange, friendly illustration-driven', category: 'Productivity & SaaS', colors: ['#ff4f00', '#201515', '#fffefb', '#36342e'] },

  // Design & Creative Tools
  { id: 'airtable', name: 'Airtable', description: 'Colorful, friendly, structured data aesthetic', category: 'Design & Creative Tools', colors: ['#1b61c9', '#006400', '#254fad', '#181d26'] },
  { id: 'clay', name: 'Clay', description: 'Organic shapes, soft gradients, art-directed layout', category: 'Design & Creative Tools', colors: ['#84e7a5', '#078a52', '#3bd3fd', '#faf9f7'] },
  { id: 'figma', name: 'Figma', description: 'Vibrant multi-color, playful yet professional', category: 'Design & Creative Tools', colors: ['#f24e1e', '#a259ff', '#1abcfe', '#0acf83', '#ff7262'] },
  { id: 'framer', name: 'Framer', description: 'Bold black and blue, motion-first, design-forward', category: 'Design & Creative Tools', colors: ['#0099ff', '#0000ee', '#a6a6a6', '#090909'] },
  { id: 'miro', name: 'Miro', description: 'Bright yellow accent, infinite canvas aesthetic', category: 'Design & Creative Tools', colors: ['#5b76fe', '#2a41b6', '#ffc6c6', '#ffd02f'] },
  { id: 'webflow', name: 'Webflow', description: 'Blue-accented, polished marketing site aesthetic', category: 'Design & Creative Tools', colors: ['#146ef5', '#3b89ff', '#006acc', '#0055d4'] },

  // Fintech & Crypto
  { id: 'binance', name: 'Binance', description: 'Bold Binance Yellow on monochrome, trading-floor urgency', category: 'Fintech & Crypto', colors: ['#f0b90b', '#ffd000', '#f8d12f', '#1eaedb'] },
  { id: 'coinbase', name: 'Coinbase', description: 'Clean blue identity, trust-focused, institutional feel', category: 'Fintech & Crypto', colors: ['#0052ff', '#578bfa', '#0667d0', '#0a0b0d'] },
  { id: 'kraken', name: 'Kraken', description: 'Purple-accented dark UI, data-dense dashboards', category: 'Fintech & Crypto', colors: ['#7132f5', '#5741d8', '#5b1ecf', '#686b82'] },
  { id: 'revolut', name: 'Revolut', description: 'Sleek dark interface, gradient cards, fintech precision', category: 'Fintech & Crypto', colors: ['#494fdf', '#4f55f1', '#376cd5', '#191c1f'] },
  { id: 'stripe', name: 'Stripe', description: 'Signature purple gradients, weight-300 elegance', category: 'Fintech & Crypto', colors: ['#533afd', '#ea2261', '#061b31', '#1c1e54'] },
  { id: 'wise', name: 'Wise', description: 'Bright green accent, friendly and clear', category: 'Fintech & Crypto', colors: ['#9fe870', '#163300', '#e2f6d5', '#cdffad'] },

  // E-commerce & Retail
  { id: 'airbnb', name: 'Airbnb', description: 'Warm coral accent, photography-driven, rounded UI', category: 'E-commerce & Retail', colors: ['#ff385c', '#e00b41', '#c13515', '#460479'] },
  { id: 'meta', name: 'Meta', description: 'Photography-first, binary light/dark surfaces, Meta Blue CTAs', category: 'E-commerce & Retail', colors: ['#0064e0', '#1877f2', '#47a5fa', '#004bb9'] },
  { id: 'nike', name: 'Nike', description: 'Monochrome UI, massive uppercase Futura, full-bleed photography', category: 'E-commerce & Retail', colors: ['#111111', '#fafafa', '#e5e5e5', '#28282a'] },
  { id: 'shopify', name: 'Shopify', description: 'Dark-first cinematic, neon green accent, ultra-light display type', category: 'E-commerce & Retail', colors: ['#36f4a4', '#c1fbd4', '#02090a', '#061a1c'] },

  // Media & Consumer Tech
  { id: 'apple', name: 'Apple', description: 'Premium white space, SF Pro, cinematic imagery', category: 'Media & Consumer Tech', colors: ['#0071e3', '#2997ff', '#0066cc', '#1d1d1f'] },
  { id: 'ibm', name: 'IBM', description: 'Carbon design system, structured blue palette', category: 'Media & Consumer Tech', colors: ['#0f62fe', '#161616', '#262626', '#525252'] },
  { id: 'nvidia', name: 'NVIDIA', description: 'Green-black energy, technical power aesthetic', category: 'Media & Consumer Tech', colors: ['#76b900', '#bff230', '#df6500', '#ef9100'] },
  { id: 'pinterest', name: 'Pinterest', description: 'Red accent, masonry grid, image-first', category: 'Media & Consumer Tech', colors: ['#e60023', '#103c25', '#211922', '#62625b'] },
  { id: 'playstation', name: 'PlayStation', description: 'Three-surface channel layout, cyan hover-scale interaction', category: 'Media & Consumer Tech', colors: ['#0070cc', '#1eaedb', '#1883fd', '#0068bd'] },
  { id: 'spacex', name: 'SpaceX', description: 'Stark black and white, full-bleed imagery, futuristic', category: 'Media & Consumer Tech', colors: ['#005288', '#a0a0a0', '#f0f0fa'] },
  { id: 'spotify', name: 'Spotify', description: 'Vibrant green on dark, bold type, album-art-driven', category: 'Media & Consumer Tech', colors: ['#1ed760', '#121212', '#1f1f1f', '#b3b3b3'] },
  { id: 'theverge', name: 'The Verge', description: 'Acid-mint and ultraviolet accents, Manuka display type', category: 'Media & Consumer Tech', colors: ['#3cffd0', '#5200ff', '#309875', '#3860be'] },
  { id: 'uber', name: 'Uber', description: 'Bold black and white, tight type, urban energy', category: 'Media & Consumer Tech', colors: ['#276ef1', '#e2e2e2', '#4b4b4b', '#afafaf'] },
  { id: 'wired', name: 'WIRED', description: 'Paper-white broadsheet density, custom serif, ink-blue links', category: 'Media & Consumer Tech', colors: ['#057dbc', '#e2e8f0', '#757575', '#999999'] },

  // Automotive
  { id: 'bmw', name: 'BMW', description: 'Dark premium surfaces, precise German engineering aesthetic', category: 'Automotive', colors: ['#1c69d4', '#0653b6', '#262626', '#757575'] },
  { id: 'bugatti', name: 'Bugatti', description: 'Cinema-black canvas, monochrome austerity, monumental display type', category: 'Automotive', colors: ['#1a1a1a', '#999999', '#c0b283'] },
  { id: 'ferrari', name: 'Ferrari', description: 'Chiaroscuro black-white editorial, Ferrari Red with extreme sparseness', category: 'Automotive', colors: ['#da291c', '#b01e0a', '#fff200', '#f6e500'] },
  { id: 'lamborghini', name: 'Lamborghini', description: 'True black cathedral, gold accent, LamboType custom Neo-Grotesk', category: 'Automotive', colors: ['#ffc000', '#917300', '#ffce3e', '#29abe2'] },
  { id: 'renault', name: 'Renault', description: 'Vivid aurora gradients, NouvelR proprietary typeface, zero-radius buttons', category: 'Automotive', colors: ['#efdf00', '#f8eb4c', '#1883fd', '#d9d9d6'] },
  { id: 'tesla', name: 'Tesla', description: 'Radical subtraction, cinematic full-viewport photography, Universal Sans', category: 'Automotive', colors: ['#3e6ae1', '#171a20', '#393c41', '#5c5e62'] },
];

export function getDesignsByCategory(): Record<string, DesignTemplate[]> {
  const grouped: Record<string, DesignTemplate[]> = {};
  for (const cat of DESIGN_CATEGORIES) {
    grouped[cat] = DESIGN_CATALOG.filter((d) => d.category === cat);
  }
  return grouped;
}
