import { apiClient } from "@/lib/axios";
import {
  BukuTabunganResponse,
  SavingsTransaction,
  SavingsAccountListItem,
  TransactionSummary,
  QueryBukuTabunganParams,
  QueryTransactionParams,
  QueryAllAccountsParams,
} from "@/types/buku-tabungan.types";
import { PaginatedResponse } from "@/types/pagination.types";

export const bukuTabunganService = {
  /**
   * Get current user's savings account summary
   */
  async getMyTabungan(
    params?: QueryBukuTabunganParams,
  ): Promise<BukuTabunganResponse> {
    const response = await apiClient.get("/buku-tabungan", { params });
    return response.data;
  },

  /**
   * Get current user's savings transactions with pagination
   */
  async getMyTransactions(
    params?: QueryTransactionParams,
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
      `/buku-tabungan/transactions/${transactionId}`,
    );
    return response.data;
  },

  /**
   * Get transaction summary for a specific period
   */
  async getTransactionSummaryByPeriod(
    month: number,
    year: number,
  ): Promise<TransactionSummary | null> {
    const response = await apiClient.get(
      `/buku-tabungan/summary/${month}/${year}`,
    );
    return response.data;
  },

  /**
   * Get all savings accounts (admin only)
   */
  async getAllAccounts(
    params?: QueryAllAccountsParams,
  ): Promise<PaginatedResponse<SavingsAccountListItem>> {
    const response = await apiClient.get("/buku-tabungan/all", { params });
    return response.data;
  },

  /**
   * Get specific user's savings account (admin only)
   */
  async getAccountByUserId(
    userId: string,
    params?: QueryBukuTabunganParams,
  ): Promise<BukuTabunganResponse> {
    const response = await apiClient.get(`/buku-tabungan/user/${userId}`, {
      params,
    });
    return response.data;
  },

  /**
   * Get specific user's transactions (admin only)
   */
  async getTransactionsByUserId(
    userId: string,
    params?: QueryTransactionParams,
  ): Promise<PaginatedResponse<SavingsTransaction>> {
    const response = await apiClient.get(
      `/buku-tabungan/user/${userId}/transactions`,
      { params },
    );
    return response.data;
  },

  /**
   * Export current user's savings book to Excel
   */
  async exportMyTabungan(): Promise<Blob> {
    const response = await apiClient.get("/buku-tabungan/export", {
      responseType: "blob",
    });
    return response.data;
  },

  /**
   * Export specific user's savings book to Excel (admin only)
   */
  async exportTabunganByUserId(userId: string): Promise<Blob> {
    const response = await apiClient.get(
      `/buku-tabungan/user/${userId}/export`,
      {
        responseType: "blob",
      },
    );
    return response.data;
  },

  /**
   * Export all savings books to ZIP (admin only)
   */
  async exportAllBukuTabungan(): Promise<Blob> {
    const response = await apiClient.get("/buku-tabungan/export/all", {
      responseType: "blob",
    });
    return response.data;
  },
};
