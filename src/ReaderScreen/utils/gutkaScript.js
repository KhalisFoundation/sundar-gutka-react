import { Platform } from "react-native";

const script = (nightMode, position) => {
  const listener = Platform.OS === "android" ? "document" : "window";
  return `

let autoScrollTimeout;
let autoScrollSpeed = 0;
let scrollMultiplier = 1.0;
let dragging = false;
let holding = false;
let holdTimer;
let curPosition = 0;
let isScrolling;
let isManuallyScrolling = false;
let initialDistance = null;
let fontSize=22; // Starting font size in pixels
let maxFontSize = 54; // Maximum font size in pixels
let minFontSize = 18; // Minimum font size in pixels
let scale=1;

window.addEventListener(
  "orientationchange",
  function () {
    setTimeout(function () {
      let scrollY = (document.body.scrollHeight - window.innerHeight) * curPosition;
      window.scrollTo(0, scrollY);
      curPosition = scrollY;
    }, 50);
  },
  false
);

(function scrollToPosition() {
  setTimeout(function () {
    let scrollY = (document.body.scrollHeight - window.innerHeight) * ${position};
    window.scrollTo(0, scrollY);
    curPosition = scrollY;
  }, 50);
})();

function getScrollPercent() {
  return window.pageYOffset / (document.body.scrollHeight - window.innerHeight);
}

//  Listen for scroll events
window.addEventListener(
  "scroll",
  function (event) {
    // Clear our timeout throughout the scroll
    window.clearTimeout(isScrolling);
    // Set a timeout to run after scrolling ends
    isScrolling = setTimeout(function () {
      isManuallyScrolling = false;
    }, 66);
  },
  false
);

if (${nightMode}) {
  //fade event
  // window.addEventListener("load", fadeInEffect(), false);

  function fadeInEffect() {
    let fadeTarget = document.getElementsByTagName("HTML")[0];
    fadeTarget.style.opacity = 0;
    let fadeEffect = setInterval(function () {
      if (Number(fadeTarget.style.opacity) < 1) {
        fadeTarget.style.opacity = Number(fadeTarget.style.opacity) + 0.1;
      } else {
        fadeTarget.style.opacity = 1;
      }
    }, 100);
  }
}
function setAutoScroll() {
  let speed = autoScrollSpeed;
  if (speed > 0) {
    if (!isManuallyScrolling) {
      window.scrollBy({
        behavior: "auto",
        left: 0,
        top: 1,
      });
    }
    autoScrollTimeout = setTimeout(function () {
      setAutoScroll();
    }, (200 - speed * 2) / scrollMultiplier);
  } else {
    clearScrollTimeout();
  }
}

function clearScrollTimeout() {
  if (autoScrollTimeout != null) {
    clearTimeout(autoScrollTimeout);
  }
  autoScrollTimeout = null;
}

function scrollFunc(e) {
  curPosition = getScrollPercent();
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
window.onscroll = scrollFunc;
function getDistance(touch1, touch2) {
  const dx = touch1.pageX - touch2.pageX;
  const dy = touch1.pageY - touch2.pageY;
  return Math.sqrt(dx * dx + dy * dy);
}

window.addEventListener("touchstart", function (event) {
   if (event.touches.length === 2) {
    // Start the pinch
    initialDistance = getDistance(event.touches[0], event.touches[1]);
  }
  if (autoScrollSpeed !== 0) {
    clearScrollTimeout();
  }
  dragging = false;
  holding = false;
  holdTimer = setTimeout(function () {
    holding = true;
  }, 125); // Longer than 125 milliseconds is not a tap
},false);

window.addEventListener("touchmove", function (event) {
  if (event.touches.length === 2) {
    // Calculate the change in distance between the two touches
    const distance = getDistance(event.touches[0], event.touches[1]);
     const scale = distance / initialDistance;
    fontSize = Math.max(minFontSize, Math.min(maxFontSize, fontSize * scale));

    var items = document.querySelectorAll('.content-item');
          items.forEach(function(item) {
              item.style.fontSize = fontSize + 'px';
          });

    // Update the initial distance for the next move
    initialDistance = distance;
    // scale = newScale;
  }
  isManuallyScrolling = true;
  dragging = true;
});

window.addEventListener("touchend", function (event) {
if (event.touches.length < 2) {
    // Reset initial distance when touches end
    window.ReactNativeWebView.postMessage("fontSize-" + fontSize);
    initialDistance = null;
  }
  
    clearTimeout(holdTimer);
  if (autoScrollSpeed !== 0 && autoScrollTimeout === null) {
    setTimeout(function () {
      window.ReactNativeWebView.postMessage("hide");
    }, 5000);
    setAutoScroll();
  }
  if (!dragging && !holding) {
    window.ReactNativeWebView.postMessage("toggle");
  }

  dragging = false;
  holding = false;
},false);

${listener}.addEventListener(
  "message",
  function (event) {
    let message = JSON.parse(event.data);

    if (message.hasOwnProperty("Back")) {
      currentPosition = getScrollPercent();
      window.ReactNativeWebView.postMessage("save-" + currentPosition);
    }
    if(message.hasOwnProperty("fontSize")){
      
      fontSize=message.fontSize;
      console.log("fontSize",fontSize);
    }

    if (message.hasOwnProperty("bookmark")) {
      location.hash = "#" + message.bookmark;
      
        window.ReactNativeWebView.postMessage("hide");
    }
    if (message.hasOwnProperty("autoScroll")) {
      autoScrollSpeed = message.autoScroll;
      scrollMultiplier = message.scrollMultiplier;
      if (autoScrollSpeed !== 0) {
        setTimeout(() => {
          window.ReactNativeWebView.postMessage("toggle");
        }, 5000);
      }
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
