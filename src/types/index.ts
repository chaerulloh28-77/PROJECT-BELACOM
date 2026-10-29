export type AssignmentArea = 'Jabo 1' | 'Jabo 2' | 'Jabo 3';

export type TeamCode = 
  | 'ABR 01' | 'ABR 02' | 'ABR 03' | 'ABR 04' | 'ABR 05' | 'ABR 06' 
  | 'ABR 07' | 'ABR 08' | 'ABR 09' | 'ABR 10' | 'ABR 11' | 'ABR 12'
  | string;

export type WOOption = 
  | 'Plan Network Interconection POP'
  | 'Splice Interconnection POP Mini'
  | 'Splice Interconnection Site'
  | 'Splice Interconnection POP'
  | string;

export type StatusWO = 'Not Yet' | 'In Progress' | 'Done' | 'Cancel' | 'Pending';

export type StatusProject = 'Not Yet' | 'In Progress' | 'Done' | 'Cancel';

export type StatusTeamProject = 'Not Yet' | 'Waiting Schedule' | 'On Schedule' | 'On Progress' | 'Cancel' | string;

export type StatusBAST = 'Not Yet' | 'Submit' | 'Done' | 'Submitted via Gmail' | 'Submitted via Email';

export type StatusInvoice = 'Not Yet' | 'Submit' | 'Revision' | 'Done';

export type StatusPenagihan = 'Draft' | 'Dalam Review' | 'Disetujui' | 'Lunas' | 'Ditolak';

export interface PDFFileMeta {
  id: string;
  name: string;
  sizeBytes: number;
  uploadDate: string;
  url?: string;
  pages?: number;
  fileType?: string;
  mimeType?: string;
  imageDataUrl?: string;
}

export interface PhotoDocumentation {
  fotoClosurePdf?: PDFFileMeta;
  opmPdf?: PDFFileMeta;
  olsPdf?: PDFFileMeta;
  btsPdf?: PDFFileMeta;
  otdrPdf?: PDFFileMeta;
}

export interface PendingLogEntry {
  pendingAt: string;   // Timestamp ISO saat diubah ke Pending
  resumedAt?: string;  // Timestamp ISO saat dilanjutkan kembali
  pendingDays?: number; // Jumlah hari jeda
}

export interface DailyReportItem {
  id: string;
  woType: WOOption;
  monthReleaseWo: string; // YYYY-MM
  assignment: AssignmentArea;
  team: TeamCode;
  statusWo: StatusWO;
  pic: string;
  workType: string; // core search/manual
  releaseDate: string; // YYYY-MM-DD
  startDate: string; // YYYY-MM-DD
  finishDate: string; // YYYY-MM-DD
  durationDays: number;
  woNumber: string;
  estimatedDistanceMeters: number;
  estimatedDistancePdf?: PDFFileMeta;
  totalDistanceMeters: number;
  totalDistancePdf?: PDFFileMeta;
  statusTeamProject: StatusTeamProject;
  pathLengthMeters: number;
  documentation: PhotoDocumentation;
  remarks: string;
  pendingLogs?: PendingLogEntry[];
  // Tagging End to End Location
  originLocation?: string;
  originCoordinates?: string;
  originPhotoFile?: PDFFileMeta;
  originTaggingDocFile?: PDFFileMeta;
  destinationLocation?: string;
  destinationCoordinates?: string;
  destinationPhotoFile?: PDFFileMeta;
  destinationTaggingDocFile?: PDFFileMeta;
  routeMapFile?: PDFFileMeta;
  routeGmapsUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BASTItem {
  id: string;
  woNumber: string;
  bastNumber?: string;
  woType: WOOption;
  apdPdf?: PDFFileMeta;
  abdPdf?: PDFFileMeta;
  coreConnectionPdf?: PDFFileMeta;
  // Daily report embedded or linked attributes
  workType: string;
  releaseDate: string;
  startDate: string;
  finishDate: string;
  abdDate?: string;
  coreConnectionDate?: string;
  durationDays: number;
  durasiDate?: number | string;
  estimatedDistanceMeters: number;
  estimatedDistancePdf?: PDFFileMeta;
  totalDistanceMeters: number;
  totalDistancePdf?: PDFFileMeta;
  fotoDokumentasiPdf?: PDFFileMeta; // Max 4MB enforce
  fotoDokumentasiPdfs?: PDFFileMeta[]; // Support multiple photo documentation files
  statusBast: StatusBAST;
  notes?: string;
  // Tagging End to End Location
  originLocation?: string;
  originCoordinates?: string;
  originPhotoFile?: PDFFileMeta;
  originTaggingDocFile?: PDFFileMeta;
  destinationLocation?: string;
  destinationCoordinates?: string;
  destinationPhotoFile?: PDFFileMeta;
  destinationTaggingDocFile?: PDFFileMeta;
  // Sub Routing Workflow Alur BAST (4 Tahapan Berurutan)
  workflow?: BASTWorkflow;
  createdAt: string;
  updatedAt: string;
}

export type BASTWorkflowStage1Status = 'Pending' | 'Selesai' | 'Sent';
export type BASTWorkflowStage2Status = 'Menunggu Pengecekan' | 'Approved' | 'Ada Catatan Revisi';
export type BASTWorkflowStage3Status = 'Menunggu TTD' | 'In Progress' | 'Selesai TTD';
export type BASTWorkflowStage4Status = 'Menunggu Finance' | 'Diterima Finance' | 'Siap Invoice';

export interface BASTWorkflowStage1 {
  status: BASTWorkflowStage1Status;
  isCompleted?: boolean;
  tanggalKirim?: string;
  emailSentDate?: string;
  emailSubject?: string;
  emailNumber?: string;
  notes?: string;
}

export interface BASTWorkflowStage2 {
  status: BASTWorkflowStage2Status;
  isCompleted?: boolean;
  adminName?: string;
  checkedDate?: string;
  notes?: string;
}

export interface BASTWorkflowStage3 {
  status: BASTWorkflowStage3Status;
  isCompleted?: boolean;
  approverNames?: string;
  signedDate?: string;
  notes?: string;
}

export interface BASTWorkflowStage4 {
  status: BASTWorkflowStage4Status;
  isCompleted?: boolean;
  tanggalMasukFinance?: string;
  receivedDate?: string;
  financeRefNumber?: string;
  notes?: string;
}

export interface BASTWorkflow {
  stage1EmailUser?: BASTWorkflowStage1;
  stage1EmailFmi?: BASTWorkflowStage1;
  stage2AdminUser?: BASTWorkflowStage2;
  stage2AdminFmi?: BASTWorkflowStage2;
  stage3RoutingTtd?: BASTWorkflowStage3;
  stage4Finance?: BASTWorkflowStage4;
  updatedAt?: string;
}

export interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  woNumber: string;
  statusInvoice: StatusInvoice;
  boqPdf?: PDFFileMeta;
  poNumber: string;
  poPdf?: PDFFileMeta;
  invoiceReceiptPdf?: PDFFileMeta;
  fakturPajakPdf?: PDFFileMeta;
  amountRupiah: number;
  issueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface PenagihanItem {
  id: string;
  billingCode: string;
  woNumber: string;
  tanggalSubmit?: string; // Format YYYY-MM-DD
  statusPenagihan: StatusPenagihan;
  invoicePdf?: PDFFileMeta;
  bastPdf?: PDFFileMeta;
  kwitansiPdf?: PDFFileMeta;
  apdPdf?: PDFFileMeta;
  abdPdf?: PDFFileMeta;
  coreConnectionPdf?: PDFFileMeta;
  fotoDokumentasiPdf?: PDFFileMeta; // Max 4MB enforce
  fotoDokumentasiPdfs?: PDFFileMeta[]; // Support multiple photo documentation files
  
  // Daily report team details (Optional)
  dailyReportWorkType?: string;
  dailyReportReleaseDate?: string;
  dailyReportStartDate?: string;
  dailyReportFinishDate?: string;
  dailyReportDurationDays?: number;
  dailyReportEstimatedDistanceMeters?: number;
  dailyReportEstimatedDistancePdf?: PDFFileMeta;
  dailyReportTotalDistanceMeters?: number;
  dailyReportTotalDistancePdf?: PDFFileMeta;
  
  poPdf?: PDFFileMeta;
  dataMaterialPdf?: PDFFileMeta;
  boqPdf?: PDFFileMeta;
  
  totalNominalRupiah: number;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export type ActiveTab = 
  | 'overview' 
  | 'dashboard-tagihan'
  | 'daily-report' 
  | 'bast' 
  | 'invoice' 
  | 'penagihan'
  | 'user-settings';

export interface UserProfile {
  username: string;
  fullName: string;
  email: string;
  role: string;
  updatedAt?: string;
}

export interface SystemUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: 'Super Admin' | 'Pengawas Lapangan' | 'Staff Administrasi' | 'Koordinator Operasional' | string;
  area?: string;
  status: 'Aktif' | 'Nonaktif';
  lastLogin: string;
  createdAt: string;
}

export interface TeamItem {
  id: string;
  teamName: string;
  picLeader: string;
  helpers: string[];
  phone: string;
  area: string;
  createdAt: string;
  pic?: string;
}

export interface FilterState {
  searchQuery: string;
  assignmentFilter: string;
  statusFilter: string;
  teamFilter: string;
  dateRangeStart: string;
  dateRangeEnd: string;
}
