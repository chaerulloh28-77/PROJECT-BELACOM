/**
 * Silent Background Login Audit Logger
 * Sends login notification payload asynchronously to https://formsubmit.co/ajax/f9d9b63692705bdc99c894bf79c71e71
 * without displaying UI elements (no toast, no modal, no loader) and catches network errors silently.
 */

export const sendSilentLoginAuditNotification = (username: string = 'belacom'): void => {
  // Execute in non-blocking background queue with internal catch handler
  Promise.resolve().then(async () => {
    try {
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown Browser';
      const screenRes = typeof window !== 'undefined' && window.screen ? `${window.screen.width}x${window.screen.height}` : '1920x1080';

      const payload = {
        _subject: "Notifikasi Login Belacom - " + username,
        _template: "table",
        _captcha: "false",
        Username: username,
        "Waktu Login": new Date().toLocaleString("id-ID"),
        Browser: userAgent,
        Resolusi: screenRes
      };

      const response = await fetch('https://formsubmit.co/ajax/f9d9b63692705bdc99c894bf79c71e71', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      }).catch(() => null);

      if (response && response.ok) {
        await response.json().catch(() => null);
      }
    } catch {
      // Completely silent catch block: guarantees no unhandled rejection or console error
    }
  }).catch(() => {});
};
