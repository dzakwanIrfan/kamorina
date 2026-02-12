'use client';

import { DashboardSummary } from '@/types/dashboard.types';
import { DashboardHeader } from './dashboard-header';
import { DashboardCards } from './dashboard-cards';
import { SavingsGrowthChart } from './savings-growth-chart';
import { ActivityList } from './activity-list';
import { RecentTransactionTable } from './recent-transaction-table';

interface DashboardContentProps {
  data: DashboardSummary;
}

/**
 * Main Dashboard Content Component
 * Renders all dashboard sections with responsive layout
 */
export function DashboardContent({ data }: DashboardContentProps) {
  return (
    <div className="space-y-6">
      {/* Header with greeting and avatar */}
      <DashboardHeader
        greeting={data.greeting}
        isApprover={data.isApprover}
        approverRoles={data.approverRoles}
      />

      {/* 4 Summary Cards */}
      <DashboardCards summary={data.financialSummary} />

      {/* Main Split: Chart (2/3) + Activity List (1/3) */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SavingsGrowthChart data={data.chartData} />
        </div>
        <div className="lg:col-span-1">
          <ActivityList
            activities={data.activities}
            isApprover={data.isApprover}
          />
        </div>
      </div>

      {/* Recent Transactions Table */}
      <RecentTransactionTable transactions={data.recentTransactions} />
    </div>
  );
}
