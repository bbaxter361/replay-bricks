function makeId() {
  return `bingo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function addBingoTransaction(transactions, transaction) {
  return [
    ...transactions,
    {
      id: makeId(),
      residentId: transaction.residentId,
      amount: Number(transaction.amount || 0),
      reason: transaction.reason || 'Manual adjustment',
      createdBy: transaction.createdBy || 'System',
      createdAt: transaction.createdAt || new Date().toISOString(),
    },
  ];
}

export function getBingoBalance(residentId, transactions) {
  return transactions
    .filter((transaction) => transaction.residentId === residentId)
    .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
}
