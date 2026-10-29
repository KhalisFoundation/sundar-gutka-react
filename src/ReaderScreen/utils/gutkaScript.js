import { Platform } from "react-native";

// `readerTheme` is a resolved reading-theme record (src/theme/reader), not the
// app theme — this script styles only the Bani reading surface.
const script = (readerTheme) => {
  const listener = Platform.OS === "android" ? "document" : "window";
  const body = Platform.OS === "android" ? "document.body" : "window.document.body";
  return `

let autoScrollTimeout;
let autoScrollRAF = null;
let autoScrollSpeed = 0;
// Auto-scroll rate. The 1-100 slider maps linearly onto this px/s range rather
// than scaling straight from the slider value: the slowest setting still has to
// move at a readable pace, and the fastest has to keep up with a fast reader.
const AUTO_SCROLL_MIN_SPEED = 1;
const AUTO_SCROLL_MAX_SPEED = 100;
const AUTO_SCROLL_MIN_PX_PER_SECOND = 12;
const AUTO_SCROLL_MAX_PX_PER_SECOND = 200;
let isScrolling;
let isManuallyScrolling = false;
let lastHighlightedElement = null;
// The node currently carrying .sync-enlarged (a .pline span in paragraph mode,
// a content-item div in line mode). Tracked separately from
// lastHighlightedElement so a line change WITHIN one paragraph still scrolls.
let lastEnlargedTarget = null;
let highlightTimeout = null;
let hasReachedEnd = false;
let accumulatedScroll = 0;
let lastFrameTime = 0;
// Timestamp until which programmatic (audio sync) scrolls suppress the show/hide
// header messages. Without this, an audio-driven scrollIntoView fires the scroll
// handler, which mistakes it for a user scroll-down and collapses the nav bar —
// repeatedly and fast on banis with 1–2 word lines — even after the user tapped
// to keep it visible. Audio sync-scroll's resulting scroll-progress messages are
// intentionally NOT suppressed — listening via synced scroll should count toward
// completion the same as manual reading.
let syncScrollUntil = 0;
// Timestamp until which the "resume where you left off" position-restore jump
// suppresses scroll-progress reporting specifically. Separate from
// syncScrollUntil above: that jump must NOT count toward read-completion (it's
// not the user reading this session, just the WebView re-scrolling to a
// previously-saved position on load/refocus), whereas audio sync-scroll must.
let restoreScrollUntil = 0;

// Whether the page was last seen resting at the very top or the very end of
// the bani. Arriving at either edge brings the bars back ("edge"), once per
// arrival: this is what makes it an arrival rather than every tick spent there.
let wasAtEdge = false;

// Where the reader was before the last reflow: the line at the top of the
// viewport, and how far down the viewport it sat. Captured by the scroll
// handler while the layout is stable, and used by the resize handler to put
// the page back after a rotation.
let lastViewportWidth = window.innerWidth;
let anchorElementId = null;
let anchorViewportTop = 0;
let reflowRestoreTimer = null;

// The active (sync-scroll) line is rendered slightly larger than the rest of
// the bani via the .sync-enlarged class — the scale itself lives in CSS
// (gutkahtml.js), derived from each line's own base size, so the text still
// re-wraps naturally and never clips. Class toggling is deliberate: the
// previous implementation read getComputedStyle(...).fontSize and wrote the
// value back as absolute px, and under Android's textZoom (computed =
// specified × system font scale) every highlight/restore cycle multiplied the
// line by the font scale — lines drifted permanently smaller (scale < 100%)
// or larger (> 100%). A class add/remove has no read-back, so it cannot
// drift, and any stale state is removable by a document-wide sweep.
const clearEnlarged = () => {
  const prev = document.querySelectorAll('.sync-enlarged');
  for (let i = 0; i < prev.length; i++) {
    prev[i].classList.remove('sync-enlarged');
  }
};

// Enlarge ONLY the sung Gurmukhi line: the verse's own .pline span inside a
// merged paragraph (db.js wraps each verse when merging), else the main
// gurmukhi content-item. The div is targeted by data-type, NOT the .gurmukhi
// class — the Punjabi translation div shares that class for its font.
// Transliteration/translation lines never enlarge.
const setEnlarged = (element, sequenceNumber, isParagraphMode) => {
  clearEnlarged();
  if (!element) return null;
  let target = isParagraphMode
    ? element.querySelector('.pline[data-pseq="' + sequenceNumber + '"]')
    : null;
  if (!target) {
    target = element.querySelector('.content-item[data-type="gurmukhi"]');
  }
  if (target) {
    target.classList.add('sync-enlarged');
  }
  return target;
};

const clearAllHighlights = () => {
  if (highlightTimeout != null) {
    clearTimeout(highlightTimeout);
    highlightTimeout = null;
  }
  // Sweep the whole document, independent of lastHighlightedElement
  // bookkeeping — no line can survive a reset enlarged.
  clearEnlarged();
  lastEnlargedTarget = null;
  if (lastHighlightedElement) {
    lastHighlightedElement.style.backgroundColor = lastHighlightedElement.dataset.origBg || '';
    lastHighlightedElement.style.width = lastHighlightedElement.dataset.origWidth || '';
    lastHighlightedElement.style.margin = lastHighlightedElement.dataset.origMargin || '';
    lastHighlightedElement.style.borderRadius = '';
    lastHighlightedElement = null;
  }
};

const clearScrollTimeout=()=> {
  if (autoScrollTimeout != null) {
    clearTimeout(autoScrollTimeout);
  }
  autoScrollTimeout = null;
  if (autoScrollRAF != null) {
    cancelAnimationFrame(autoScrollRAF);
    autoScrollRAF = null;
  }
}

let lastScrollFuncTime = 0;
// Tap-vs-scroll bookkeeping: any scroll event during a touch (or momentum that
// is still settling when a new touch lands) disqualifies that touch from being
// treated as a tap.
let scrolledDuringTouch = false;
let lastScrollTime = 0;
// Timestamp of the last programmatic auto-scroll step. Auto-scroll's scrollBy
// fires scroll events just like a finger drag; without excluding them the tap
// gate below sees a "recent scroll" every frame and rejects every tap, so the
// screen can't be tapped while auto-scrolling.
let lastAutoScrollTime = 0;

const scrollFunc=(e)=> {
  // Only user-driven scrolls disqualify a following touch from being a tap.
  // A scroll event fires within a frame of the scrollBy that caused it, so a
  // fresh lastAutoScrollTime means this event is auto-scroll's own motion.
  if (Date.now() - lastAutoScrollTime > 100) {
    scrolledDuringTouch = true;
    lastScrollTime = Date.now();
  }
  // During auto-scroll, throttle this handler to every 300ms
  // to prevent 60fps RAF from triggering 60 expensive DOM queries/sec
  if (autoScrollSpeed > 0) {
    const now = Date.now();
    if (now - lastScrollFuncTime < 300) return;
    lastScrollFuncTime = now;
  }

  // Check if user has reached the end of the document
  const scrollHeight = document.documentElement.scrollHeight;
  const scrollTop = window.scrollY || window.pageYOffset;
  const clientHeight = window.innerHeight;
  const threshold = 50; // pixels from bottom to consider "at end"
  const isAtEnd = scrollTop + clientHeight >= scrollHeight - threshold;
  
  if (isAtEnd && !hasReachedEnd) {
    hasReachedEnd = true;
  } else if (!isAtEnd && hasReachedEnd) {
    // Reset flag when user scrolls away from the end
    hasReachedEnd = false;
  }

  // A rotation resizes the WebView and Chromium reflows the text underneath
  // the scroll offset, so every scroll event between the resize and the
  // restore below describes a position the user never chose. Reporting those
  // overwrote the saved reading position — and near the bottom saved "end",
  // which reopens the bani at the top. Nothing is reported, and no anchor
  // captured, until the new layout is final.
  const reflowing = window.innerWidth !== lastViewportWidth;

  // Report topmost element on both manual and auto-scroll so read context
  // survives background/terminate mid-auto-scroll. The 300ms throttle above
  // keeps this off the 60fps RAF hot path during auto-scroll.
  const elementId = reflowing ? null : getTopmostElementId();
  const topEl = elementId ? document.getElementById(String(elementId)) : null;
  if (topEl) {
    // WHERE on screen that line sits, so a rotation can put it back in the
    // same place (see the resize handler).
    anchorElementId = String(elementId);
    anchorViewportTop = topEl.getBoundingClientRect().top;
  }
  if (!reflowing) {
    if (elementId && !hasReachedEnd) {
      const seq = topEl ? (topEl.getAttribute("data-sequence") || "") : "";
      window.ReactNativeWebView.postMessage("scroll-elementId-" + elementId + "|seq-" + seq);
    } else if (hasReachedEnd) {
      window.ReactNativeWebView.postMessage("scroll-elementId-null");
    }
  }

  // ── Scroll progress — bridge message on every scroll tick, except during a
  // position-restore jump (see restoreScrollUntil) which isn't genuine reading ──
  var arrivedAtEdge = false;
  if (!reflowing && Date.now() > restoreScrollUntil) {
    var sh = document.documentElement.scrollHeight;
    var ch = window.innerHeight;
    // Exclude the artificial bottom inset (body padding-bottom) from the reading
    // range: it exists only to give the last line room to scroll clear of the
    // nav/audio chrome, not to represent unread content. Without this, a bani
    // whose real content fits on one screen becomes 65px "scrollable" and a
    // stray nudge would report pct 0, undoing its auto-100%; and a longer bani
    // would reach 100% only after scrolling through the blank inset.
    var pb = parseFloat(getComputedStyle(document.body).paddingBottom) || 0;
    var maxScroll = sh - ch - pb;
    if (maxScroll > 0) {
      var pct = (window.scrollY || window.pageYOffset) / maxScroll;
      if (pct < 0) pct = 0;
      if (pct > 1) pct = 1;
      window.ReactNativeWebView.postMessage("scroll-progress-" + pct.toFixed(4));
      // Measured here, behind the same guard as progress, so a position-restore
      // jump or a reflow never counts as reaching the top or the end.
      //
      // The END is where the page can scroll no further, not where pct hits 1.
      // pct stops counting at the bottom inset, so it reaches 1 the moment the
      // last line touches the bottom of the screen — and the nav bar, brought
      // back there, landed on those last lines instead of the blank inset left
      // under them for it. Waiting for the inset to be fully in view puts the
      // returning bars over that gap. 2px of slack for a fractional scrollY, the
      // same the auto-scroll stop uses.
      var y = window.scrollY || window.pageYOffset;
      var atEdge = y <= 0 || y + ch >= sh - 2;
      arrivedAtEdge = atEdge && !wasAtEdge;
      wasAtEdge = atEdge;
    }
  }

  if (typeof scrollFunc.y == "undefined") {
    scrollFunc.y = window.pageYOffset;
  }
  // A reflow moves the page under the reader without them touching it, and the
  // delta it produces reads as a deliberate scroll up — which brought the bars
  // back every time the phone was rotated, and took the progress track up with
  // them onto a nav bar the reader had hidden.
  if (arrivedAtEdge) {
    // Reaching the top or the end of the bani shows the header and nav bar,
    // in place of this tick's hide or show — scrolling down onto the last line
    // would otherwise hide them at exactly the moment the reader is done.
    // Posted during auto-scroll too, which stops at the end with the bars up.
    window.ReactNativeWebView.postMessage("edge");
  } else if (!reflowing && autoScrollSpeed == 0 && Date.now() > syncScrollUntil) {
    let diffY = scrollFunc.y - window.pageYOffset;
    // Scroll direction drives the bars: scrolling DOWN hides them, scrolling UP
    // restores them together. (A tap also toggles — see the touch handlers
    // below.) The syncScrollUntil guard keeps audio-sync/position-restore
    // scrolls from flickering the bars.
    if (diffY < -3) {
      // Scroll down — except while resting at the end, where a last settling
      // tick would take away the bars "edge" has just brought back. Scrolling
      // through the bottom inset on the way there still hides them: the bars
      // come back only once the inset is fully in view.
      if (!wasAtEdge) window.ReactNativeWebView.postMessage("hide");
    } else if (diffY > 3) {
      // Scroll up
      window.ReactNativeWebView.postMessage("show");
    }
  }
  scrollFunc.y = window.pageYOffset;
}

const getTopmostElementId=()=> {
  const viewportTop = window.pageYOffset;
  const viewportBottom = viewportTop + window.innerHeight;
  const viewportCenter = viewportTop + (window.innerHeight / 2);
  
  // Get all text items
  const textItems = document.querySelectorAll('.text-item[id]');
  
  let topmostElement = null;
  let minDistance = Infinity;
  
  // Find the element closest to the top of the viewport
  for (let i = 0; i < textItems.length; i++) {
    const element = textItems[i];
    const rect = element.getBoundingClientRect();
    const elementTop = rect.top + window.pageYOffset;
    const elementBottom = elementTop + rect.height;
    
    // Check if element is visible in viewport
    if (elementBottom >= viewportTop && elementTop <= viewportBottom) {
      // Calculate distance from viewport top
      const distance = Math.abs(elementTop - viewportTop);
      if (distance < minDistance) {
        minDistance = distance;
        topmostElement = element;
      }
    }
  }
  
  // If no element found in viewport, find the closest element above viewport
  if (!topmostElement) {
    for (let i = textItems.length - 1; i >= 0; i--) {
      const element = textItems[i];
      const rect = element.getBoundingClientRect();
      const elementTop = rect.top + window.pageYOffset;
      
      if (elementTop < viewportCenter) {
        topmostElement = element;
        break;
      }
    }
  }
  
  // Fallback: if still no element, use first element
  if (!topmostElement && textItems.length > 0) {
    topmostElement = textItems[0];
  }
  
  return topmostElement ? topmostElement.id : null;
}

const fadeInEffect = () => {
  let fadeTarget = ${body};
  fadeTarget.style.opacity = 0;
  let fadeVal = 0;
  let fadeEffect = setInterval(() => {
    if (fadeVal < 1) {
      fadeVal = Number(fadeVal) + 0.1;
      fadeTarget.style.opacity = fadeVal;
    } else {
      fadeTarget.style.opacity = 1;
      clearInterval(fadeEffect);
    }
  }, 100);
};
const setAutoScroll=()=> {
  // Cancel any existing animation
  clearScrollTimeout();

  if (autoScrollSpeed <= 0) return;

  lastFrameTime = performance.now();
  accumulatedScroll = 0;

  const scrollStep = (currentTime) => {
    if (autoScrollSpeed <= 0) {
      autoScrollRAF = null;
      return;
    }

    // Stop at bottom
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY || window.pageYOffset;
    const clientHeight = window.innerHeight;
    if (scrollTop + clientHeight >= scrollHeight - 2) {
      autoScrollRAF = null;
      return;
    }

    if (!isManuallyScrolling) {
      // Compute from live autoScrollSpeed so speed changes take effect immediately.
      const slider = Math.min(
        Math.max(autoScrollSpeed, AUTO_SCROLL_MIN_SPEED),
        AUTO_SCROLL_MAX_SPEED
      );
      const sliderFraction =
        (slider - AUTO_SCROLL_MIN_SPEED) / (AUTO_SCROLL_MAX_SPEED - AUTO_SCROLL_MIN_SPEED);
      const pxPerSecond =
        AUTO_SCROLL_MIN_PX_PER_SECOND +
        sliderFraction * (AUTO_SCROLL_MAX_PX_PER_SECOND - AUTO_SCROLL_MIN_PX_PER_SECOND);
      const deltaMs = currentTime - lastFrameTime;
      // Cap delta to prevent huge jumps after tab switch
      const deltaSec = Math.min(deltaMs / 1000, 0.05);
      accumulatedScroll += pxPerSecond * deltaSec;

      if (accumulatedScroll >= 0.5) {
        const px = accumulatedScroll;
        // Mark this as a programmatic scroll so scrollFunc doesn't count the
        // resulting scroll event as user activity that would block tap-to-toggle.
        lastAutoScrollTime = Date.now();
        window.scrollBy(0, px);
        accumulatedScroll = 0;
      }
    }

    lastFrameTime = currentTime;
    autoScrollRAF = requestAnimationFrame(scrollStep);
  };

  autoScrollRAF = requestAnimationFrame(scrollStep);
}

// Rotation: put the reader back where they were.
//
// Nothing reloads on rotation — the WebView is resized and Chromium reflows
// the text, so the document's height changes (landscape lines are about twice
// as wide, so the page is roughly half as tall) while the scroll offset in
// pixels stays as it was. That offset means a different place in the new
// layout, which is what threw the page down the bani.
//
// This used to run off "orientationchange" with a 50ms timeout, which fires
// BEFORE the new geometry exists: it measured the top line against a viewport
// mid-resize and smooth-scrolled to a target computed from the old layout. So
// each rotation displaced the page by a different amount — sometimes none,
// which is why it looked intermittent — and repeated rotations compounded it.
//
// The reflow is done when "resize" reports a new width. The anchor was
// captured by the scroll handler BEFORE it, so it describes where the user
// actually was. The restore is an instant scroll, not a smooth one: an
// animation runs over a layout that is still settling and lands elsewhere
// again.
const restoreAfterReflow = () => {
  reflowRestoreTimer = null;
  lastViewportWidth = window.innerWidth;
  const element = anchorElementId ? document.getElementById(anchorElementId) : null;
  if (!element) return;
  // The captured offset belongs to the old viewport; landscape is much
  // shorter, so clamp it into the new one. A line that began above the
  // viewport (offset < 0) is put at the top rather than scrolled past.
  const limit = Math.max(window.innerHeight - 40, 0);
  const offset = Math.min(Math.max(anchorViewportTop, 0), limit);
  const documentTop =
    element.getBoundingClientRect().top + (window.scrollY || window.pageYOffset);
  // Same suppressions as the load-time restore: this jump is not the user
  // reading, and must not toggle the nav bars.
  syncScrollUntil = Date.now() + 700;
  restoreScrollUntil = Date.now() + 700;
  window.scrollTo(0, Math.max(documentTop - offset, 0));
};

window.addEventListener(
  "resize",
  () => {
    // Only a width change re-wraps the text. Height alone changes for reasons
    // that reflow nothing.
    if (window.innerWidth === lastViewportWidth) return;
    if (reflowRestoreTimer) clearTimeout(reflowRestoreTimer);
    // Debounced: a rotation fires several resize events. Two frames after the
    // last one, the new layout is final.
    reflowRestoreTimer = setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(restoreAfterReflow);
      });
    }, 120);
  },
  false
);

${listener}.onload = () => {
  // Gated on the READING theme's base, not the app's: a dark reading theme needs
  // the same first-paint fade whether or not the app itself is in light mode.
  if (${readerTheme.base === "dark"}) {
  //fade event
fadeInEffect();
}
}


//  Listen for scroll events
${listener}.addEventListener(
  "scroll",
  (event)=> {
    // Clear our timeout throughout the scroll
    window.clearTimeout(isScrolling);
    // Set a timeout to run after scrolling ends
    isScrolling = setTimeout( ()=> {
      isManuallyScrolling = false;
    }, 300);
  },
  false
);



${listener}.onscroll = scrollFunc;

// Touch events for auto-scroll handling + tap detection.
let wasAutoScrolling = false;
// Tap detection: a touch that ends without meaningful movement is a tap and
// toggles the bars. A touch that moves (a scroll) never toggles — scrolling
// only hides (see scrollFunc). This keeps scroll gestures from flipping the
// bars, while a genuine tap still shows or hides them.
let tapStartX = 0;
let tapStartY = 0;
let tapStartTime = 0;
let tapMoved = false;
const TAP_MOVE_THRESHOLD = 10; // px
const resumeAutoScroll = () => {
  isManuallyScrolling = false;
  // Resume auto-scroll if it was active before touch
  if (wasAutoScrolling && autoScrollSpeed !== 0 && autoScrollRAF == null) {
    wasAutoScrolling = false;
    setAutoScroll();
  }
};
${listener}.addEventListener("touchstart", (e)=> {
  // Any touch on the reading area is "activity" — restarts the idle countdown
  // that auto-hides the bars during auto-scroll / audio playback.
  window.ReactNativeWebView.postMessage("activity");
  if (autoScrollSpeed !== 0) {
    wasAutoScrolling = true;
    clearScrollTimeout();
  }
  tapMoved = false;
  scrolledDuringTouch = false;
  tapStartTime = Date.now();
  if (e.touches && e.touches.length > 0) {
    tapStartX = e.touches[0].clientX;
    tapStartY = e.touches[0].clientY;
  }
});
${listener}.addEventListener("touchmove", (e)=> {
  isManuallyScrolling = true;
  if (!tapMoved && e.touches && e.touches.length > 0) {
    const dx = Math.abs(e.touches[0].clientX - tapStartX);
    const dy = Math.abs(e.touches[0].clientY - tapStartY);
    if (dx > TAP_MOVE_THRESHOLD || dy > TAP_MOVE_THRESHOLD) {
      tapMoved = true;
    }
  }
});
${listener}.addEventListener("touchend", ()=> {
  // A tap toggles the bars. It must be: quick, without finger movement, with no
  // scroll event during the touch, and not landing on still-settling momentum
  // (a tap-to-stop-scroll gesture). Any of these means it was a scroll, not a tap.
  const now = Date.now();
  const isTap =
    !tapMoved &&
    !scrolledDuringTouch &&
    (now - tapStartTime) < 300 &&
    (now - lastScrollTime) > 200;
  if (isTap) {
    window.ReactNativeWebView.postMessage("toggle");
  }
  resumeAutoScroll();
});
${listener}.addEventListener("touchcancel", resumeAutoScroll);

${listener}.addEventListener(
  "message",
  (event)=> {
    const message = JSON.parse(event.data);

    if (message.hasOwnProperty("bookmark")) {
      const element = document.getElementById(String(message.bookmark));
      if(!element){
        return;
      }
        // Manually scroll to the bookmarked element because location.hash is unreliable inside WebView HTML
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest"
      });
      const sequenceStringNormal=element.getAttribute("data-sequence");
      const sequenceStringParagraph=element.getAttribute("data-sequences");
      const sequenceString = sequenceStringNormal ? sequenceStringNormal : sequenceStringParagraph;
      window.ReactNativeWebView.postMessage("sequenceString-" + sequenceString);
      window.ReactNativeWebView.postMessage("hide");
    }
    if (message.hasOwnProperty("action") && message.action === "setBottomInset") {
      // Bottom inset so the last line can scroll clear of the audio player / nav
      // bar, which overlay the bottom of the WebView viewport when the bars are
      // visible. Applied as body padding-bottom (in CSS px ~= dp) rather than
      // baked into the HTML, so toggling audio never reloads/reflows the page.
      var inset = parseFloat(message.value);
      if (!isNaN(inset) && inset >= 0) {
        document.body.style.paddingBottom = inset + "px";
      }
      return;
    }
    if (message.hasOwnProperty("action") && message.action === "setTopMargin") {
      // A foldable's page margin follows the top inset, which changes when the
      // phone is folded or unfolded. Applied here rather than baked into the
      // HTML, because rebuilding the HTML reloads the page and loses the
      // reader's line. The margin sits above every line, so the page scrolls by
      // the same amount it grew and the text stays exactly where it was.
      var nextMargin = parseFloat(message.value);
      var prevMargin = parseFloat(getComputedStyle(document.body).marginTop) || 0;
      if (!isNaN(nextMargin) && nextMargin >= 0 && nextMargin !== prevMargin) {
        document.body.style.marginTop = nextMargin + "px";
        if ((window.scrollY || window.pageYOffset) > 0) {
          // Not the user reading, and must not toggle the nav bars.
          syncScrollUntil = Date.now() + 700;
          restoreScrollUntil = Date.now() + 700;
          window.scrollBy(0, nextMargin - prevMargin);
        }
      }
      return;
    }
    if (message.hasOwnProperty("resetHighlight")) {
      clearAllHighlights();
    }
    if (message.hasOwnProperty("freezeHighlight")) {
      if (highlightTimeout != null) {
        clearTimeout(highlightTimeout);
        highlightTimeout = null;
      }
    }
    if (message.hasOwnProperty("autoScroll")) {
      autoScrollSpeed = message.autoScroll;
      if (autoScrollRAF == null) {
        setAutoScroll();
      }
    }
      // Handle scroll to saved element or position
    if (message.hasOwnProperty("action") && message.action === "scrollToPosition") {
      let element = null;
      if (message.elementId) {
        element = document.getElementById(String(message.elementId));
      }
      // Fallback: locate by sequence so toggling paragraph mode mid-read
      // still restores position even though DOM ids changed.
      if (!element && message.sequence) {
        const seq = parseInt(message.sequence, 10);
        if (Number.isInteger(seq) && seq > 0) {
          element = document.querySelector('[data-sequences*="|' + seq + '|"]')
                 || document.querySelector('[data-sequence="' + seq + '"]');
        }
      }
      if (element) {
        // Programmatic position-restore — suppress the show/hide nav toggle
        // AND (separately) the scroll-progress completion tracking, since this
        // jump reflects a PREVIOUS session's position, not genuine reading now.
        syncScrollUntil = Date.now() + 700;
        restoreScrollUntil = Date.now() + 700;
        element.scrollIntoView({
          behavior: "auto",
          block: "start",
          inline: "nearest"
        });
        // The header FLOATS over the page, so "top of the viewport" is behind it.
        // Without this the restored line landed underneath the header and the
        // only way to see it was to scroll back up — which is what made a bani
        // look like it had opened part-scrolled.
        if (message.topInset) {
          window.scrollBy(0, -message.topInset);
        }
        // The normal scroll-progress report above is suppressed during
        // restoreScrollUntil (a restore isn't genuine reading), which also leaves
        // the visual progress bar empty despite the restored scroll position.
        // Emit the restored position on a SEPARATE channel so RN fills the bar to
        // match WITHOUT counting it toward completion. rAF lets the jump settle
        // so scrollY is accurate.
        requestAnimationFrame(function () {
          var sh = document.documentElement.scrollHeight;
          var ch = window.innerHeight;
          var pb = parseFloat(getComputedStyle(document.body).paddingBottom) || 0;
          var maxScroll = sh - ch - pb;
          if (maxScroll > 0) {
            var rpct = (window.scrollY || window.pageYOffset) / maxScroll;
            if (rpct < 0) rpct = 0;
            if (rpct > 1) rpct = 1;
            window.ReactNativeWebView.postMessage("scroll-progress-restore-" + rpct.toFixed(4));
          }
        });
      }
      return;
    }
      // Handle sync scroll to sequence
    if (message.hasOwnProperty("action") && message.action === "scrollToSequence") {
      // Sanitize and validate sequence number
      const sequenceNumber = parseInt(message.sequence, 10);
      const isParagraphMode = message.isParagraphMode;
      const timeOut = message.timeout;
      
      // Validate that it's a valid positive integer
      if (!Number.isInteger(sequenceNumber) || sequenceNumber < 1) {
        return;
      }
      
      let element = null;
      
      if (isParagraphMode) {
        // Use CSS selector trick with pipe delimiters for instant match
        element = document.querySelector('[data-sequences*="|' + sequenceNumber + '|"]');
      } else {
        element = document.querySelector('[data-sequence="' + sequenceNumber + '"]');
      }
      
      if (element) {
        // Find the gurmukhi div within the element
        const gurmukhiDiv = element.querySelector('.gurmukhi') || element;
        
        // Check if this is the same element as last time
        const isSameElement = lastHighlightedElement === element;
        
        // Clear previous highlight timeout if exists
        if (highlightTimeout) {
          clearTimeout(highlightTimeout);
          highlightTimeout = null;
        }
        
        // Remove highlight from previous element if different (its enlarged
        // line is cleared by the sweep inside setEnlarged below)
        if (lastHighlightedElement && !isSameElement) {
          lastHighlightedElement.style.backgroundColor = lastHighlightedElement.dataset.origBg || '';
          lastHighlightedElement.style.width = lastHighlightedElement.dataset.origWidth || '';
          lastHighlightedElement.style.margin = lastHighlightedElement.dataset.origMargin || '';
          lastHighlightedElement.style.transition = '';
        }

        // Only snapshot original styles the first time this element is highlighted.
        // Re-highlighting the same element (e.g. multiple sequences in one paragraph)
        // must NOT overwrite origBg — it would capture the highlight colour and make
        // clearAllHighlights restore to the highlight colour instead of transparent.
        if (!isSameElement) {
          element.dataset.origBg = element.style.backgroundColor;
          element.dataset.origWidth = element.style.width;
          element.dataset.origMargin = element.style.margin;
        }
        const originalBackgroundColor = element.dataset.origBg || '';
        const originalWidth = element.dataset.origWidth || '';
        const originalMargin = element.dataset.origMargin || '';

        // Apply highlight
        element.style.backgroundColor = "${readerTheme.highlight.color}";
        element.style.borderRadius = "15px";
        element.style.width = "fit-content";

        // Preserve alignment when using fit-content. The alignment class lives on
        // the inner gurmukhi div, not on the outer .text-item (element).
        if (gurmukhiDiv.classList.contains("center")) {
          element.style.margin = "0 auto";
        } else if (gurmukhiDiv.classList.contains("right")) {
          element.style.marginLeft = "auto";
          element.style.marginRight = "0";
        }

        // Enlarge ONLY the sung line — BEFORE scrolling, so the centering math
        // sees the final (highlighted + enlarged) layout.
        const enlarged = setEnlarged(element, sequenceNumber, isParagraphMode);
        const scrollTarget = enlarged || gurmukhiDiv;

        // Scroll whenever the SUNG LINE changes — including line changes within
        // one merged paragraph (.pline target). The old element-level check
        // centered a long paragraph once and later lines could sit off-screen.
        if (scrollTarget !== lastEnlargedTarget) {
          // Programmatic sync-scroll — suppress scrollFunc's show/hide so the
          // nav bar the user chose to keep visible isn't collapsed by it.
          syncScrollUntil = Date.now() + 700;
          const behavior = message.behavior === "smooth" ? "smooth" : "auto";
          scrollTarget.scrollIntoView({
            behavior: behavior,
            block: "center",
            inline: "nearest"
          });
        }
        lastEnlargedTarget = scrollTarget;

        // Store current element
        lastHighlightedElement = element;

        // Remove highlight after timeout
        highlightTimeout = setTimeout(()=> {
          clearEnlarged();
          lastEnlargedTarget = null;
          element.style.backgroundColor = originalBackgroundColor;
          element.style.width = originalWidth;
          element.style.margin = originalMargin;
          highlightTimeout = null;
        }, timeOut);
      }
    }
  },
  false
);
      `;
};
export default script;
