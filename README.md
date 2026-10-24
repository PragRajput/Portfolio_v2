# Prag Dev Singh — 3D Three.js Portfolio

An animated, Three.js interactive portfolio for **Prag Dev Singh** (Full-Stack + AI Developer).

Combines the cinematic WebGL engine, particle morphing, smooth scroll, and shader effects of the Three.js project with all real content, projects, experience, and contact forms from the React portfolio (`Portfolio/frontend`).

---

## Quick Start

```bash
npm install
npm run dev      # Local dev server -> http://localhost:5173
npm run build    # Production build -> dist/
npm run preview  # Preview production build locally
npm run deploy   # Builds & deploys directly to AWS S3 + CloudFront
```

---

## Production Deployment (AWS)

- **Live URL**: [https://d5mc1bhs7lp3i.cloudfront.net](https://d5mc1bhs7lp3i.cloudfront.net)
- **S3 Bucket**: `prag-portfolio-453393997723` (`ap-southeast-2`)
- **CloudFront Distribution ID**: `E1GA0LZUSAZA5U`
- **Origin Access Control (OAC)**: `E386JKWRSGCNPU` (`prag-portfolio-oac`)

---

## Content & Features

| Section | Experience & Visual Effect |
|---|---|
| **Preloader** | Monospace progress counter, animated ghost silhouette, smooth curtain lift |
| **Hero** | Interactive ghost character following cursor with click "boo" spin; typewriter cycling through developer specialties; live IST clock and "Open to work" badge |
| **Marquee** | Dual-track velocity-reactive ticker showcasing core stack and 40+ CRM/ERP integrations |
| **About** | Text lighting up word-by-word as you read; portrait photo with WebGL duotone shader and ripple hover; interactive code card (`dev.ts`) |
| **Experience** | Chronological timeline of roles at OneMetric (formerly Growtomation) and Deftsoft with expandable detail bullets and animated status markers |
| **Skills (Particle Morph)** | Pinned 24k GPU particle swarm that morphs through 6 developer stages as you scroll:<br>1. Ghost<br>2. Neural Network (AI & Agents)<br>3. Code (`</>`) (Languages & Frameworks)<br>4. Database Cylinders (Databases & Queues)<br>5. Integration Globe (2-Way CRM Syncing & APIs)<br>6. Cloud & DevOps Swarm |
| **Projects** | Horizontal shader cards syncing DOM with WebGL (bending with scroll velocity and rippling on pointer); full searchable/filterable catalog of 20 projects with category tabs (All, Personal, Work); interactive project details modal |
| **Stats** | Animated milestone counters (Years experience, projects shipped, AI agents in production, integrations, SMS processed) |
| **Contact** | Ghost re-materializes in the contact section and waves; interactive contact modal connected to `POST ${VITE_API_URL}/api/send-email` (falls back gracefully to `mailto:`) |

---

## Configuration & Environment Variables

Create `.env` in the project root:

```bash
# Express server API endpoint (default for local server in Portfolio/server is port 5001)
VITE_API_URL=http://localhost:5001
```

> If `VITE_API_URL` is omitted, the contact form opens the visitor's mail client (`mailto:`) automatically with prepopulated subject and message body.

---

## Project Structure

```
Portfolio_Threejs/
├── index.html              # Clean semantic HTML markup and accessibility scaffolding
├── src/
│   ├── main.js             # Boot sequence, scroll triggers, Lenis setup, UI bindings
│   ├── content.js          # All portfolio data (projects, skills, bio, links, stats)
│   ├── render.js           # Dynamic DOM renderer
│   ├── style.css           # Modern typographic & responsive layout
│   ├── ui/                 # Cursor wisps, magnetic buttons, modal, marquee, contact form
│   └── webgl/
│       ├── Experience.js   # Master Three.js scene, post-processing composer, quality scaling
│       ├── Ghost.js        # The 3D ghost character (flowing ectoplasm & fresnel glow)
│       ├── MorphParticles.js # 24k particle swarm system
│       ├── shapes.js       # Point-cloud mathematical shape generators
│       └── GalleryPlanes.js # DOM-glued shader planes for projects & photo
└── public/
    ├── profile.jpg         # Developer photo
    └── projects/           # Project preview assets (SuprConfig, TrueDialog, etc.)
```

