import BrowserDetector from 'browser-dtector';

const name = [
  "Google Chrome",
  "Mozilla Firefox",
  "Microsoft Edge",
  "Safari",
  "Brave",
  "Opera",
  "Samsung Browser",
];

const detailByBrowser: any = {
  // supportPWA: all, half, none
  "Safari": {
    minVersion: 15.4,
    includeDevices: ["desktop", "mobile", "tablet"],
    supportPWA: "half",
  },
  "Google Chrome": {
    minVersion: 111,
    includeDevices: ["desktop", "mobile", "tablet"],
    supportPWA: "all",
  },
  "Microsoft Edge": {
    minVersion: 111,
    includeDevices: ["desktop", "mobile", "tablet"],
    supportPWA: "all",
  },
  "Mozilla Firefox": {
    minVersion: 113,
    includeDevices: ["desktop", "mobile", "tablet"],
    supportPWA: "none",
  },
  "Brave": {
    minVersion: 111,
    includeDevices: ["desktop", "mobile", "tablet"],
    supportPWA: "none",
  },
  "Opera": {
    minVersion: 97,
    includeDevices: ["desktop", "mobile", "tablet"],
    supportPWA: "none",
  },
  "Samsung Browser": {
    minVersion: 22,
    includeDevices: ["mobile", "tablet"],
    supportPWA: "all",
  },
};

function _checkIsBrowserSupport(uaParser: any): boolean {
  const browserName = uaParser.name;
  const browserVersion = uaParser.shortVersion || 0;
  const browserDevice = uaParser.isDesktop ? "desktop" : uaParser.isMobile ? "mobile" : uaParser.isTablet ? "tablet" : "unknown";

  return name.includes(browserName)
    && +browserVersion >= detailByBrowser[browserName].minVersion
    && detailByBrowser[browserName].includeDevices.includes(browserDevice);
}

function checkIsSupportWeb(ua: string) {
  const browser = new BrowserDetector(ua);
  const uaParser = browser.parseUserAgent();

  return _checkIsBrowserSupport(uaParser);
}

function checkIsSupportPWA(ua: string): boolean {
  const browser = new BrowserDetector(ua);
  const uaParser = browser.parseUserAgent();

  return _checkIsBrowserSupport(uaParser)
    && detailByBrowser[uaParser.name].supportPWA === "all";
}

function checkIsSupportHalfPWA(ua: string): boolean {
  const browser = new BrowserDetector(ua);
  const uaParser = browser.parseUserAgent();

  return _checkIsBrowserSupport(uaParser)
    && detailByBrowser[uaParser.name].supportPWA === "half";
}

function checkIsSafariDesktop(ua: string): boolean {
  const browser = new BrowserDetector(ua);
  const uaParser = browser.parseUserAgent();

  return uaParser.name === "Safari" && uaParser.isDesktop;
}

function checkIsSafariMobile(ua: string): boolean {
  const browser = new BrowserDetector(ua);
  const uaParser = browser.parseUserAgent();

  return uaParser.name === "Safari" && uaParser.isMobile;
}

export {
  checkIsSupportWeb,
  checkIsSupportPWA,
  checkIsSupportHalfPWA,
  checkIsSafariDesktop,
  checkIsSafariMobile,
}
