import gsap from 'gsap';
import { PROFILE, CONTACT } from '../content.js';

// Same contract as the React portfolio: POST {name, email, message} to
// `${VITE_API_URL}/api/send-email`. Without an API URL it falls back to mailto.
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function validate(name, value) {
  switch (name) {
    case 'name':
      if (!value.trim()) return 'Required';
      if (value.trim().length < 2) return 'At least 2 characters';
      return '';
    case 'email':
      if (!value.trim()) return 'Required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email';
      return '';
    case 'message':
      if (!value.trim()) return 'Required';
      if (value.trim().length < 10) return 'At least 10 characters';
      return '';
    default:
      return '';
  }
}

export const contactFormHTML = () => `
  <div class="cf">
    <p class="label-sm mono" data-stagger>Send a message</p>
    <h2 class="cf__title" id="modal-title" data-stagger>Got a project in mind?</h2>
    <p class="cf__intro" data-stagger>${esc(CONTACT.formIntro)}</p>
    <form class="cf__form" novalidate>
      ${[
        ['name', 'Name', 'text', 'Your name', 'name'],
        ['email', 'Email', 'email', 'you@example.com', 'email'],
      ]
        .map(
          ([n, label, type, ph, ac]) => `
        <div class="field" data-stagger>
          <div class="field__row"><label for="cf-${n}">${label}</label><span class="field__err" id="cf-${n}-err" aria-live="polite"></span></div>
          <input id="cf-${n}" name="${n}" type="${type}" placeholder="${ph}" autocomplete="${ac}" aria-describedby="cf-${n}-err" />
        </div>`,
        )
        .join('')}
      <div class="field" data-stagger>
        <div class="field__row"><label for="cf-message">Message</label><span class="field__err" id="cf-message-err" aria-live="polite"></span></div>
        <textarea id="cf-message" name="message" rows="4" placeholder="Tell me about your project..." aria-describedby="cf-message-err"></textarea>
      </div>
      <div class="cf__error" role="alert" hidden></div>
      <button type="submit" class="btn btn--primary btn--block" data-stagger><span class="btn__spinner" aria-hidden="true"></span><span class="btn__label">Send Message</span></button>
    </form>
  </div>`;

const successHTML = (message) => `
  <div class="cf-done">
    <div class="cf-done__icon" aria-hidden="true">
      <span class="cf-done__ring"></span>
      <svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
    </div>
    <h2 class="cf__title" id="modal-title">Message sent!</h2>
    <p class="cf__intro">${esc(message)}</p>
    <button type="button" class="btn btn--primary" data-close><span class="btn__label">Done</span></button>
  </div>`;

export function mountContactForm(root) {
  const form = root.querySelector('form');
  const fields = ['name', 'email', 'message'];
  const touched = new Set();
  const errorBox = root.querySelector('.cf__error');
  const button = form.querySelector('button[type="submit"]');

  const showError = (name) => {
    const input = form.elements[name];
    const msg = touched.has(name) ? validate(name, input.value) : '';
    root.querySelector(`#cf-${name}-err`).textContent = msg;
    input.classList.toggle('is-invalid', !!msg);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return msg;
  };

  fields.forEach((name) => {
    const input = form.elements[name];
    input.addEventListener('blur', () => {
      touched.add(name);
      showError(name);
    });
    input.addEventListener('input', () => showError(name));
  });

  const done = (message) => {
    const panel = root.closest('.modal__body') || root;
    gsap.to(root, {
      opacity: 0,
      y: -10,
      duration: 0.25,
      onComplete: () => {
        panel.innerHTML = successHTML(message);
        const ok = panel.querySelector('.cf-done');
        gsap.from(ok.children, { opacity: 0, y: 18, duration: 0.7, stagger: 0.08, ease: 'power3.out' });
        gsap.fromTo(ok.querySelector('path'), { strokeDashoffset: 24 }, { strokeDashoffset: 0, duration: 0.5, delay: 0.25, ease: 'power2.out' });
        panel.querySelector('button')?.focus({ preventScroll: true });
      },
    });
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    fields.forEach((n) => touched.add(n));
    // validate every field (not just up to the first failure) so all errors show at once
    const errors = fields.map((n) => showError(n));
    const firstInvalid = fields[errors.findIndex(Boolean)];
    if (firstInvalid) {
      form.elements[firstInvalid].focus();
      gsap.fromTo(form.elements[firstInvalid], { x: -6 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
      return;
    }
    const data = Object.fromEntries(fields.map((n) => [n, form.elements[n].value.trim()]));
    errorBox.hidden = true;

    if (!API_URL) {
      const subject = encodeURIComponent(`Portfolio enquiry from ${data.name}`);
      const body = encodeURIComponent(`${data.message}\n\n— ${data.name} (${data.email})`);
      window.location.href = `mailto:${PROFILE.email}?subject=${subject}&body=${body}`;
      done('Your email app should open with the message ready to send.');
      return;
    }

    button.disabled = true;
    button.classList.add('is-loading');
    button.querySelector('.btn__label').textContent = 'Sending...';
    try {
      const res = await fetch(`${API_URL}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) done("Thanks for reaching out. I'll get back to you within 24 hours.");
      else throw new Error(json.error || 'Failed to send. Please try again.');
    } catch (err) {
      errorBox.textContent = err instanceof TypeError ? 'Network error. Please try again.' : err.message;
      errorBox.hidden = false;
      gsap.from(errorBox, { opacity: 0, y: -6, duration: 0.4 });
    } finally {
      button.disabled = false;
      button.classList.remove('is-loading');
      const label = button.querySelector('.btn__label');
      if (label) label.textContent = 'Send Message';
    }
  });
}
