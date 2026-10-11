import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { PostOverlay } from '../components/PostOverlay';
import { isEnabled } from '../lib/storage';
import { findPostContainers, hidePromotedPosts } from '../lib/postFinder';
import { warmUp } from '../lib/gemma';
import '../assets/tailwind.css';

const INJECTED_ATTR = 'data-grindset-injected';

function debounce<T extends () => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return (() => {
    clearTimeout(timer);
    timer = setTimeout(fn, ms);
  }) as T;
}

async function injectIntoPost(postEl: Element, ctx: any) {
  if (postEl.getAttribute(INJECTED_ATTR)) return;
  postEl.setAttribute(INJECTED_ATTR, 'true');

  // Inject right before the post text paragraph
  const textParent = postEl.querySelector('[data-testid="expandable-text-box"]')?.parentElement ?? null;
  const anchor = textParent ?? postEl;
  const appendMode = textParent ? 'before' : 'first';

  const ui = await createShadowRootUi(ctx, {
    name: 'grindset-overlay',
    position: 'inline',
    anchor,
    append: appendMode,
    onMount(container: HTMLElement) {
      const root = createRoot(container);
      root.render(createElement(PostOverlay, { postElement: postEl }));
      return root;
    },
    onRemove(root: any) {
      root?.unmount();
    },
  });
  ui.mount();
}

export default defineContentScript({
  matches: ['*://*.linkedin.com/*'],
  cssInjectionMode: 'ui',
  async main(ctx) {
    const enabled = await isEnabled();
    if (!enabled) return;

    warmUp(); // fire-and-forget to warm the API connection

    // Hide promoted posts and inject into organic posts already on the page
    hidePromotedPosts();
    findPostContainers()
      .filter(el => !el.getAttribute(INJECTED_ATTR))
      .forEach(el => injectIntoPost(el, ctx));

    // Watch for new posts as user scrolls
    const observer = new MutationObserver(
      debounce(() => {
        hidePromotedPosts();
        findPostContainers()
          .filter(el => !el.getAttribute(INJECTED_ATTR))
          .forEach(el => injectIntoPost(el, ctx));
      }, 300)
    );

    observer.observe(document.body, { childList: true, subtree: true });
    ctx.onInvalidated(() => observer.disconnect());
  },
});
