import FingerprintJS from '@fingerprintjs/fingerprintjs';

let cachedFingerprint: string | null = null;

export async function getDeviceFingerprint(): Promise<string> {
  if (cachedFingerprint) {
    return cachedFingerprint;
  }

  // Check localStorage first
  const stored = localStorage.getItem('bucoride_device_hash');
  if (stored) {
    cachedFingerprint = stored;
    return stored;
  }

  try {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    cachedFingerprint = result.visitorId;
  } catch (err) {
    // Fallback hardware fingerprinting
    const nav = window.navigator;
    const screen = window.screen;
    const raw = `${nav.userAgent}-${screen.width}x${screen.height}-${screen.colorDepth}-${nav.hardwareConcurrency}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    cachedFingerprint = 'dev_fp_' + Math.abs(hash).toString(16);
  }

  localStorage.setItem('bucoride_device_hash', cachedFingerprint);
  return cachedFingerprint;
}
