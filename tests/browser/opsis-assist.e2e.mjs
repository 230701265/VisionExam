import assert from "node:assert/strict";
import fs from "node:fs/promises";
import puppeteer from "puppeteer-core";

const baseUrl = process.env.OPSIS_TEST_URL || "http://127.0.0.1:5000";
const chromium = process.env.CHROMIUM_PATH || "/repl/tools/bin/chromium";

const browser = await puppeteer.launch({
  executablePath: chromium,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--use-fake-ui-for-media-stream"],
});

const page = await browser.newPage();
let populatedExamSelector = "";
const browserErrors = [];
page.on("pageerror", error => browserErrors.push(error.message));
page.on("console", message => {
  if (message.type() === "error" && !message.text().includes("ERR_CERT_VERIFIER_CHANGED")) browserErrors.push(message.text());
});

await page.evaluateOnNewDocument(() => {
  const originalAdd = EventTarget.prototype.addEventListener;
  const originalRemove = EventTarget.prototype.removeEventListener;
  const documentKeyHandlers = new Map();
  EventTarget.prototype.addEventListener = function (type, listener, options) {
    if (this === document && type === "keydown") documentKeyHandlers.set(listener, new Error().stack);
    return originalAdd.call(this, type, listener, options);
  };
  EventTarget.prototype.removeEventListener = function (type, listener, options) {
    if (this === document && type === "keydown") documentKeyHandlers.delete(listener);
    return originalRemove.call(this, type, listener, options);
  };

  class FakeRecognition {
    static instances = [];
    static active = new Set();
    continuous = false;
    interimResults = false;
    lang = "en-US";
    maxAlternatives = 1;
    onstart = null;
    onend = null;
    onerror = null;
    onresult = null;
    constructor() {
      FakeRecognition.instances.push(this);
    }
    start() {
      FakeRecognition.active.add(this);
      this.onstart?.();
    }
    stop() {
      const wasActive = FakeRecognition.active.delete(this);
      if (wasActive) queueMicrotask(() => this.onend?.());
    }
    emitFinal(transcript, confidence = 0.99) {
      this.onresult?.({
        resultIndex: 0,
        results: [{ isFinal: true, 0: { transcript, confidence } }],
      });
    }
  }

  class FakeUtterance {
    constructor(text) {
      this.text = text;
      this.onend = null;
      this.onerror = null;
    }
  }
  const fakeSpeech = {
    speaking: false,
    current: null,
    speak(utterance) {
      this.speaking = true;
      this.current = utterance;
    },
    cancel() {
      this.speaking = false;
      this.current = null;
    },
    pause() {},
    resume() {},
    getVoices() { return []; },
    finish() {
      const utterance = this.current;
      this.current = null;
      this.speaking = false;
      utterance?.onend?.();
    },
  };

  Object.defineProperty(window, "SpeechRecognition", { configurable: true, value: FakeRecognition });
  Object.defineProperty(window, "webkitSpeechRecognition", { configurable: true, value: FakeRecognition });
  Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: FakeUtterance });
  Object.defineProperty(window, "speechSynthesis", { configurable: true, value: fakeSpeech });
  window.__assistTest = {
    documentKeyHandlerCount: () => documentKeyHandlers.size,
    documentKeyHandlerStacks: () => Array.from(documentKeyHandlers.values()),
    assistKeyHandlerCount: () => Array.from(documentKeyHandlers.values()).filter(stack =>
      stack?.includes("/src/components/AccessibilityProvider.tsx"),
    ).length,
    legacyKeyHandlerCount: () => Array.from(documentKeyHandlers.values()).filter(stack =>
      /useInternationalKeyboardNavigation|usePageNavigation|useKeyboardNavigation|useVoiceCommands/.test(stack ?? ""),
    ).length,
    recognitionInstanceCount: () => FakeRecognition.instances.length,
    activeRecognitionCount: () => FakeRecognition.active.size,
    emitFinal: text => Array.from(FakeRecognition.active).at(-1)?.emitFinal(text),
    finishNarration: () => fakeSpeech.finish(),
    isNarrating: () => fakeSpeech.speaking,
  };
});

async function waitFor(selector) {
  await page.waitForSelector(selector, { visible: true, timeout: 10_000 });
}

async function tabTo(selector, maxTabs = 80) {
  for (let index = 0; index < maxTabs; index += 1) {
    const matches = await page.evaluate(sel => document.activeElement?.matches(sel), selector);
    if (matches) return;
    await page.keyboard.press("Tab");
  }
  throw new Error(`Tab navigation did not reach ${selector}`);
}

async function clickVisible(selector) {
  const elements = await page.$$(selector);
  for (const element of elements) {
    const box = await element.boundingBox();
    if (box && box.width > 0 && box.height > 0) {
      await element.click();
      return;
    }
  }
  throw new Error(`No visible element found for ${selector}`);
}

async function hasVisible(selector) {
  const elements = await page.$$(selector);
  for (const element of elements) {
    const box = await element.boundingBox();
    if (box && box.width > 0 && box.height > 0) return true;
  }
  return false;
}

async function createFreshStudent(examTitle = "Mathematics Final Exam") {
  await page.goto(baseUrl, { waitUntil: "networkidle0" });
  await page.click('[data-testid="button-register-tab"]');
  const username = `assist-review-${process.pid}-${Date.now()}`;
  await page.type('[data-testid="input-register-username"]', username);
  await page.type('[data-testid="input-register-password"]', "password123");
  await page.click('[data-testid="button-register-submit"]');
  await waitFor('[data-testid^="button-start-exam-"]');
  populatedExamSelector = await page.$$eval(
    '[data-testid^="card-exam-"]',
    (cards, title) => {
      const card = cards.find(element => element.textContent?.includes(title));
      return card?.querySelector('[data-testid^="button-start-exam-"]')?.getAttribute("data-testid") ?? "";
    },
    examTitle,
  );
  assert.ok(populatedExamSelector, `${examTitle} is available`);
}

async function startExamWithKeyboard() {
  const selector = `[data-testid="${populatedExamSelector}"]`;
  await page.evaluate(() => document.body.focus());
  await tabTo(selector);
  await page.keyboard.press("Enter");
  await waitFor('[data-testid="text-exam-title"]');
}

async function answerFlagNavigateAndSubmit() {
  await waitFor('[data-testid^="radio-option-"]');
  await page.click('[data-testid^="radio-option-"]');
  await page.click('[data-testid="button-flag-question"]');
  assert.equal(
    await page.$$eval('[data-testid="button-flag-question"]', elements =>
      elements.some(element =>
        element.getAttribute("aria-pressed") === "true" || /unflag|flagged/i.test(element.textContent ?? ""),
      ),
    ),
    true,
    "flag state is visible after activation",
  );

  const next = '[data-testid="button-next-question"]';
  await page.$eval('[data-testid="button-flag-question"]', element => element.focus());
  await tabTo(next);
  await page.keyboard.press("Enter");

  while (!(await hasVisible('[data-testid="button-submit-exam"]'))) {
    await clickVisible(next);
  }
  await clickVisible('[data-testid="button-submit-exam"]');
  await waitFor('[data-testid="button-confirm-submit"]');
  await page.click('[data-testid="button-confirm-submit"]');
  await page.waitForFunction(() => /results/i.test(document.body.innerText), { timeout: 10_000 });
}

async function assertNativeControlsRemainNative() {
  const result = await page.evaluate(async () => {
    const main = document.querySelector("main") ?? document.body;
    const host = document.createElement("section");
    host.innerHTML = `
      <select id="assist-test-select"><option>A</option><option>B</option></select>
      <input id="assist-test-slider" type="range" min="0" max="10" value="5">
      <div role="tablist"><button id="assist-test-tab" role="tab">Tab</button></div>
      <div role="radiogroup">
        <label><input id="assist-test-radio-a" type="radio" name="assist-test-radio" checked>A</label>
        <label><input id="assist-test-radio-b" type="radio" name="assist-test-radio">B</label>
      </div>
      <div class="monaco-editor"><textarea id="assist-test-monaco"></textarea></div>
    `;
    main.appendChild(host);
    const ids = ["assist-test-select", "assist-test-slider", "assist-test-tab", "assist-test-radio-a", "assist-test-monaco"];
    const prevented = {};
    for (const id of ids) {
      const element = document.getElementById(id);
      element.focus();
      const event = new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true });
      element.dispatchEvent(event);
      prevented[id] = event.defaultPrevented;
    }
    host.remove();
    return prevented;
  });
  assert.deepEqual(result, {
    "assist-test-select": false,
    "assist-test-slider": false,
    "assist-test-tab": false,
    "assist-test-radio-a": false,
    "assist-test-monaco": false,
  });
}

try {
  await createFreshStudent();
  const listenerCount = await page.evaluate(() => window.__assistTest.assistKeyHandlerCount());
  if (listenerCount !== 1) {
    console.error("Document keydown registration stacks:", await page.evaluate(() => window.__assistTest.documentKeyHandlerStacks()));
  }
  assert.equal(listenerCount, 1, "one app-owned Assist document keydown listener after login");
  assert.equal(await page.evaluate(() => window.__assistTest.legacyKeyHandlerCount()), 0, "no legacy keyboard hook listeners");

  await startExamWithKeyboard();
  await answerFlagNavigateAndSubmit();
  console.log("PASS ordinary student flow with Assist OFF");

  await page.click('[data-testid="button-logout"]');
  await waitFor('[data-testid="button-register-tab"]');
  await createFreshStudent();
  await startExamWithKeyboard();
  await page.click('[data-testid="button-quick-accessibility"]');
  await waitFor('[data-testid="switch-quick-speech"]');
  await page.click('[data-testid="switch-quick-speech"]');
  await page.click('[data-testid="button-close-panel"]');

  await page.keyboard.down("Control");
  await page.keyboard.down("Shift");
  await page.keyboard.press("Space");
  await page.keyboard.up("Shift");
  await page.keyboard.up("Control");
  await waitFor('[role="dialog"][aria-labelledby="assist-question-title"]');
  const noButton = await page.$$("button");
  for (const button of noButton) {
    const text = await button.evaluate(element => element.textContent);
    if (text?.includes("No, keep my current setting")) {
      await button.click();
      break;
    }
  }
  await page.waitForFunction(() => window.__assistTest.activeRecognitionCount() === 1);
  assert.equal(await page.evaluate(() => window.__assistTest.assistKeyHandlerCount()), 1);
  assert.equal(await page.evaluate(() => window.__assistTest.legacyKeyHandlerCount()), 0);
  assert.equal(await page.evaluate(() => window.__assistTest.activeRecognitionCount()), 1);
  assert.equal(await page.evaluate(() => window.__assistTest.recognitionInstanceCount()), 1);

  await assertNativeControlsRemainNative();

  const progressBeforeNarration = await page.$eval('[data-testid="text-question-progress"]', element => element.textContent);
  await page.keyboard.press("ArrowDown");
  assert.equal(await page.evaluate(() => window.__assistTest.isNarrating()), true);
  await page.evaluate(() => window.__assistTest.emitFinal("next question"));
  await new Promise(resolve => setTimeout(resolve, 50));
  assert.equal(
    await page.$eval('[data-testid="text-question-progress"]', element => element.textContent),
    progressBeforeNarration,
    "voice command emitted during narration must be ignored",
  );
  await page.evaluate(() => window.__assistTest.finishNarration());

  await answerFlagNavigateAndSubmit();
  console.log("PASS ordinary student flow with Assist ON");

  await page.keyboard.down("Control");
  await page.keyboard.down("Shift");
  await page.keyboard.press("Space");
  await page.keyboard.up("Shift");
  await page.keyboard.up("Control");
  await page.waitForFunction(() => window.__assistTest.activeRecognitionCount() === 0);
  assert.equal(await page.evaluate(() => window.__assistTest.activeRecognitionCount()), 0);

  await page.click('[data-testid="button-logout"]');
  await waitFor('[data-testid="button-register-tab"]');
  await createFreshStudent("Programming Fundamentals");
  await startExamWithKeyboard();
  await page.keyboard.down("Control");
  await page.keyboard.down("Shift");
  await page.keyboard.press("Space");
  await page.keyboard.up("Shift");
  await page.keyboard.up("Control");
  await waitFor('[role="dialog"][aria-labelledby="assist-question-title"]');
  for (const button of await page.$$("button")) {
    if ((await button.evaluate(element => element.textContent))?.includes("No, keep my current setting")) {
      await button.click();
      break;
    }
  }
  await page.waitForFunction(() => window.__assistTest.activeRecognitionCount() === 1);

  await page.evaluate(() => window.__assistTest.emitFinal("run tests"));
  await waitFor('[data-testid="execution-results"]');
  await new Promise(resolve => setTimeout(resolve, 1_000));
  const codingProgress = await page.$eval('[data-testid="text-question-progress"]', element => element.textContent);
  await page.evaluate(() => window.__assistTest.emitFinal("next question"));
  await page.waitForFunction(
    previous => document.querySelector('[data-testid="text-question-progress"]')?.textContent !== previous,
    {},
    codingProgress,
  );
  await page.keyboard.down("Alt");
  await page.keyboard.press("KeyA");
  await page.keyboard.up("Alt");
  await page.waitForFunction(() => window.location.pathname === "/accessibility");
  assert.equal(await page.evaluate(() => window.__assistTest.activeRecognitionCount()), 1);
  console.log("PASS editor, exam, and global scope routing with one Assist session");

  assert.equal(browserErrors.length, 0, `browser errors: ${browserErrors.join(" | ")}`);
  console.log("PASS listener uniqueness, native exemptions, shared recognition lifecycle, and narration gating");
} catch (error) {
  await fs.mkdir("test-results", { recursive: true });
  await page.screenshot({ path: "test-results/opsis-assist-failure.png", fullPage: true });
  console.error(error);
  if (browserErrors.length) console.error("Browser errors:", browserErrors);
  process.exitCode = 1;
} finally {
  await browser.close();
}