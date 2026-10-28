import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sendSilentLoginAuditNotification } from './auditLogger';

describe('auditLogger tests', () => {
  it('should trigger sendSilentLoginAuditNotification without throwing exceptions', () => {
    assert.doesNotThrow(() => {
      sendSilentLoginAuditNotification('belacom');
    });
  });

  it('handles empty or custom username gracefully', () => {
    assert.doesNotThrow(() => {
      sendSilentLoginAuditNotification('admin@belacom.co.id');
    });
  });
});
