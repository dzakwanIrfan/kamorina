/**
 * Modular Seed Orchestrator
 */

import { PrismaClient } from '@prisma/client';
import { createSeederContext } from './helpers/seeder-context';
import type { SeederContext } from './helpers/seeder-context';
import { seedLevels } from './01-levels.seed';
import { seedDepartments } from './02-departments.seed';
import { seedGolongan } from './03-golongan.seed';
import { seedEmployees } from './04-employees.seed';
import { seedUsers } from './05-users.seed';
import { seedSettings } from './06-settings.seed';
import { seedLoanLimits } from './07-loan-limits.seed';
import { seedDepositOptions } from './08-deposit-options.seed';
import { seedMemberApplications } from './09-member-applications.seed';
import { seedSavingsAccounts } from './10-savings-accounts.seed';
import { seedSavingsTransactions } from './11-savings-transactions.seed';

// Re-export individual seeders for standalone use
export {
  seedLevels,
  seedDepartments,
  seedGolongan,
  seedEmployees,
  seedUsers,
  seedSettings,
  seedLoanLimits,
  seedDepositOptions,
  seedMemberApplications,
  seedSavingsAccounts,
  seedSavingsTransactions,
};

// Re-export helpers
export { createSeederContext, SeederContext };

/**
 * Run all seeders in order
 */
export async function runAllSeeders(prisma: PrismaClient): Promise<void> {
  console.log('');
  console.log('🌱 ================================');
  console.log('🌱 Starting Modular Seed Process');
  console.log('🌱 ================================');
  console.log('');

  // Create shared context
  const ctx = createSeederContext(prisma);

  const seeders = [
    { name: 'Levels', fn: () => seedLevels(ctx) },
    { name: 'Departments', fn: () => seedDepartments(ctx) },
    { name: 'Golongan', fn: () => seedGolongan(ctx) },
    { name: 'Employees', fn: () => seedEmployees(ctx) },
    { name: 'Users', fn: () => seedUsers(ctx) },
    { name: 'Settings', fn: () => seedSettings(ctx) },
    { name: 'LoanLimits', fn: () => seedLoanLimits(ctx) },
    { name: 'DepositOptions', fn: () => seedDepositOptions(ctx) },
    { name: 'MemberApplications', fn: () => seedMemberApplications(ctx) },
    { name: 'SavingsAccounts', fn: () => seedSavingsAccounts(ctx) },
    { name: 'SavingsTransactions', fn: () => seedSavingsTransactions(ctx) },
  ];

  for (const seeder of seeders) {
    console.log(`\n📦 Running ${seeder.name} seeder...`);
    console.log('─'.repeat(40));

    try {
      await seeder.fn();
    } catch (error) {
      console.error(`❌ Error in ${seeder.name} seeder:`, error);
      throw error;
    }
  }

  console.log('');
  console.log('🎉 ================================');
  console.log('🎉 All seeders completed!');
  console.log('🎉 ================================');
  console.log('');

  // Print summary
  await printSummary(prisma);
}

/**
 * Print database summary after seeding
 */
async function printSummary(prisma: PrismaClient): Promise<void> {
  console.log('📊 Database Summary:');
  console.log('─'.repeat(40));

  const counts = await Promise.all([
    prisma.level.count(),
    prisma.department.count(),
    prisma.golongan.count(),
    prisma.employee.count(),
    prisma.user.count(),
    prisma.memberApplication.count(),
    prisma.savingsAccount.count(),
    prisma.savingsTransaction.count(),
    prisma.payrollPeriod.count(),
    prisma.cooperativeSetting.count(),
  ]);

  const labels = [
    'Levels',
    'Departments',
    'Golongan',
    'Employees',
    'Users',
    'Member Applications',
    'Savings Accounts',
    'Savings Transactions',
    'Payroll Periods',
    'Cooperative Settings',
  ];

  labels.forEach((label, i) => {
    console.log(`  ${label.padEnd(22)}: ${counts[i]}`);
  });

  console.log('─'.repeat(40));
}
