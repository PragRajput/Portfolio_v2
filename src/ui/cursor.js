import gsap from 'gsap';

export default class Cursor {
  constructor() {
    this.el = document.querySelector('.cursor');
    this.enabled = !matchMedia('(hover: none)').matches;
    if (!this.enabled) {
      this.el.remove();
      return;
    }
    document.documentElement.classList.add('has-cursor');
    this.ring = this.el.querySelector('.cursor__ring');
    this.dot = this.el.querySelector('.cursor__dot');
    this.label = this.el.querySelector('.cursor__label');
    this.hoverTarget = null;
    this.ghost = false;

    gsap.set([this.ring, this.dot], { xPercent: -50, yPercent: -50, x: innerWidth / 2, y: innerHeight / 2 });
    // dot tracks the pointer 1:1, the ring trails just slightly
    const dx = gsap.quickSetter(this.dot, 'x', 'px');
    const dy = gsap.quickSetter(this.dot, 'y', 'px');
    const rx = gsap.quickTo(this.ring, 'x', { duration: 0.12, ease: 'power3' });
    const ry = gsap.quickTo(this.ring, 'y', { duration: 0.12, ease: 'power3' });

    addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      this.el.classList.add('is-visible');
      dx(e.clientX);
      dy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);
    });
    document.addEventListener('mouseleave', () => this.el.classList.remove('is-visible'));
    addEventListener('pointerdown', () => this.el.classList.add('is-down'));
    addEventListener('pointerup', () => this.el.classList.remove('is-down'));

    document.addEventListener('pointerover', (e) => {
      const t = e.target.closest('a, button, [data-cursor], .services__item');
      if (t === this.hoverTarget) return;
      this.hoverTarget = t;
      this.refresh();
    });
  }

  setGhost(on) {
    if (!this.enabled || on === this.ghost) return;
    this.ghost = on;
    this.refresh();
  }

  refresh() {
    const t = this.hoverTarget;
    const text = t?.dataset.cursor || (this.ghost && !t ? 'Boo?' : '');
    this.el.classList.toggle('is-hover', !!t || this.ghost);
    this.el.classList.toggle('has-label', !!text);
    if (text) this.label.textContent = text;
  }
}
