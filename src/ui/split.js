// Tiny text splitter: wraps words (and optionally chars) in masking spans,
// preserving inline elements like <em> and <br>.
export function split(el, { chars = false } = {}) {
  const words = [];
  const letters = [];
  const nodes = [...el.childNodes];
  el.textContent = '';

  const append = (node, target) => {
    if (node.nodeType === Node.TEXT_NODE) {
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          target.appendChild(document.createTextNode(' '));
          return;
        }
        const w = document.createElement('span');
        w.className = 'w';
        const wi = document.createElement('span');
        wi.className = 'wi';
        if (chars) {
          [...part].forEach((ch) => {
            const c = document.createElement('span');
            c.className = 'c';
            c.textContent = ch;
            wi.appendChild(c);
            letters.push(c);
          });
        } else {
          wi.textContent = part;
        }
        w.appendChild(wi);
        target.appendChild(w);
        words.push(wi);
      });
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.tagName === 'BR') {
        target.appendChild(node.cloneNode());
        return;
      }
      const clone = node.cloneNode(false);
      target.appendChild(clone);
      [...node.childNodes].forEach((c) => append(c, clone));
    }
  };

  nodes.forEach((n) => append(n, el));
  el.classList.add('is-split');
  return { words, chars: letters };
}
