import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, loginTime, userAgent } = req.body || {};

  if (!email) {
    return res.status(400).json({ message: 'Data email wajib diisi' });
  }

  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@belacom.co.id';

    if (!resendApiKey) {
      console.warn('RESEND_API_KEY belum dikonfigurasi pada Environment Variables Vercel.');
      return res.status(200).json({ 
        success: true, 
        message: 'Endpoint siap (RESEND_API_KEY belum diisi pada Vercel Dashboard)' 
      });
    }

    // Mengirim email melalui REST API Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Sistem Belacom <onboarding@resend.dev>',
        to: [adminEmail],
        subject: `Notifikasi Keamanan: Akun ${email} Berhasil Login`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f6f8;">
            <div style="background-color: #ffffff; padding: 24px; border-radius: 8px; border-left: 4px solid #0284c7;">
              <h2 style="color: #0f172a; margin-top: 0;">Laporan Aktivitas Login</h2>
              <p>Pengguna berikut baru saja masuk ke sistem <strong>Project Belacom</strong>:</p>
              <ul style="color: #334155; line-height: 1.6;">
                <li><strong>Akun Email:</strong> ${email}</li>
                <li><strong>Waktu Login:</strong> ${loginTime}</li>
                <li><strong>Perangkat / Browser:</strong> ${userAgent}</li>
              </ul>
              <p style="font-size: 12px; color: #64748b; margin-top: 20px;">Email ini dihasilkan otomatis oleh sistem pemantauan keamanan aplikasi.</p>
            </div>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gagal mengirim email via Resend API:', errText);
      return res.status(502).json({ success: false, error: errText });
    }

    return res.status(200).json({ success: true, message: 'Notifikasi email login terkirim' });
  } catch (error: any) {
    console.error('Error notifikasi login:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
