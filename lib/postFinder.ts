const LOG = '[grindset]';

export function isPromoted(el: Element): boolean {
  return [...el.querySelectorAll('span')].some(s => s.textContent?.trim() === 'Promoted');
}

export function extractPostText(el: Element): string {
  return el.querySelector('[data-testid="expandable-text-box"]')?.textContent?.trim() ?? '';
}

export function extractPostImages(el: Element): string[] {
  return [...el.querySelectorAll('img[alt="View image"]')].map(img => (img as HTMLImageElement).src);
}

function findContainerFromTextBox(span: Element): Element | null {
  let el: Element | null = span;
  while (el && el !== document.body) {
    const h2 = el.querySelector('h2');
    if (h2?.textContent?.includes('Feed post')) return el;
    el = el.parentElement;
  }
  return null;
}

export function hidePromotedPosts(): void {
  document.querySelectorAll('[data-testid="expandable-text-box"]').forEach(span => {
    const container = findContainerFromTextBox(span);
    if (container && isPromoted(container)) {
      (container as HTMLElement).style.display = 'none';
    }
  });
}

export function findPostContainers(): Element[] {
  const containers = new Set<Element>();

  document.querySelectorAll('[data-testid="expandable-text-box"]').forEach(span => {
    const container = findContainerFromTextBox(span);
    if (container) containers.add(container);
  });

  const all = Array.from(containers);

  // Keep only the innermost containers — drop any that contain another container in the list
  const innermost = all.filter(el => !all.some(other => other !== el && el.contains(other)));

  const promoted = innermost.filter(isPromoted);
  const organic = innermost.filter(el => !isPromoted(el));

  console.log(`${LOG} findPostContainers: found ${innermost.length} total, ${promoted.length} promoted (filtered), ${organic.length} organic`);

  organic.forEach((el, i) => {
    const text = extractPostText(el);
    const images = extractPostImages(el);
    console.log(`${LOG} post[${i}]`, {
      text: text.slice(0, 80) + (text.length > 80 ? '…' : ''),
      images,
      element: el,
    });
  });

  return organic;
}
