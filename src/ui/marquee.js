// Infinite marquee whose speed and direction react to scroll velocity.
export default class Marquee {
  constructor(row) {
    this.row = row;
    this.track = row.querySelector('.marquee__track');
    this.dir = Number(row.dataset.dir) || 1;
    this.html = this.track.innerHTML;
    this.x = 0;
    this.skew = 0;
    this.measure();
  }

  measure() {
    this.track.innerHTML = this.html;
    const unit = this.track.scrollWidth;
    let copies = 1;
    while (this.track.scrollWidth < innerWidth + unit * 1.5 && copies < 12) {
      this.track.insertAdjacentHTML('beforeend', this.html);
      copies++;
    }
    this.unit = unit;
  }

  update(dt, velocity) {
    const speed = this.dir * (70 + velocity * 22);
    this.x -= speed * dt;
    if (this.unit > 0) {
      this.x %= this.unit;
      if (this.x > 0) this.x -= this.unit;
    }
    const skewTarget = Math.max(-10, Math.min(10, -velocity * 0.35));
    this.skew += (skewTarget - this.skew) * Math.min(1, dt * 8);
    this.track.style.transform = `translate3d(${this.x}px,0,0) skewX(${this.skew}deg)`;
  }
}
