import { PrismaClient, Level, Department, Golongan, User } from '@prisma/client';

/**
 * Seeder Context - Shared state between seeders
 * This allows seeders to reference entities created by previous seeders
 */
export interface SeederContext {
    prisma: PrismaClient;

    // Created entities references
    levels: {
        ketua?: Level;
        divisiSimpanPinjam?: Level;
        pengawas?: Level;
        bendahara?: Level;
        payroll?: Level;
        shopkeeper?: Level;
        anggota?: Level;
    };

    departments: {
        mdp?: Department;
        hcga?: Department;
        finance?: Department;
        bda?: Department;
        production?: Department;
        warehouse?: Department;
        qc?: Department;
        engineering?: Department;
        ios?: Department;
    };

    golongan: {
        golongan1?: Golongan;
        golongan2?: Golongan;
        golongan3?: Golongan;
        golongan4?: Golongan;
    };

    users: {
        admin?: User;      // Ketua
        divisi?: User;     // Divisi Simpan Pinjam
        pengawas?: User;   // Pengawas
        payroll?: User;    // Payroll Staff
        shopkeeper?: User; // Shopkeeper
        testUsers: User[]; // All test users
        allUsers: User[];  // All users for quick access
    };

    // Payroll period IDs for historical data
    payrollPeriods: Array<{
        id: string;
        month: number;
        year: number;
    }>;
}

/**
 * Create initial empty context
 */
export function createSeederContext(prisma: PrismaClient): SeederContext {
    return {
        prisma,
        levels: {},
        departments: {},
        golongan: {},
        users: {
            testUsers: [],
            allUsers: [],
        },
        payrollPeriods: [],
    };
}

/**
 * Logger helper for consistent output
 */
export function logSeeder(name: string, message: string): void {
    console.log(`[${name}] ${message}`);
}

export function logSuccess(name: string, message: string): void {
    console.log(`✅ [${name}] ${message}`);
}

export function logInfo(name: string, message: string): void {
    console.log(`🔄 [${name}] ${message}`);
}
