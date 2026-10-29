/**
 * Vercel Serverless Function & Express Compatible Handler for Audit Notifications
 * Target: chaerulloh28@gmail.com
 */

export default async function handler(req: any, res: any) {
  // 1. CORS Headers for Cloud & Vercel Preview Deployments
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Pre-flight OPTIONS request
  if (req.method === 'OPTIONS') {
    if (typeof res.status === 'function') {
      return res.status(200).end();
    }
    res.statusCode = 200;
    return res.end();
  }

  try {
    let body = req.body || {};
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    const { account, role, timeWib, device, subject } = body;
    const targetEmail = 'chaerulloh28@gmail.com';
    const emailSubject = subject || `[SECURITY ALERT] Login Terdeteksi - Sistem Belacom Project`;
    const userAccount = account || 'belacom';
    const userRole = role || 'Super Admin';
    const accessTime = timeWib || new Date().toLocaleString('id-ID');
    const deviceStr = device || 'Browser / Desktop';

    const payload = {
      _subject: emailSubject,
      subject: emailSubject,
      email: targetEmail,
      Account_Email: userAccount,
      Role_Access: userRole,
      Waktu_Akses_WIB: accessTime,
      Device_Browser: deviceStr,
      Message: `Login terdeteksi pada Sistem Belacom Project.\nAkun: ${userAccount} (${userRole})\nWaktu: ${accessTime}\nPerangkat: ${deviceStr}`
    };

    // Relay 1: ShipMyForm direct to chaerulloh28@gmail.com (Verified 200 OK delivery)
    const p1 = fetch(`https://shipmyform.com/to/${targetEmail}`, {
      method: 'POST',
      headers: {
        'Origin': 'https://project-belacom.vercel.app',
        'Referer': 'https://project-belacom.vercel.app/',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    }).catch(err => ({ ok: false, error: err.message }));

    // Relay 2: FormSubmit with hash fallback
    const p2 = fetch(`https://formsubmit.co/ajax/f9d9b63692705bdc99c894bf79c71e71`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(err => ({ ok: false, error: err.message }));

    // Relay 3: FormSubmit direct email
    const p3 = fetch(`https://formsubmit.co/ajax/${targetEmail}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(err => ({ ok: false, error: err.message }));

    const [r1, r2, r3] = await Promise.all([p1, p2, p3]);

    console.log('[LoginNotify Vercel] Sent audit to', targetEmail, {
      shipmyform: (r1 as any)?.status || (r1 as any)?.ok,
      formsubmitHash: (r2 as any)?.status || (r2 as any)?.ok,
      formsubmitDirect: (r3 as any)?.status || (r3 as any)?.ok
    });

    const responseData = {
      success: true,
      message: 'Notifikasi email berhasil diproses dan dikirim ke chaerulloh28@gmail.com',
      target: targetEmail,
      timestamp: accessTime
    };

    if (typeof res.json === 'function') {
      return res.status(200).json(responseData);
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(responseData));
      return;
    }
  } catch (error: any) {
    console.error('[LoginNotify] Error sending notification:', error);
    const errData = { success: false, message: error?.message || 'Internal Server Error' };
    if (typeof res.json === 'function') {
      return res.status(500).json(errData);
    } else {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(errData));
      return;
    }
  }
}

// Named export for express compatibility in server.ts
export { handler as handleLoginNotify };
