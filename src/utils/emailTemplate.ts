import { getDirectDownloadUrl } from './fileDownloader';

export interface EmailAttachment {
  name: string;
  url?: string;
  sizeBytes?: number;
  base64?: string;
}

export interface EmailSubmissionData {
  recipientName: string;
  recipientEmail: string;
  recipientCompany?: string;
  ccEmails: string[];
  subject: string;
  projectName: string;
  woNumber: string;
  vendorName: string;
  // BAST fields
  segmentLocation?: string;
  realisasiJarak?: string;
  documentNumber?: string;
  // Invoice fields
  wilayahOperasi?: string;
  nomorBastAcuan?: string;
  // RFS fields
  lingkupTugas?: string;
  segmenJaringan?: string;
  statusJaringan?: string;
  // Penagihan fields
  mitraPelaksana?: string;
  statusDokumen?: string;
  requestType: 'BAST' | 'Invoice' | 'RFS' | 'Penagihan' | 'Both';
  userNotes: string;
  attachments: EmailAttachment[];
  submissionDate: string;
}

export const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '1.2 MB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const formatAttachmentLinesForEmail = (
  attachments?: EmailAttachment[], 
  defaultWoNumber?: string
): string => {
  if (!attachments || attachments.length === 0) {
    return '- Document terlampir';
  }

  return '- Dokumen Berkas & Tautan Unduh Langsung:\n' + attachments.map((att, idx) => {
    const directUrl = getDirectDownloadUrl(att.name, att.url, defaultWoNumber);
    return `  ${idx + 1}. ${att.name} : [Klik untuk Download Berkas Langsung] (${directUrl})`;
  }).join('\n');
};

/**
 * 1. Format Draf Surat Resmi Pengajuan BAST (Rata Kiri & Kanan, Titik Dua Sejajar)
 */
export const generateBastEmailPlainText = (params: {
  recipientName?: string;
  recipientCompany?: string;
  woNumber?: string;
  uraianPekerjaan?: string;
  segmenLokasi?: string;
  realisasiJarak?: string;
  nomorDokumen?: string;
  attachments?: EmailAttachment[];
  vendorName?: string;
}): string => {
  const recipient = params.recipientName?.trim() || '';
  const company = params.recipientCompany?.trim() ? `\n${params.recipientCompany.trim()}` : '';

  const wo = params.woNumber || '';
  const uraian = params.uraianPekerjaan || '';
  const segmen = params.segmenLokasi || '';
  const jarak = params.realisasiJarak || '';
  const noDok = params.nomorDokumen || '';

  const lampiranText = formatAttachmentLinesForEmail(params.attachments, wo);

  return `Kepada Yth.
${recipient || ''}${company}

Dengan hormat,

Sehubungan dengan selesainya pelaksanaan fisik pekerjaan di lapangan, bersama ini kami sampaikan dokumen Berita Acara Serah Terima (BAST) untuk paket pekerjaan berikut:

• Nomor WO        : ${wo}
• Uraian Pekerjaan: ${uraian}
• Segmen / Lokasi : ${segmen}
• Realisasi Jarak : ${jarak}
• Nomor Dokumen   : ${noDok}

Bersama email ini kami lampirkan tautan resmi dokumen BAST beserta berkas pendukung:
${lampiranText}

*Catatan: Seluruh dokumen pendukung tersimpan aman di cloud server dan dapat langsung diakses/diunduh melalui tautan di atas.*

Mohon kesediaan Bapak beserta tim untuk melakukan verifikasi berkas dan melanjutkan prosesnya.

Atas perhatian dan kerja samanya, kami ucapkan terima kasih.


Hormat kami,

${params.vendorName || 'Belacom'}`;
};

/**
 * 2. Format Draf Surat Resmi Pengajuan Invoice (Rata Kiri & Kanan, Titik Dua Sejajar)
 */
export const generateInvoiceEmailPlainText = (params: {
  recipientName?: string;
  recipientCompany?: string;
  woNumber?: string;
  uraianPekerjaan?: string;
  wilayahOperasi?: string;
  nomorBastAcuan?: string;
  attachments?: EmailAttachment[];
  vendorName?: string;
}): string => {
  const recipient = params.recipientName?.trim() || 'Tim Finance & Accounting / Tim Verifikasi Pembayaran';
  const company = params.recipientCompany?.trim() || 'PT Telkom Indonesia (Persero) Tbk';

  const wo = params.woNumber || '';
  const uraian = params.uraianPekerjaan || '';
  const wilayah = params.wilayahOperasi || 'Area Jabodetabek';
  const bastAcuan = params.nomorBastAcuan || `BAST/${wo}/BELACOM/${new Date().getFullYear()}`;

  const lampiranText = formatAttachmentLinesForEmail(params.attachments, wo);

  return `Kepada Yth.
${recipient}
${company}

Dengan hormat,

Merujuk pada pekerjaan yang telah selesai dan BAST yang telah terbit, kami mengajukan dokumen tagihan resmi (Invoice) untuk pekerjaan:

• Nomor WO        : ${wo}
• Uraian Pekerjaan: ${uraian}
• Wilayah Operasi : ${wilayah}
• Nomor BAST Acuan: ${bastAcuan}

Terlampir pada email ini berkas kelengkapan penagihan keuangan & tautan unduh langsung:
${lampiranText}

*Catatan: Seluruh dokumen pendukung tersimpan aman di cloud server dan dapat langsung diakses/diunduh melalui tautan di atas.*

Mohon bantuan Bapak/Ibu untuk memproses berkas tagihan ini ke tahap verifikasi keuangan dan penjadwalan pembayaran sesuai term of payment yang berlaku.

Terima kasih atas kerja sama dan dukungan yang diberikan.


Hormat kami,

${params.vendorName || 'Belacom'}`;
};

/**
 * 3. Format Draf Surat Resmi Notifikasi RFS (Rata Kiri & Kanan, Titik Dua Sejajar)
 */
export const generateRfsEmailPlainText = (params: {
  recipientName?: string;
  recipientCompany?: string;
  woNumber?: string;
  lingkupTugas?: string;
  segmenJaringan?: string;
  statusJaringan?: string;
  attachments?: EmailAttachment[];
  vendorName?: string;
}): string => {
  const recipient = params.recipientName?.trim() || 'Tim Pengawas & Operasional Jaringan';
  const company = params.recipientCompany?.trim() ? `\n${params.recipientCompany.trim()}` : '';

  const wo = params.woNumber || '';
  const lingkup = params.lingkupTugas || '';
  const segmen = params.segmenJaringan || '';
  const status = params.statusJaringan || 'Request For Service (RFS) - Aktif Normal';

  const lampiranText = formatAttachmentLinesForEmail(params.attachments, wo);

  return `Kepada Yth.
${recipient}${company}

Dengan hormat,

Kami menginformasikan bahwa infrastruktur jaringan pada paket pekerjaan di bawah ini telah selesai diuji dan dinyatakan aktif serta siap beroperasi (Request For Service):

• Nomor WO        : ${wo}
• Lingkup Tugas   : ${lingkup}
• Segmen Jaringan : ${segmen}
• Status Jaringan : ${status}

Bersama ini kami lampirkan berkas pengujian teknis & tautan unduh langsung:
${lampiranText}

*Catatan: Seluruh dokumen pendukung tersimpan aman di cloud server dan dapat langsung diakses/diunduh melalui tautan di atas.*

Seluruh jalur telah memenuhi parameter standar kualitas. Mohon konfirmasi penerimaan teknis agar jaringan dapat diintegrasikan sepenuhnya ke live network.

Terima kasih atas perhatian dan kerja samanya.


Hormat kami,

${params.vendorName || 'Belacom'}`;
};

/**
 * 4. Format Draf Surat Resmi Berkas Penagihan (13 Checklist, Rata Kiri & Kanan, Titik Dua Sejajar)
 */
export const generatePenagihanEmailPlainText = (params: {
  recipientName?: string;
  recipientCompany?: string;
  woNumber?: string;
  uraianPekerjaan?: string;
  mitraPelaksana?: string;
  statusDokumen?: string;
  attachments?: EmailAttachment[];
  vendorName?: string;
}): string => {
  const recipient = params.recipientName?.trim() || 'Tim Verifikasi Penagihan & Kontrak';
  const company = params.recipientCompany?.trim() || 'PT Telkom Indonesia (Persero) Tbk';

  const wo = params.woNumber || '';
  const uraian = params.uraianPekerjaan || '';
  const mitra = params.mitraPelaksana || 'PT. Belacom Indonesia Telecom';
  const status = params.statusDokumen || 'Lengkap 13 Checklist (Terverifikasi)';

  const lampiranText = formatAttachmentLinesForEmail(params.attachments, wo);

  return `Kepada Yth.
${recipient}
${company}

Dengan hormat,

Untuk melengkapi syarat administrasi pencairan dan penagihan proyek, kami menyampaikan bundel dokumen lengkap sesuai 13 Checklist Verifikasi Berkas Penagihan untuk paket pekerjaan:

• Nomor WO        : ${wo}
• Uraian Pekerjaan: ${uraian}
• Mitra Pelaksana : ${mitra}
• Status Dokumen  : ${status}

Daftar berkas terlampir dalam bundel penagihan & tautan unduh langsung:
${lampiranText}

*Catatan: Seluruh dokumen pendukung tersimpan aman di cloud server dan dapat langsung diakses/diunduh melalui tautan di atas.*

Mohon perkenan tim penagihan untuk memeriksa kelengkapan bundel berkas ini agar proses pembayaran dapat diteruskan ke bagian perbendaharaan/kasir.

Atas bantuan dan koordinasi yang baik, kami ucapkan terima kasih.


Hormat kami,

${params.vendorName || 'Belacom'}`;
};

/**
 * Helper Dispatcher untuk membuat teks surat resmi sesuai tipe request
 */
export const generateOfficialEmailPlainText = (
  requestType: 'BAST' | 'Invoice' | 'RFS' | 'Penagihan' | 'Both',
  data: {
    recipientName?: string;
    recipientCompany?: string;
    woNumber?: string;
    projectName?: string;
    segmentLocation?: string;
    realisasiJarak?: string;
    documentNumber?: string;
    wilayahOperasi?: string;
    nomorBastAcuan?: string;
    lingkupTugas?: string;
    segmenJaringan?: string;
    statusJaringan?: string;
    mitraPelaksana?: string;
    statusDokumen?: string;
    attachments?: EmailAttachment[];
    vendorName?: string;
  }
): string => {
  if (requestType === 'BAST') {
    return generateBastEmailPlainText({
      recipientName: data.recipientName,
      recipientCompany: data.recipientCompany,
      woNumber: data.woNumber,
      uraianPekerjaan: data.projectName,
      segmenLokasi: data.segmentLocation,
      realisasiJarak: data.realisasiJarak,
      nomorDokumen: data.documentNumber,
      attachments: data.attachments,
      vendorName: data.vendorName
    });
  }

  if (requestType === 'Invoice') {
    return generateInvoiceEmailPlainText({
      recipientName: data.recipientName,
      recipientCompany: data.recipientCompany,
      woNumber: data.woNumber,
      uraianPekerjaan: data.projectName,
      wilayahOperasi: data.wilayahOperasi || data.segmentLocation,
      nomorBastAcuan: data.nomorBastAcuan || data.documentNumber,
      attachments: data.attachments,
      vendorName: data.vendorName
    });
  }

  if (requestType === 'RFS') {
    return generateRfsEmailPlainText({
      recipientName: data.recipientName,
      recipientCompany: data.recipientCompany,
      woNumber: data.woNumber,
      lingkupTugas: data.lingkupTugas || data.projectName,
      segmenJaringan: data.segmenJaringan || data.segmentLocation,
      statusJaringan: data.statusJaringan,
      attachments: data.attachments,
      vendorName: data.vendorName
    });
  }

  if (requestType === 'Penagihan') {
    return generatePenagihanEmailPlainText({
      recipientName: data.recipientName,
      recipientCompany: data.recipientCompany,
      woNumber: data.woNumber,
      uraianPekerjaan: data.projectName,
      mitraPelaksana: data.mitraPelaksana || data.vendorName,
      statusDokumen: data.statusDokumen,
      attachments: data.attachments,
      vendorName: data.vendorName
    });
  }

  return generateBastEmailPlainText({
    recipientName: data.recipientName,
    recipientCompany: data.recipientCompany,
    woNumber: data.woNumber,
    uraianPekerjaan: data.projectName,
    segmenLokasi: data.segmentLocation,
    realisasiJarak: data.realisasiJarak,
    nomorDokumen: data.documentNumber,
    attachments: data.attachments,
    vendorName: data.vendorName
  });
};

/**
 * Merender struktur HTML email tabel responsif berstandar email client (Gmail / Outlook)
 * Didesain rapi rata kiri dan kanan (justified text & balanced tables).
 */
export const generateSubmissionEmailHtml = (data: EmailSubmissionData): string => {
  const attachmentLinks = data.attachments.length > 0
    ? data.attachments.map((att, idx) => {
        const downloadHref = att.base64
          ? `data:application/pdf;base64,${att.base64}`
          : getDirectDownloadUrl(att.name, att.url, data.woNumber);

        return `
        <li style="margin-bottom: 8px; color: #1e293b; font-size: 13px; text-align: left;">
          <span style="font-weight: 600; color: #64748b;">${idx + 1}.</span> 
          <a href="${downloadHref}" 
             download="${att.name}"
             data-download="true"
             data-filename="${att.name}" 
             data-fileurl="${downloadHref}" 
             style="color: #0284c7; text-decoration: underline; font-weight: 600; font-family: monospace;"
             onclick="if(window.__belacomDownload) { window.__belacomDownload('${att.name}', '${downloadHref}'); } return true;">
            ${att.name}
          </a> 
          <span style="color: #2563eb; font-weight: 600; font-size: 11px;"> : [Klik untuk Download Berkas Langsung]</span>
          <span style="color: #94a3b8; font-size: 11px; font-family: monospace;">(${formatFileSize(att.sizeBytes)})</span>
        </li>
      `;
      }).join('')
    : '<li style="color: #94a3b8; font-size: 12px; font-style: italic;">- Document terlampir</li>';

  // Konfigurasi Banner & Konten Sesuai Request Type
  let bannerSubtitle = 'GOV JABO DASHBOARD SUBMISSION';
  let defaultRecipientName = 'Bapak / Ibu Tim Pengawas & Asset';
  let defaultRecipientCompany = 'PT Telekomunikasi Indonesia, Tbk';
  let openingParagraph = '';
  let closingParagraph = '';
  let followUpParagraph = '';
  let attachmentLeadIn = '- Document terlampir:';

  // Baris Tabel Spesifikasi (Rata Kiri & Kanan)
  let tableRows = '';

  if (data.requestType === 'BAST') {
    bannerSubtitle = 'PENGAJUAN RESMI BERITA ACARA SERAH TERIMA';
    defaultRecipientName = 'Bapak / Ibu Tim Pengawas & Asset';
    defaultRecipientCompany = 'PT Telekomunikasi Indonesia, Tbk';
    openingParagraph = 'Sehubungan dengan selesainya pelaksanaan fisik pekerjaan di lapangan, bersama ini kami sampaikan dokumen Berita Acara Serah Terima (BAST) untuk paket pekerjaan berikut:';
    attachmentLeadIn = 'Bersama email ini kami lampirkan dokumen BAST resmi beserta lampiran teknis pendukung:';
    followUpParagraph = 'Mohon kesediaan Bapak beserta tim untuk melakukan verifikasi berkas dan melanjutkan prosesnya.';
    closingParagraph = 'Atas perhatian dan kerja samanya, kami ucapkan terima kasih.';

    const segmen = data.segmentLocation || 'Area Jabodetabek';
    const realisasi = data.realisasiJarak || '-';
    const docNo = data.documentNumber || `BAST/${data.woNumber}/BELACOM/${new Date().getFullYear()}`;

    tableRows = `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td width="30%" style="color: #475569; font-weight: 600; padding: 7px 0;">• Nomor WO</td>
        <td width="4%" style="color: #94a3b8; text-align: center;">:</td>
        <td width="66%" style="font-weight: 700; color: #0284c7; font-family: monospace; padding: 7px 0;">${data.woNumber}</td>
      </tr>
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="color: #475569; font-weight: 600; padding: 7px 0;">• Uraian Pekerjaan</td>
        <td style="color: #94a3b8; text-align: center;">:</td>
        <td style="font-weight: 600; color: #0f172a; padding: 7px 0;">${data.projectName}</td>
      </tr>
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="color: #475569; font-weight: 600; padding: 7px 0;">• Segmen / Lokasi</td>
        <td style="color: #94a3b8; text-align: center;">:</td>
        <td style="font-weight: 500; color: #334155; padding: 7px 0;">${segmen}</td>
      </tr>
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="color: #475569; font-weight: 600; padding: 7px 0;">• Realisasi Jarak</td>
        <td style="color: #94a3b8; text-align: center;">:</td>
        <td style="font-weight: 600; color: #059669; font-family: monospace; padding: 7px 0;">${realisasi}</td>
      </tr>
      <tr>
        <td style="color: #475569; font-weight: 600; padding: 7px 0;">• Nomor Dokumen</td>
        <td style="color: #94a3b8; text-align: center;">:</td>
        <td style="font-weight: 700; color: #334155; font-family: monospace; padding: 7px 0;">${docNo}</td>
      </tr>
    `;
  } else if (data.requestType === 'Invoice') {
    bannerSubtitle = 'PENGAJUAN RESMI FAKTUR TAGIHAN (INVOICE)';
    defaultRecipientName = 'Tim Finance & Accounting / Tim Verifikasi Pembayaran';
    defaultRecipientCompany = 'PT Telkom Indonesia (Persero) Tbk';
    openingParagraph = 'Merujuk pada pekerjaan yang telah selesai dan BAST yang telah terbit, kami mengajukan dokumen tagihan resmi (Invoice) untuk pekerjaan:';
    attachmentLeadIn = 'Terlampir pada email ini berkas kelengkapan penagihan keuangan:';
    followUpParagraph = 'Mohon bantuan Bapak/Ibu untuk memproses berkas tagihan ini ke tahap verifikasi keuangan dan penjadwalan pembayaran sesuai term of payment yang berlaku.';
    closingParagraph = 'Terima kasih atas kerja sama dan dukungan yang diberikan.';

    const wilayah = data.wilayahOperasi || data.segmentLocation || 'Area Jabodetabek';
    const bastAcuan = data.nomorBastAcuan || data.documentNumber || `BAST/${data.woNumber}/BELACOM/${new Date().getFullYear()}`;

    tableRows = `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td width="30%" style="color: #475569; font-weight: 600; padding: 7px 0;">• Nomor WO</td>
        <td width="4%" style="color: #94a3b8; text-align: center;">:</td>
        <td width="66%" style="font-weight: 700; color: #0284c7; font-family: monospace; padding: 7px 0;">${data.woNumber}</td>
      </tr>
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="color: #475569; font-weight: 600; padding: 7px 0;">• Uraian Pekerjaan</td>
        <td style="color: #94a3b8; text-align: center;">:</td>
        <td style="font-weight: 600; color: #0f172a; padding: 7px 0;">${data.projectName}</td>
      </tr>
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="color: #475569; font-weight: 600; padding: 7px 0;">• Wilayah Operasi</td>
        <td style="color: #94a3b8; text-align: center;">:</td>
        <td style="font-weight: 500; color: #334155; padding: 7px 0;">${wilayah}</td>
      </tr>
      <tr>
        <td style="color: #475569; font-weight: 600; padding: 7px 0;">• Nomor BAST Acuan</td>
        <td style="color: #94a3b8; text-align: center;">:</td>
        <td style="font-weight: 700; color: #334155; font-family: monospace; padding: 7px 0;">${bastAcuan}</td>
      </tr>
    `;
  } else if (data.requestType === 'RFS') {
    bannerSubtitle = 'NOTIFIKASI RESMI BERITA ACARA UJI TERIMA (READY FOR SERVICE)';
    defaultRecipientName = 'Tim Pengawas & Operasional Jaringan';
    defaultRecipientCompany = 'PT Telekomunikasi Indonesia, Tbk';
    openingParagraph = 'Kami menginformasikan bahwa infrastruktur jaringan pada paket pekerjaan di bawah ini telah selesai diuji dan dinyatakan aktif serta siap beroperasi (Ready For Service):';
    attachmentLeadIn = 'Bersama ini kami lampirkan berkas pengujian teknis:';
    followUpParagraph = 'Seluruh jalur telah memenuhi parameter standar kualitas. Mohon konfirmasi penerimaan teknis agar jaringan dapat diintegrasikan sepenuhnya ke live network.';
    closingParagraph = 'Terima kasih atas perhatian dan kerja samanya.';

    const lingkup = data.lingkupTugas || data.projectName;
    const segmen = data.segmenJaringan || data.segmentLocation || 'Segmen Distribusi Fiber Optic';
    const status = data.statusJaringan || 'Ready For Service (RFS) - Aktif Normal';

    tableRows = `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td width="30%" style="color: #475569; font-weight: 600; padding: 7px 0;">• Nomor WO</td>
        <td width="4%" style="color: #94a3b8; text-align: center;">:</td>
        <td width="66%" style="font-weight: 700; color: #0284c7; font-family: monospace; padding: 7px 0;">${data.woNumber}</td>
      </tr>
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="color: #475569; font-weight: 600; padding: 7px 0;">• Lingkup Tugas</td>
        <td style="color: #94a3b8; text-align: center;">:</td>
        <td style="font-weight: 600; color: #0f172a; padding: 7px 0;">${lingkup}</td>
      </tr>
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="color: #475569; font-weight: 600; padding: 7px 0;">• Segmen Jaringan</td>
        <td style="color: #94a3b8; text-align: center;">:</td>
        <td style="font-weight: 500; color: #334155; padding: 7px 0;">${segmen}</td>
      </tr>
      <tr>
        <td style="color: #475569; font-weight: 600; padding: 7px 0;">• Status Jaringan</td>
        <td style="color: #94a3b8; text-align: center;">:</td>
        <td style="font-weight: 700; color: #059669; font-family: monospace; padding: 7px 0;">${status}</td>
      </tr>
    `;
  } else if (data.requestType === 'Penagihan') {
    bannerSubtitle = 'VERIFIKASI LENGKAP 13 CHECKLIST ADMINISTRASI PENAGIHAN';
    defaultRecipientName = 'Tim Verifikasi Penagihan & Kontrak';
    defaultRecipientCompany = 'PT Telkom Indonesia (Persero) Tbk';
    openingParagraph = 'Untuk melengkapi syarat administrasi pencairan dan penagihan proyek, kami menyampaikan bundel dokumen lengkap sesuai 13 Checklist Verifikasi Berkas Penagihan untuk paket pekerjaan:';
    attachmentLeadIn = 'Daftar berkas terlampir dalam bundel penagihan:';
    followUpParagraph = 'Mohon perkenan tim penagihan untuk memeriksa kelengkapan bundel berkas ini agar proses pembayaran dapat diteruskan ke bagian perbendaharaan/kasir.';
    closingParagraph = 'Atas bantuan dan koordinasi yang baik, kami ucapkan terima kasih.';

    const mitra = data.mitraPelaksana || data.vendorName || 'PT. Belacom Indonesia Telecom';
    const status = data.statusDokumen || 'Lengkap 13 Checklist (Terverifikasi)';

    tableRows = `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td width="30%" style="color: #475569; font-weight: 600; padding: 7px 0;">• Nomor WO</td>
        <td width="4%" style="color: #94a3b8; text-align: center;">:</td>
        <td width="66%" style="font-weight: 700; color: #0284c7; font-family: monospace; padding: 7px 0;">${data.woNumber}</td>
      </tr>
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="color: #475569; font-weight: 600; padding: 7px 0;">• Uraian Pekerjaan</td>
        <td style="color: #94a3b8; text-align: center;">:</td>
        <td style="font-weight: 600; color: #0f172a; padding: 7px 0;">${data.projectName}</td>
      </tr>
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="color: #475569; font-weight: 600; padding: 7px 0;">• Mitra Pelaksana</td>
        <td style="color: #94a3b8; text-align: center;">:</td>
        <td style="font-weight: 600; color: #334155; padding: 7px 0;">${mitra}</td>
      </tr>
      <tr>
        <td style="color: #475569; font-weight: 600; padding: 7px 0;">• Status Dokumen</td>
        <td style="color: #94a3b8; text-align: center;">:</td>
        <td style="font-weight: 700; color: #059669; font-family: monospace; padding: 7px 0;">${status}</td>
      </tr>
    `;
  }

  const finalRecipientName = data.recipientName || defaultRecipientName;
  const finalRecipientCompany = data.recipientCompany || defaultRecipientCompany;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 660px; margin: 24px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;">
    
    <!-- Header Banner Resmi Belacom (#1E56A0) -->
    <div style="background-color: #1E56A0; padding: 24px 32px; color: #ffffff; text-align: left;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <div style="font-size: 20px; font-weight: 800; letter-spacing: 0.5px; color: #ffffff; margin-bottom: 4px;">
              BELACOM <span style="font-weight: 300; opacity: 0.85;">|</span> CONTROLLING PROJECT
            </div>
            <div style="font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: #93c5fd;">
              ${bannerSubtitle}
            </div>
          </td>
          <td align="right" style="vertical-align: middle;">
            <div style="background: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 8px; padding: 6px 12px; font-size: 11px; font-family: monospace; color: #ffffff;">
              ${data.submissionDate}
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Konten Utama Surat Resmi - Rapi Rata Kiri & Kanan (Justified) -->
    <div style="padding: 32px 32px 28px 32px; color: #1e293b;">
      
      <!-- Kepada Yth. -->
      <div style="margin-bottom: 20px;">
        <div style="font-size: 13px; color: #64748b; margin-bottom: 3px;">Kepada Yth.</div>
        <div style="font-size: 15px; font-weight: 700; color: #0f172a;">
          ${finalRecipientName}
        </div>
        ${finalRecipientCompany ? `
          <div style="font-size: 13px; color: #475569;">
            ${finalRecipientCompany}
          </div>
        ` : ''}
      </div>

      <!-- Salam Pembuka -->
      <p style="font-size: 14px; line-height: 1.6; margin-top: 0; margin-bottom: 16px; color: #0f172a;">
        Dengan hormat,
      </p>

      <!-- Paragraf Pengantar Resmi (Rata Kiri Kanan) -->
      <p style="font-size: 14px; line-height: 1.75; text-align: justify; text-justify: inter-word; color: #334155; margin-bottom: 20px;">
        ${openingParagraph}
      </p>

      <!-- Tabel Rincian Paket Pekerjaan (Rata & Terstruktur Rapi) -->
      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 18px 20px; margin-bottom: 22px;">
        <table width="100%" cellpadding="5" cellspacing="0" border="0" style="font-size: 13px; color: #1e293b; border-collapse: collapse;">
          ${tableRows}
        </table>
      </div>

      <!-- Lampiran Berkas Teknis Pendukung -->
      <div style="margin-bottom: 22px;">
        <p style="font-size: 14px; line-height: 1.7; text-align: justify; text-justify: inter-word; color: #334155; margin-bottom: 10px;">
          ${attachmentLeadIn}
        </p>
        <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px;">
          <div style="font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 8px; font-family: monospace;">
            - Document terlampir:
          </div>
          <ul style="padding-left: 20px; margin: 0; list-style-type: none;">
            ${attachmentLinks}
          </ul>
        </div>
      </div>

      <!-- Paragraf Tindak Lanjut (Rata Kiri Kanan) -->
      <p style="font-size: 14px; line-height: 1.75; text-align: justify; text-justify: inter-word; color: #334155; margin-bottom: 16px;">
        ${followUpParagraph}
      </p>

      <!-- Paragraf Penutup (Rata Kiri Kanan) -->
      <p style="font-size: 14px; line-height: 1.7; text-align: justify; text-justify: inter-word; color: #334155; margin-bottom: 30px;">
        ${closingParagraph}
      </p>

      <!-- Blok Tanda Tangan -->
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px dashed #e2e8f0;">
        <div style="font-size: 13px; color: #64748b; margin-bottom: 4px;">Hormat kami,</div>
        <div style="font-size: 15px; font-weight: 800; color: #0f172a; letter-spacing: 0.3px; margin-top: 12px;">
          ${data.vendorName || 'Belacom'}
        </div>
        <div style="font-size: 12px; color: #64748b; font-family: monospace;">
          Controlling Project Team
        </div>
      </div>

    </div>

    <!-- Footer Sistem -->
    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 32px; text-align: center; color: #94a3b8; font-size: 11px; line-height: 1.5;">
      <div>&copy; ${new Date().getFullYear()} BELACOM - Controlling Project Dashboard.</div>
      <div>Official Document Submission notification.</div>
    </div>

  </div>
</body>
</html>
  `.trim();
};
