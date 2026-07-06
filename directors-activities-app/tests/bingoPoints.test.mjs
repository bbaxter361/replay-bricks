import test from 'node:test';
import assert from 'node:assert/strict';
import { addBingoTransaction, getBingoBalance } from '../src/utils/bingoPoints.js';

test('adds and subtracts resident Bingo Bucks without automatic reset', () => {
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

test('records entered Bingo Bucks with the date and time they were entered', () => {
  const enteredAt = '2026-07-06T15:45:00.000Z';
  const transactions = addBingoTransaction([], {
    residentId: 'resident-mary',
    amount: 12,
    reason: 'Attended bingo',
    createdBy: 'Amanda',
    createdAt: enteredAt,
  });

  assert.equal(transactions[0].amount, 12);
  assert.equal(transactions[0].createdAt, enteredAt);
});
