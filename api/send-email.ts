import type { Request, Response } from 'express';

export interface EmailAttachmentPayload {
  filename: string;
  content: string; // Base64 encoded file content
}

export interface SendEmailRequestBody {
  to: string | string[];
  cc?: string | string[];
  subject: string;
  html: string;
  attachments?: EmailAttachmentPayload[];
}

/**
 * Handler Endpoint Serverless / Express Pengiriman Email Nyata
 * Menggunakan Resend API (https://api.resend.com/emails)
 */
export async function sendEmailHandler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Metode HTTP tidak diizinkan. Gunakan POST.'
    });
  }

  try {
    const { to, cc, subject, html, attachments } = req.body as SendEmailRequestBody;

    // Validasi parameter wajib
    if (!to || (Array.isArray(to) && to.length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'Alamat email penerima utama (to) wajib diisi.'
      });
    }

    if (!subject || !subject.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Subjek email wajib diisi.'
      });
    }

    if (!html || !html.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Konten HTML email wajib diisi.'
      });
    }

    // Normalisasi 'to' menjadi array
    const toArray = Array.isArray(to) ? to.map(e => e.trim()).filter(Boolean) : [to.trim()];

    // Normalisasi 'cc' menjadi array jika ada
    let ccArray: string[] | undefined = undefined;
    if (cc) {
      const rawCc = Array.isArray(cc) ? cc : [cc];
      const filteredCc = rawCc.map(e => e.trim()).filter(Boolean);
      if (filteredCc.length > 0) {
        ccArray = filteredCc;
      }
    }

    // Normalisasi attachments (memastikan filename dan content base64 valid)
    const validAttachments = Array.isArray(attachments)
      ? attachments
          .filter(a => a && a.filename && a.content)
          .map(a => ({
            filename: a.filename.trim(),
            content: a.content.replace(/^data:[^;]+;base64,/, '') // Bersihkan prefix data-uri jika ada
          }))
      : [];

    const apiKey = process.env.RESEND_API_KEY?.trim();
    const fromAddress = process.env.RESEND_FROM_EMAIL?.trim() || 'Controlling Project Belacom <onboarding@resend.dev>';

    // Jika RESEND_API_KEY tidak dikonfigurasi, beri fallback respon sukses tersimulasi dengan instruksi jelas
    if (!apiKey) {
      console.warn('[SendEmail API] RESEND_API_KEY tidak terdeteksi di env. Mode pengiriman disimulasikan secara aman.');
      return res.status(200).json({
        success: true,
        id: 'sim-' + Math.random().toString(36).substring(2, 11),
        simulated: true,
        message: 'Pengiriman email disimulasikan berhasil (Silakan masukkan RESEND_API_KEY di file .env untuk pengiriman nyata ke inbox).',
        recipientCount: toArray.length,
        ccCount: ccArray?.length || 0,
        attachmentCount: validAttachments.length
      });
    }

    // Siapkan payload untuk Resend API
    const resendPayload: Record<string, unknown> = {
      from: fromAddress,
      to: toArray,
      subject: subject.trim(),
      html: html
    };

    if (ccArray && ccArray.length > 0) {
      resendPayload.cc = ccArray;
    }

    if (validAttachments.length > 0) {
      resendPayload.attachments = validAttachments;
    }

    // Eksekusi POST ke Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(resendPayload)
    });

    const resendData = await resendResponse.json().catch(() => ({}));

    if (!resendResponse.ok) {
      console.error('[SendEmail API] Resend API Error:', resendData);
      const errorMessage =
        resendData?.message ||
        resendData?.error ||
        `Gagal mengirim email melalui Resend API (HTTP ${resendResponse.status})`;

      return res.status(resendResponse.status).json({
        success: false,
        error: errorMessage,
        details: resendData
      });
    }

    return res.status(200).json({
      success: true,
      id: resendData.id,
      message: 'Email dan lampiran berhasil dikirim ke inbox Penerima & Cc!'
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[SendEmail API] Exception:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Terjadi kesalahan internal server saat memproses email.'
    });
  }
}

// Default export untuk serverless runtime (Vercel / Next API compatibility)
export default sendEmailHandler;
