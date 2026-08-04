function addGtagScript(ga: string) {
  if ((window as any).gtag) return;

  (window as any).dataLayer = (window as any).dataLayer || [];
  function gtag() {
    (window as any).dataLayer.push(arguments);
  }
  (window as any).gtag = gtag;

  // @ts-ignore
  gtag("js", new Date());
  // @ts-ignore
  gtag("config", ga);

  const script = document.createElement("script");
  script.type = "text/javascript";
  script.src = `https://www.googletagmanager.com/gtag/js?id=${ga}`;
  document.getElementsByTagName("head")[0].appendChild(script);
}

function trackEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window === "undefined" || typeof (window as any).gtag !== "function") return;
  (window as any).gtag("event", eventName, params);
}

export {
  addGtagScript,
  trackEvent,
}
