const hasNewVersion = ref(false);

async function checkAppVersion(currentBuildId: number) {
  try {
    const res = await fetch('/api/app-version', { cache: 'no-store' });
    const data = await res.json();
    if (data?.buildId !== undefined && data.buildId !== currentBuildId) {
      hasNewVersion.value = true;
    }
  } catch (_) {
    // offline or network error — silently retry on the next poll
  }
}

export { hasNewVersion, checkAppVersion };
