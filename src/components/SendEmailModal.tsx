import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Paperclip, 
  Check, 
  Eye, 
  Download, 
  FileText, 
  Building,
  ExternalLink,
  Sparkles,
  AlignJustify,
  CheckCircle2,
  FileCheck2,
  RotateCcw
} from 'lucide-react';
import { TouchButton } from './TouchButton';
import { 
  EmailSubmissionData, 
  EmailAttachment, 
  generateSubmissionEmailHtml, 
  generateOfficialEmailPlainText,
  formatFileSize 
} from '../utils/emailTemplate';
import { downloadAttachedFile } from '../utils/fileDownloader';
import { isValidEmail, validateEmailList } from '../utils/validation';
import { useProjectContext } from '../context/ProjectContext';

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultData: {
    bastId?: string;
    requestType: 'BAST' | 'Invoice' | 'RFS' | 'Penagihan' | 'Both';
    woNumber: string;
    projectName: string;
    vendorName?: string;
    // BAST
    segmentLocation?: string;
    realisasiJarak?: string;
    documentNumber?: string;
    // Invoice
    wilayahOperasi?: string;
    nomorBastAcuan?: string;
    // RFS
    lingkupTugas?: string;
    segmenJaringan?: string;
    statusJaringan?: string;
    // Penagihan
    mitraPelaksana?: string;
    statusDokumen?: string;
    defaultRecipient?: string;
    defaultRecipientName?: string;
    availableAttachments: EmailAttachment[];
  };
}

export const SendEmailModal: React.FC<SendEmailModalProps> = ({
  isOpen,
  onClose,
  defaultData
}) => {
  const { showToast, bastList, updateBAST } = useProjectContext();

  // Mode: 'form' (Form Pengiriman) or 'preview' (Tampilan Penerima / Gmail Preview)
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');

  // Helper default recipient & company based on request type
  const getDefaultRecipientInfo = () => {
    switch (defaultData.requestType) {
      case 'Invoice':
        return {
          email: defaultData.defaultRecipient || 'finance.payment@telkom.co.id',
          name: defaultData.defaultRecipientName || 'Tim Finance & Accounting / Tim Verifikasi Pembayaran',
          company: 'PT Telkom Indonesia (Persero) Tbk'
        };
      case 'RFS':
        return {
          email: defaultData.defaultRecipient || 'noc.operations@telkom.co.id',
          name: defaultData.defaultRecipientName || 'Tim Pengawas & Operasional Jaringan',
          company: 'PT Telkom Indonesia (Persero) Tbk'
        };
      case 'Penagihan':
        return {
          email: defaultData.defaultRecipient || 'penagihan.kontrak@telkom.co.id',
          name: defaultData.defaultRecipientName || 'Tim Verifikasi Penagihan & Kontrak',
          company: 'PT Telkom Indonesia (Persero) Tbk'
        };
      case 'BAST':
      default:
        return {
          email: defaultData.defaultRecipient || 'sap.procurement@telkom.co.id',
          name: defaultData.defaultRecipientName || 'Bpk. Aris Munandar / Tim SAP Asset',
          company: 'PT Telekomunikasi Indonesia, Tbk'
        };
    }
  };

  const initialRec = getDefaultRecipientInfo();

  // Form states
  const [recipientEmail, setRecipientEmail] = useState(initialRec.email);
  const [recipientName, setRecipientName] = useState(initialRec.name);
  const [recipientCompany, setRecipientCompany] = useState(initialRec.company);
  
  // Specific data fields
  const [woNumber, setWoNumber] = useState(defaultData.woNumber);
  const [projectName, setProjectName] = useState(defaultData.projectName);
  const [vendorName, setVendorName] = useState(defaultData.vendorName || 'Belacom');

  // BAST fields
  const [segmentLocation, setSegmentLocation] = useState(defaultData.segmentLocation || 'Area Jabodetabek');
  const [realisasiJarak, setRealisasiJarak] = useState(defaultData.realisasiJarak || '-');
  const [documentNumber, setDocumentNumber] = useState(
    defaultData.documentNumber || `BAST/${defaultData.woNumber}/BELACOM/${new Date().getFullYear()}`
  );

  // Invoice fields
  const [wilayahOperasi, setWilayahOperasi] = useState(defaultData.wilayahOperasi || defaultData.segmentLocation || 'Area Jabodetabek');
  const [nomorBastAcuan, setNomorBastAcuan] = useState(
    defaultData.nomorBastAcuan || `BAST/${defaultData.woNumber}/BELACOM/${new Date().getFullYear()}`
  );

  // RFS fields
  const [lingkupTugas, setLingkupTugas] = useState(defaultData.lingkupTugas || defaultData.projectName);
  const [segmenJaringan, setSegmenJaringan] = useState(defaultData.segmenJaringan || defaultData.segmentLocation || 'Segmen Distribusi Fiber Optic');
  const [statusJaringan, setStatusJaringan] = useState(defaultData.statusJaringan || 'Ready For Service (RFS) - Aktif Normal');

  // Penagihan fields
  const [mitraPelaksana, setMitraPelaksana] = useState(defaultData.mitraPelaksana || 'PT. Belacom Indonesia Telecom');
  const [statusDokumen, setStatusDokumen] = useState(defaultData.statusDokumen || 'Lengkap 13 Checklist (Terverifikasi)');

  // Multi-Cc list & current text
  const [ccList, setCcList] = useState<string[]>([
    'project.control@belacom.co.id',
    'gov.jabo.review@telkom.co.id'
  ]);
  const [ccInput, setCcInput] = useState('');

  // Selected attachments checklist
  const [selectedAttachments, setSelectedAttachments] = useState<EmailAttachment[]>(
    defaultData.availableAttachments
  );

  // Helper generator function to produce pristine aligned letter text
  const createFormattedBody = (overrides?: Partial<{
    recName: string;
    recComp: string;
    wo: string;
    proj: string;
    vendor: string;
    seg: string;
    dist: string;
    doc: string;
    wilayah: string;
    bastAcuan: string;
    lingkup: string;
    segmenNet: string;
    statusNet: string;
    mitra: string;
    statusDoc: string;
    atts: EmailAttachment[];
  }>) => {
    return generateOfficialEmailPlainText(defaultData.requestType, {
      recipientName: overrides?.recName ?? recipientName,
      recipientCompany: overrides?.recComp ?? recipientCompany,
      woNumber: overrides?.wo ?? woNumber,
      projectName: overrides?.proj ?? projectName,
      vendorName: overrides?.vendor ?? vendorName,
      segmentLocation: overrides?.seg ?? segmentLocation,
      realisasiJarak: overrides?.dist ?? realisasiJarak,
      documentNumber: overrides?.doc ?? documentNumber,
      wilayahOperasi: overrides?.wilayah ?? wilayahOperasi,
      nomorBastAcuan: overrides?.bastAcuan ?? nomorBastAcuan,
      lingkupTugas: overrides?.lingkup ?? lingkupTugas,
      segmenJaringan: overrides?.segmenNet ?? segmenJaringan,
      statusJaringan: overrides?.statusNet ?? statusJaringan,
      mitraPelaksana: overrides?.mitra ?? mitraPelaksana,
      statusDokumen: overrides?.statusDoc ?? statusDokumen,
      attachments: overrides?.atts ?? selectedAttachments
    });
  };

  // Helper default subject
  const getDefaultSubject = () => {
    switch (defaultData.requestType) {
      case 'BAST':
        return `[PENGAJUAN BAST] Berita Acara Serah Terima Pekerjaan - ${defaultData.woNumber}`;
      case 'Invoice':
        return `[SUBMISSION INVOICE] Pengajuan Faktur Tagihan Pekerjaan - ${defaultData.woNumber}`;
      case 'RFS':
        return `[NOTIFIKASI RFS] Berita Acara Uji Terima & Uji Kelayakan Jaringan - ${defaultData.woNumber}`;
      case 'Penagihan':
        return `[BERKAS PENAGIHAN] Verifikasi Lengkap 13 Checklist Administrasi Penagihan - ${defaultData.woNumber}`;
      default:
        return `[PENGAJUAN SAP] ${defaultData.requestType} - ${defaultData.woNumber} - ${defaultData.projectName}`;
    }
  };

  // Subject state
  const [subject, setSubject] = useState(getDefaultSubject());

  // User notes (email body text)
  const [userNotes, setUserNotes] = useState(() =>
    generateOfficialEmailPlainText(defaultData.requestType, {
      recipientName: initialRec.name,
      recipientCompany: initialRec.company,
      woNumber: defaultData.woNumber,
      projectName: defaultData.projectName,
      vendorName: defaultData.vendorName || 'Belacom',
      segmentLocation: defaultData.segmentLocation || 'Area Jabodetabek',
      realisasiJarak: defaultData.realisasiJarak || '-',
      documentNumber: defaultData.documentNumber || `BAST/${defaultData.woNumber}/BELACOM/${new Date().getFullYear()}`,
      wilayahOperasi: defaultData.wilayahOperasi || defaultData.segmentLocation || 'Area Jabodetabek',
      nomorBastAcuan: defaultData.nomorBastAcuan || `BAST/${defaultData.woNumber}/BELACOM/${new Date().getFullYear()}`,
      lingkupTugas: defaultData.lingkupTugas || defaultData.projectName,
      segmenJaringan: defaultData.segmenJaringan || defaultData.segmentLocation || 'Segmen Distribusi Fiber Optic',
      statusJaringan: defaultData.statusJaringan || 'Ready For Service (RFS) - Aktif Normal',
      mitraPelaksana: defaultData.mitraPelaksana || 'PT. Belacom Indonesia Telecom',
      statusDokumen: defaultData.statusDokumen || 'Lengkap 13 Checklist (Terverifikasi)',
      attachments: defaultData.availableAttachments
    })
  );

  // Update defaults when modal opens with new data
  useEffect(() => {
    if (isOpen) {
      const rec = getDefaultRecipientInfo();
      const wo = defaultData.woNumber;
      const proj = defaultData.projectName;
      const vendor = defaultData.vendorName || 'Belacom';
      const seg = defaultData.segmentLocation || 'Area Jabodetabek';
      const dist = defaultData.realisasiJarak || '-';
      const doc = defaultData.documentNumber || `BAST/${defaultData.woNumber}/BELACOM/${new Date().getFullYear()}`;
      const wilayah = defaultData.wilayahOperasi || defaultData.segmentLocation || 'Area Jabodetabek';
      const bastAcuan = defaultData.nomorBastAcuan || `BAST/${defaultData.woNumber}/BELACOM/${new Date().getFullYear()}`;
      const lingkup = defaultData.lingkupTugas || defaultData.projectName;
      const segmenNet = defaultData.segmenJaringan || defaultData.segmentLocation || 'Segmen Distribusi Fiber Optic';
      const statusNet = defaultData.statusJaringan || 'Ready For Service (RFS) - Aktif Normal';
      const mitra = defaultData.mitraPelaksana || 'PT. Belacom Indonesia Telecom';
      const statusDoc = defaultData.statusDokumen || 'Lengkap 13 Checklist (Terverifikasi)';

      setRecipientEmail(rec.email);
      setRecipientName(rec.name);
      setRecipientCompany(rec.company);
      setWoNumber(wo);
      setProjectName(proj);
      setVendorName(vendor);
      setSegmentLocation(seg);
      setRealisasiJarak(dist);
      setDocumentNumber(doc);
      setWilayahOperasi(wilayah);
      setNomorBastAcuan(bastAcuan);
      setLingkupTugas(lingkup);
      setSegmenJaringan(segmenNet);
      setStatusJaringan(statusNet);
      setMitraPelaksana(mitra);
      setStatusDokumen(statusDoc);
      setSelectedAttachments(defaultData.availableAttachments);

      setSubject(getDefaultSubject());

      setUserNotes(
        generateOfficialEmailPlainText(defaultData.requestType, {
          recipientName: rec.name,
          recipientCompany: rec.company,
          woNumber: wo,
          projectName: proj,
          vendorName: vendor,
          segmentLocation: seg,
          realisasiJarak: dist,
          documentNumber: doc,
          wilayahOperasi: wilayah,
          nomorBastAcuan: bastAcuan,
          lingkupTugas: lingkup,
          segmenJaringan: segmenNet,
          statusJaringan: statusNet,
          mitraPelaksana: mitra,
          statusDokumen: statusDoc,
          attachments: defaultData.availableAttachments
        })
      );
    }
  }, [isOpen, defaultData]);

  // Pasang window helper untuk menangkap klik unduh dari preview HTML
  useEffect(() => {
    (window as unknown as { __belacomDownload: (name: string, url?: string) => void }).__belacomDownload = (name: string, url?: string) => {
      downloadAttachedFile(name, url);
      showToast('info', 'Mengunduh Berkas', `File ${name} sedang diunduh...`);
    };

    return () => {
      delete (window as unknown as { __belacomDownload?: unknown }).__belacomDownload;
    };
  }, [showToast]);

  if (!isOpen) return null;

  // Handler Multi-Cc dengan validasi RFC 5322
  const handleAddCc = () => {
    const trimmed = ccInput.trim().replace(/,/g, '');
    if (!trimmed) return;
    if (ccList.includes(trimmed)) {
      setCcInput('');
      return;
    }
    if (!isValidEmail(trimmed)) {
      showToast('error', 'Format Email Tidak Valid', `Email '${trimmed}' tidak memenuhi format standar (contoh: user@domain.com).`);
      return;
    }
    setCcList(prev => [...prev, trimmed]);
    setCcInput('');
  };

  const handleCcKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddCc();
    }
  };

  const handleRemoveCc = (emailToRemove: string) => {
    setCcList(prev => prev.filter(e => e !== emailToRemove));
  };

  // Toggle attachment checkbox
  const handleToggleAttachment = (attachment: EmailAttachment) => {
    setSelectedAttachments(prev => {
      const exists = prev.some(a => a.name === attachment.name);
      return exists ? prev.filter(a => a.name !== attachment.name) : [...prev, attachment];
    });
  };

  // Re-generate and neat-align body text
  const handleFormatRapi = () => {
    const formatted = createFormattedBody();
    setUserNotes(formatted);
    showToast('success', 'Format Dirapihkan', 'Format surat telah dirapihkan rata kiri dan kanan dengan posisi titik dua sejajar.');
  };

  const emailData: EmailSubmissionData = {
    recipientName,
    recipientEmail,
    recipientCompany,
    ccEmails: ccList,
    subject,
    projectName,
    woNumber,
    segmentLocation,
    realisasiJarak,
    documentNumber,
    wilayahOperasi,
    nomorBastAcuan,
    lingkupTugas,
    segmenJaringan,
    statusJaringan,
    mitraPelaksana,
    statusDokumen,
    vendorName,
    requestType: defaultData.requestType,
    userNotes,
    attachments: selectedAttachments,
    submissionDate: new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  };

  const generatedHtml = generateSubmissionEmailHtml(emailData);

  // Submit Handler: Langsung membuka Gmail Web di tab baru
  const handleOpenGmail = () => {
    // 1. Validasi penerima utama (To)
    const to = recipientEmail.trim();
    if (!to || !isValidEmail(to)) {
      showToast('error', 'Email Penerima Wajib Valid', 'Harap isi alamat email penerima utama yang valid (contoh: user@telkom.co.id).');
      return;
    }

    // 2. Validasi Cc jika ada
    const { invalid: invalidCc } = validateEmailList(ccList);
    if (invalidCc.length > 0) {
      showToast('error', 'Daftar Cc Tidak Valid', `Alamat email Cc berikut tidak valid: ${invalidCc.join(', ')}`);
      return;
    }

    const cc = ccList.join(',');
    const notes = userNotes;

    // 3. Formula pembukaan Gmail Web di tab baru
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&cc=${encodeURIComponent(cc)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(notes)}`;
    window.open(gmailUrl, '_blank');

    // 4. Tampilkan notifikasi sukses
    showToast('success', 'Draf berhasil dibuka di Gmail Web', 'Tab Gmail Web telah dibuka dengan draf formulir pengajuan lengkap.');

    // 5. Perbarui status BAST jika terkait BAST
    if (defaultData.requestType === 'BAST') {
      const targetBast = defaultData.bastId 
        ? bastList.find(b => b.id === defaultData.bastId)
        : bastList.find(b => b.woNumber === defaultData.woNumber);

      if (targetBast) {
        updateBAST(targetBast.id, { statusBast: 'Submitted via Gmail' });
      } else {
        const matchByWo = bastList.find(b => b.woNumber === defaultData.woNumber);
        if (matchByWo) {
          updateBAST(matchByWo.id, { statusBast: 'Submitted via Gmail' });
        }
      }
    }

    // 6. Simpan riwayat pengiriman ke LocalStorage
    try {
      const historyKey = 'belacom_sent_emails';
      const existing = localStorage.getItem(historyKey);
      const parsed = existing ? JSON.parse(existing) : [];
      const newEntry = {
        id: 'GMAIL-' + Math.random().toString(36).substring(2, 9),
        sentAt: new Date().toISOString(),
        deliveryStatus: 'Submitted via Gmail',
        to,
        cc,
        subject,
        woNumber,
        requestType: defaultData.requestType
      };
      localStorage.setItem(historyKey, JSON.stringify([newEntry, ...parsed].slice(0, 50)));
    } catch (err) {
      console.warn('LocalStorage save error:', err);
    }

    // 7. Tutup modal secara otomatis
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-w-5xl w-full max-h-[94vh] h-[92vh]">
        
        {/* Header Modal */}
        <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/15 text-blue-400 rounded-xl border border-blue-500/25 shrink-0 shadow-lg shadow-blue-950/40">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Kirim Email Resmi & Dokumen SAP
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {defaultData.requestType}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-emerald-400" /> Gmail Web Direct
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                No. WO: <span className="text-cyan-400 font-bold">{woNumber}</span> · {projectName}
              </p>
            </div>
          </div>

          {/* Tab Switcher: Form vs Gmail Preview */}
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'form'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Form Pengiriman</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'preview'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Tampilan Penerima (Gmail)</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              title="Tutup (X)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6">
          
          {/* TAB 1: FORM PENGIRIMAN */}
          {activeTab === 'form' && (
            <div className="space-y-5 max-w-4xl mx-auto">
              
              {/* Quick Info Banner */}
              <div className="p-3 bg-blue-950/30 border border-blue-500/20 rounded-xl flex items-center justify-between gap-3 text-xs text-blue-300">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                    <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div>
                    <span className="font-semibold block text-white">Alur Pengiriman Langsung ke Gmail Web</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Draf surat resmi {defaultData.requestType} otomatis tersusun rapi dengan format rata kiri & kanan.
                    </span>
                  </div>
                </div>
                <div className="shrink-0 hidden md:block">
                  <span className="px-2 py-1 rounded bg-blue-500/20 text-cyan-300 font-mono text-[10px] font-semibold border border-blue-400/30">
                    Template: [{defaultData.requestType.toUpperCase()}]
                  </span>
                </div>
              </div>

              {/* Penerima Utama & Nama */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Penerima Utama (To) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="contoh: sap.procurement@telkom.co.id"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 text-xs text-white rounded-xl p-2.5 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Kepada Yth. (Nama Penerima / Unit)
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Nama Penerima / Tim Verifikasi"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 text-xs text-white rounded-xl p-2.5 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Perusahaan / Instansi
                  </label>
                  <input
                    type="text"
                    value={recipientCompany}
                    onChange={(e) => setRecipientCompany(e.target.value)}
                    placeholder="PT Telkom Indonesia (Persero) Tbk"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 text-xs text-white rounded-xl p-2.5 outline-none"
                  />
                </div>
              </div>

              {/* Multi-Cc Input Field */}
              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Tembusan Email (Multi-Cc)</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Tekan Enter atau koma (,) untuk menambahkan email
                  </span>
                </label>

                {/* Chips of added Cc emails */}
                <div className="flex flex-wrap gap-1.5 min-h-[32px] p-1 bg-slate-950/80 border border-slate-800/80 rounded-lg">
                  {ccList.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-md text-[11px] font-mono"
                    >
                      <span>{email}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCc(email)}
                        className="text-slate-400 hover:text-rose-400 cursor-pointer"
                        title="Hapus Cc"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  
                  <input
                    type="email"
                    value={ccInput}
                    onChange={(e) => setCcInput(e.target.value)}
                    onKeyDown={handleCcKeyDown}
                    placeholder={ccList.length === 0 ? "Ketik email Cc lalu tekan Enter..." : "Tambah Cc..."}
                    className="flex-1 bg-transparent text-xs text-white placeholder-slate-600 outline-none min-w-[160px] px-2 py-0.5 font-mono"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Total {ccList.length} alamat Cc terdaftar</span>
                  {ccInput && (
                    <button
                      type="button"
                      onClick={handleAddCc}
                      className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                    >
                      + Tambah Email
                    </button>
                  )}
                </div>
              </div>

              {/* Subjek Email */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Subjek Email Resmi
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 text-xs text-white rounded-xl p-2.5 outline-none font-mono font-semibold"
                />
              </div>

              {/* Rincian Paket Pekerjaan (Disesuaikan menurut tipe dokumen) */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-white uppercase font-mono flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-cyan-400" />
                    Rincian Spesifikasi Dokumen ({defaultData.requestType})
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Tersinkronisasi otomatis ke isi surat
                  </span>
                </div>

                {/* FIELDS UNTUK BAST */}
                {defaultData.requestType === 'BAST' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">
                        • Nomor WO
                      </label>
                      <input
                        type="text"
                        value={woNumber}
                        onChange={(e) => setWoNumber(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-cyan-300 font-mono font-bold rounded-lg p-2 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">
                        • Uraian Pekerjaan
                      </label>
                      <input
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-white rounded-lg p-2 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">
                        • Segmen / Lokasi
                      </label>
                      <input
                        type="text"
                        value={segmentLocation}
                        onChange={(e) => setSegmentLocation(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-slate-200 rounded-lg p-2 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">
                        • Realisasi Jarak
                      </label>
                      <input
                        type="text"
                        value={realisasiJarak}
                        onChange={(e) => setRealisasiJarak(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-emerald-300 font-mono font-bold rounded-lg p-2 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">
                        • Nomor Dokumen
                      </label>
                      <input
                        type="text"
                        value={documentNumber}
                        onChange={(e) => setDocumentNumber(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-amber-300 font-mono font-bold rounded-lg p-2 outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* FIELDS UNTUK INVOICE */}
                {defaultData.requestType === 'Invoice' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">
                        • Nomor WO
                      </label>
                      <input
                        type="text"
                        value={woNumber}
                        onChange={(e) => setWoNumber(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-cyan-300 font-mono font-bold rounded-lg p-2 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">
                        • Uraian Pekerjaan
                      </label>
                      <input
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-white rounded-lg p-2 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">
                        • Wilayah Operasi
                      </label>
                      <input
                        type="text"
                        value={wilayahOperasi}
                        onChange={(e) => setWilayahOperasi(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-slate-200 rounded-lg p-2 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">
                        • Nomor BAST Acuan
                      </label>
                      <input
                        type="text"
                        value={nomorBastAcuan}
                        onChange={(e) => setNomorBastAcuan(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-amber-300 font-mono font-bold rounded-lg p-2 outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* FIELDS UNTUK RFS */}
                {defaultData.requestType === 'RFS' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">
                        • Nomor WO
                      </label>
                      <input
                        type="text"
                        value={woNumber}
                        onChange={(e) => setWoNumber(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-cyan-300 font-mono font-bold rounded-lg p-2 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">
                        • Lingkup Tugas
                      </label>
                      <input
                        type="text"
                        value={lingkupTugas}
                        onChange={(e) => setLingkupTugas(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-white rounded-lg p-2 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">
                        • Segmen Jaringan
                      </label>
                      <input
                        type="text"
                        value={segmenJaringan}
                        onChange={(e) => setSegmenJaringan(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-slate-200 rounded-lg p-2 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">
                        • Status Jaringan
                      </label>
                      <input
                        type="text"
                        value={statusJaringan}
                        onChange={(e) => setStatusJaringan(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-emerald-300 font-mono font-bold rounded-lg p-2 outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* FIELDS UNTUK PENAGIHAN */}
                {defaultData.requestType === 'Penagihan' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">
                        • Nomor WO
                      </label>
                      <input
                        type="text"
                        value={woNumber}
                        onChange={(e) => setWoNumber(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-cyan-300 font-mono font-bold rounded-lg p-2 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">
                        • Uraian Pekerjaan
                      </label>
                      <input
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-white rounded-lg p-2 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">
                        • Mitra Pelaksana
                      </label>
                      <input
                        type="text"
                        value={mitraPelaksana}
                        onChange={(e) => setMitraPelaksana(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-slate-200 rounded-lg p-2 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">
                        • Status Dokumen
                      </label>
                      <input
                        type="text"
                        value={statusDokumen}
                        onChange={(e) => setStatusDokumen(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-emerald-300 font-mono font-bold rounded-lg p-2 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Dokumen Lampiran Teknis */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-cyan-400 uppercase font-mono flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5" />
                    Dokumen Lampiran Terlampir ({selectedAttachments.length} Dipilih)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedAttachments.length === defaultData.availableAttachments.length) {
                        setSelectedAttachments([]);
                      } else {
                        setSelectedAttachments(defaultData.availableAttachments);
                      }
                    }}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-mono cursor-pointer"
                  >
                    {selectedAttachments.length === defaultData.availableAttachments.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                  </button>
                </div>

                {defaultData.availableAttachments.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Belum ada dokumen PDF terunggah pada data ini.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {defaultData.availableAttachments.map((att) => {
                      const isChecked = selectedAttachments.some(a => a.name === att.name);
                      return (
                        <div
                          key={att.name}
                          onClick={() => handleToggleAttachment(att)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-blue-950/40 border-blue-500/40 text-white'
                              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                              isChecked ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-700 bg-slate-900'
                            }`}>
                              {isChecked && <Check className="w-3 h-3" />}
                            </div>
                            <span className="text-xs font-mono truncate" title={att.name}>{att.name}</span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] text-slate-500 font-mono">{formatFileSize(att.sizeBytes)}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadAttachedFile(att.name, att.url);
                                showToast('info', 'Mengunduh Berkas', `File ${att.name} sedang diunduh...`);
                              }}
                              className="p-1 hover:text-cyan-400 text-slate-400 cursor-pointer"
                              title="Unduh Berkas Langsung"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Isi Surat Pengajuan Resmi - Rata Kiri & Kanan */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-white flex items-center gap-1.5">
                      <AlignJustify className="w-4 h-4 text-blue-400" />
                      Draf Surat Pengajuan Resmi {defaultData.requestType} (Rata Kiri & Kanan)
                    </label>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Teks ini akan otomatis dimasukkan ke dalam body Gmail Web dengan format yang rapi dan posisi titik dua sejajar.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleFormatRapi}
                    className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                    title="Format Ulang Rata Kiri & Kanan"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Rapihkan Format Surat</span>
                  </button>
                </div>

                <div className="relative">
                  <textarea
                    rows={15}
                    value={userNotes}
                    onChange={(e) => setUserNotes(e.target.value)}
                    placeholder="Isi surat resmi..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 text-xs text-slate-100 rounded-xl p-4 outline-none font-mono leading-relaxed resize-y selection:bg-blue-600 selection:text-white"
                  />
                  <div className="absolute right-3 bottom-3 pointer-events-none">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                      <CheckCircle2 className="w-3 h-3" /> Rata Kiri & Kanan
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: TAMPILAN PENERIMA (GMAIL SIMULATION PREVIEW) */}
          {activeTab === 'preview' && (
            <div className="max-w-4xl mx-auto space-y-4">
              
              {/* Gmail Mock Client Header Frame */}
              <div className="bg-[#f6f8fc] border border-slate-300 rounded-xl overflow-hidden shadow-xl text-slate-800">
                
                {/* Gmail Top Bar */}
                <div className="bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-red-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                      M
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span>Gmail Client Preview</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">Inbox</span>
                      </h4>
                      <p className="text-[10px] text-slate-500 font-mono">
                        Tampilan layout email resmi {defaultData.requestType} untuk penerima
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-slate-500 font-mono">
                    {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* Email Metadata Envelope Header */}
                <div className="p-5 bg-white border-b border-slate-200 space-y-2">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    {subject}
                  </h2>

                  <div className="flex items-start justify-between gap-3 text-xs pt-1">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        B
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">
                          PT. BELACOM INDONESIA TELECOM <span className="text-slate-500 font-normal text-[11px]">&lt;project.control@belacom.co.id&gt;</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          to: <strong className="text-slate-700">{recipientEmail}</strong>
                          {ccList.length > 0 && (
                            <span className="ml-1 text-slate-500">
                              · cc: {ccList.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono shrink-0">
                      Standard TLS Security
                    </div>
                  </div>
                </div>

                {/* Rendered HTML Email Content with active download triggers */}
                <div className="p-4 sm:p-6 bg-[#f1f5f9] overflow-x-auto flex justify-center">
                  <div 
                    className="w-full"
                    dangerouslySetInnerHTML={{ __html: generatedHtml }}
                  />
                </div>

                {/* Quick Interactive Download Strip */}
                {selectedAttachments.length > 0 && (
                  <div className="p-4 bg-white border-t border-slate-200">
                    <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5 font-mono">
                      <Download className="w-3.5 h-3.5 text-blue-600" />
                      Unduh Berkas Lampiran ({selectedAttachments.length} Dokumen):
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedAttachments.map((att) => (
                        <button
                          key={att.name}
                          type="button"
                          onClick={() => {
                            downloadAttachedFile(att.name, att.url);
                            showToast('success', 'Mengunduh Berkas', `${att.name} berhasil diunduh ke komputer.`);
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          <span>{att.name}</span>
                          <span className="text-[10px] text-slate-400">({formatFileSize(att.sizeBytes)})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              </div>

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-850 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
            <Building className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="hidden sm:inline">Pengiriman resmi langsung via Google Mail Web (mail.google.com)</span>
          </div>

          <div className="flex items-center gap-2">
            <TouchButton 
              variant="secondary" 
              size="md" 
              onClick={onClose}
            >
              Tutup
            </TouchButton>

            <TouchButton
              variant="primary"
              size="md"
              icon={<ExternalLink className="w-4 h-4" />}
              onClick={handleOpenGmail}
              showFingerIcon
              className="font-bold bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/30 transition-all hover:scale-102 active:scale-98"
            >
              Kirim via Gmail Web
            </TouchButton>
          </div>
        </div>

      </div>
    </div>
  );
};
