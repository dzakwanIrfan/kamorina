import { apiClient } from '@/lib/axios';
import {
    DepositWithdrawal,
    CreateDepositWithdrawalDto,
    ApproveWithdrawalDto,
    BulkApproveWithdrawalDto,
    ConfirmDisbursementDto,
    ConfirmAuthorizationDto,
    QueryWithdrawalParams,
} from '@/types/deposit-withdrawal.types';
import { PaginatedResponse } from '@/types/pagination.types';

export const depositWithdrawalService = {
    // Member endpoints
    async createWithdrawal(
        data: CreateDepositWithdrawalDto
    ): Promise<{
        message: string;
        withdrawal: DepositWithdrawal;
        calculation: any
    }> {
        const response = await apiClient.post('/deposit-withdrawals', data);
        return response.data;
    },

    async getMyWithdrawals(
        params?: QueryWithdrawalParams
    ): Promise<PaginatedResponse<DepositWithdrawal>> {
        const response = await apiClient.get('/deposit-withdrawals/my-withdrawals', {
            params
        });
        return response.data;
    },

    async getMyWithdrawalById(withdrawalId: string): Promise<DepositWithdrawal> {
        const response = await apiClient.get(
            `/deposit-withdrawals/my-withdrawals/${withdrawalId}`
        );
        return response.data;
    },

    async cancelWithdrawal(withdrawalId: string): Promise<{ message: string }> {
        const response = await apiClient.delete(
            `/deposit-withdrawals/my-withdrawals/${withdrawalId}`
        );
        return response.data;
    },

    // Approver endpoints
    async getAllWithdrawals(
        params?: QueryWithdrawalParams
    ): Promise<PaginatedResponse<DepositWithdrawal>> {
        const response = await apiClient.get('/deposit-withdrawals', { params });
        return response.data;
    },

    async getWithdrawalById(withdrawalId: string): Promise<DepositWithdrawal> {
        const response = await apiClient.get(`/deposit-withdrawals/${withdrawalId}`);
        return response.data;
    },

    async processApproval(
        withdrawalId: string,
        data: ApproveWithdrawalDto
    ): Promise<{ message: string }> {
        const response = await apiClient.post(
            `/deposit-withdrawals/${withdrawalId}/approve`,
            data
        );
        return response.data;
    },

    async bulkProcessApproval(
        data: BulkApproveWithdrawalDto
    ): Promise<{ message: string; results: any }> {
        const response = await apiClient.post(
            '/deposit-withdrawals/bulk-approve',
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
            `/deposit-withdrawals/${withdrawalId}/confirm-disbursement`,
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
            `/deposit-withdrawals/${withdrawalId}/confirm-authorization`,
            data
        );
        return response.data;
    },
};