import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import './style.css';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

import Experience from './webgl/Experience.js';
import { split } from './ui/split.js';
import Cursor from './ui/cursor.js';
import { initMagnetic } from './ui/magnetic.js';
import Marquee from './ui/marquee.js';
import typewriter from './ui/typewriter.js';
import Modal from './ui/modal.js';
import Menu from './ui/menu.js';
import { contactFormHTML, mountContactForm } from './ui/contact.js';
import { HERO_LINES, PROFILE, getExperienceLabel } from './content.js';
import * as R from './render.js';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const isTouch = matchMedia('(hover: none)').matches;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const EXP = getExperienceLabel();

// Shared state between DOM, scroll and WebGL
const state = {
  mouse: { x: 0, y: 0, px: innerWidth / 2, py: innerHeight / 2, active: false, overUI: false },
  velocity: 0,
  scroll: 0,
  intro: 0,
  greet: false,
  ctaHover: false,
  ghostHover: false,
  progress: { toPeek: 0, toMorph: 0, morph: 0, morphOut: 0, cta: 0 },
};

// ─── Content ─────────────────────────────────────────────
R.renderMarquees($('.js-marquee-stack'), $('.js-marquee-int'));
R.renderAbout($('.about'), EXP);
R.renderExperience($('.js-experience'));
R.renderStages($('.js-stages'));

let currentFilter = 'all';
let showAllProjects = false;
const gridEl = $('.js-projects-grid');
const toggleBtn = $('.js-projects-toggle');
const toggleLabel = $('.js-toggle-label');

const updateProjectsView = () => {
  const counts = R.renderProjects(gridEl, currentFilter, showAllProjects);
  $('.js-n-all').textContent = counts.all;
  $('.js-n-personal').textContent = counts.personal;
  $('.js-n-work').textContent = counts.work;

  if (counts.filteredTotal <= 6) {
    toggleBtn.style.display = 'none';
  } else {
    toggleBtn.style.display = '';
    toggleLabel.textContent = showAllProjects
      ? 'Show less ↑'
      : `Show ${counts.filteredTotal - 6} more projects ↓`;
  }
  bindProjectCards();
};

const counts = R.renderProjects(gridEl, currentFilter, showAllProjects);
$('.js-n-all').textContent = counts.all;
$('.js-n-personal').textContent = counts.personal;
$('.js-n-work').textContent = counts.work;
if (counts.filteredTotal <= 6) toggleBtn.style.display = 'none';
else toggleLabel.textContent = `Show ${counts.filteredTotal - 6} more projects ↓`;

R.renderStats($('.js-stats'), EXP);
R.renderContact($('.js-contact-links'), $('.js-contact-facts'));
$$('.js-exp').forEach((el) => (el.textContent = EXP));
$('.js-year').textContent = new Date().getFullYear();
const statement = $('.js-statement');
statement.innerHTML = statement.textContent.replace(/(AI agents|voice AI applications|SaaS platforms|enterprise data pipelines)/g, '<em>$1</em>');

// ─── Smooth scroll ───────────────────────────────────────
const lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.95, touchMultiplier: 1.3 });
lenis.stop();
gsap.ticker.lagSmoothing(0);
const nav = $('.nav');
let menu;
lenis.on('scroll', ({ direction, scroll }) => {
  ScrollTrigger.update();
  nav.classList.toggle('is-hidden', direction === 1 && scroll > 160 && !menu?.isOpen);
  nav.classList.toggle('is-scrolled', scroll > 40);
});

const scrollToTarget = (t) =>
  lenis.scrollTo(t === '0' || t === 0 ? 0 : t, { duration: 2, immediate: reduceMotion, easing: (x) => 1 - Math.pow(1 - x, 4) });
$$('[data-scroll-to]')
  .filter((a) => !a.classList.contains('menu__link'))
  .forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      scrollToTarget(a.dataset.scrollTo);
    }),
  );

// ─── Pointer ─────────────────────────────────────────────
const UI = 'a, button, input, textarea, .pcard, .photo, .modal, .menu';
const setPointer = (e) => {
  const m = state.mouse;
  m.px = e.clientX;
  m.py = e.clientY;
  m.x = (e.clientX / innerWidth) * 2 - 1;
  m.y = -(e.clientY / innerHeight) * 2 + 1;
  m.active = e.pointerType === 'mouse';
};
addEventListener('pointermove', setPointer);
addEventListener('pointerdown', setPointer);
document.addEventListener('mouseleave', () => (state.mouse.active = false));
document.addEventListener('pointerover', (e) => (state.mouse.overUI = !!e.target.closest(UI)));

// ─── Text splitting ──────────────────────────────────────
// Char-split headings keep an aria-label and hide the fragments from screen readers.
const splitHeading = (el, opts) => {
  el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
  const res = split(el, opts);
  $$('.w', el).forEach((w) => w.setAttribute('aria-hidden', 'true'));
  return res;
};
const heroChars = splitHeading($('.hero__title'), { chars: true }).chars;
const statementWords = split(statement).words;
const stages = $$('.stage');
stages.forEach((s, idx) => {
  if (idx > 0) s.style.setProperty('--out', '115%');
  split($('.stage__title', s)).words.forEach((w, i) => w.style.setProperty('--i', i));
});
const contactChars = splitHeading($('.contact__title'), { chars: true }).chars;
const footerChars = split($('.footer__word .fit'), { chars: true }).chars;
const reveals = $$('[data-reveal]').map((el) => ({ el, words: (el.tagName.startsWith('H') ? splitHeading(el) : split(el)).words }));

gsap.set(heroChars, { yPercent: 115, rotate: 6 });
gsap.set('.fade-in', { autoAlpha: 0, y: 24 });
gsap.set(nav, { yPercent: -120, autoAlpha: 0 });

// ─── UI ──────────────────────────────────────────────────
const cursor = new Cursor();
initMagnetic();
const marquees = $$('.marquee__row').map((r) => new Marquee(r));
const typer = typewriter($('.js-type'), HERO_LINES);
if (isTouch) $('.hero__hint span').textContent = 'psst… tap the ghost';

const modal = new Modal($('.modal'), {
  onOpen: () => lenis.stop(),
  onClose: () => lenis.start(),
});
menu = new Menu({
  onOpen: () => lenis.stop(),
  onClose: () => lenis.start(),
  onNavigate: (t) => scrollToTarget(t),
});

const openProject = (id) => {
  const p = R.findProject(id);
  if (p) modal.open(R.projectModalHTML(p), { variant: 'project' });
};

function bindProjectCards() {
  $$('.pcard').forEach((el) => {
    el.addEventListener('click', () => openProject(el.dataset.project));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openProject(el.dataset.project);
      }
    });
  });
}
bindProjectCards();

const openContact = () =>
  modal.open(contactFormHTML(), { variant: 'form', onMount: (body) => mountContactForm(body.querySelector('.cf')) });
$$('.js-open-contact').forEach((b) => b.addEventListener('click', openContact));
const contactBtn = $('.contact__button');
contactBtn.addEventListener('pointerenter', () => (state.ctaHover = true));
contactBtn.addEventListener('pointerleave', () => (state.ctaHover = false));

const tabs = $$('.tabs button');
const tabPill = $('.tabs__pill');
const moveTabPill = (btn) => {
  if (!btn || !tabPill) return;
  tabPill.style.width = `${btn.offsetWidth}px`;
  tabPill.style.transform = `translateX(${btn.offsetLeft - 4}px)`;
};

tabs.forEach((btn) =>
  btn.addEventListener('click', () => {
    const type = btn.dataset.tab;
    currentFilter = type;
    showAllProjects = false;
    tabs.forEach((b) => {
      b.classList.toggle('is-active', b === btn);
      b.setAttribute('aria-selected', String(b === btn));
    });
    moveTabPill(btn);
    gsap.to('.pcard', {
      autoAlpha: 0,
      y: 10,
      duration: 0.18,
      stagger: 0.015,
      onComplete: () => {
        updateProjectsView();
        gsap.fromTo('.pcard', { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.035, ease: 'expo.out' });
        ScrollTrigger.refresh();
      },
    });
  }),
);

toggleBtn?.addEventListener('click', () => {
  showAllProjects = !showAllProjects;
  updateProjectsView();
  gsap.fromTo('.pcard', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.03, ease: 'expo.out' });
  ScrollTrigger.refresh();
});

// clocks (Gurugram time)
const ist = $('.js-ist');
const istFull = $('.js-ist-full');
const fmt = (opts) => new Intl.DateTimeFormat('en-GB', { timeZone: PROFILE.timeZoneId, hour12: false, ...opts });
const fmtShort = fmt({ hour: '2-digit', minute: '2-digit' });
const fmtFull = fmt({ hour: '2-digit', minute: '2-digit', second: '2-digit' });
const tick = () => {
  const now = new Date();
  ist.textContent = fmtShort.format(now);
  istFull.textContent = fmtFull.format(now);
};
tick();
setInterval(tick, 1000);

// ─── Preloader + boot ────────────────────────────────────
const loaderNum = $('.loader__num');
const loaderBar = $('.loader__bar span');
const count = { v: 0 };
const renderCount = () => {
  loaderNum.textContent = Math.round(count.v);
  loaderBar.style.transform = `scaleX(${count.v / 100})`;
  renderTerm(count.v);
};

// Terminal in the middle of the loader, driven by the count (not timers) so it stays in
// sync while boot blocks the main thread: each command types from `at` to `at + dur`.
const TERM_STEPS = [
  { at: 0, dur: 16, cmd: 'git pull origin main', out: 'Already up to date.' },
  { at: 20, dur: 8, cmd: 'npm ci', out: 'added 412 packages in 1.8s' },
  { at: 36, dur: 12, cmd: 'npm test', out: '✓ 86 tests passed' },
  { at: 56, dur: 14, cmd: 'npm run build', out: '✓ 128 modules transformed' },
  { at: 84, dur: 10, cmd: 'npm run deploy', out: '✓ deployed to production' },
];
const termBody = $('.term__body');
let termKey = '';
function renderTerm(v) {
  const lines = [];
  let typing = false;
  for (const { at, dur, cmd, out } of TERM_STEPS) {
    if (v < at) break;
    lines.push(['term__cmd', cmd.slice(0, Math.floor(((v - at) / dur) * cmd.length))]);
    if (v < at + dur + 2) {
      typing = true;
      break;
    }
    lines.push([out.startsWith('✓') ? 'term__res term__res--ok' : 'term__res', out]);
  }
  if (!typing) lines.push(['term__cmd', '']);
  const key = lines.map((l) => l[1]).join('\n');
  if (key === termKey) return;
  termKey = key;
  termBody.replaceChildren(
    ...lines.slice(-7).map(([cls, text], i, arr) => {
      const el = Object.assign(document.createElement('div'), { className: `term__line ${cls}`, textContent: text });
      if (i === arr.length - 1) el.append(Object.assign(document.createElement('span'), { className: 'term__caret' }));
      return el;
    }),
  );
}
renderTerm(0);

const words = ['Compiling components', 'Spinning up agents', 'Syncing 40+ integrations', 'Shipping to production'];
let wi = 0;
const wordEl = $('.loader__word span');
const wordTimer = setInterval(() => {
  wi = (wi + 1) % words.length;
  gsap.to(wordEl, {
    yPercent: -100,
    duration: 0.35,
    ease: 'power2.in',
    onComplete: () => {
      wordEl.textContent = words[wi];
      gsap.fromTo(wordEl, { yPercent: 100 }, { yPercent: 0, duration: 0.45, ease: 'power3.out' });
    },
  });
}, 900);

const triggers = {};
let exp = null;

async function boot() {
  const counting = gsap.to(count, { v: 82, duration: reduceMotion ? 0.6 : 2.1, ease: 'power2.inOut', onUpdate: renderCount });

  await Promise.race([
    Promise.all([document.fonts.load('800 100px "Inter Variable"'), document.fonts.load('800 100px "JetBrains Mono Variable"'), document.fonts.ready]),
    wait(3000),
  ]);

  try {
    exp = new Experience($('.webgl'), state, {
      glElements: $$('[data-gl]'),
      codeFont: '800 300px "JetBrains Mono Variable", ui-monospace, monospace',
      contactAnchor: $('.contact__ghost'),
    });
    await exp.warmup();
    document.documentElement.classList.add('has-webgl');
  } catch (err) {
    console.error('WebGL unavailable', err);
    exp = null;
    document.documentElement.classList.add('no-webgl');
  }

  marquees.forEach((m) => m.measure());
  fitTitles();
  addEventListener('resize', () => {
    fitTitles();
    marquees.forEach((m) => m.measure());
    moveTabPill($('.tabs button.is-active'));
  });
  setupScroll();
  moveTabPill($('.tabs button.is-active'));

  // One RAF for everything: scroll → WebGL (layout reads) → DOM writes
  gsap.ticker.add((time, deltaMs) => {
    const dt = deltaMs / 1000;
    lenis.raf(time * 1000);
    state.velocity = lenis.velocity;
    state.scroll = lenis.scroll;
    for (const k in triggers) state.progress[k] = triggers[k].progress;
    if (exp) {
      exp.update(time, dt);
      cursor.setGhost(state.ghostHover);
      updateStage(exp.morphIndex);
    } else {
      updateStage(Math.min(stages.length - 1, Math.round(state.progress.morph * (stages.length - 1))));
    }
    marquees.forEach((m) => m.update(dt, state.velocity));
    updateChrome();
  });

  addEventListener('click', (e) => {
    if (!exp || modal.isOpen) return;
    setPointer(e);
    exp.ndc.set(state.mouse.x, state.mouse.y);
    if (exp.pick()) exp.ghost.boo(() => exp.booBurst());
  });

  await counting;
  await gsap.to(count, { v: 100, duration: 0.6, ease: 'power2.out', onUpdate: renderCount });
  clearInterval(wordTimer);
  intro();
}

function intro() {
  const tl = gsap.timeline({ defaults: { ease: 'expo.inOut' } });
  tl.to('.loader__term', { scale: 0.9, autoAlpha: 0, duration: 0.7, ease: 'power3.in' })
    .to('.loader__top > *, .loader__bottom > *', { yPercent: -120, autoAlpha: 0, duration: 0.7, stagger: 0.04, ease: 'power3.in' }, 0)
    .to('.loader', { yPercent: -100, borderBottomLeftRadius: '50% 18vh', borderBottomRightRadius: '50% 18vh', duration: 1.3 }, 0.45)
    .set('.loader', { display: 'none' })
    .to(state, { intro: 1, duration: 2.4, ease: 'power2.out' }, 0.9)
    .to(heroChars, { yPercent: 0, rotate: 0, duration: 1.5, stagger: 0.035, ease: 'expo.out' }, 1.0)
    .to('.fade-in', { autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.07, ease: 'power3.out' }, 1.3)
    .to(nav, { yPercent: 0, autoAlpha: 1, duration: 1.2, ease: 'expo.out' }, 1.3)
    .add(() => {
      lenis.start();
      typer.start(300);
      state.greet = true;
      gsap.delayedCall(2.4, () => (state.greet = false));
    }, 1.6);
  if (reduceMotion) tl.timeScale(3);
}

// Big one-line titles always span the full content width
function fitTitles() {
  const el = $('.footer__word');
  const fit = $('.fit', el);
  const pad = parseFloat(getComputedStyle($('.footer')).paddingLeft);
  el.style.fontSize = '100px';
  const w = fit.offsetWidth;
  el.style.fontSize = `${(100 * (innerWidth - pad * 2) * 0.985) / Math.max(w, 1)}px`;
}

// ─── Scroll choreography ─────────────────────────────────
function setupScroll() {
  const st = (trigger, start, end) => ScrollTrigger.create({ trigger, start, end });
  triggers.toPeek = st('.about', 'top bottom', 'top 25%');
  triggers.toMorph = st('.skills', 'top bottom', 'top top');
  triggers.morph = st('.skills', 'top top', 'bottom bottom');
  triggers.morphOut = st('.projects', 'top bottom', 'top top');
  triggers.cta = st('.contact', 'top bottom', 'top 15%');

  // hero: pause the typewriter when it's off screen
  ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom top', onLeave: () => typer.stop(), onEnterBack: () => typer.start(200) });

  // nav: highlight the section in view
  const links = $$('.nav__links a');
  $$('[data-section]').forEach((sec) =>
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (self) => self.isActive && links.forEach((a) => a.classList.toggle('is-active', a.dataset.nav === sec.dataset.section)),
    }),
  );

  // about: the statement lights up word by word as you read
  gsap.fromTo(
    statementWords,
    { opacity: 0.14 },
    { opacity: 1, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: statement, start: 'top 80%', end: 'bottom 45%', scrub: true } },
  );

  reveals.forEach(({ el, words }) =>
    gsap.from(words, { yPercent: 115, rotate: 5, duration: 1.3, ease: 'expo.out', stagger: 0.035, scrollTrigger: { trigger: el, start: 'top 88%' } }),
  );
  $$('.label').forEach((el) =>
    gsap.from(el, { autoAlpha: 0, x: -20, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%' } }),
  );
  $$('.about__bio p, .whatido li, .fact').forEach((el) =>
    gsap.from(el, { autoAlpha: 0, y: 36, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%' } }),
  );

  // experience: the timeline draws as you scroll, roles slide in
  gsap.to('.timeline__line i', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.timeline', start: 'top 70%', end: 'bottom 70%', scrub: true } });
  $$('.job').forEach((job) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: job, start: 'top 80%' } });
    tl.from(job.querySelector('.job__dot'), { scale: 0, duration: 0.8, ease: 'back.out(3)' })
      .from(job.querySelectorAll('.job__meta, .job__company, .job__role'), { autoAlpha: 0, y: 40, duration: 1.2, stagger: 0.08, ease: 'expo.out' }, 0)
      .from(job.querySelectorAll('.job__bullets li'), { autoAlpha: 0, y: 24, duration: 1, stagger: 0.06, ease: 'expo.out' }, 0.25);
  });

  // projects: entrance reveal
  gsap.from('.tabs', {
    autoAlpha: 0,
    y: 20,
    duration: 0.8,
    ease: 'expo.out',
    scrollTrigger: { trigger: '.projects', start: 'top 80%' },
  });
  gsap.from('.pcard', {
    autoAlpha: 0,
    y: 35,
    duration: 0.9,
    stagger: 0.06,
    ease: 'expo.out',
    scrollTrigger: { trigger: '.pgrid', start: 'top 85%' },
  });

  // stats
  $$('.stat b[data-count]').forEach((el) => {
    const target = Number(el.dataset.count);
    const decimals = Number(el.dataset.decimals || 0);
    const { prefix = '', suffix = '' } = el.dataset;
    const o = { v: 0 };
    el.textContent = `${prefix}0${suffix}`;
    gsap.to(o, {
      v: target,
      duration: 2.2,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%' },
      onUpdate: () => (el.textContent = prefix + (decimals ? o.v.toFixed(decimals) : Math.round(o.v).toLocaleString('en-US')) + suffix),
    });
  });
  gsap.from('.stat', { autoAlpha: 0, y: 50, duration: 1.2, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: '.stats', start: 'top 88%' } });

  // contact + footer
  gsap.from(contactChars, { yPercent: 120, rotate: 8, duration: 1.4, stagger: 0.025, ease: 'expo.out', scrollTrigger: { trigger: '.contact__title', start: 'top 88%' } });
  gsap.from('.contact__button', { scale: 0, rotate: -30, duration: 1.4, ease: 'elastic.out(1, 0.5)', scrollTrigger: { trigger: '.contact__button', start: 'top 95%' } });
  gsap.from('.clink, .cfact, .contact__avail', { autoAlpha: 0, y: 26, duration: 1, stagger: 0.06, ease: 'expo.out', scrollTrigger: { trigger: '.contact__grid', start: 'top 92%' } });
  gsap.from(footerChars, { yPercent: 100, duration: 1.4, stagger: 0.035, ease: 'expo.out', scrollTrigger: { trigger: '.footer__word', start: 'top 98%' } });

  ScrollTrigger.addEventListener('refresh', measurePage);
  ScrollTrigger.refresh();
  addEventListener('load', () => ScrollTrigger.refresh());
}

// ─── Per-frame DOM chrome ────────────────────────────────
const meterNum = $('.scroll-meter__num');
const meterLine = $('.scroll-meter__line i');
const skillsTrack = $('.skills__track i');
const skillsIndex = $('.skills__index b');
let maxScroll = 1;
let lastPct = -1;
function measurePage() {
  maxScroll = Math.max(document.documentElement.scrollHeight - innerHeight, 1);
}
function updateChrome() {
  const p = Math.min(state.scroll / maxScroll, 1);
  const pct = Math.round(p * 100);
  if (pct !== lastPct) {
    lastPct = pct;
    meterNum.textContent = String(pct).padStart(2, '0');
  }
  meterLine.style.transform = `scaleY(${p})`;
  skillsTrack.style.transform = `scaleY(${state.progress.morph})`;
}

let lastStage = 0;
function updateStage(i) {
  if (i === lastStage || !stages[i]) return;
  const dir = i > lastStage ? 1 : -1;
  const prev = stages[lastStage];
  const next = stages[i];
  prev.style.setProperty('--out', dir > 0 ? '-115%' : '115%');
  prev.classList.remove('is-active');
  next.classList.add('no-trans');
  next.style.setProperty('--out', dir > 0 ? '115%' : '-115%');
  void next.offsetWidth;
  next.classList.remove('no-trans');
  next.classList.add('is-active');
  skillsIndex.textContent = String(i + 1).padStart(2, '0');
  lastStage = i;
}

boot();
