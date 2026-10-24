// Turns the data in content.js into DOM. Everything is rendered before the
// text-splitting and scroll animations are set up.
import { PROFILE, ABOUT, EXPERIENCE, SKILL_STAGES, PROJECTS, STATS, CONTACT, STACK, INTEGRATIONS } from './content.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const pad = (n) => String(n).padStart(2, '0');

const DEFAULT_PALETTES = {
  personal: [
    ['#03140f', '#047857', '#6ee7b7', '#ecfdf5'],
    ['#06120d', '#0f766e', '#99f6e4', '#f0fdfa'],
  ],
  work: [
    ['#060b1d', '#1e40af', '#93c5fd', '#eff6ff'],
    ['#0b0a1f', '#4338ca', '#a5b4fc', '#eef2ff'],
  ],
};

export function splitTitle(title) {
  const i = title.indexOf(':');
  return i === -1 ? { name: title, sub: '' } : { name: title.slice(0, i), sub: title.slice(i + 1).trim() };
}

export function paletteFor(p, i) {
  if (p.palette) return p.palette;
  const set = p.personal ? DEFAULT_PALETTES.personal : DEFAULT_PALETTES.work;
  return set[i % set.length];
}

function firstSentence(text, max = 120) {
  const end = text.indexOf('. ');
  const s = end === -1 ? text : text.slice(0, end + 1);
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

export function badges(p) {
  return p.personal
    ? '<span class="badge badge--personal">Personal</span>'
    : `<span class="badge badge--work">Work</span>${p.company ? `<span class="badge">${esc(p.company)}</span>` : ''}`;
}

export function renderMarquees(stackEl, intEl) {
  stackEl.innerHTML = STACK.map((w, i) => `<span class="${i % 3 === 1 ? 'is-accent' : ''}">${esc(w)}</span><b>✦</b>`).join('');
  intEl.innerHTML = INTEGRATIONS.map((w) => `<span>${esc(w)}</span><b>✦</b>`).join('');
}

export function renderAbout(root, exp) {
  root.querySelector('.js-statement').textContent = ABOUT.statement.replace('{exp}', exp);
  root.querySelector('.js-bio').innerHTML = ABOUT.paragraphs.map((p) => `<p data-reveal-lines>${esc(p)}</p>`).join('');
  root.querySelector('.js-whatido').innerHTML = ABOUT.whatIDo.map((t, i) => `<li><span class="mono">${pad(i + 1)}</span>${esc(t)}</li>`).join('');
  root.querySelector('.js-facts').innerHTML = ABOUT.facts
    .map((f) => `<div class="fact"><p class="fact__k">${esc(f.label)}</p><p class="fact__v">${esc(f.value.replace('{exp}', exp))}</p></div>`)
    .join('');
}

export function renderExperience(el) {
  el.innerHTML = EXPERIENCE.map(
    (j) => `
    <article class="job${j.current ? ' is-current' : ''}">
      <span class="job__dot" aria-hidden="true"></span>
      <div class="job__meta mono">
        <span>${esc(j.period)}</span>
        ${j.current ? '<span class="pill pill--live"><i></i>Current</span>' : ''}
      </div>
      <h3 class="job__company">${esc(j.company)}${j.formerly ? ` <span class="job__formerly">(${esc(j.formerly)})</span>` : ''}</h3>
      <p class="job__role">${esc(j.role)}</p>
      <ul class="job__bullets">${j.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
    </article>`,
  ).join('');
}

export function renderStages(el) {
  el.innerHTML = SKILL_STAGES.map(
    (s, i) => `
    <div class="stage${i === 0 ? ' is-active' : ''}${s.featured ? ' is-featured' : ''}" data-i="${i}">
      <p class="stage__note mono">${i === 0 ? '' : `<span>${pad(i)}</span> `}${esc(s.note)}</p>
      <h2 class="stage__title">${s.title}</h2>
      ${s.chips.length ? `<ul class="stage__chips">${s.chips.map((c, k) => `<li class="chip" style="--k:${k}">${esc(c)}</li>`).join('')}</ul>` : ''}
    </div>`,
  ).join('');
}

export function renderProjects(el, filter = 'all', showAll = false) {
  const filtered = PROJECTS.filter((p) => {
    if (filter === 'personal') return p.personal;
    if (filter === 'work') return !p.personal;
    return true;
  });
  const list = showAll ? filtered : filtered.slice(0, 6);
  el.innerHTML = list
    .map((p, i) => {
      const { name, sub } = splitTitle(p.title);
      const tech = p.technologies.slice(0, 3).map((t) => `<li>${esc(t)}</li>`).join('');
      const more = p.technologies.length > 3 ? `<li class="more">+${p.technologies.length - 3}</li>` : '';
      return `
      <article class="pcard" data-project="${esc(p.id)}" data-type="${p.personal ? 'personal' : 'work'}" data-cursor="View" tabindex="0" role="button" aria-label="Open project: ${esc(name)}">
        <div class="pcard__top">
          ${badges(p)}
          <span class="pcard__num mono">${pad(i + 1)}</span>
        </div>
        <div class="pcard__head">
          <h3 class="pcard__title">${esc(name)}</h3>
          <span class="pcard__arrow" aria-hidden="true">↗</span>
        </div>
        <p class="pcard__desc">${esc(sub ? `${sub}: ${firstSentence(p.description, 110)}` : firstSentence(p.description, 130))}</p>
        <ul class="pcard__tech mono">${tech}${more}</ul>
      </article>`;
    })
    .join('');
  return {
    filteredTotal: filtered.length,
    shownCount: list.length,
    all: PROJECTS.length,
    personal: PROJECTS.filter((p) => p.personal).length,
    work: PROJECTS.filter((p) => !p.personal).length,
  };
}

export function parseStat(raw) {
  const m = /^(~?)(\d+(?:\.\d+)?)(.*)$/.exec(raw.trim());
  if (!m) return { prefix: '', value: 0, decimals: 0, suffix: raw };
  return { prefix: m[1], value: Number(m[2]), decimals: (m[2].split('.')[1] || '').length, suffix: m[3] };
}

export function renderStats(el, exp) {
  el.innerHTML = STATS.map((s) => {
    const v = s.value.replace('{exp}', exp);
    const { prefix, value, decimals, suffix } = parseStat(v);
    return `<div class="stat"><b data-count="${value}" data-decimals="${decimals}" data-prefix="${esc(prefix)}" data-suffix="${esc(suffix)}">${esc(v)}</b><span>${esc(s.label)}</span></div>`;
  }).join('');
}

export function renderContact(linksEl, factsEl) {
  linksEl.innerHTML = PROFILE.socials
    .map(
      (s) => `
      <a class="clink" href="${esc(s.href)}" ${s.href.startsWith('http') ? 'target="_blank" rel="noopener noreferrer"' : ''}>
        <span class="clink__k mono">${esc(s.label)}</span>
        <span class="clink__v">${esc(s.value)}</span>
        <span class="clink__arrow" aria-hidden="true">↗</span>
      </a>`,
    )
    .join('');
  factsEl.innerHTML = CONTACT.facts.map((f) => `<div class="cfact"><span>${esc(f.label)}</span><b>${esc(f.value)}</b></div>`).join('');
}

export function projectModalHTML(p) {
  const idx = PROJECTS.indexOf(p);
  const { name, sub } = splitTitle(p.title);
  const [c1, c2, c3] = paletteFor(p, idx);
  return `
    <article class="pm">
      <div class="pm__art" style="--c1:${c1};--c2:${c2};--c3:${c3}" aria-hidden="true">
        ${p.image ? `<img src="${esc(p.image)}" alt="" class="pm__img" />` : ''}
        <span class="mono">${pad(idx + 1)} / ${pad(PROJECTS.length)}</span>
      </div>
      <div class="pm__content">
        <div class="badges" data-stagger>${badges(p)}</div>
        <h2 class="pm__title" id="modal-title" data-stagger>${esc(name)}${sub ? `<span>${esc(sub)}</span>` : ''}</h2>
        <p class="pm__desc" data-stagger>${esc(p.description)}</p>
        <p class="label-sm mono" data-stagger>Tech stack</p>
        <ul class="chips" data-stagger>${p.technologies.map((t) => `<li class="chip">${esc(t)}</li>`).join('')}</ul>
        ${p.demoUrl ? `<div class="pm__foot" data-stagger><a class="btn btn--primary" href="${esc(p.demoUrl)}" target="_blank" rel="noopener noreferrer"><span class="magnetic__inner">Visit project <span aria-hidden="true">↗</span></span></a></div>` : ''}
      </div>
    </article>`;
}

export function findProject(id) {
  return PROJECTS.find((p) => p.id === id);
}
