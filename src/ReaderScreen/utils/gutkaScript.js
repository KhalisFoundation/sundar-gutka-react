import { Platform } from "react-native";

const script = (theme) => {
  const listener = Platform.OS === "android" ? "document" : "window";
  const body = Platform.OS === "android" ? "document.body" : "window.document.body";
  return `

let autoScrollTimeout;
let autoScrollSpeed = 0;
let scrollMultiplier = 1.5;
let isScrolling;
let isManuallyScrolling = false;
let lastHighlightedElement = null;
let highlightTimeout = null;
let scrollbar = null;
let resizeListener = null;

const clearScrollTimeout=()=> {
  if (autoScrollTimeout != null) {
    clearTimeout(autoScrollTimeout);
  }
  autoScrollTimeout = null;
}

const updateScrollbar = () => {
  if (!scrollbar) return;
  const maxScrollHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) - window.innerHeight;
  if (maxScrollHeight <= 0) {
    scrollbar.style.display = "none";
    return;
  }
  scrollbar.style.display = "block";
  const scrollPosition = Math.max(0, Math.min(1, (window.pageYOffset || 0) / maxScrollHeight));
  const thumbHeight = Math.max(30, (window.innerHeight / maxScrollHeight) * window.innerHeight);
  const thumbElement = scrollbar.children[0];
  if (thumbElement) {
    thumbElement.style.height = thumbHeight + "px";
    thumbElement.style.top = (scrollPosition * (window.innerHeight - thumbHeight)) + "px";
  }
}

const scrollFunc = (event) => {
  updateScrollbar();
  const elementId = getTopmostElementId();
  if (elementId) {
    window.ReactNativeWebView.postMessage("scroll-elementId-" + elementId);
  }
  if (window.scrollY == 0) {
    window.ReactNativeWebView.postMessage("show");
  }

  // Check if user has reached the end of the document
  const scrollHeight = document.documentElement.scrollHeight;
  const scrollTop = window.scrollY || window.pageYOffset;
  const clientHeight = window.innerHeight;
  const threshold = 50; // pixels from bottom to consider "at end"
  const isAtEnd = scrollTop + clientHeight >= scrollHeight - threshold;
  
  if (isAtEnd) {
    window.ReactNativeWebView.postMessage("reached-end");
  }

  if (typeof scrollFunc.y == "undefined") {
    scrollFunc.y = window.pageYOffset;
  }
  if (autoScrollSpeed == 0) {
    let diffY = scrollFunc.y - window.pageYOffset;
    if (diffY < 0) {
      // Scroll down
      if (diffY < -3) {
        window.ReactNativeWebView.postMessage("hide");
      }
    } else if (diffY > 5) {
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
  const speed = autoScrollSpeed;
  if (speed > 0) {
    if (!isManuallyScrolling) {
      window.scrollBy({
        behavior: "auto",
        left: 0,
        top: 1,
      });
    }
    autoScrollTimeout = setTimeout(()=> {
      setAutoScroll();
    }, (200 - speed * 2) / scrollMultiplier);
  } else {
    clearScrollTimeout();
  }
}

window.addEventListener(
  "orientationchange",
   ()=> {
    setTimeout(()=> {
      const elementId = getTopmostElementId();
      if (elementId) {
        const element = document.getElementById(String(elementId));
        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "start",
            inline: "nearest"
          });
        }
      }
    }, 50);
  },
  false
);

// Use window.onload for Android reliability
window.onload = () => {
  if (${theme.mode === "dark"}) {
    //fade event
    fadeInEffect();
  }

  // Minimal scrollbar - works on Android and iOS
  scrollbar = document.createElement("div");
  scrollbar.id = "sb";
  const scrollbarThumb = document.createElement("div");
  scrollbarThumb.id = "sb-t";
  scrollbar.appendChild(scrollbarThumb);
  document.body.appendChild(scrollbar);
  // Update scrollbar after a short delay
  setTimeout(updateScrollbar, 100);
  
  if (resizeListener !== null) {
    window.removeEventListener("resize", resizeListener);
  }
  
  // Store reference to the resize listener
  resizeListener = updateScrollbar;
  window.addEventListener("resize", resizeListener);
}


//  Listen for scroll events
${listener}.addEventListener(
  "scroll",
  (scrollEvent) => {
    // Clear our timeout throughout the scroll
    window.clearTimeout(isScrolling);
    // Set a timeout to run after scrolling ends
    isScrolling = setTimeout( ()=> {
      isManuallyScrolling = false;
    }, 66);
  },
  false
);



${listener}.onscroll = scrollFunc;
// Touch events for auto-scroll handling only
let wasAutoScrolling = false;
const resumeAutoScroll = () => {
  isManuallyScrolling = false;
  // Resume auto-scroll if it was active before touch
  if (wasAutoScrolling && autoScrollSpeed !== 0 && autoScrollTimeout == null) {
    wasAutoScrolling = false;
    setAutoScroll();
  }
};
${listener}.addEventListener("touchstart", ()=> {
  if (autoScrollSpeed !== 0) {
    wasAutoScrolling = true;
    clearScrollTimeout();
  }
});
${listener}.addEventListener("touchmove", ()=> {
  isManuallyScrolling = true;
});
${listener}.addEventListener("touchend", resumeAutoScroll);
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
    if (message.hasOwnProperty("autoScroll")) {
      autoScrollSpeed = message.autoScroll;
      scrollMultiplier = message.scrollMultiplier;
      if (autoScrollTimeout == null) {
        setAutoScroll();
      }
    }
      // Handle scroll to saved element or position
    if (message.hasOwnProperty("action") && message.action === "scrollToPosition") {
      // Try element ID first if provided
      if (message.elementId) {
        const element = document.getElementById(String(message.elementId));
        if (element) {
          element.scrollIntoView({
            behavior: "auto",
            block: "start",
            inline: "nearest"
          });
          console.log("No Element Found");
          return;
        }
      }
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
        
        // Remove highlight from previous element if different
        if (lastHighlightedElement && !isSameElement) {
          lastHighlightedElement.style.backgroundColor = '';
          lastHighlightedElement.style.transition = '';
        }
        
        // Only scroll if it's a different element
        if (!isSameElement) {
          const behavior = message.behavior === "smooth" ? "smooth" : "auto";
          gurmukhiDiv.scrollIntoView({
            behavior: behavior,
            block: "center",
            inline: "nearest"
          });
        }
        
        // Apply highlight
        const originalBackgroundColor = element.style.backgroundColor;
        element.style.backgroundColor = "${theme.staticColors.HIGHLIGHT_COLOR}";
        element.style.borderRadius = "15px";
        element.style.transition = "background-color 0.3s ease";
        
        // Store current element
        lastHighlightedElement = element;
        
        // Remove highlight after timeout
        highlightTimeout = setTimeout(()=> {
          element.style.backgroundColor = originalBackgroundColor;
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
