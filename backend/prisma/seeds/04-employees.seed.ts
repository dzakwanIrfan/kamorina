import { EmployeeType } from '@prisma/client';
import { SeederContext, logSuccess, logInfo } from './helpers/seeder-context';

/**
 * Core admin employees - PRESERVED for login testing
 */
const CORE_EMPLOYEES = [
    {
        employeeNumber: '100000001',
        fullName: 'Admin Koperasi',
        departmentKey: 'mdp' as const,
        golonganKey: 'golongan3' as const,
        employeeType: EmployeeType.TETAP,
        isActive: true,
        permanentEmployeeDate: new Date('2021-01-01'),
    },
    {
        employeeNumber: '100000002',
        fullName: 'Divisi Simpan Pinjam',
        departmentKey: 'finance' as const,
        golonganKey: 'golongan3' as const,
        employeeType: EmployeeType.TETAP,
        isActive: true,
        permanentEmployeeDate: new Date('2021-01-01'),
    },
    {
        employeeNumber: '100000003',
        fullName: 'Pengawas Koperasi',
        departmentKey: 'hcga' as const,
        golonganKey: 'golongan3' as const,
        employeeType: EmployeeType.TETAP,
        isActive: true,
        permanentEmployeeDate: new Date('2021-01-01'),
    },
    {
        employeeNumber: '100000004',
        fullName: 'Payroll Staff',
        departmentKey: 'hcga' as const,
        golonganKey: 'golongan2' as const,
        employeeType: EmployeeType.TETAP,
        isActive: true,
        permanentEmployeeDate: new Date('2021-01-01'),
    },
    {
        employeeNumber: '100000005',
        fullName: 'Shopkeeper',
        departmentKey: 'finance' as const,
        golonganKey: 'golongan1' as const,
        employeeType: EmployeeType.TETAP,
        isActive: true,
        permanentEmployeeDate: new Date('2021-01-01'),
    },
];

/**
 * Test user names for generating additional employees
 */
const TEST_USER_NAMES = [
    'Budi Santoso',
    'Siti Nurhaliza',
    'Ahmad Dahlan',
    'Rina Wijaya',
    'Joko Widodo',
    'Dewi Sartika',
    'Andi Setiawan',
    'Sri Mulyani',
    'Bambang Pamungkas',
    'Mega Wati',
    'Hendra Gunawan',
    'Lestari Indah',
    'Rizki Ramadhan',
    'Fitri Handayani',
    'Arief Budiman',
    'Doni Pratama',
    'Yuni Shara',
    'Wawan Setiawan',
    'Dzakwan Irfan Ramdhani',
];

/**
 * Seed Employees
 * - Core admin employees (5) - preserved for login testing
 * - Additional test employees (dynamically generated)
 */
export async function seedEmployees(ctx: SeederContext): Promise<void> {
    logInfo('Employees', 'Seeding employees...');

    const allDepartments = Object.values(ctx.departments).filter(Boolean);
    const allGolongan = Object.values(ctx.golongan).filter(Boolean);
    const employeeTypes = [EmployeeType.TETAP, EmployeeType.KONTRAK];

    // Helper to get random item
    const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    // 1. Create core admin employees
    for (const emp of CORE_EMPLOYEES) {
        const departmentId = ctx.departments[emp.departmentKey]?.id;
        const golonganId = ctx.golongan[emp.golonganKey]?.id;

        if (!departmentId || !golonganId) {
            throw new Error(`Missing department or golongan for ${emp.fullName}`);
        }

        await ctx.prisma.employee.upsert({
            where: { employeeNumber: emp.employeeNumber },
            update: {},
            create: {
                employeeNumber: emp.employeeNumber,
                fullName: emp.fullName,
                departmentId,
                golonganId,
                employeeType: emp.employeeType,
                isActive: emp.isActive,
                permanentEmployeeDate: emp.permanentEmployeeDate,
            },
        });
    }

    logSuccess('Employees', `Created ${CORE_EMPLOYEES.length} core admin employees`);

    // 2. Create additional test employees
    let testEmployeeCount = 0;
    for (let i = 6; i <= 23; i++) {
        const randomType = getRandomItem(employeeTypes);
        const randomDept = getRandomItem(allDepartments);
        const randomGol = getRandomItem(allGolongan);

        const employeeData: any = {
            employeeNumber: `100000${i.toString().padStart(3, '0')}`,
            fullName: TEST_USER_NAMES[i - 5] || `Test User ${i}`,
            departmentId: randomDept!.id,
            golonganId: randomGol!.id,
            employeeType: randomType,
            isActive: true,
        };

        if (randomType === EmployeeType.TETAP) {
            // Vary permanent dates for testing loan limits
            const yearsAgo = Math.floor(Math.random() * 10); // 0-9 years
            const permanentDate = new Date();
            permanentDate.setFullYear(permanentDate.getFullYear() - yearsAgo);
            employeeData.permanentEmployeeDate = permanentDate;
        }

        await ctx.prisma.employee.upsert({
            where: { employeeNumber: employeeData.employeeNumber },
            update: {},
            create: employeeData,
        });
        testEmployeeCount++;
    }

    logSuccess('Employees', `Created ${testEmployeeCount} test employees`);
}
