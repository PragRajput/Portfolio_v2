import gsap from 'gsap';

// Full-screen navigation for small screens.
export default class Menu {
  constructor({ onOpen, onClose, onNavigate }) {
    this.root = document.querySelector('.menu');
    this.burger = document.querySelector('.nav__burger');
    this.links = [...this.root.querySelectorAll('.menu__link')];
    this.isOpen = false;
    this.hooks = { onOpen, onClose };

    this.burger.addEventListener('click', () => (this.isOpen ? this.close() : this.open()));
    this.links.forEach((a) =>
      a.addEventListener('click', (e) => {
        e.preventDefault();
        this.close();
        onNavigate?.(a.dataset.scrollTo);
      }),
    );
    document.addEventListener('keydown', (e) => e.key === 'Escape' && this.isOpen && this.close());
  }

  open() {
    this.isOpen = true;
    this.hooks.onOpen?.();
    this.root.hidden = false;
    this.root.setAttribute('aria-hidden', 'false');
    this.burger.setAttribute('aria-expanded', 'true');
    this.burger.setAttribute('aria-label', 'Close menu');
    document.documentElement.classList.add('menu-open');
    const r = this.burger.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    gsap.killTweensOf(this.root);
    gsap.fromTo(this.root, { clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${Math.hypot(innerWidth, innerHeight)}px at ${x}px ${y}px)`, duration: 0.9, ease: 'expo.inOut' });
    gsap.fromTo(this.links, { yPercent: 110 }, { yPercent: 0, duration: 1, stagger: 0.06, delay: 0.25, ease: 'expo.out' });
    gsap.fromTo(this.root.querySelector('.menu__foot'), { opacity: 0 }, { opacity: 1, duration: 0.8, delay: 0.6 });
    this.links[0]?.focus({ preventScroll: true });
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.burger.setAttribute('aria-expanded', 'false');
    this.burger.setAttribute('aria-label', 'Open menu');
    document.documentElement.classList.remove('menu-open');
    const r = this.burger.getBoundingClientRect();
    gsap.killTweensOf(this.root);
    gsap.to(this.root, {
      clipPath: `circle(0px at ${r.left + r.width / 2}px ${r.top + r.height / 2}px)`,
      duration: 0.7,
      ease: 'expo.inOut',
      onComplete: () => {
        this.root.hidden = true;
        this.root.setAttribute('aria-hidden', 'true');
      },
    });
    this.hooks.onClose?.();
  }
}
