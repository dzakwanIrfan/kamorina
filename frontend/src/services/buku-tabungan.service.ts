import { apiClient } from "@/lib/axios";
import {
  BukuTabunganResponse,
  SavingsTransaction,
  TransactionSummary,
  QueryBukuTabunganParams,
  QueryTransactionParams,
} from "@/types/buku-tabungan.types";
import { PaginatedResponse } from "@/types/pagination.types";

export const bukuTabunganService = {
  /**
   * Get current user's savings account summary
   */
  async getMyTabungan(
    params?: QueryBukuTabunganParams
  ): Promise<BukuTabunganResponse> {
    const response = await apiClient.get("/buku-tabungan", { params });
    return response.data;
  },

  /**
   * Get current user's savings transactions with pagination
   */
  async getMyTransactions(
    params?: QueryTransactionParams
  ): Promise<PaginatedResponse<SavingsTransaction>> {
    const response = await apiClient.get("/buku-tabungan/transactions", {
      params,
    });
    return response.data;
  },

  /**
   * Get a specific transaction by ID
   */
  async getTransactionById(transactionId: string): Promise<SavingsTransaction> {
    const response = await apiClient.get(
      `/buku-tabungan/transactions/${transactionId}`
    );
    return response.data;
  },

  /**
   * Get transaction summary for a specific period
   */
  async getTransactionSummaryByPeriod(
    month: number,
    year: number
  ): Promise<TransactionSummary | null> {
    const response = await apiClient.get(
      `/buku-tabungan/summary/${month}/${year}`
    );
    return response.data;
  },
};
