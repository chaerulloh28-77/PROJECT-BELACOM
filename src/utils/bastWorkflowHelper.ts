import {
  BASTItem,
  BASTWorkflow,
  BASTWorkflowStage1,
  BASTWorkflowStage2,
  BASTWorkflowStage3,
  BASTWorkflowStage4
} from '../types';

export type WorkflowFilterTab =
  | 'ALL'
  | '1. Email User'
  | '2. Admin User'
  | '3. Routing TTD'
  | '4. Finance'
  | 'Selesai';

export interface StageProgressInfo {
  stageNumber: 1 | 2 | 3 | 4;
  title: string;
  subtitle: string;
  state: 'completed' | 'in_progress' | 'revision' | 'pending';
  badgeLabel: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  isCompleted: boolean;
  dateInfo?: string;
  details?: string;
}

export interface BASTWorkflowSummary {
  currentStageNumber: 1 | 2 | 3 | 4 | 5; // 5 = Selesai
  currentStageTitle: string;
  percent: number; // 0..100
  filterTab: WorkflowFilterTab;
  isAllCompleted: boolean;
  stages: [
    StageProgressInfo,
    StageProgressInfo,
    StageProgressInfo,
    StageProgressInfo
  ];
}

export function getDefaultBASTWorkflow(woNumber?: string): BASTWorkflow {
  const today = new Date().toISOString().substring(0, 10);
  return {
    stage1EmailUser: {
      status: 'Pending',
      isCompleted: false,
      tanggalKirim: '',
      emailSentDate: '',
      emailSubject: woNumber ? `Pengiriman Berkas BAST ${woNumber} - PT Belacom` : '',
      emailNumber: '',
      notes: ''
    },
    stage2AdminUser: {
      status: 'Menunggu Pengecekan',
      isCompleted: false,
      adminName: '',
      checkedDate: '',
      notes: ''
    },
    stage3RoutingTtd: {
      status: 'Menunggu TTD',
      isCompleted: false,
      approverNames: '',
      signedDate: '',
      notes: ''
    },
    stage4Finance: {
      status: 'Menunggu Finance',
      isCompleted: false,
      tanggalMasukFinance: '',
      receivedDate: '',
      financeRefNumber: '',
      notes: ''
    },
    updatedAt: today
  };
}

export function getStage1(wf?: BASTWorkflow): BASTWorkflowStage1 {
  return wf?.stage1EmailUser || wf?.stage1EmailFmi || { status: 'Pending', isCompleted: false };
}

export function getStage2(wf?: BASTWorkflow): BASTWorkflowStage2 {
  return wf?.stage2AdminUser || wf?.stage2AdminFmi || { status: 'Menunggu Pengecekan', isCompleted: false };
}

export function getStage3(wf?: BASTWorkflow): BASTWorkflowStage3 {
  return wf?.stage3RoutingTtd || { status: 'Menunggu TTD', isCompleted: false };
}

export function getStage4(wf?: BASTWorkflow): BASTWorkflowStage4 {
  return wf?.stage4Finance || { status: 'Menunggu Finance', isCompleted: false };
}

export function evaluateBASTWorkflow(bast: BASTItem): BASTWorkflowSummary {
  const wf = bast.workflow || getDefaultBASTWorkflow(bast.woNumber);
  const s1 = getStage1(wf);
  const s2 = getStage2(wf);
  const s3 = getStage3(wf);
  const s4 = getStage4(wf);

  // 1. Stage 1: Email ke User
  const isS1Done = s1.isCompleted === true || s1.status === 'Selesai' || s1.status === 'Sent';
  const s1Date = s1.tanggalKirim || s1.emailSentDate || '';
  const stage1Info: StageProgressInfo = {
    stageNumber: 1,
    title: '1. Email User',
    subtitle: 'BAST dokumen lengkap diemail ke User',
    state: isS1Done ? 'completed' : 'in_progress',
    isCompleted: isS1Done,
    badgeLabel: isS1Done ? 'Selesai (Terkirim)' : 'Pending',
    badgeBg: isS1Done ? 'bg-emerald-950/80' : 'bg-blue-950/80',
    badgeText: isS1Done ? 'text-emerald-300' : 'text-blue-300',
    badgeBorder: isS1Done ? 'border-emerald-700/80' : 'border-blue-700/80',
    dateInfo: s1Date,
    details: s1Date ? `Tgl: ${s1Date}` : (s1.emailSubject || undefined)
  };

  // 2. Stage 2: Pengecekan admin User
  let s2State: StageProgressInfo['state'] = 'pending';
  let s2Label = 'Belum';
  const isS2ExplicitDone = s2.isCompleted === true || s2.status === 'Approved';

  if (!isS1Done) {
    s2State = 'pending';
    s2Label = 'Antre';
  } else if (isS2ExplicitDone) {
    s2State = 'completed';
    s2Label = 'Approved';
  } else if (s2.status === 'Ada Catatan Revisi') {
    s2State = 'revision';
    s2Label = 'Ada Revisi';
  } else {
    s2State = 'in_progress';
    s2Label = 'Pengecekan';
  }

  const isS2Done = isS1Done && isS2ExplicitDone;
  const s2Date = s2.checkedDate || '';
  const stage2Info: StageProgressInfo = {
    stageNumber: 2,
    title: '2. Admin User',
    subtitle: 'Pengecekan admin User',
    state: s2State,
    isCompleted: isS2Done,
    badgeLabel: s2Label,
    badgeBg:
      s2State === 'completed'
        ? 'bg-emerald-950/80'
        : s2State === 'revision'
        ? 'bg-rose-950/80'
        : s2State === 'in_progress'
        ? 'bg-blue-950/80'
        : 'bg-slate-800/80',
    badgeText:
      s2State === 'completed'
        ? 'text-emerald-300'
        : s2State === 'revision'
        ? 'text-rose-300'
        : s2State === 'in_progress'
        ? 'text-blue-300'
        : 'text-slate-400',
    badgeBorder:
      s2State === 'completed'
        ? 'border-emerald-700/80'
        : s2State === 'revision'
        ? 'border-rose-700/80'
        : s2State === 'in_progress'
        ? 'border-blue-700/80'
        : 'border-slate-700/80',
    dateInfo: s2Date,
    details: s2.adminName ? `Admin: ${s2.adminName}` : (s2.notes || undefined)
  };

  // 3. Stage 3: Routing TTD User
  let s3State: StageProgressInfo['state'] = 'pending';
  let s3Label = 'Belum';
  const isS3ExplicitDone = s3.isCompleted === true || s3.status === 'Selesai TTD';

  if (!isS2Done) {
    s3State = 'pending';
    s3Label = 'Antre';
  } else if (isS3ExplicitDone) {
    s3State = 'completed';
    s3Label = 'Selesai TTD';
  } else if (s3.status === 'In Progress') {
    s3State = 'in_progress';
    s3Label = 'In Progress';
  } else {
    s3State = 'in_progress';
    s3Label = 'Menunggu TTD';
  }

  const isS3Done = isS2Done && isS3ExplicitDone;
  const s3Date = s3.signedDate || '';
  const stage3Info: StageProgressInfo = {
    stageNumber: 3,
    title: '3. Routing TTD',
    subtitle: 'Proses routing TTD User',
    state: s3State,
    isCompleted: isS3Done,
    badgeLabel: s3Label,
    badgeBg:
      s3State === 'completed'
        ? 'bg-emerald-950/80'
        : s3State === 'in_progress'
        ? 'bg-blue-950/80'
        : 'bg-slate-800/80',
    badgeText:
      s3State === 'completed'
        ? 'text-emerald-300'
        : s3State === 'in_progress'
        ? 'text-blue-300'
        : 'text-slate-400',
    badgeBorder:
      s3State === 'completed'
        ? 'border-emerald-700/80'
        : s3State === 'in_progress'
        ? 'border-blue-700/80'
        : 'border-slate-700/80',
    dateInfo: s3Date,
    details: s3.approverNames ? `Approver: ${s3.approverNames}` : undefined
  };

  // 4. Stage 4: Masuk ke Finance
  let s4State: StageProgressInfo['state'] = 'pending';
  let s4Label = 'Belum';
  const isS4ExplicitDone = s4.isCompleted === true || s4.status === 'Siap Invoice';

  if (!isS3Done) {
    s4State = 'pending';
    s4Label = 'Antre';
  } else if (isS4ExplicitDone) {
    s4State = 'completed';
    s4Label = 'Siap Invoice';
  } else if (s4.status === 'Diterima Finance') {
    s4State = 'in_progress';
    s4Label = 'Diterima Finance';
  } else {
    s4State = 'in_progress';
    s4Label = 'Menunggu Finance';
  }

  const isS4Done = isS3Done && isS4ExplicitDone;
  const s4Date = s4.tanggalMasukFinance || s4.receivedDate || '';
  const stage4Info: StageProgressInfo = {
    stageNumber: 4,
    title: '4. Finance',
    subtitle: 'Masuk ke finance & siap invoice',
    state: s4State,
    isCompleted: isS4Done,
    badgeLabel: s4Label,
    badgeBg:
      s4State === 'completed'
        ? 'bg-emerald-950/80'
        : s4State === 'in_progress'
        ? 'bg-blue-950/80'
        : 'bg-slate-800/80',
    badgeText:
      s4State === 'completed'
        ? 'text-emerald-300'
        : s4State === 'in_progress'
        ? 'text-blue-300'
        : 'text-slate-400',
    badgeBorder:
      s4State === 'completed'
        ? 'border-emerald-700/80'
        : s4State === 'in_progress'
        ? 'border-blue-700/80'
        : 'border-slate-700/80',
    dateInfo: s4Date,
    details: s4.financeRefNumber ? `Ref: ${s4.financeRefNumber}` : undefined
  };

  // Calculation of overall summary
  let currentStageNumber: 1 | 2 | 3 | 4 | 5 = 1;
  let currentStageTitle = '1. Email User';
  let filterTab: WorkflowFilterTab = '1. Email User';
  let percent = 10;

  if (isS4Done) {
    currentStageNumber = 5;
    currentStageTitle = 'Selesai (Siap Invoice)';
    filterTab = 'Selesai';
    percent = 100;
  } else if (isS3Done) {
    currentStageNumber = 4;
    currentStageTitle = '4. Masuk ke Finance';
    filterTab = '4. Finance';
    percent = s4.status === 'Diterima Finance' ? 88 : 75;
  } else if (isS2Done) {
    currentStageNumber = 3;
    currentStageTitle = '3. Routing TTD User';
    filterTab = '3. Routing TTD';
    percent = s3.status === 'In Progress' ? 62 : 50;
  } else if (isS1Done) {
    currentStageNumber = 2;
    currentStageTitle =
      s2.status === 'Ada Catatan Revisi'
        ? '2. Pengecekan Admin User (Ada Catatan Revisi)'
        : '2. Pengecekan Admin User';
    filterTab = '2. Admin User';
    percent = s2.status === 'Ada Catatan Revisi' ? 30 : 38;
  } else {
    currentStageNumber = 1;
    currentStageTitle = '1. BAST Diemail ke User';
    filterTab = '1. Email User';
    percent = 12;
  }

  return {
    currentStageNumber,
    currentStageTitle,
    percent,
    filterTab,
    isAllCompleted: isS4Done,
    stages: [stage1Info, stage2Info, stage3Info, stage4Info]
  };
}
