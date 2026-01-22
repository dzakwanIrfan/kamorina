"use client";

import { useEffect, useState } from "react";
import { EmailLog, EmailStatus } from "@/types/email-logs.types";
import { emailLogsService } from "@/services/email-logs.service";
import { DataTableAdvanced } from "@/components/data-table/data-table-advanced";
import { getColumns } from "./columns";
import { toast } from "sonner";
import { EmailLogDetailDialog } from "./email-log-detail-dialog";

export function EmailLogsList() {
  const [data, setData] = useState<EmailLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filter State
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  // Detailed View State
  const [detailLog, setDetailLog] = useState<EmailLog | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const query = {
        page,
        limit,
        search,
        status: filters.status,
        startDate: dateRange.from ? dateRange.from.toISOString() : undefined,
        endDate: dateRange.to ? dateRange.to.toISOString() : undefined,
      };

      const result = await emailLogsService.getAll(query);
      setData(result.data);
      setTotal(result.meta.total);
      setTotalPages(result.meta.totalPages);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data email logs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, limit, search, filters, dateRange]);

  const handleResend = async (log: EmailLog) => {
    try {
      await emailLogsService.resend(log.id);
      toast.success("Permintaan pengiriman ulang berhasil dibuat");
      fetchData(); // Refresh to see updated status/retry count
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengirim ulang email", {
        description:
          error instanceof Error ? error.message : "Terjadi kesalahan unknown",
      });
    }
  };

  const handleView = (log: EmailLog) => {
    setDetailLog(log);
    setDetailOpen(true);
  };

  const columns = getColumns({ onView: handleView, onResend: handleResend });

  return (
    <div className="space-y-4">
      <DataTableAdvanced
        columns={columns}
        data={data}
        isLoading={isLoading}
        meta={{
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        }}
        onPageChange={setPage}
        onPageSizeChange={setLimit}
        // Search & Filter Props
        onSearch={setSearch}
        onFiltersChange={setFilters}
        onResetFilters={() => {
          setSearch("");
          setFilters({});
          setDateRange({});
          setPage(1);
        }}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        // Config passed to internal toolbar
        config={{
          searchable: true,
          searchPlaceholder: "Cari subjek atau penerima...",
          filterable: true,
          dateRangeFilter: true,
          filterFields: [
            {
              id: "status",
              label: "Status",
              type: "select",
              options: [
                { label: "Pending", value: EmailStatus.PENDING },
                { label: "Sent", value: EmailStatus.SENT },
                { label: "Failed", value: EmailStatus.FAILED },
              ],
            },
          ],
        }}
      />

      <EmailLogDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        log={detailLog}
      />
    </div>
  );
}
