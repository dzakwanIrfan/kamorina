"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { bukuTabunganService } from "@/services/buku-tabungan.service";
import {
  BukuTabunganResponse,
  SavingsTransaction,
  SavingsAccountListItem,
  TransactionSummary,
  QueryTransactionParams,
  QueryAllAccountsParams,
} from "@/types/buku-tabungan.types";
import { PaginationMeta } from "@/types/pagination.types";
import axios from "axios";

interface UseBukuTabunganOptions {
  includeTransactionSummary?: boolean;
}

interface UseBukuTabunganReturn {
  tabungan: BukuTabunganResponse | null;
  isLoading: boolean;
  error: string | null;
  notFound: boolean;
  refetch: () => Promise<void>;
}

export function useBukuTabungan(
  options?: UseBukuTabunganOptions
): UseBukuTabunganReturn {
  const [tabungan, setTabungan] = useState<BukuTabunganResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const fetchTabungan = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setNotFound(false);

      const data = await bukuTabunganService.getMyTabungan({
        includeTransactionSummary: options?.includeTransactionSummary,
      });
      setTabungan(data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const message =
          err.response?.data?.message || "Gagal memuat data tabungan";

        if (status === 404) {
          // Account not found - this is expected for new users
          setNotFound(true);
          setError(null);
        } else if (status === 500) {
          // Server error - likely account doesn't exist yet
          setNotFound(true);
          setError(null);
        } else {
          setError(message);
          toast.error(message);
        }
      } else {
        setError("Terjadi kesalahan");
        toast.error("Terjadi kesalahan");
      }
    } finally {
      setIsLoading(false);
    }
  }, [options?.includeTransactionSummary]);

  useEffect(() => {
    fetchTabungan();
  }, [fetchTabungan]);

  return {
    tabungan,
    isLoading,
    error,
    notFound,
    refetch: fetchTabungan,
  };
}

interface UseTransactionsReturn {
  transactions: SavingsTransaction[];
  meta: PaginationMeta;
  isLoading: boolean;
  error: string | null;
  notFound: boolean;
  refetch: () => Promise<void>;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setFilters: (filters: Partial<QueryTransactionParams>) => void;
  resetFilters: () => void;
}

const defaultMeta: PaginationMeta = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

export function useTransactions(
  initialParams?: QueryTransactionParams
): UseTransactionsReturn {
  const [transactions, setTransactions] = useState<SavingsTransaction[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(defaultMeta);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [params, setParams] = useState<QueryTransactionParams>({
    page: 1,
    limit: 10,
    sortBy: "transactionDate",
    sortOrder: "desc",
    ...initialParams,
  });

  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setNotFound(false);

      const response = await bukuTabunganService.getMyTransactions(params);
      setTransactions(response.data);
      setMeta(response.meta);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const message = err.response?.data?.message || "Gagal memuat transaksi";

        if (status === 404 || status === 500) {
          setNotFound(true);
          setTransactions([]);
          setMeta(defaultMeta);
        } else {
          setError(message);
          toast.error(message);
        }
      } else {
        setError("Terjadi kesalahan");
      }
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const setPage = (page: number) => {
    setParams((prev) => ({ ...prev, page }));
  };

  const setLimit = (limit: number) => {
    setParams((prev) => ({ ...prev, limit, page: 1 }));
  };

  const setFilters = (filters: Partial<QueryTransactionParams>) => {
    setParams((prev) => ({ ...prev, ...filters, page: 1 }));
  };

  const resetFilters = () => {
    setParams({
      page: 1,
      limit: 10,
      sortBy: "transactionDate",
      sortOrder: "desc",
    });
  };

  return {
    transactions,
    meta,
    isLoading,
    error,
    notFound,
    refetch: fetchTransactions,
    setPage,
    setLimit,
    setFilters,
    resetFilters,
  };
}

interface UseTransactionSummaryReturn {
  summary: TransactionSummary | null;
  isLoading: boolean;
  error: string | null;
  refetch: (month: number, year: number) => Promise<void>;
}

export function useTransactionSummary(
  month?: number,
  year?: number
): UseTransactionSummaryReturn {
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async (m: number, y: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await bukuTabunganService.getTransactionSummaryByPeriod(
        m,
        y
      );
      setSummary(data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message || "Gagal memuat ringkasan";
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (month && year) {
      fetchSummary(month, year);
    }
  }, [month, year, fetchSummary]);

  return {
    summary,
    isLoading,
    error,
    refetch: fetchSummary,
  };
}

/**
 * Hook for admin to view all savings accounts
 */
interface UseAllAccountsReturn {
  accounts: SavingsAccountListItem[];
  meta: PaginationMeta;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setFilters: (filters: Partial<QueryAllAccountsParams>) => void;
  resetFilters: () => void;
  params: QueryAllAccountsParams;
}

export function useAllAccounts(
  initialParams?: QueryAllAccountsParams
): UseAllAccountsReturn {
  const [accounts, setAccounts] = useState<SavingsAccountListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(defaultMeta);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<QueryAllAccountsParams>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
    ...initialParams,
  });

  const fetchAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await bukuTabunganService.getAllAccounts(params);
      setAccounts(response.data);
      setMeta(response.meta);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const message =
          err.response?.data?.message || "Gagal memuat data tabungan";

        if (status === 403) {
          setError("Anda tidak memiliki akses ke halaman ini");
          toast.error("Anda tidak memiliki akses ke halaman ini");
        } else {
          setError(message);
          toast.error(message);
        }
        setAccounts([]);
        setMeta(defaultMeta);
      } else {
        setError("Terjadi kesalahan");
        toast.error("Terjadi kesalahan");
      }
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const setPage = (page: number) => {
    setParams((prev) => ({ ...prev, page }));
  };

  const setLimit = (limit: number) => {
    setParams((prev) => ({ ...prev, limit, page: 1 }));
  };

  const setFilters = (filters: Partial<QueryAllAccountsParams>) => {
    setParams((prev) => ({ ...prev, ...filters, page: 1 }));
  };

  const resetFilters = () => {
    setParams({
      page: 1,
      limit: 10,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  };

  return {
    accounts,
    meta,
    isLoading,
    error,
    refetch: fetchAccounts,
    setPage,
    setLimit,
    setFilters,
    resetFilters,
    params,
  };
}

