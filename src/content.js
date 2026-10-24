// ─────────────────────────────────────────────────────────────
// All portfolio content lives here. Edit this file to update the site.
// (Ported from the React portfolio: Portfolio/frontend/src)
// ─────────────────────────────────────────────────────────────

export const PROFILE = {
  name: 'Prag Dev Singh',
  role: 'Full-Stack + AI Developer',
  company: 'OneMetric',
  location: 'Gurugram, IN',
  timezone: 'IST (UTC+5:30)',
  timeZoneId: 'Asia/Kolkata',
  email: 'paragdev168@gmail.com',
  careerStart: new Date('2024-06-01'),
  socials: [
    { label: 'GitHub', value: 'PragRajput', href: 'https://github.com/PragRajput' },
    { label: 'LinkedIn', value: 'Prag Dev Singh', href: 'https://www.linkedin.com/in/prag-dev-singh' },
    { label: 'Email', value: 'paragdev168@gmail.com', href: 'mailto:paragdev168@gmail.com' },
  ],
};

/**
 * Elapsed time since `since` as a rounded label that eases toward the next
 * whole year: "N+" fresh into year N, "N.5" mid-year, "~N+1" near the anniversary.
 */
export function getExperienceLabel(since = PROFILE.careerStart) {
  const now = new Date();
  let totalMonths = (now.getFullYear() - since.getFullYear()) * 12 + (now.getMonth() - since.getMonth());
  if (now.getDate() < since.getDate()) totalMonths -= 1;
  const years = Math.floor(totalMonths / 12);
  const monthInYear = totalMonths % 12;
  if (monthInYear <= 4) return `${years}+`;
  if (monthInYear <= 9) return `${years}.5`;
  return `~${years + 1}`;
}

export const HERO_LINES = [
  'Crafting clean full-stack web experiences',
  'Building multi-agent AI pipelines with LangGraph',
  'Specialized in React, Next.js & TypeScript frontends',
  'Building scalable Node.js & Express backends',
  'Integrating APIs with 2-way CRM synchronization',
  'Prompt engineering & Claude API integrations',
  'Deploying on Azure, GCP, Firebase and Vercel',
];

export const STACK = ['React', 'Node.js', 'TypeScript', 'Python', 'LangGraph', 'Claude API', 'ElevenLabs', 'MongoDB', 'Redis'];
export const INTEGRATIONS = ['HubSpot', 'Salesforce', 'NetSuite', 'QuickBooks', 'Zoho', 'Xero', 'Cin7', 'Stripe', 'Monday.com'];

export const ABOUT = {
  heading: 'Building things that matter',
  // {exp} is replaced with the live experience label
  statement:
    "I'm a full-stack developer with {exp} years building production-grade systems: AI agents, voice AI applications, SaaS platforms, and enterprise data pipelines.",
  paragraphs: [
    'I work primarily in Python, TypeScript, and React, with deep hands-on experience in Claude, LangGraph, and ElevenLabs.',
    'I enjoy working across the full stack, from designing APIs and async pipelines to shipping clean, performant frontends. I take ownership end-to-end, from architecture decisions through deployment and monitoring.',
    "I'm drawn to hard problems at the intersection of AI and practical engineering: systems that don't just work, but scale. CRM integrations across a dozen+ platforms, high-volume data pipelines, and agents that automate real workflows are where I do my best work.",
  ],
  whatIDo: [
    'Build full-stack MERN applications with real-time capabilities',
    'Design and ship multi-agent AI pipelines using LangGraph & Claude',
    'Build voice AI agents and conversational systems with ElevenLabs',
    'Create bidirectional CRM integrations (HubSpot, Salesforce, NetSuite, Zoho & more)',
    'Architect async systems with BullMQ, Redis, and event-driven patterns',
    'Deploy and manage cloud infrastructure on Azure, GCP & Firebase',
  ],
  facts: [
    { label: 'Focus', value: 'Full-Stack + AI' },
    { label: 'Experience', value: '{exp} Years' },
    { label: 'Location', value: 'Gurugram, IN' },
    { label: 'Status', value: 'Open to work' },
  ],
};

export const EXPERIENCE = [
  {
    company: 'OneMetric',
    formerly: 'formerly Growtomation',
    role: 'Full-Stack Developer',
    period: 'Apr 2025 - Present',
    current: true,
    bullets: [
      'Building production-grade MERN features and AI agent systems',
      'Owning end-to-end development of the SuprConfig CRM deployment product',
      'Architecting multi-agent pipelines using LangGraph and Claude API',
      'Built 40+ integrations between platforms like Salesforce, HubSpot, QuickBooks, Zoho Books, NetSuite, etc.',
      'Built TrueDialog, a public HubSpot app enabling one-to-one and mass SMS campaigns for 100k+ contacts',
    ],
  },
  {
    company: 'Deftsoft Informatics',
    role: 'Full-Stack Developer',
    period: 'Jun 2024 - Apr 2025',
    current: false,
    bullets: [
      'Delivered full-stack MERN applications with third-party API integrations',
      'Built an Educational Learning Management Platform (LMS)',
      'Built Eu Pro Scene, a gaming tournament platform with PayPal wallet top-ups, credit-based tournament entry, and withdrawals',
      'Implemented Azure-hosted infrastructure: App Service, Functions, SignalR, Service Bus',
      'Regular production deployments with CI/CD pipelines',
    ],
  },
];

// Each stage pairs with a particle shape in the pinned "Skills" section:
// ghost → neural network → </> → database → integration globe → cloud
export const SKILL_STAGES = [
  { title: 'Technologies I <em>work with</em>', note: 'Scroll to watch the ghost become the stack', chips: [] },
  {
    title: 'AI &amp; <em>Agents</em>',
    note: 'Multi-agent pipelines, voice AI and LLM tooling',
    chips: ['Claude API', 'LangGraph', 'LangChain', 'OpenRouter', 'ElevenLabs', 'Prompt Engineering', 'Multi-Agent Pipelines', 'RAG'],
    featured: true,
  },
  {
    title: 'Languages &amp; <em>Frameworks</em>',
    note: 'Languages · Frameworks & Libraries',
    chips: ['JavaScript', 'TypeScript', 'Python', 'C++', 'React', 'Next.js', 'Node.js', 'Express', 'FastAPI', 'Vite', 'Tailwind CSS', 'WebSockets', 'WebRTC', 'Zustand', 'shadcn/ui'],
  },
  {
    title: 'Databases &amp; <em>Queues</em>',
    note: 'Storage, ORMs and async processing',
    chips: ['MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Supabase', 'Mongoose', 'SQLAlchemy', 'BullMQ', 'Cosmos DB'],
  },
  {
    title: 'Integration &amp; <em>APIs</em>',
    note: '2-way sync across CRMs, ERPs and payments',
    chips: ['2-way CRM Syncing', 'REST APIs', 'Webhooks', 'HubSpot API', 'Zoho API', 'Salesforce API', 'NetSuite API', 'QuickBooks API', 'Xero API', 'Monday.com API', 'Microsoft Dynamics 365 API', 'Stripe API', 'PayPal API', 'Zapier', 'n8n'],
  },
  {
    title: 'Cloud &amp; <em>DevOps</em>',
    note: 'Cloud & Infrastructure · DevOps & Tooling',
    chips: ['Azure App Service', 'Azure Functions', 'GCP Cloud Run', 'GCP Pub/Sub', 'Firebase Functions', 'Vertex AI', 'Render', 'Neon', 'Git', 'GitHub', 'Docker', 'CI/CD', 'Vercel', 'Netlify', 'Heroku', 'Postman'],
  },
];

// palette: [deep, mid, glow, highlight] for the generative card art
export const PROJECTS = [
  {
    id: '11',
    title: 'LexigoAI: Vocabulary Learning App',
    description: 'AI-powered vocabulary and language learning app. Surfaces 3 fresh AI-generated words daily, lets you search or generate any word with definitions, synonyms, antonyms, and translations. Quiz yourself across 4 modes (flashcard, multiple choice, fill-in-blank, match) plus a Random AI Quiz. Per-account word and sentence collections with full attempt history.',
    technologies: ['Next.js 16', 'React 19', 'Supabase', 'OpenRouter', 'Zustand', 'Tailwind CSS v4', 'shadcn/ui', 'Netlify'],
    demoUrl: 'https://lexigoai.netlify.app/',
    personal: true,
    featured: true,
    palette: ['#03140f', '#0f766e', '#5eead4', '#f0fdfa'],
  },
  {
    id: 'p21',
    title: 'Tracely: Web Analytics with AI Insights',
    description: 'Self-hosted web analytics platform with AI insights. A single script tag tracks sessions, page and section views, clicks, scroll depth, form submits/abandons, logins and JS errors on any website, plus rage-click and dead-click detection for UX friction. Real-time dashboard over Socket.io with Recharts visualizations, and Claude generates written insights from the collected data. Dependency-free vanilla JS tracker, JWT-authenticated multi-project dashboard. Deployed on EC2 (API), S3 and CloudFront.',
    technologies: ['Node.js', 'Express', 'MongoDB', 'Socket.io', 'React', 'Vite', 'Recharts', 'Claude API', 'JWT', 'AWS EC2', 'S3', 'CloudFront'],
    demoUrl: 'https://d1u3ng3n6cixi8.cloudfront.net/',
    personal: true,
    featured: true,
    palette: ['#08121c', '#0369a1', '#7dd3fc', '#f0f9ff'],
  },
  {
    id: 'p20',
    title: 'Memento: Browser Video Editor',
    description: 'Studio-grade video editor that runs 100% client-side in the browser; media never leaves your machine. Multi-track timeline (video layers, audio lanes, overlays, titles) with frame-accurate trimming and splitting, 13 transitions, keyframe animation, color grading presets, Web Audio effects, lower thirds and visual FX overlays. Auto-saves projects to IndexedDB with full undo/redo, and exports hardware-accelerated MP4 (H.264, HEVC, VP9, AV1) via WebCodecs.',
    technologies: ['React 19', 'TypeScript', 'Vite', 'WebCodecs', 'Mediabunny', 'Web Audio API', 'IndexedDB', 'GitHub Pages'],
    demoUrl: 'https://pragrajput.github.io/Memento-Pro-Studio/',
    personal: true,
    featured: true,
    palette: ['#0c0a14', '#6d28d9', '#c4b5fd', '#faf5ff'],
  },
  {
    id: '1',
    title: 'Synker: Integration Automation Platform',
    description: 'Webhook-driven workflow engine for real-time CRM/ERP sync across 13 connectors, including HubSpot, Salesforce, NetSuite, QuickBooks, Xero, Zoho, Close CRM, and Cin7. Workflows are defined as typed step graphs (get_record, lookup, branch, iterate, update_record) scoped per connection, preventing O(n) webhook fan-out. Ships a conversational AI builder (Claude) backed by a provider knowledge base encoding connector field paths, upsert patterns, and failure modes. Includes end-to-end bidirectional HubSpot ↔ QuickBooks sync with QB invoice write-back and loop-guard branch patterns. Custom HubSpot property detection surfaces missing fields before they silently fail at runtime. BullMQ + Redis for async processing with retry; OAuth 2.0 token refresh handled transparently per connector.',
    technologies: ['Node.js', 'TypeScript', 'Python', 'FastAPI', 'LangGraph', 'Claude API', 'Tool Calling', 'Next.js', 'BullMQ', 'Redis', 'MongoDB', 'Express', 'OAuth 2.0', 'Webhooks'],
    demoUrl: 'https://synker-landing-gq88.vercel.app/',
    personal: true,
    featured: true,
    palette: ['#04120a', '#15803d', '#86efac', '#f0fdf4'],
  },
  {
    id: '2',
    title: 'HubMetrics: CRM Audit Agent',
    description: 'AI-powered multi-agent audit platform (orchestrator → narrator pipeline) running 25+ health checks across HubSpot Sales, Marketing, and Service Hub. Uses Claude AI to generate prioritized, severity-labeled reports with PDF export.',
    technologies: ['Claude API', 'LangGraph', 'Tool Calling', 'Node.js', 'TypeScript', 'Express', 'MongoDB'],
    personal: true,
    featured: true,
    palette: ['#0d0a1c', '#5b21b6', '#a78bfa', '#f5f3ff'],
  },
  {
    id: 'p15',
    title: 'Discovery Agent',
    description: "Voice AI agent that conducts pre-discovery stakeholder interviews ahead of an agency's real discovery call. Admins create client accounts and invite stakeholders via personal links; each has a 5-10 minute live voice conversation (ElevenLabs Conversational AI, browser-to-ElevenLabs WebRTC) driven by a 24-persona matrix (8 functions × 3 company sizes) that tailors the questions asked. Claude summarizes each transcript into a per-stakeholder write-up and synthesizes an account-level report, grounded throughout in admin-supplied context notes and uploaded documents. Shipped across 50+ client accounts, generating 100+ account-level reports and cutting discovery turnaround from 2-3 days down to a few hours.",
    technologies: ['FastAPI', 'SQLAlchemy', 'PostgreSQL', 'React', 'Vite', 'Tailwind CSS', 'ElevenLabs Conversational AI', 'Claude API', 'WebRTC'],
    company: 'OneMetric',
    featured: true,
    palette: ['#060b1d', '#1d4ed8', '#60a5fa', '#eff6ff'],
  },
  {
    id: 'p16',
    title: 'EY Customer Training Platform',
    description: 'AI-driven soft-skills training platform built for EY, where consultants practice high-pressure client conversations against a live AI-played persona (ElevenLabs voice call) before facing quiz-based reinforcement. Claude grades each call transcript against a 5-dimension rubric (active listening, empathy, structured communication, managing pressure, ownership), returning dimension scores, a graded headline, and coaching notes tied to specific named skill gaps. Combined call + quiz scorecards feed a learner dashboard with score trends and cohort ranking.',
    technologies: ['FastAPI', 'SQLModel', 'React', 'Vite', 'Tailwind CSS', 'ElevenLabs Conversational AI', 'Claude API'],
    company: 'OneMetric',
    featured: true,
    palette: ['#120e03', '#a16207', '#fde047', '#fefce8'],
  },
  {
    id: '4',
    title: 'SuprConfig: HubSpot Deployment Platform',
    description: 'Enterprise SaaS product by SuprDense enabling one-click HubSpot deployments and asset management. Built comprehensive platform for importing and deploying HubSpot assets (workflows, templates, lists, forms) across multiple portals. Features include pre-built module library, sandbox-to-production transfers, and automated deployment system delivering 5x faster HubSpot implementations. Used across 100+ portals with 500+ deployments and 1,000+ assets managed; adds rollback, deployment history, property verification, AI-powered bulk property creation, and asynchronous deployments.',
    image: '/projects/supr-config.svg',
    technologies: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'Firebase Functions', 'Firebase Hosting', 'Firebase Database', 'Firebase Storage', 'Vertex AI', 'Cloud Tasks', 'Stripe', 'HubSpot API'],
    demoUrl: 'https://www.suprdense.com/config',
    company: 'OneMetric',
    featured: true,
    palette: ['#140904', '#c2410c', '#fb923c', '#fff7ed'],
  },
  {
    id: '5',
    title: 'TrueDialog SMS Platform',
    description: 'Enterprise SMS messaging platform for a US-based client, serving 40+ users and processing 10M+ messages. Supports one-to-one and mass SMS campaigns, media messaging, templated workflow automation, and opt-in/opt-out compliance management, with batch processing for large-scale sends.',
    image: '/projects/truedialog.png',
    technologies: ['React', 'Node.js', 'TypeScript', 'SMS API', 'Azure Functions', 'Azure App Service', 'Cosmos DB', 'SignalR', 'Azure Key Vault', 'Service Bus'],
    demoUrl: 'https://www.truedialog.com/',
    company: 'OneMetric',
    featured: true,
    palette: ['#03121a', '#0e7490', '#22d3ee', '#ecfeff'],
  },
  {
    id: '3',
    title: 'SuprConfig Chrome Extension',
    description: 'Chrome extension built to bypass HubSpot API limitations, enabling support for reports and dashboards within the SuprConfig deployment ecosystem. Extends the core platform capabilities beyond what the HubSpot API officially exposes.',
    technologies: ['Chrome Extension', 'JavaScript', 'TypeScript', 'HubSpot API', 'React'],
    company: 'OneMetric',
  },
  {
    id: 'p6',
    title: 'Cin7 & HubSpot Integration',
    description: 'Built bi-directional data synchronization between Cin7 inventory management and HubSpot CRM. Automated order creation, invoice calculations, and real-time updates using webhooks. Seamless cross-platform workflow automation.',
    technologies: ['Node.js', 'HubSpot API', 'Cin7 API', 'Webhooks', 'Express', 'Firebase Functions'],
    demoUrl: 'https://circleg.world/home.html',
    company: 'OneMetric',
  },
  {
    id: '9',
    title: 'DailyLog: Work Tracking App',
    description: 'Personal work tracking app for developers to log daily tasks, track time per project, and browse history via a calendar view. Features AI-powered standup summaries via Gemini API, Google OAuth sign-in, and profile customization with Cloudinary avatar uploads.',
    technologies: ['Next.js 14', 'TypeScript', 'Express', 'MongoDB', 'Google OAuth', 'Gemini API', 'Cloudinary', 'Tailwind CSS', 'Framer Motion'],
    demoUrl: 'https://daily-log-ruby-omega.vercel.app',
    personal: true,
  },
  {
    id: '10',
    title: 'DailyPing: VS Code Dev Tracker',
    description: 'VS Code extension that silently tracks coding activity in the background and generates AI-powered standup summaries with zero interruption. Local dashboard shows hourly productivity charts and per-project language breakdown. Fully private: no cloud sync, no telemetry, all data stays on your machine.',
    technologies: ['VS Code API', 'TypeScript', 'Express', 'React', 'Vite', 'Redux Toolkit', 'Recharts', 'Gemini API', 'esbuild'],
    personal: true,
  },
  {
    id: 'p19',
    title: 'Rudra Shodh Foundation: Research Publication Platform',
    description: 'Mobile-first static website for an academic research foundation, built with Astro and Tailwind CSS v4 for near-zero JavaScript and fast, SEO-friendly pages. Publications, events/programmes, and research centres are all managed as Markdown content collections validated against typed frontmatter schemas at build time, so publishing a new entry needs no code changes. Includes membership and contact forms via Web3Forms, a donate section with UPI QR code, and dedicated book detail pages.',
    technologies: ['Astro', 'Tailwind CSS v4', 'TypeScript', 'Markdown Content Collections', 'Web3Forms', 'Static Site Generation'],
    demoUrl: 'https://rudrashodhfoundation.com',
    personal: true,
  },
  {
    id: 'p7',
    title: 'Zoho & HubSpot Multi-Org Integration',
    description: 'Developed scalable integration supporting multiple Zoho organizations with HubSpot. Implemented 2-way data synchronization, multi-tenant architecture, and automated data mapping across different organizational structures.',
    technologies: ['TypeScript', 'Python', 'FastAPI', 'Zoho API', 'HubSpot API', 'Webhooks', 'Heroku'],
    company: 'OneMetric',
  },
  {
    id: 'p8',
    title: 'Educational Learning Management Platform',
    description: 'Comprehensive 4-tier learning platform with hierarchical access: Super Admin creates interactive lessons with drag-and-drop UI; School Admin manages teachers and students; Teachers customize lessons and mark attendance; Students access assignments and submit feedback with real-time dashboard updates.',
    technologies: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'Express', 'Role-Based Access', 'Real-time Dashboard'],
    company: 'Deftsoft',
  },
  {
    id: 'p11',
    title: 'SFTP × HubSpot Data Migration',
    description: 'Enterprise-scale data processing system using Python FastAPI handling 200,000 to 300,000 daily records and 1M+ operations daily. Automated GCP Cloud Run cron jobs fetch files from SFTP, upload to GCP Cloud Storage, perform data validation, cleansing, and de-duplication, then migrate to HubSpot via batch processing with complex association handling.',
    technologies: ['Python', 'FastAPI', 'GCP Cloud Storage', 'GCP Cloud Run', 'SFTP', 'HubSpot API', 'Cron Jobs', 'Batch Processing'],
    company: 'OneMetric',
  },
  {
    id: 'p17',
    title: 'HubSpot ↔ Salesforce Sync',
    description: 'Bidirectional CRM sync between HubSpot and Salesforce for leads, deals, and their related records. Salesforce exposes no outbound webhooks, so the HubSpot-to-Salesforce direction runs on a cursor-based poller with a per-object watermark, while Salesforce-to-HubSpot changes are captured instantly via triggers and pushed through a staged outbox batch. Leads created or qualified in Salesforce are pushed to HubSpot, and deals created on either platform are mirrored to the other, matched and deduplicated using dedicated internal-ID properties stored on both records so re-running a sync can never create a duplicate. Custom field mappings and HubSpot associations keep Deal, Company, Contact, and Line Item relationships in sync alongside the field data, with a nightly reconciliation job self-healing any drift.',
    technologies: ['Salesforce Apex', 'Batch Apex', 'HubSpot API', 'Node.js', 'Python', 'REST APIs', 'Webhooks', 'Custom Metadata Types'],
    company: 'OneMetric',
  },
  {
    id: 'p18',
    title: 'HubSpot ↔ NetSuite Integration',
    description: 'Node/Express service syncing HubSpot and NetSuite across four flows: bidirectional contact sync (HubSpot webhook + NetSuite poller), activity logging (notes, calls, emails, tasks, meetings, WhatsApp) pushed from HubSpot into NetSuite, reservation-to-deal creation, and invoice-driven deal-stage updates. A 60-second poller watches NetSuite via SuiteQL for new reservations and customer receipts, claiming an existing HubSpot deal by matching contact and property rather than guessing, then stamping it so later polls cannot double-claim it. Deployed on Firebase as paired HTTPS and scheduled functions, with Firestore-backed poller state so records created during downtime are still picked up after a redeploy.',
    technologies: ['Node.js', 'Express', 'NetSuite REST API', 'OAuth 1.0 (TBA)', 'HubSpot API', 'SuiteScript', 'Firebase Functions', 'Firestore', 'Webhooks'],
    company: 'OneMetric',
  },
  {
    id: 'p12',
    title: 'BlendsBooking Integration',
    description: 'Comprehensive booking integration system syncing reservation data with HubSpot across contacts, orders, products, and cancellations. Real-time booking management with automated workflow triggers.',
    technologies: ['React', 'Node.js', 'HubSpot API', 'Booking System', 'Nordhost'],
    company: 'OneMetric',
  },
  {
    id: 'p13',
    title: 'Telegram × HubSpot CRM',
    description: 'Embedded Telegram inside HubSpot CRM for seamless team communication. Automatically generates deal-based Telegram groups to streamline collaboration across sales and business development.',
    technologies: ['Telegram API', 'HubSpot API', 'Node.js', 'TypeScript', 'Automated Workflows'],
    company: 'OneMetric',
  },
  {
    id: 'p14',
    title: 'Eu Pro Scene: Gaming Tournament Platform',
    description: 'Gaming tournament platform where tournaments are organised online and played out at physical venues, with prize winnings reflected directly in player accounts. Users top up real cash via PayPal to buy platform credits, spend those credits to enter any game tournament, and can withdraw their balance back out, backed by a full wallet system handling cash-to-credit conversion, tournament entry, and payouts.',
    technologies: ['React', 'Node.js', 'Express', 'MongoDB', 'PayPal API', 'Wallet System'],
    demoUrl: 'https://euproscene.com/',
    company: 'Deftsoft',
  },
];

export const STATS = [
  { value: '{exp}', label: 'Years building production systems' },
  { value: '30+', label: 'Projects shipped' },
  { value: '10+', label: 'AI agents in production' },
  { value: '40+', label: 'Integrations across CRMs & ERPs' },
  { value: '10M+', label: 'SMS messages processed via TrueDialog' },
];

export const CONTACT = {
  heading: "Let's work together",
  intro: "Have a project in mind, need an integration built, or want to discuss an opportunity? I'd love to hear from you.",
  formIntro: "Fill out the form and I'll get back to you within 24 hours: no fluff, just a straight conversation about what you need built.",
  facts: [
    { label: 'Response time', value: 'Within 24 hours' },
    { label: 'Availability', value: 'Open to freelance & full-time' },
    { label: 'Timezone', value: 'IST (UTC+5:30)' },
  ],
  availability: 'Available for freelance & full-time roles',
};
