import gsap from 'gsap';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select, [tabindex]:not([tabindex="-1"])';

// One accessible dialog shell, reused for project details and the contact form.
export default class Modal {
  constructor(root, { onOpen, onClose } = {}) {
    this.root = root;
    this.panel = root.querySelector('.modal__panel');
    this.body = root.querySelector('.modal__body');
    this.backdrop = root.querySelector('.modal__backdrop');
    this.hooks = { onOpen, onClose };
    this.isOpen = false;
    this.token = 0;

    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-close]')) this.close();
    });
    document.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      if (e.key === 'Escape') this.close();
      if (e.key === 'Tab') this.trap(e);
    });
  }

  open(html, { onMount, variant = '' } = {}) {
    const token = ++this.token;
    if (!this.isOpen) this.lastFocus = document.activeElement;
    this.body.innerHTML = html;
    this.panel.dataset.variant = variant;
    this.root.classList.add('is-open');
    this.root.setAttribute('aria-hidden', 'false');
    this.panel.scrollTop = 0;
    this.isOpen = true;
    this.hooks.onOpen?.();
    onMount?.(this.body, token);

    gsap.killTweensOf([this.backdrop, this.panel]);
    gsap.fromTo(this.backdrop, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' });
    gsap.fromTo(this.panel, { opacity: 0, y: 70, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'expo.out' });
    gsap.from(this.body.querySelectorAll('[data-stagger]'), { opacity: 0, y: 24, duration: 0.8, stagger: 0.06, delay: 0.12, ease: 'power3.out' });
    requestAnimationFrame(() => {
      if (token === this.token) this.root.querySelector('.modal__close')?.focus({ preventScroll: true });
    });
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    const token = this.token;
    gsap.killTweensOf([this.backdrop, this.panel]);
    gsap.to(this.panel, { opacity: 0, y: 40, scale: 0.98, duration: 0.35, ease: 'power2.in' });
    gsap.to(this.backdrop, {
      opacity: 0,
      duration: 0.42,
      ease: 'power2.in',
      onComplete: () => {
        if (token !== this.token || this.isOpen) return;
        this.root.classList.remove('is-open');
        this.root.setAttribute('aria-hidden', 'true');
        this.body.innerHTML = '';
      },
    });
    this.hooks.onClose?.();
    this.lastFocus?.focus?.({ preventScroll: true });
  }

  trap(e) {
    const items = [...this.panel.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}
