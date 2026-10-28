import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getDefaultBASTWorkflow,
  evaluateBASTWorkflow
} from './bastWorkflowHelper';
import { BASTItem } from '../types';

describe('bastWorkflowHelper tests', () => {
  const baseBast: BASTItem = {
    id: 'BAST-TEST-1',
    woNumber: 'WO-BEL-2026-0082',
    woType: 'Splice Interconnection POP Mini',
    workType: 'Splicing FO Core 48',
    releaseDate: '2026-10-04',
    startDate: '2026-10-04',
    finishDate: '2026-10-08',
    durationDays: 4,
    estimatedDistanceMeters: 1200,
    totalDistanceMeters: 1195,
    statusBast: 'Submit',
    createdAt: '2026-10-04T00:00:00Z',
    updatedAt: '2026-10-08T00:00:00Z'
  };

  it('evaluates newly created BAST as Stage 1 (Email User) with Pending status', () => {
    const summary = evaluateBASTWorkflow(baseBast);
    assert.strictEqual(summary.currentStageNumber, 1);
    assert.strictEqual(summary.filterTab, '1. Email User');
    assert.strictEqual(summary.isAllCompleted, false);
    assert.strictEqual(summary.stages[0].isCompleted, false);
    assert.strictEqual(summary.stages[1].state, 'pending');
  });

  it('evaluates BAST as Stage 2 (Admin User) when Stage 1 is Selesai or isCompleted', () => {
    const bast: BASTItem = {
      ...baseBast,
      workflow: {
        stage1EmailUser: {
          status: 'Selesai',
          isCompleted: true,
          tanggalKirim: '2026-10-09',
          emailSubject: 'Pengiriman BAST WO-0082'
        },
        stage2AdminUser: {
          status: 'Menunggu Pengecekan',
          isCompleted: false
        }
      }
    };
    const summary = evaluateBASTWorkflow(bast);
    assert.strictEqual(summary.currentStageNumber, 2);
    assert.strictEqual(summary.filterTab, '2. Admin User');
    assert.strictEqual(summary.stages[0].state, 'completed');
    assert.strictEqual(summary.stages[0].isCompleted, true);
    assert.strictEqual(summary.stages[1].state, 'in_progress');
  });

  it('evaluates BAST with revision in Stage 2 as revision state', () => {
    const bast: BASTItem = {
      ...baseBast,
      workflow: {
        stage1EmailUser: { status: 'Selesai', isCompleted: true, tanggalKirim: '2026-10-09' },
        stage2AdminUser: { status: 'Ada Catatan Revisi', isCompleted: false, adminName: 'Sarah User', notes: 'Perbaiki foto core' }
      }
    };
    const summary = evaluateBASTWorkflow(bast);
    assert.strictEqual(summary.currentStageNumber, 2);
    assert.strictEqual(summary.stages[1].state, 'revision');
    assert.strictEqual(summary.stages[1].badgeLabel, 'Ada Revisi');
  });

  it('evaluates BAST as Stage 3 (Routing TTD) when Stage 2 is Approved', () => {
    const bast: BASTItem = {
      ...baseBast,
      workflow: {
        stage1EmailUser: { status: 'Selesai', isCompleted: true, tanggalKirim: '2026-10-09' },
        stage2AdminUser: { status: 'Approved', isCompleted: true, adminName: 'Sarah User', checkedDate: '2026-10-10' },
        stage3RoutingTtd: { status: 'In Progress', approverNames: 'Bpk. Hendra & Bpk. Bambang' }
      }
    };
    const summary = evaluateBASTWorkflow(bast);
    assert.strictEqual(summary.currentStageNumber, 3);
    assert.strictEqual(summary.filterTab, '3. Routing TTD');
    assert.strictEqual(summary.stages[0].state, 'completed');
    assert.strictEqual(summary.stages[1].state, 'completed');
    assert.strictEqual(summary.stages[2].state, 'in_progress');
  });

  it('evaluates BAST as Stage 4 (Finance) when Stage 3 is Selesai TTD', () => {
    const bast: BASTItem = {
      ...baseBast,
      workflow: {
        stage1EmailUser: { status: 'Selesai', isCompleted: true },
        stage2AdminUser: { status: 'Approved', isCompleted: true },
        stage3RoutingTtd: { status: 'Selesai TTD', isCompleted: true, signedDate: '2026-10-12' },
        stage4Finance: { status: 'Diterima Finance', isCompleted: false, tanggalMasukFinance: '2026-10-13', financeRefNumber: 'FIN-REF-9981' }
      }
    };
    const summary = evaluateBASTWorkflow(bast);
    assert.strictEqual(summary.currentStageNumber, 4);
    assert.strictEqual(summary.filterTab, '4. Finance');
    assert.strictEqual(summary.stages[2].state, 'completed');
    assert.strictEqual(summary.stages[3].state, 'in_progress');
  });

  it('evaluates BAST as Selesai (100%) when Stage 4 is Siap Invoice', () => {
    const bast: BASTItem = {
      ...baseBast,
      workflow: {
        stage1EmailUser: { status: 'Selesai', isCompleted: true },
        stage2AdminUser: { status: 'Approved', isCompleted: true },
        stage3RoutingTtd: { status: 'Selesai TTD', isCompleted: true },
        stage4Finance: { status: 'Siap Invoice', isCompleted: true, tanggalMasukFinance: '2026-10-14' }
      }
    };
    const summary = evaluateBASTWorkflow(bast);
    assert.strictEqual(summary.currentStageNumber, 5);
    assert.strictEqual(summary.filterTab, 'Selesai');
    assert.strictEqual(summary.percent, 100);
    assert.strictEqual(summary.isAllCompleted, true);
    assert.strictEqual(summary.stages.every(s => s.state === 'completed'), true);
  });
});
