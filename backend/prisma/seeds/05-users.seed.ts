import * as bcrypt from 'bcrypt';
import { SeederContext, logSuccess, logInfo } from './helpers/seeder-context';

/**
 * Admin user configurations - linked to core employees
 */
const ADMIN_USERS = [
  {
    employeeNumber: '100000001',
    email: 'dzakwanbusiness7@gmail.com',
    name: 'Admin Koperasi',
    nik: '1234567890123456',
    npwp: '1234567890123456',
    levelKey: 'ketua' as const,
    userKey: 'admin' as const,
    dateOfBirth: new Date('1990-01-01'),
    birthPlace: 'Jakarta',
  },
  {
    employeeNumber: '100000002',
    email: 'dzakwan.ramdhani@mhs.unsoed.ac.id',
    name: 'Divisi Simpan Pinjam',
    nik: '1234567890123457',
    npwp: '1234567890123457',
    levelKey: 'divisiSimpanPinjam' as const,
    userKey: 'divisi' as const,
    dateOfBirth: new Date('1991-01-01'),
    birthPlace: 'Bandung',
  },
  {
    employeeNumber: '100000003',
    email: 'lexdani368@gmail.com',
    name: 'Pengawas Koperasi',
    nik: '1234567890123458',
    npwp: '1234567890123458',
    levelKey: 'pengawas' as const,
    userKey: 'pengawas' as const,
    dateOfBirth: new Date('1992-01-01'),
    birthPlace: 'Surabaya',
  },
  {
    employeeNumber: '100000004',
    email: 'ulujamicomal66@gmail.com',
    name: 'Payroll Staff',
    nik: '1234567890123459',
    npwp: '1234567890123459',
    levelKey: 'payroll' as const,
    userKey: 'payroll' as const,
    dateOfBirth: new Date('1993-01-01'),
    birthPlace: 'Medan',
  },
  {
    employeeNumber: '100000005',
    email: 'kostproduction1@gmail.com',
    name: 'Shopkeeper',
    nik: '1234567890123460',
    npwp: '1234567890123460',
    levelKey: 'shopkeeper' as const,
    userKey: 'shopkeeper' as const,
    dateOfBirth: new Date('1994-01-01'),
    birthPlace: 'Yogyakarta',
  },
];

/**
 * Test users data for member applications
 */
const TEST_USERS_DATA = [
  // Waiting DSP Approval
  {
    empNum: '100000006',
    name: 'Siti Nurhaliza',
    email: 'siti.nur@test.com',
    nik: '3201011991020002',
    npwp: '1234567890123462',
    levelKey: 'anggota' as const,
    userKey: 'anggota' as const,
  },
  {
    empNum: '100000007',
    name: 'Ahmad Dahlan',
    email: 'ahmad.dahlan@test.com',
    nik: '3201011992030003',
    npwp: '1234567890123463',
    levelKey: 'anggota' as const,
    userKey: 'anggota' as const,
  },
  {
    empNum: '100000008',
    name: 'Rina Wijaya',
    email: 'rina.wijaya@test.com',
    nik: '3201011993040004',
    npwp: '1234567890123464',
    levelKey: 'anggota' as const,
    userKey: 'anggota' as const,
  },
  {
    empNum: '100000009',
    name: 'Joko Widodo',
    email: 'joko.widodo@test.com',
    nik: '3201011994050005',
    npwp: '1234567890123465',
    levelKey: 'anggota' as const,
    userKey: 'anggota' as const,
  },
  // Waiting Ketua Approval
  {
    empNum: '100000010',
    name: 'Dewi Sartika',
    email: 'dewi.sartika@test.com',
    nik: '3201011995060006',
    npwp: '1234567890123466',
    levelKey: 'anggota' as const,
    userKey: 'anggota' as const,
  },
  {
    empNum: '100000011',
    name: 'Andi Setiawan',
    email: 'andi.setiawan@test.com',
    nik: '3201011996070007',
    npwp: '1234567890123467',
    levelKey: 'anggota' as const,
    userKey: 'anggota' as const,
  },
  {
    empNum: '100000012',
    name: 'Sri Mulyani',
    email: 'sri.mulyani@test.com',
    nik: '3201011997080008',
    npwp: '1234567890123468',
    levelKey: 'anggota' as const,
    userKey: 'anggota' as const,
  },
  {
    empNum: '100000013',
    name: 'Bambang Pamungkas',
    email: 'bambang.p@test.com',
    nik: '3201011998090009',
    npwp: '1234567890123469',
    levelKey: 'anggota' as const,
    userKey: 'anggota' as const,
  },
  // Approved members
  {
    empNum: '100000014',
    name: 'Mega Wati',
    email: 'mega.wati@test.com',
    nik: '3201011999100010',
    npwp: '1234567890123470',
    levelKey: 'anggota' as const,
    userKey: 'anggota' as const,
  },
  {
    empNum: '100000015',
    name: 'Hendra Gunawan',
    email: 'hendra.g@test.com',
    nik: '3201012000110011',
    npwp: '1234567890123471',
    levelKey: 'anggota' as const,
    userKey: 'anggota' as const,
  },
  {
    empNum: '100000016',
    name: 'Lestari Indah',
    email: 'lestari.indah@test.com',
    nik: '3201012001120012',
    npwp: '1234567890123472',
    levelKey: 'anggota' as const,
    userKey: 'anggota' as const,
  },
  {
    empNum: '100000017',
    name: 'Rizki Ramadhan',
    email: 'rizki.r@test.com',
    nik: '3201012002130013',
    npwp: '1234567890123473',
    levelKey: 'anggota' as const,
    userKey: 'anggota' as const,
  },
  {
    empNum: '100000018',
    name: 'Fitri Handayani',
    email: 'fitri.h@test.com',
    nik: '3201012003140014',
    npwp: '1234567890123474',
    levelKey: 'anggota' as const,
    userKey: 'anggota' as const,
  },
  {
    empNum: '100000019',
    name: 'Arief Budiman',
    email: 'arief.b@test.com',
    nik: '3201012004150015',
    npwp: '1234567890123475',
    levelKey: 'anggota' as const,
    userKey: 'anggota' as const,
  },
  // Rejected
  {
    empNum: '100000020',
    name: 'Doni Pratama',
    email: 'doni.p@test.com',
    nik: '3201012005160016',
    npwp: '1234567890123476',
    levelKey: 'anggota' as const,
    userKey: 'anggota' as const,
  },
  {
    empNum: '100000021',
    name: 'Yuni Shara',
    email: 'yuni.shara@test.com',
    nik: '3201012006170017',
    npwp: '1234567890123477',
    levelKey: 'anggota' as const,
    userKey: 'anggota' as const,
  },
  {
    empNum: '100000022',
    name: 'Wawan Setiawan',
    email: 'wawan.s@test.com',
    nik: '3201012007180018',
    npwp: '1234567890123478',
    levelKey: 'anggota' as const,
    userKey: 'anggota' as const,
  },
];

/**
 * Seed Users
 * - Admin users with roles (verified members)
 * - Test users (will be linked to member applications later)
 */
export async function seedUsers(ctx: SeederContext): Promise<void> {
  logInfo('Users', 'Seeding users...');

  const hashedPassword = await bcrypt.hash('Admin123!', 12);

  // 1. Create admin users
  for (const adminData of ADMIN_USERS) {
    const employee = await ctx.prisma.employee.findUnique({
      where: { employeeNumber: adminData.employeeNumber },
    });

    if (!employee) {
      throw new Error(`Employee ${adminData.employeeNumber} not found`);
    }

    const level = ctx.levels[adminData.levelKey];
    if (!level) {
      throw new Error(`Level ${adminData.levelKey} not found`);
    }

    const user = await ctx.prisma.user.upsert({
      where: { email: adminData.email },
      update: {},
      create: {
        name: adminData.name,
        email: adminData.email,
        nik: adminData.nik,
        npwp: adminData.npwp,
        password: hashedPassword,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        memberVerified: true,
        memberVerifiedAt: new Date(),
        employeeId: employee.id,
        dateOfBirth: adminData.dateOfBirth,
        birthPlace: adminData.birthPlace,
        installmentPlan: 1,
      },
    });

    // Assign role
    await ctx.prisma.userRole.upsert({
      where: { userId_levelId: { userId: user.id, levelId: level.id } },
      update: {},
      create: { userId: user.id, levelId: level.id },
    });

    // Store in context
    (ctx.users as any)[adminData.userKey] = user;
    ctx.users.allUsers.push(user);
  }

  logSuccess('Users', `Created ${ADMIN_USERS.length} admin users with roles`);

  // 2. Create test users (without member verification - will be set by member applications)
  for (const testData of TEST_USERS_DATA) {
    const employee = await ctx.prisma.employee.findUnique({
      where: { employeeNumber: testData.empNum },
    });

    if (!employee) {
      console.warn(`Employee ${testData.empNum} not found, skipping...`);
      continue;
    }

    // Check if employee is already linked to a user
    const userByEmployee = await ctx.prisma.user.findUnique({
      where: { employeeId: employee.id },
    });

    if (userByEmployee) {
      if (userByEmployee.email !== testData.email) {
        console.warn(
          `Employee ${testData.empNum} already linked to user ${userByEmployee.email}. Using existing user.`,
        );
      }

      ctx.users.testUsers.push(userByEmployee);
      ctx.users.allUsers.push(userByEmployee);
      continue;
    }

    const user = await ctx.prisma.user.upsert({
      where: { email: testData.email },
      update: {
        employeeId: employee.id, // Ensure link is correct
      },
      create: {
        name: testData.name,
        email: testData.email,
        nik: testData.nik,
        npwp: testData.npwp,
        password: hashedPassword,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        memberVerified: false, // Will be updated by member application seeder
        employeeId: employee.id,
        dateOfBirth: new Date('1990-05-15'),
        birthPlace: 'Jakarta',
        installmentPlan: Math.random() > 0.5 ? 1 : 2,
      },
    });

    // Assign role
    const level = ctx.levels[testData.levelKey];
    if (!level) {
      throw new Error(`Level ${testData.levelKey} not found`);
    }

    await ctx.prisma.userRole.upsert({
      where: { userId_levelId: { userId: user.id, levelId: level.id } },
      update: {},
      create: { userId: user.id, levelId: level.id },
    });

    ctx.users.testUsers.push(user);
    ctx.users.allUsers.push(user);
  }

  logSuccess('Users', `Created ${ctx.users.testUsers.length} test users`);
}
