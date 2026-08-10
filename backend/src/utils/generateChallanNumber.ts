import { sequelize } from '../db';
import Counter from '../models/counter.model';
import { Transaction } from 'sequelize';

export const generateChallanNumber = async (transaction: Transaction): Promise<string> => {
  const currentYear = new Date().getFullYear();

  // Use FOR UPDATE lock to prevent race conditions
  const [counter] = await Counter.findOrCreate({
    where: { year: currentYear },
    defaults: { year: currentYear, last_value: 0 },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  // If findOrCreate found an existing row, we still need the lock
  // Re-fetch with lock to be safe
  const lockedCounter = await Counter.findOne({
    where: { year: currentYear },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  if (!lockedCounter) {
    throw new Error('Failed to acquire challan counter lock');
  }

  const newValue = lockedCounter.last_value + 1;
  await lockedCounter.update({ last_value: newValue }, { transaction });

  const paddedValue = String(newValue).padStart(6, '0');
  return `CH-${currentYear}-${paddedValue}`;
};
