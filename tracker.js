/* eslint-disable no-console */
/**
 * @package    block_eventtrack
 * @copyright  2020 Daniel Biedermann <biedermann@dipf.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
const MOUSE_MOVE_TRACKING_INTERVAL = 50; // Delay between successive mouse movement samples
const MOUSE_MOVE_POSTING_DELAY = 2000; // Delay between successive posts of the mouse movement data
const SCROLL_TRACKING_INTERVAL = 333; // Delay between successive scroll samples
const RESIZE_TRACKING_INTERVAL = 333; // Delay between successive resizing samples
const INTERSECTION_TRACKING_INTERVAL = 500; // Deltay between successive intersection observer tracks
const INTERSECTION_STEPS = [0.2, 0.4, 0.6, 0.8, 1.0];

let IRS_USER = 'user';
let IRS_PASSWORD = 'user';
let IRS_URL = 'https://tracking.difa.edutec.science/datums';
let USERID = "";

/**
 * @param {payload} data
 * @return {promise} the response from the server
 */
export function postData(data) {
  const response = fetch(IRS_URL, {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Basic " + window.btoa(`${IRS_USER}:${IRS_PASSWORD}`),
    },
    body: JSON.stringify(data),
  })
    .then((response) => response)
    // eslint-disable-next-line no-console
    .catch((error) => console.log(error));
  return response;
}

/**
 *
 * @param {string} eventName
 * @param {payload} payloadData
 * @return {eventdata} event data for the IRS
 */
export function createTrackingEvent(eventName, payloadData) {
  return {
    name: eventName,
    timestamp: getTimestamp(),
    payload: {
      url: window.location.href,
      userid: USERID,
      tabid: getTabId(),
      ...payloadData,
    },
  };
}

const getTimestamp = () => Date.now();

/**
 * Returns the element id or null. This function exists because if element.id is undefined, it not be added to the JSON
 * thereby potentially causing annoying parsing afterwards. Therefore, we ensure that it the element is always present
 * @param {DOMElement} element
 * @returns {string} The element id if there is one, otherwise null
 */
const getElementId = (element) => element.id ? element.id : null;

const getTabId = () => window.tabId;

/**
 * Sets an Id to identify the tab that is then stored in session storage.
*/
function setTabId() {
  if (sessionStorage.tabId && sessionStorage.closedLastTab !== "2") {
    window.tabId = sessionStorage.tabId;
  } else {
    sessionStorage.tabId = Math.floor(Math.random() * 1000000000);
    window.tabId = sessionStorage.tabId;
  }

  sessionStorage.closedLastTab = '2';

  window.addEventListener("unload beforeunload", () => {
    sessionStorage.closedLastTab = '1';
  });
}

/**
 * Posts the user agent
 * @param {string} userid
 */
function postUserAgent() {
  const userAgent = navigator.userAgent;
  const userAgentData = {
    userAgent,
  };
  postData(createTrackingEvent("useragent", userAgentData));
}

/**
 * Tracks and posts the mouse leave event
 */
function trackMouseLeave() {
  const mouseLeave = () => {
    postData(createTrackingEvent("mouseleave", {}));
  };
  document.body.addEventListener("mouseleave", mouseLeave);
}

/**
 * Tracks and posts the mouse enter event
 */
function trackMouseEnter() {
  const mouseEnter = () => {
    postData(createTrackingEvent("mouseenter", {}));
  };
  document.body.addEventListener("mouseenter", mouseEnter);
}

/**
 * Tracks whenever the context menu is opened
 */
function trackContextMenu() {
  const contextMenu = () => {
    postData(createTrackingEvent("contextmenu", {}));
  };
  document.body.addEventListener("contextmenu", contextMenu);
}


/**
 * Tracks and posts the mouse enter event
 */
function trackMouseClick() {
  document.onclick = (event) => {

    let href = event.target.href ? event.target.href : null;
    // Check if the clicked element is part of a link
    if (!href) {
      let parentA = event.target.closest("a");
      if (parentA) {
        href = parentA.href;
      }
    }

    const clickData = {
      ...getDataAttributes(event.target),
      id: getElementId(event.target),
      elementClasses: event.target.classList,
      nodeName: event.target.nodeName,
      href,
    };
    postData(createTrackingEvent("click", clickData));
  };
}

/**
 * Returns the data-attributes of interest for an an element
 * @param {DOMElement} element
 * @returns {Object} Object containing the data-attributes
 */
function getDataAttributes(element) {
  let dataset = {
    topic: null,
    category: null,
    resource: null
  };
  if (element.dataset.topic) {
    dataset.topic = element.dataset.topic;
  }
  if (element.dataset.category) {
    dataset.category = element.dataset.category;
  }
  if (element.dataset.resource) {
    dataset.resource = element.dataset.resource;
  }
  return dataset;
}

/**
 * Tracks and posts whenever a user has text in their clipboard.
 * @param {string} userid
 */
function trackTextSelection() {
  const mouseUp = (event) => {
    const textSelection = window.getSelection().toString();
    if (textSelection.length) {
      const selectionData = {
        text: textSelection,
        element: {
          ...getDataAttributes(event.target),
          classes: event.target.classList,
          id: getElementId(event.target),
          name: event.target.nodeName,
        },
      };
      postData(createTrackingEvent("textselection", selectionData));
    }
  };
  window.addEventListener("mouseup", mouseUp);
}

/**
 * Tracks and posts the visibility of elements with the intersection observer API
 * @param {string} userid
 */
function trackIntersection() {
  const options = {
    rootMargin: "0px",
    threshold: INTERSECTION_STEPS,
  };
  let postTime = true;
  const callback = (entries) => {

    if (!postTime) {
      return;
    }
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        let intersectionData = {
          intersectionRatio: entry.intersectionRatio,
          isIntersecting: entry.isIntersecting,
          boundingClientRect: entry.boundingClientRect,
          intersectionRect: entry.intersectionRect,
          id: getElementId(entry.target),
          ...getDataAttributes(entry.target)
        };
        postData(
          createTrackingEvent("intersection", intersectionData)
        );
      }
    });

    postTime = false;
    setTimeout(() => {
      postTime = true;
    }, INTERSECTION_TRACKING_INTERVAL);
  };
  let observer = new IntersectionObserver(callback, options);

  getScrollTrackables().forEach((t) => observer.observe(t));
}

/**
 * Tracks and posts the mouse move events
 * Mouse movement tracking intervals are defined with MOVE_MOVE_TRACKING_INTERVAL
 * All mouse movements that are tracked within the MOUSE_MOVE_POSTING_DELAY are batch-sent to the IRS
 */
function trackMouseMove() {
  let timer = null;
  let lastTime = 0;
  let positions = [];
  document.onmousemove = (e) => {
    const timestamp = Date.now();
    if (timestamp - lastTime >= MOUSE_MOVE_TRACKING_INTERVAL) { // Mouse movenets are tracked once every X ms
      positions.push({
        timestamp,
        x: e.pageX,
        y: e.pageY,
      });
      lastTime = timestamp;
    }
    if (!timer) {
      timer = setTimeout(() => {
        const mouseMoveData = {
          positions,
        };
        postData(createTrackingEvent("mousemove", mouseMoveData));
        positions = [];
        timer = null;
      }, MOUSE_MOVE_POSTING_DELAY);
    }
  };
}

const getParagraphs = () => document.querySelectorAll("[data-category='paragraph']");

const getFeedbackElements = () => document.querySelectorAll(".feedback");

const getReferences = () => document.querySelectorAll("[data-category='bibliography']");

const getMediaElements = () => document.querySelectorAll("audio, video");

const getScrollTrackables = () => [...getParagraphs(), ...getFeedbackElements(), ...getReferences(), ...getMediaElements()];

/**
 * Tracks the x- and y-position of all the elements that have the data-category=paragraph attribute
 */
function postElementPositions() {
  const elements = getScrollTrackables();
  const paragraphs = [];

  for (var i = 0; i < elements.length; i++) {
    const box = elements[i].getBoundingClientRect();
    paragraphs.push({
      ...getDataAttributes(elements[i]),
      id: getElementId(elements[i]),
      y: box.top + window.scrollY,
      x: box.left + window.scrollX,
      w: elements[i].offsetWidth,
      h: elements[i].offsetHeight,
    });
  }
  const positionData = {
    paragraphs,
  };
  if (paragraphs.length > 0) {
    postData(createTrackingEvent("positions", positionData));
  }
}

const postViewport = () => {
  const viewportData = {
    viewport: {
      y: window.scrollY,
      x: window.scrollX,
      w: window.innerWidth,
      h: window.innerHeight,
    },
  };
  postData(createTrackingEvent("viewport", viewportData));
};

/**
 * Listens to the "scroll" and "resize" events and posts the updated element positions
 */
function trackPositionsAndViewport() {
  postElementPositions();
  postViewport();
  let buffer1 = null;
  window.addEventListener("resize", () => {
    clearTimeout(buffer1);
    buffer1 = setTimeout(() => {
      postElementPositions();
      postViewport();
    }, RESIZE_TRACKING_INTERVAL);
  });
  let buffer2 = null;
  window.addEventListener("scroll", () => {
    if (!buffer2) {
      buffer2 = setTimeout(() => {
        postViewport();
        buffer2 = null;
      }, SCROLL_TRACKING_INTERVAL);
    }
  });
}

/**
 * Listens to the "copy" event and posts the data
 */
function trackCopy() {
  document.addEventListener("copy", (event) => {
    const selection = window.getSelection();
    const copyData = {
      selection: selection.toString(),
      element: {
        classes: event.target.classList,
        id: getElementId(event.target),
        name: event.target.nodeName,
      },
    };
    postData(createTrackingEvent("copy", copyData));
  });
}

/**
 * Tracks the blur event
 */
function trackBlur() {
  window.addEventListener("blur", () => {
    const blurData = {};
    postData(createTrackingEvent("blur", blurData));
  });
}

/**
 * Tracks the focus event
 */
function trackFocus() {
  window.addEventListener("focus", () => {
    const focusData = {};
    postData(createTrackingEvent("focus", focusData));
  });
}

/**
 * Tracks all resizes of region-main
 */
function trackResize() {
  const resize = () => {
    postElementPositions();
    postViewport();
  };

  let main = document.getElementById("region-main");

  if (main) {
    new ResizeObserver(resize).observe(document.getElementById("region-main"));
  }
}

/**
 * Tracks the toggling of <detail> elements
 */
function trackDetailToggle() {

  const detailElements = document.querySelectorAll("details");
  if (detailElements) {
    detailElements.forEach((detail) => {
      detail.addEventListener("toggle", (event) => {
        const toggleData = {
          open: event.target.open,
          id: event.target.id,
          ...getDataAttributes(event.target)
        };
        postData(createTrackingEvent("detailsToggle", toggleData));

        setTimeout(() => postElementPositions(), 100);
      });
    });
  }

}
/**
 * Tracks the toggling of <detail> elements
 * @param {string} userid
 */
function trackQuizInputChange(userid) {
  let inputs = [...document.querySelectorAll("input[type='checkbox']", "input[type='radio']")];
  inputs.forEach((inputElement) => {
    inputElement.addEventListener("change", (event) => {
      // Part of the information that needs to be extracted is NOT IN THE INPUT ELEMENT ITSELF,
      // but instead in a paragraph further down the tree
      let dataCatChild = event.target.parentNode.querySelector("[data-category='quiz-answer']");
      let id = "";
      if (dataCatChild) {
        id = dataCatChild.id;
      } else {
        id = event.target.id;
      }

      const inputData = {
        quizInputId: event.target.id,
        checked: event.target.checked,
        id,
        ...getDataAttributes(dataCatChild)
      };
      postData(createTrackingEvent(userid, "quizInputChange", inputData));
    });
  });
}

/**
 * Sends an event when the "unload" event is raised
 */
function trackTabLeave() {
  window.addEventListener("beforeunload", () => {
    postData(createTrackingEvent("unload", {}));
  });
}

// eslint-disable-next-line require-jsdoc
function trackMediaEvents() {
  document.querySelectorAll("audio, video").forEach((mediaElement) => {

    let getEventData = (el) => {
      return {
        currentTime: el.currentTime,
        src: el.currentSrc,
        duration: el.duration,
        paused: el.paused,
        volume: el.volume
      };
    };

    mediaElement.addEventListener("play", (event) => {
      let eventData = getEventData(event.target);
      postData(createTrackingEvent("mediaPlay", eventData));
    });

    mediaElement.addEventListener("pause", (event) => {
      let eventData = getEventData(event.target);
      postData(createTrackingEvent("mediaPause", eventData));
    });

    mediaElement.addEventListener("volumechange", (event) => {
      let eventData = getEventData(event.target);
      postData(createTrackingEvent("mediaVolumeChange", eventData));
    });

    mediaElement.addEventListener("ended", (event) => {
      let eventData = getEventData(event.target);
      postData(createTrackingEvent("mediaEnded", eventData));
    });

    mediaElement.addEventListener("interrupted", (event) => {
      let eventData = getEventData(event.target);
      postData(createTrackingEvent("mediaInterrupted", eventData));
    });

    mediaElement.addEventListener("seeked", (event) => {
      let eventData = getEventData(event.target);
      postData(createTrackingEvent("mediaSeeked", eventData));
    });

    mediaElement.addEventListener("ratechange", (event) => {
      let eventData = getEventData(event.target);
      postData(createTrackingEvent("mediaRateChange", eventData));
    });

    document.addEventListener("webkitfullscreenchange mozfullscreenchange fullscreenchange", (event) => {
      let eventData = getEventData(event.target);
      postData(createTrackingEvent("mediaFullscreenChange", eventData));
    });

    mediaElement.addEventListener("error, stalled", (event) => {
      let eventData = getEventData(event.target);
      postData(createTrackingEvent("mediaError", eventData));
    });
  });
}

// Public variables and functions.
/**
 * Initialise the click track functionality by hooking to click events
 * @method init
 * @param {string} userid the user id
 * @param {string} irsUrl the URL of the IRS
 * @param {string} irsUser the Username for the IRS auth
 * @param {string} irsPassword the Password for the IRS auth
 */
export function init(userid, irsUrl, irsUser, irsPassword) {
  IRS_URL = irsUrl;
  IRS_USER = irsUser;
  IRS_PASSWORD = irsPassword;
  USERID = userid;

  setTabId();
  postUserAgent(userid);
  trackIntersection(userid);
  trackMouseClick(userid);
  trackMouseMove(userid);
  trackTextSelection(userid);
  trackMouseLeave(userid);
  trackMouseEnter(userid);
  trackCopy(userid);
  postViewport(userid);
  trackPositionsAndViewport(userid);
  trackBlur(userid);
  trackFocus(userid);
  trackQuizInputChange(userid);
  trackDetailToggle(userid);
  trackTabLeave(userid);
  trackContextMenu(userid);
  trackResize(userid);
  trackMediaEvents(userid);
}