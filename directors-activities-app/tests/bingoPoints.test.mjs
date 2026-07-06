import test from 'node:test';
import assert from 'node:assert/strict';
import { addBingoTransaction, getBingoBalance } from '../src/utils/bingoPoints.js';

test('adds and subtracts resident bingo points without automatic reset', () => {
  const transactions = [];
  const earned = addBingoTransaction(transactions, {
    residentId: 'resident-harold',
    amount: 5,
    reason: 'Attended bingo',
    createdBy: 'Amanda',
  });
  const redeemed = addBingoTransaction(earned, {
    residentId: 'resident-harold',
    amount: -2,
    reason: 'Redeemed prize',
    createdBy: 'Amanda',
  });

  assert.equal(getBingoBalance('resident-harold', redeemed), 3);
});
