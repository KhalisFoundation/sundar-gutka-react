import { Platform } from "react-native";

const script = (nightMode, position) => {
  const listener = Platform.OS === "android" ? "document" : "window";
  const body = Platform.OS === "android" ? "document.body" : "window.document.body";
  return `

let autoScrollTimeout;
let autoScrollSpeed = 0;
let scrollMultiplier = 1.5;
let dragging = false;
let holding = false;
let holdTimer;
let curPosition = 0;
let isScrolling;
let isManuallyScrolling = false;

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

const handleTouchEnd = () => {
  clearTimeout(holdTimer);
  if (autoScrollSpeed !== 0 && autoScrollTimeout === null) {
    setTimeout(()=> {
      window.ReactNativeWebView.postMessage("hide");
    }, 5000);
    setAutoScroll();
  }
  if (!dragging && !holding) {

    window.ReactNativeWebView.postMessage("toggle");
  }
  dragging = false;
  holding = false;
}
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

window.onload = () => {
  if (${nightMode}) {
  //fade event
fadeInEffect();
}

  scrollToPosition(); 
}


//  Listen for scroll events
window.addEventListener(
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



window.onscroll = scrollFunc;
window.addEventListener("touchstart", ()=> {
  if (autoScrollSpeed !== 0) {
    clearScrollTimeout();
  }
  dragging = false;
  holding = false;
  holdTimer = setTimeout(()=> {
    holding = true;
  }, 1000); // Longer than 1 seconds is not a tap
});
window.addEventListener("touchmove", ()=> {
  isManuallyScrolling = true;
  dragging = true;
});

window.addEventListener("touchend", handleTouchEnd);

${listener}.addEventListener(
  "message",
  (event)=> {
    const message = JSON.parse(event.data);

    if (message.hasOwnProperty("Back")) {
      const currentPosition = getScrollPercent();
      window.ReactNativeWebView.postMessage("save-" + currentPosition);
    }

    if (message.hasOwnProperty("bookmark")) {
      location.hash = "#" + message.bookmark;
      window.ReactNativeWebView.postMessage("hide");
    } 
    if (message.hasOwnProperty("autoScroll")) {
      autoScrollSpeed = message.autoScroll;
      scrollMultiplier = message.scrollMultiplier;
      if (autoScrollTimeout == null) {
        setAutoScroll();
      }
    }
  },
  false
);
      `;
};
export default script;
