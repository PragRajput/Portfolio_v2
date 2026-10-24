import gsap from 'gsap';

// Elements with [data-magnetic="strength"] get pulled toward the cursor.
export function initMagnetic(root = document) {
  if (matchMedia('(hover: none)').matches) return;
  root.querySelectorAll('[data-magnetic]:not([data-magnetic-bound])').forEach((el) => {
    el.dataset.magneticBound = '';
    const strength = parseFloat(el.dataset.magnetic) || 0.3;
    const inner = el.querySelector('.magnetic__inner');
    const opts = { duration: 1, ease: 'elastic.out(1, 0.35)' };
    const xTo = gsap.quickTo(el, 'x', opts);
    const yTo = gsap.quickTo(el, 'y', opts);
    const ixTo = inner && gsap.quickTo(inner, 'x', opts);
    const iyTo = inner && gsap.quickTo(inner, 'y', opts);
    let rect = null;

    el.addEventListener('pointerenter', () => (rect = el.getBoundingClientRect()));
    el.addEventListener('pointermove', (e) => {
      rect ||= el.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      xTo(dx * strength);
      yTo(dy * strength);
      ixTo?.(dx * strength * 0.55);
      iyTo?.(dy * strength * 0.55);
    });
    el.addEventListener('pointerleave', () => {
      rect = null;
      xTo(0);
      yTo(0);
      ixTo?.(0);
      iyTo?.(0);
    });
  });
}
