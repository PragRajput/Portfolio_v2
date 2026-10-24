// Types and erases a rotating list of lines, like a terminal.
export default function typewriter(el, lines, { type = 42, erase = 20, hold = 2000, gap = 380 } = {}) {
  let li = 0;
  let ci = 0;
  let dir = 1;
  let timer = null;
  let running = false;

  const step = () => {
    if (!running) return;
    const line = lines[li];
    if (dir > 0) {
      ci++;
      el.textContent = line.slice(0, ci);
      if (ci >= line.length) {
        dir = -1;
        timer = setTimeout(step, hold);
        return;
      }
      timer = setTimeout(step, type + Math.random() * 40);
    } else {
      ci--;
      el.textContent = line.slice(0, ci);
      if (ci <= 0) {
        dir = 1;
        li = (li + 1) % lines.length;
        timer = setTimeout(step, gap);
        return;
      }
      timer = setTimeout(step, erase);
    }
  };

  return {
    start(delay = 0) {
      if (running) return;
      running = true;
      clearTimeout(timer);
      timer = setTimeout(step, delay);
    },
    stop() {
      running = false;
      clearTimeout(timer);
    },
  };
}
