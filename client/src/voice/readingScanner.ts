/** DOM-only reading cursor utilities. They deliberately never move focus while scanning. */
export const READING_SELECTOR = 'main h1, main h2, main h3, main h4, main h5, main h6, main p, main li, main label, main button, main a[href], main input, main textarea, main select, main [role]';

export function isNativeReadingExempt(target: HTMLElement | null): boolean {
  return Boolean(target?.closest(
    '.monaco-editor, input, textarea, select, [contenteditable="true"], [role="textbox"], [role="slider"], [role="tab"], [role="radio"], [role="radiogroup"], [role="combobox"], [role="listbox"], [role="menu"], [role="tree"], [role="grid"]',
  ));
}

export function describeReadingElement(element: HTMLElement): string {
  const role = element.getAttribute('role') || element.tagName.toLowerCase();
  const labelledBy = element.getAttribute('aria-labelledby');
  const label = labelledBy
    ? labelledBy.split(/\s+/).map(id => document.getElementById(id)?.textContent ?? '').join(' ')
    : '';
  const name = element.getAttribute('aria-label') || label || (element as HTMLInputElement).labels?.[0]?.textContent || element.innerText || element.textContent || '';
  const state = [
    element.getAttribute('aria-checked') === 'true' ? 'checked' : '',
    element.getAttribute('aria-expanded') === 'true' ? 'expanded' : '',
    (element as HTMLInputElement).disabled ? 'disabled' : '',
    (element as HTMLInputElement).value && ['input', 'textarea', 'select'].includes(role) ? `value ${(element as HTMLInputElement).value}` : '',
  ].filter(Boolean).join(', ');
  return `${role}: ${name.replace(/\s+/g, ' ').trim()}${state ? `, ${state}` : ''}`;
}

export class ReadingScanner {
  private items: HTMLElement[] = [];
  private index = -1;
  private observer: MutationObserver | null = null;
  private timer: number | null = null;

  start(onRefresh: () => void) {
    this.rescan();
    this.observer = new MutationObserver(() => {
      if (this.timer !== null) window.clearTimeout(this.timer);
      this.timer = window.setTimeout(() => { this.rescan(); onRefresh(); }, 80);
    });
    this.observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-label', 'aria-hidden', 'disabled'] });
  }
  stop() { this.observer?.disconnect(); this.observer = null; if (this.timer !== null) window.clearTimeout(this.timer); }
  rescan() { this.items = Array.from(document.querySelectorAll<HTMLElement>(READING_SELECTOR)).filter(item => item.isConnected && !item.closest('[aria-hidden="true"]')); if (this.index >= this.items.length) this.index = -1; }
  move(direction: 1 | -1) {
    this.rescan();
    if (!this.items.length) return null;
    this.index = this.index < 0 ? (direction > 0 ? 0 : this.items.length - 1) : (this.index + direction + this.items.length) % this.items.length;
    return this.items[this.index];
  }
  activate() {
    const item = this.items[this.index];
    if (!item?.isConnected) return null;
    if (item.matches('input[type="checkbox"], input[type="radio"], button, a[href], [role="button"], [role="checkbox"], [role="radio"], [role="switch"]')) {
      item.click();
      return item;
    }
    if (item.matches('input, textarea, select, [contenteditable="true"], [role="textbox"], [role="combobox"]')) {
      item.focus();
      return item;
    }
    const labelledControl = item.matches('label') ? document.getElementById(item.getAttribute('for') ?? '') as HTMLElement | null : null;
    if (labelledControl) {
      if (labelledControl.matches('input[type="checkbox"], input[type="radio"]')) labelledControl.click();
      else labelledControl.focus();
      return item;
    }
    return item;
  }
}