/**
 * Standalone Notification Service for Security & Audit Logging
 * PT Belacom Indonesia Telecom
 * 
 * Sends immediate non-blocking email notifications to chaerulloh28@gmail.com
 * via multiple reliable relays (Server endpoint, ShipMyForm, FormSubmit)
 * when users log into the Belacom Project application.
 */

export interface AuthNotificationPayload {
  username: string;
  email: string;
  role: string;
  rememberMe?: boolean;
}

/**
 * Formats current date and time in WIB (Waktu Indonesia Barat / Asia/Jakarta)
 */
export function getFormattedWibTime(): string {
  try {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };
    return new Intl.DateTimeFormat('id-ID', options).format(now) + ' WIB';
  } catch {
    return new Date().toISOString().replace('T', ' ').substring(0, 19) + ' WIB';
  }
}

/**
 * Sends non-blocking notification to chaerulloh28@gmail.com
 * Executes asynchronously without blocking the UI flow.
 */
export function sendLoginNotification(payload: AuthNotificationPayload): void {
  // Execute in un-awaited IIFE so UI transitions instantly
  (async () => {
    try {
      const wibTime = getFormattedWibTime();
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown Device';
      const userEmail = payload.email || payload.username || 'belacom@belacom.co.id';
      const role = payload.role || 'Super Admin';
      const subject = `[SECURITY ALERT] Login Terdeteksi - Sistem Belacom Project`;

      const notificationData = {
        _subject: subject,
        subject: subject,
        email: 'chaerulloh28@gmail.com',
        targetEmail: 'chaerulloh28@gmail.com',
        account: userEmail,
        Account_Email: userEmail,
        Role_Access: role,
        role: role,
        Waktu_Akses_WIB: wibTime,
        timeWib: wibTime,
        Device_Browser: userAgent,
        device: userAgent,
        Security_Message: `Login terdeteksi pada Sistem Belacom Project. Akun: ${userEmail} (${role}) pada ${wibTime}.`
      };

      // Call Vercel serverless login notification endpoint (/api/login-notify)
      fetch('/api/login-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          loginTime: wibTime,
          userAgent: userAgent
        })
      }).catch((err) => console.error('Gagal memicu log notifikasi login:', err));

      // Call standardized Vercel / Express serverless endpoint (/api/audit-notify)
      const primaryRes = await fetch('/api/audit-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationData)
      }).catch(() => null);

      if (!primaryRes || !primaryRes.ok) {
        // Fallback to legacy endpoint alias (/api/audit/login-notify)
        await fetch('/api/audit/login-notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notificationData)
        }).catch(() => null);
      }
    } catch {
      // Non-blocking catch to ensure zero app crashes
    }
  })();
}
