/**
 * Silent Background Login Audit Logger
 * Sends login notification payload asynchronously to chaerulloh28@gmail.com
 * via multiple reliable relays (Server endpoint, ShipMyForm, FormSubmit)
 * without displaying UI elements (no toast, no modal, no loader) and catches network errors silently.
 */

export const sendSilentLoginAuditNotification = (username: string = 'belacom'): void => {
  // Execute in non-blocking background queue with internal catch handler
  Promise.resolve().then(async () => {
    try {
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown Browser';
      const screenRes = typeof window !== 'undefined' && window.screen ? `${window.screen.width}x${window.screen.height}` : '1920x1080';
      const wibTime = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB';

      const payload = {
        _subject: "Notifikasi Login Belacom - " + username,
        subject: "Notifikasi Login Belacom - " + username,
        _template: "table",
        _captcha: "false",
        email: 'chaerulloh28@gmail.com',
        targetEmail: 'chaerulloh28@gmail.com',
        Username: username,
        account: username,
        role: username.toLowerCase().includes('operator') ? 'Operator Lapangan' : 'Super Admin',
        "Waktu Login": wibTime,
        timeWib: wibTime,
        Browser: userAgent,
        device: userAgent,
        Resolusi: screenRes
      };

      // Primary Relay: Standardized Vercel / Express serverless endpoint (/api/audit-notify)
      const primaryRes = await fetch('/api/audit-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => null);

      if (!primaryRes || !primaryRes.ok) {
        // Fallback Relay: Legacy alias (/api/audit/login-notify)
        await fetch('/api/audit/login-notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(() => null);
      }

    } catch {
      // Completely silent catch block: guarantees no unhandled rejection or console error
    }
  }).catch(() => {});
};
