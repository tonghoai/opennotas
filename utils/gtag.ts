function addGtagScript(ga: string) {
  if ((window as any).gtag) return;

  const script = document.createElement("script");
  script.type = "text/javascript";
  script.src = `https://www.googletagmanager.com/gtag/js?id=${ga}`;
  document.getElementsByTagName("head")[0].appendChild(script);
  script.onload = () => {
    (window as any).dataLayer = (window as any).dataLayer || [];
    function gtag() {
      (window as any).dataLayer.push(arguments);
    }

    // @ts-ignore
    gtag("js", new Date());
    // @ts-ignore
    gtag("config", ga);
    (window as any).gtag = gtag;
  };
}

export {
  addGtagScript,
}
