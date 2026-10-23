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

export type StatusWO = 'Not Yet' | 'In Progress' | 'Done' | 'Cancel';

export type StatusProject = 'Not Yet' | 'In Progress' | 'Done' | 'Cancel';

export type StatusTeamProject = 'Not Yet' | 'Waiting Schedule' | 'On Schedule' | 'On Progress' | 'Cancel' | string;

export type StatusBAST = 'Not Yet' | 'Submit' | 'Done' | 'Submitted via Gmail';

export type StatusRFS = 'Not Yet' | 'Submit' | 'Done';

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
}

export interface PhotoDocumentation {
  fotoClosurePdf?: PDFFileMeta;
  opmPdf?: PDFFileMeta;
  olsPdf?: PDFFileMeta;
  btsPdf?: PDFFileMeta;
  otdrPdf?: PDFFileMeta;
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
  // Tagging End to End Location
  originLocation?: string;
  originCoordinates?: string;
  destinationLocation?: string;
  destinationCoordinates?: string;
  routeGmapsUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BASTItem {
  id: string;
  woNumber: string;
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
  statusBast: StatusBAST;
  notes?: string;
  // Tagging End to End Location
  originLocation?: string;
  originCoordinates?: string;
  destinationLocation?: string;
  destinationCoordinates?: string;
  routeGmapsUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  woNumber: string;
  statusInvoice: StatusInvoice;
  boqPdf?: PDFFileMeta;
  poNumber: string;
  poPdf?: PDFFileMeta;
  fakturPajakNumber?: string;
  fakturPajakPdf?: PDFFileMeta;
  rfsNumber?: string;
  rfsPdf?: PDFFileMeta;
  amountRupiah: number;
  issueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyHeaderDetails {
  companyName: string;
  phone: string;
  email: string;
  address: string;
  letterNumber: string;
}

export interface ClientInformation {
  clientCompanyName: string;
  picName: string;
}

export interface RFSItem {
  id: string;
  rfsNumber: string;
  woNumber: string;
  companyHeader: CompanyHeaderDetails;
  clientInfo: ClientInformation;
  scopeOfService: string;
  boqPdf?: PDFFileMeta;
  sphPdf?: PDFFileMeta;
  timelinePdf?: PDFFileMeta;
  statusRfs: StatusRFS;
  submissionDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface PenagihanItem {
  id: string;
  billingCode: string;
  woNumber: string;
  statusPenagihan: StatusPenagihan;
  invoicePdf?: PDFFileMeta;
  bastPdf?: PDFFileMeta;
  kwitansiPdf?: PDFFileMeta;
  apdPdf?: PDFFileMeta;
  abdPdf?: PDFFileMeta;
  coreConnectionPdf?: PDFFileMeta;
  fotoDokumentasiPdf?: PDFFileMeta; // Max 4MB enforce
  
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
  fakturPajakPdf?: PDFFileMeta;
  rfsPdf?: PDFFileMeta;
  
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
  | 'rfs' 
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
