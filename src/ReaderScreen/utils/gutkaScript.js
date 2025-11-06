import { Platform } from "react-native";

const script = (theme, position) => {
  const listener = Platform.OS === "android" ? "document" : "window";
  const body = Platform.OS === "android" ? "document.body" : "window.document.body";
  return `

let autoScrollTimeout;
let autoScrollSpeed = 0;
let scrollMultiplier = 1.5;
let curPosition = 0;
let isScrolling;
let isManuallyScrolling = false;
let lastHighlightedElement = null;
let highlightTimeout = null;

const clearScrollTimeout=()=> {
  if (autoScrollTimeout != null) {
    clearTimeout(autoScrollTimeout);
  }
  autoScrollTimeout = null;
}

const scrollFunc=(e)=> {
  curPosition = getScrollPercent();
  window.ReactNativeWebView.postMessage("scroll-" + curPosition);
  if (window.scrollY == 0) {
    window.ReactNativeWebView.postMessage("show");
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

const getScrollPercent=()=> {
  return window.pageYOffset / (document.body.scrollHeight - window.innerHeight);
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

// Remove handleTouchEnd since we're handling toggle at React Native level
const scrollToPosition=()=> {
  let scrollY = (document.body.scrollHeight - window.innerHeight) * ${position};
  window.scrollTo(0, scrollY);
  curPosition = scrollY;
}

window.addEventListener(
  "orientationchange",
   ()=> {
    setTimeout(()=> {
      let scrollY = (document.body.scrollHeight - window.innerHeight) * curPosition;
      window.scrollTo(0, scrollY);
      curPosition = scrollY;
    }, 50);
  },
  false
);

${listener}.onload = () => {
  if (${theme.mode === "dark"}) {
  //fade event
fadeInEffect();
}

  scrollToPosition(); 
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
    }, 66);
  },
  false
);



${listener}.onscroll = scrollFunc;
// Touch events for auto-scroll handling only
${listener}.addEventListener("touchstart", ()=> {
  if (autoScrollSpeed !== 0) {
    clearScrollTimeout();
  }
});
${listener}.addEventListener("touchmove", ()=> {
  isManuallyScrolling = true;
});

${listener}.addEventListener(
  "message",
  (event)=> {
    const message = JSON.parse(event.data);

    if (message.hasOwnProperty("Back")) {
      const currentPosition = getScrollPercent();
      window.ReactNativeWebView.postMessage("save-" + currentPosition);
    }

    if (message.hasOwnProperty("bookmark")) {
      const element = document.getElementById(message.bookmark);
      const sequenceStringNormal=element.getAttribute("data-sequence");
      const sequenceStringParagraph=element.getAttribute("data-sequences");
      const sequenceString=sequenceStringNormal?sequenceStringNormal:sequenceStringParagraph;

      location.hash = "#" + message.bookmark;
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
          element.scrollIntoView({
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
