import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidEmail, validateEmailList } from './validation.ts';

test('isValidEmail accepts valid standard emails', () => {
  assert.equal(isValidEmail('chaerulloh28@gmail.com'), true);
  assert.equal(isValidEmail('sap.procurement@telkom.co.id'), true);
  assert.equal(isValidEmail('project.control@belacom.co.id'), true);
  assert.equal(isValidEmail('user+test@sub.domain.org'), true);
});

test('isValidEmail rejects invalid emails', () => {
  assert.equal(isValidEmail(''), false);
  assert.equal(isValidEmail('plainaddress'), false);
  assert.equal(isValidEmail('missing@domain'), false);
  assert.equal(isValidEmail('@missingusername.com'), false);
  assert.equal(isValidEmail('username@.com'), false);
  assert.equal(isValidEmail('spaces in email@domain.com'), false);
});

test('validateEmailList separates valid and invalid emails properly', () => {
  const input = [
    'valid1@belacom.co.id',
    'invalid-email',
    'valid2@telkom.co.id',
    'another.bad@',
    'valid1@belacom.co.id' // Duplicate test
  ];

  const result = validateEmailList(input);
  assert.deepEqual(result.valid, ['valid1@belacom.co.id', 'valid2@telkom.co.id']);
  assert.deepEqual(result.invalid, ['invalid-email', 'another.bad@']);
});
