import { apiClient } from '@/lib/axios';
import {
    SavingsWithdrawal,
    CreateSavingsWithdrawalDto,
    ApproveSavingsWithdrawalDto,
    BulkApproveSavingsWithdrawalDto,
    ConfirmDisbursementDto,
    ConfirmAuthorizationDto,
    BulkConfirmDisbursementDto,
    BulkConfirmAuthorizationDto,
    QuerySavingsWithdrawalParams,
} from '@/types/savings-withdrawal.types';
import { PaginatedResponse } from '@/types/pagination.types';

export const savingsWithdrawalService = {
    // Member endpoints
    async createWithdrawal(
        data: CreateSavingsWithdrawalDto
    ): Promise<{
        message: string;
        withdrawal: SavingsWithdrawal;
        calculation: any
    }> {
        const response = await apiClient.post('/savings-withdrawals', data);
        return response.data;
    },

    async getMyWithdrawals(
        params?: QuerySavingsWithdrawalParams
    ): Promise<PaginatedResponse<SavingsWithdrawal>> {
        const response = await apiClient.get('/savings-withdrawals/my-withdrawals', {
            params
        });
        return response.data;
    },

    async getMyWithdrawalById(withdrawalId: string): Promise<SavingsWithdrawal> {
        const response = await apiClient.get(
            `/savings-withdrawals/my-withdrawals/${withdrawalId}`
        );
        return response.data;
    },

    async cancelWithdrawal(withdrawalId: string): Promise<{ message: string }> {
        const response = await apiClient.delete(
            `/savings-withdrawals/my-withdrawals/${withdrawalId}`
        );
        return response.data;
    },

    // Approver endpoints
    async getAllWithdrawals(
        params?: QuerySavingsWithdrawalParams
    ): Promise<PaginatedResponse<SavingsWithdrawal>> {
        const response = await apiClient.get('/savings-withdrawals', { params });
        return response.data;
    },

    async getWithdrawalById(withdrawalId: string): Promise<SavingsWithdrawal> {
        const response = await apiClient.get(`/savings-withdrawals/${withdrawalId}`);
        return response.data;
    },

    async processApproval(
        withdrawalId: string,
        data: ApproveSavingsWithdrawalDto
    ): Promise<{ message: string }> {
        const response = await apiClient.post(
            `/savings-withdrawals/${withdrawalId}/approve`,
            data
        );
        return response.data;
    },

    async bulkProcessApproval(
        data: BulkApproveSavingsWithdrawalDto
    ): Promise<{ message: string; results: any }> {
        const response = await apiClient.post(
            '/savings-withdrawals/bulk-approve',
            data
        );
        return response.data;
    },

    // Shopkeeper endpoints
    async confirmDisbursement(
        withdrawalId: string,
        data: ConfirmDisbursementDto
    ): Promise<{ message: string }> {
        const response = await apiClient.post(
            `/savings-withdrawals/${withdrawalId}/confirm-disbursement`,
            data
        );
        return response.data;
    },

    // Ketua authorization endpoints
    async confirmAuthorization(
        withdrawalId: string,
        data: ConfirmAuthorizationDto
    ): Promise<{ message: string }> {
        const response = await apiClient.post(
            `/savings-withdrawals/${withdrawalId}/confirm-authorization`,
            data
        );
        return response.data;
    },

    async bulkConfirmDisbursement(
        data: BulkConfirmDisbursementDto
    ): Promise<{ message: string; results: any }> {
        const response = await apiClient.post(
            '/savings-withdrawals/bulk-confirm-disbursement',
            data
        );
        return response.data;
    },

    async bulkConfirmAuthorization(
        data: BulkConfirmAuthorizationDto
    ): Promise<{ message: string; results: any }> {
        const response = await apiClient.post(
            '/savings-withdrawals/bulk-confirm-authorization',
            data
        );
        return response.data;
    },
};