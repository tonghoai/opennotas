import { describe, expect, it } from 'vitest';
import {
  checkIsSafariDesktop,
  checkIsSafariMobile,
  checkIsSupportHalfPWA,
  checkIsSupportPWA,
  checkIsSupportWeb,
} from '~/utils/browser';

const chromeDesktop = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const chromeOld = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36';
const safariDesktop = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
const safariMobile = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const firefox = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0';
const samsung = 'Mozilla/5.0 (Linux; Android 13; SM-S901B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36';

describe('browser capability detection', () => {
  it('supports modern Chrome and Samsung, not old Chrome or Firefox PWA install', () => {
    expect(checkIsSupportWeb(chromeDesktop)).toBe(true);
    expect(checkIsSupportPWA(chromeDesktop)).toBe(true);
    expect(checkIsSupportWeb(chromeOld)).toBe(false);
    expect(checkIsSupportPWA(chromeOld)).toBe(false);
    expect(checkIsSupportWeb(firefox)).toBe(true);
    expect(checkIsSupportPWA(firefox)).toBe(false);
    expect(checkIsSupportPWA(samsung)).toBe(true);
  });

  it('treats Safari as half-PWA and detects desktop/mobile Safari', () => {
    expect(checkIsSupportWeb(safariDesktop)).toBe(true);
    expect(checkIsSupportPWA(safariDesktop)).toBe(false);
    expect(checkIsSupportHalfPWA(safariDesktop)).toBe(true);
    expect(checkIsSafariDesktop(safariDesktop)).toBe(true);
    expect(checkIsSafariMobile(safariDesktop)).toBe(false);

    expect(checkIsSupportHalfPWA(safariMobile)).toBe(true);
    expect(checkIsSafariMobile(safariMobile)).toBe(true);
    expect(checkIsSafariDesktop(safariMobile)).toBe(false);
    expect(checkIsSafariDesktop(chromeDesktop)).toBe(false);
  });

  it('rejects unknown user agents', () => {
    expect(checkIsSupportWeb('curl/8.0')).toBe(false);
    expect(checkIsSupportPWA('curl/8.0')).toBe(false);
    expect(checkIsSupportHalfPWA('curl/8.0')).toBe(false);
  });
});
