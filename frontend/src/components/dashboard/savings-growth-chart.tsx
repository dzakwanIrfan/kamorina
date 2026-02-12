'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartDataPoint } from '@/types/dashboard.types';

interface SavingsGrowthChartProps {
  data: ChartDataPoint[];
}

/**
 * Format currency for chart tooltips
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Custom tooltip for chart
 */
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-3 shadow-sm">
        <p className="mb-2 font-medium">{label}</p>
        <div className="space-y-1">
          <p className="flex items-center gap-2 text-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">Pemasukan:</span>
            <span className="font-medium">{formatCurrency(payload[0]?.value || 0)}</span>
          </p>
          <p className="flex items-center gap-2 text-sm">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span className="text-muted-foreground">Pengeluaran:</span>
            <span className="font-medium">{formatCurrency(payload[1]?.value || 0)}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
}

export function SavingsGrowthChart({ data }: SavingsGrowthChartProps) {
  // Transform string amounts to numbers for chart
  const chartData = data.map((item) => ({
    month: item.month,
    income: parseFloat(item.income) || 0,
    expense: parseFloat(item.expense) || 0,
  }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Grafik Pemasukan & Pengeluaran</CardTitle>
        <CardDescription>Data 6 bulan terakhir</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                tickFormatter={(value: number) =>
                  new Intl.NumberFormat('id-ID', {
                    notation: 'compact',
                    compactDisplay: 'short',
                  }).format(value)
                }
                className="text-muted-foreground"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value: string) =>
                  value === 'income' ? 'Pemasukan' : 'Pengeluaran'
                }
              />
              <Area
                type="monotone"
                dataKey="income"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorIncome)"
                name="income"
              />
              <Area
                type="monotone"
                dataKey="expense"
                stroke="#f43f5e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorExpense)"
                name="expense"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
