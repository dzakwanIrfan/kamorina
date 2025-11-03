// prisma/seed.ts
import { PrismaClient, ApplicationStatus, ApprovalStep, ApprovalDecision, EmployeeType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create Levels/Roles
  const levels = [
    { levelName: 'ketua', description: 'Ketua Koperasi' },
    { levelName: 'divisi_simpan_pinjam', description: 'Divisi Simpan Pinjam' },
    { levelName: 'pengawas', description: 'Pengawas Koperasi' },
    { levelName: 'bendahara', description: 'Bendahara Koperasi' },
    { levelName: 'payroll', description: 'Payroll Staff' },
    { levelName: 'shopkeeper', description: 'Shopkeeper' },
    { levelName: 'anggota', description: 'Anggota/Member Koperasi' },
  ];

  for (const level of levels) {
    await prisma.level.upsert({
      where: { levelName: level.levelName },
      update: {},
      create: level,
    });
  }

  console.log('✅ Levels created');

  // Create Departments
  const departments = [
    { departmentName: 'MDP' },
    { departmentName: 'HCGA' },
    { departmentName: 'Finance' },
    { departmentName: 'BDA' },
    { departmentName: 'Production' },
    { departmentName: 'Warehouse' },
    { departmentName: 'QC' },
    { departmentName: 'Engineering' },
    { departmentName: 'IOS' },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { departmentName: dept.departmentName },
      update: {},
      create: dept,
    });
  }

  console.log('✅ Departments created');

  // Create Golongan
  const golongans = [
    { golonganName: 'I', description: 'Golongan I - Staff Junior' },
    { golonganName: 'II', description: 'Golongan II - Staff Senior' },
    { golonganName: 'III', description: 'Golongan III - Supervisor' },
    { golonganName: 'IV', description: 'Golongan IV - Manager' },
  ];

  for (const gol of golongans) {
    await prisma.golongan.upsert({
      where: { golonganName: gol.golonganName },
      update: {},
      create: gol,
    });
  }

  console.log('✅ Golongan created');

  // Get all departments and golongan for employee creation
  const allDepartments = await prisma.department.findMany();
  const allGolongans = await prisma.golongan.findMany();
  
  const mdpDept = allDepartments.find(d => d.departmentName === 'MDP')!;
  const hcgaDept = allDepartments.find(d => d.departmentName === 'HCGA')!;
  const financeDept = allDepartments.find(d => d.departmentName === 'Finance')!;
  const golongan3 = allGolongans.find(g => g.golonganName === 'III')!;
  const golongan2 = allGolongans.find(g => g.golonganName === 'II')!;
  const golongan1 = allGolongans.find(g => g.golonganName === 'I')!;

  // Helper to get random department and golongan
  const getRandomDept = () => allDepartments[Math.floor(Math.random() * allDepartments.length)];
  const getRandomGolongan = () => allGolongans[Math.floor(Math.random() * allGolongans.length)];

  // Create Employees (Admin + Test Users) with department, golongan, and employeeType
  const employees = [
    { 
      employeeNumber: '100000001', 
      fullName: 'Admin Koperasi', 
      departmentId: mdpDept.id,
      golonganId: golongan3.id,
      employeeType: EmployeeType.TETAP,
      isActive: true 
    },
    { 
      employeeNumber: '100000002', 
      fullName: 'Divisi Simpan Pinjam', 
      departmentId: financeDept.id,
      golonganId: golongan3.id,
      employeeType: EmployeeType.TETAP, 
      isActive: true 
    },
    { 
      employeeNumber: '100000003', 
      fullName: 'Pengawas Koperasi', 
      departmentId: hcgaDept.id,
      golonganId: golongan3.id,
      employeeType: EmployeeType.TETAP, 
      isActive: true 
    },
    { 
      employeeNumber: '100000004', 
      fullName: 'Payroll Staff', 
      departmentId: hcgaDept.id,
      golonganId: golongan2.id,
      employeeType: EmployeeType.TETAP, 
      isActive: true 
    },
  ];

  // Test users - varying departments, golongan, and types
  const testUserNames = [
    'Budi Santoso', 'Siti Nurhaliza', 'Ahmad Dahlan', 'Rina Wijaya', 'Joko Widodo',
    'Dewi Sartika', 'Andi Setiawan', 'Sri Mulyani', 'Bambang Pamungkas',
    'Mega Wati', 'Hendra Gunawan', 'Lestari Indah', 'Rizki Ramadhan', 'Fitri Handayani', 'Arief Budiman',
    'Doni Pratama', 'Yuni Shara', 'Wawan Setiawan', 'Dzakwan Irfan Ramdhani'
  ];

  const employeeTypes = [EmployeeType.TETAP, EmployeeType.KONTRAK];

  for (let i = 5; i <= 23; i++) {
    const randomType = employeeTypes[Math.floor(Math.random() * employeeTypes.length)];
    
    employees.push({
      employeeNumber: `100000${i.toString().padStart(3, '0')}`,
      fullName: testUserNames[i - 5] || `Test User ${i}`,
      departmentId: getRandomDept().id,
      golonganId: getRandomGolongan().id,
      employeeType: randomType as any,
      isActive: true,
    });
  }

  for (const emp of employees) {
    await prisma.employee.upsert({
      where: { employeeNumber: emp.employeeNumber },
      update: {},
      create: emp,
    });
  }

  console.log('✅ Employees created');

  // Get levels
  const ketuaLevel = await prisma.level.findFirst({ where: { levelName: 'ketua' } });
  const divisiSimpanPinjamLevel = await prisma.level.findFirst({ where: { levelName: 'divisi_simpan_pinjam' } });
  const pengawasLevel = await prisma.level.findFirst({ where: { levelName: 'pengawas' } });
  const payrollLevel = await prisma.level.findFirst({ where: { levelName: 'payroll' } });

  if (!ketuaLevel || !divisiSimpanPinjamLevel || !pengawasLevel || !payrollLevel) {
    throw new Error('Required levels not found');
  }

  const hashedPassword = await bcrypt.hash('Admin123!', 12);

  // ==================== CREATE ADMIN USERS (NO departmentId in users!) ====================
  
  // 1. Admin User (Ketua)
  const adminEmployee = await prisma.employee.findUnique({ where: { employeeNumber: '100000001' } });
  const adminUser = await prisma.user.upsert({
    where: { email: 'dzakwanbusiness7@gmail.com' },
    update: {},
    create: {
      name: 'Admin Koperasi',
      email: 'dzakwanbusiness7@gmail.com',
      nik: '1234567890123456',
      npwp: '1234567890123456',
      password: hashedPassword,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      memberVerified: true,
      memberVerifiedAt: new Date(),
      employeeId: adminEmployee!.id,
      // NO departmentId here - it's in employee!
      dateOfBirth: new Date('1990-01-01'),
      birthPlace: 'Jakarta',
      permanentEmployeeDate: new Date('2020-01-01'),
      installmentPlan: 1,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_levelId: { userId: adminUser.id, levelId: ketuaLevel.id } },
    update: {},
    create: { userId: adminUser.id, levelId: ketuaLevel.id },
  });

  console.log('✅ Admin (Ketua) user created');

  // 2. Divisi Simpan Pinjam User
  const divisiEmployee = await prisma.employee.findUnique({ where: { employeeNumber: '100000002' } });
  const divisiUser = await prisma.user.upsert({
    where: { email: 'dzakwan.ramdhani@mhs.unsoed.ac.id' },
    update: {},
    create: {
      name: 'Divisi Simpan Pinjam',
      email: 'dzakwan.ramdhani@mhs.unsoed.ac.id',
      nik: '1234567890123457',
      npwp: '1234567890123457',
      password: hashedPassword,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      memberVerified: true,
      memberVerifiedAt: new Date(),
      employeeId: divisiEmployee!.id,
      dateOfBirth: new Date('1991-01-01'),
      birthPlace: 'Bandung',
      permanentEmployeeDate: new Date('2020-02-01'),
      installmentPlan: 1,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_levelId: { userId: divisiUser.id, levelId: divisiSimpanPinjamLevel.id } },
    update: {},
    create: { userId: divisiUser.id, levelId: divisiSimpanPinjamLevel.id },
  });

  console.log('✅ Divisi Simpan Pinjam user created');

  // 3. Pengawas User
  const pengawasEmployee = await prisma.employee.findUnique({ where: { employeeNumber: '100000003' } });
  const pengawasUser = await prisma.user.upsert({
    where: { email: 'lexdani368@gmail.com' },
    update: {},
    create: {
      name: 'Pengawas Koperasi',
      email: 'lexdani368@gmail.com',
      nik: '1234567890123458',
      npwp: '1234567890123458',
      password: hashedPassword,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      memberVerified: true,
      memberVerifiedAt: new Date(),
      employeeId: pengawasEmployee!.id,
      dateOfBirth: new Date('1992-01-01'),
      birthPlace: 'Surabaya',
      permanentEmployeeDate: new Date('2020-03-01'),
      installmentPlan: 1,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_levelId: { userId: pengawasUser.id, levelId: pengawasLevel.id } },
    update: {},
    create: { userId: pengawasUser.id, levelId: pengawasLevel.id },
  });

  console.log('✅ Pengawas user created');

  // 4. Payroll User
  const payrollEmployee = await prisma.employee.findUnique({ where: { employeeNumber: '100000004' } });
  const payrollUser = await prisma.user.upsert({
    where: { email: 'ulujamicomal66@gmail.com' },
    update: {},
    create: {
      name: 'Payroll Staff',
      email: 'ulujamicomal66@gmail.com',
      nik: '1234567890123459',
      npwp: '1234567890123459',
      password: hashedPassword,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      memberVerified: true,
      memberVerifiedAt: new Date(),
      employeeId: payrollEmployee!.id,
      dateOfBirth: new Date('1993-01-01'),
      birthPlace: 'Medan',
      permanentEmployeeDate: new Date('2020-04-01'),
      installmentPlan: 1,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_levelId: { userId: payrollUser.id, levelId: payrollLevel.id } },
    update: {},
    create: { userId: payrollUser.id, levelId: payrollLevel.id },
  });

  console.log('✅ Payroll user created');

  // ==================== CREATE TEST USERS WITH APPLICATIONS ====================

  // Helper function to create user with application (NO departmentId param!)
  async function createUserWithApplication(
    employeeNumber: string,
    userData: {
      name: string;
      email: string;
      nik: string;
      npwp: string;
      dateOfBirth: Date;
      birthPlace: string;
      installmentPlan: number;
    },
    applicationData: {
      status: ApplicationStatus;
      currentStep: ApprovalStep | null;
      submittedAt: Date;
      approvedAt?: Date;
      rejectedAt?: Date;
      rejectionReason?: string;
      approvals: Array<{
        step: ApprovalStep;
        decision?: ApprovalDecision;
        decidedAt?: Date;
        approverId?: string;
        notes?: string;
      }>;
    }
  ) {
    const employee = await prisma.employee.findUnique({ where: { employeeNumber } });
    if (!employee) throw new Error(`Employee ${employeeNumber} not found`);

    const user = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        memberVerified: applicationData.status === ApplicationStatus.APPROVED,
        memberVerifiedAt: applicationData.status === ApplicationStatus.APPROVED ? applicationData.approvedAt : null,
        employeeId: employee.id,
        permanentEmployeeDate: new Date('2021-06-01'),
        // NO departmentId!
      },
    });

    const application = await prisma.memberApplication.create({
      data: {
        userId: user.id,
        status: applicationData.status,
        currentStep: applicationData.currentStep,
        submittedAt: applicationData.submittedAt,
        approvedAt: applicationData.approvedAt,
        rejectedAt: applicationData.rejectedAt,
        rejectionReason: applicationData.rejectionReason,
      },
    });

    for (const approval of applicationData.approvals) {
      await prisma.applicationApproval.create({
        data: {
          applicationId: application.id,
          step: approval.step,
          decision: approval.decision,
          decidedAt: approval.decidedAt,
          approverId: approval.approverId,
          notes: approval.notes,
        },
      });
    }

    return { user, application };
  }

  console.log('🔄 Creating test users with applications...');

  // ===== 1. UNDER_REVIEW - Waiting DSP Approval (5 users) =====
  const waitingDSPUsers = [
    { empNum: '100000005', name: 'Budi Santoso', email: 'budi.santoso@test.com', nik: '3201011990010001', npwp: '1234567890123460' },
    { empNum: '100000006', name: 'Siti Nurhaliza', email: 'siti.nur@test.com', nik: '3201011991020002', npwp: '1234567890123461' },
    { empNum: '100000007', name: 'Ahmad Dahlan', email: 'ahmad.dahlan@test.com', nik: '3201011992030003', npwp: '1234567890123462' },
    { empNum: '100000008', name: 'Rina Wijaya', email: 'rina.wijaya@test.com', nik: '3201011993040004', npwp: '1234567890123463' },
    { empNum: '100000009', name: 'Joko Widodo', email: 'joko.widodo@test.com', nik: '3201011994050005', npwp: '1234567890123464' },
  ];

  for (const testUser of waitingDSPUsers) {
    await createUserWithApplication(
      testUser.empNum,
      {
        name: testUser.name,
        email: testUser.email,
        nik: testUser.nik,
        npwp: testUser.npwp,
        dateOfBirth: new Date('1990-05-15'),
        birthPlace: 'Jakarta',
        installmentPlan: 1,
      },
      {
        status: ApplicationStatus.UNDER_REVIEW,
        currentStep: ApprovalStep.DIVISI_SIMPAN_PINJAM,
        submittedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        approvals: [
          { step: ApprovalStep.DIVISI_SIMPAN_PINJAM },
          { step: ApprovalStep.KETUA },
        ],
      }
    );
  }

  console.log('✅ Created 5 users waiting DSP approval');

  // ===== 2. UNDER_REVIEW - Waiting Ketua Approval (4 users) =====
  const waitingKetuaUsers = [
    { empNum: '100000010', name: 'Dewi Sartika', email: 'dewi.sartika@test.com', nik: '3201011995060006', npwp: '1234567890123465' },
    { empNum: '100000011', name: 'Andi Setiawan', email: 'andi.setiawan@test.com', nik: '3201011996070007', npwp: '1234567890123466' },
    { empNum: '100000012', name: 'Sri Mulyani', email: 'sri.mulyani@test.com', nik: '3201011997080008', npwp: '1234567890123467' },
    { empNum: '100000013', name: 'Bambang Pamungkas', email: 'bambang.p@test.com', nik: '3201011998090009', npwp: '1234567890123468' },
  ];

  for (const testUser of waitingKetuaUsers) {
    const submittedDate = new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000);
    const dspApprovedDate = new Date(submittedDate.getTime() + 2 * 24 * 60 * 60 * 1000);

    await createUserWithApplication(
      testUser.empNum,
      {
        name: testUser.name,
        email: testUser.email,
        nik: testUser.nik,
        npwp: testUser.npwp,
        dateOfBirth: new Date('1991-06-20'),
        birthPlace: 'Bandung',
        installmentPlan: 2,
      },
      {
        status: ApplicationStatus.UNDER_REVIEW,
        currentStep: ApprovalStep.KETUA,
        submittedAt: submittedDate,
        approvals: [
          {
            step: ApprovalStep.DIVISI_SIMPAN_PINJAM,
            decision: ApprovalDecision.APPROVED,
            decidedAt: dspApprovedDate,
            approverId: divisiUser.id,
            notes: 'Data lengkap dan sesuai',
          },
          { step: ApprovalStep.KETUA },
        ],
      }
    );
  }

  console.log('✅ Created 4 users waiting Ketua approval');

  // ===== 3. APPROVED (6 users) =====
  const approvedUsers = [
    { empNum: '100000014', name: 'Mega Wati', email: 'mega.wati@test.com', nik: '3201011999100010', npwp: '1234567890123469' },
    { empNum: '100000015', name: 'Hendra Gunawan', email: 'hendra.g@test.com', nik: '3201012000110011', npwp: '1234567890123470' },
    { empNum: '100000016', name: 'Lestari Indah', email: 'lestari.indah@test.com', nik: '3201012001120012', npwp: '1234567890123471' },
    { empNum: '100000017', name: 'Rizki Ramadhan', email: 'rizki.r@test.com', nik: '3201012002130013', npwp: '1234567890123472' },
    { empNum: '100000018', name: 'Fitri Handayani', email: 'fitri.h@test.com', nik: '3201012003140014', npwp: '1234567890123473' },
    { empNum: '100000019', name: 'Arief Budiman', email: 'arief.b@test.com', nik: '3201012004150015', npwp: '1234567890123474' },
  ];

  for (const testUser of approvedUsers) {
    const submittedDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    const dspApprovedDate = new Date(submittedDate.getTime() + 2 * 24 * 60 * 60 * 1000);
    const ketuaApprovedDate = new Date(dspApprovedDate.getTime() + 3 * 24 * 60 * 60 * 1000);

    await createUserWithApplication(
      testUser.empNum,
      {
        name: testUser.name,
        email: testUser.email,
        nik: testUser.nik,
        npwp: testUser.npwp,
        dateOfBirth: new Date('1992-07-10'),
        birthPlace: 'Surabaya',
        installmentPlan: Math.random() > 0.5 ? 1 : 2,
      },
      {
        status: ApplicationStatus.APPROVED,
        currentStep: null,
        submittedAt: submittedDate,
        approvedAt: ketuaApprovedDate,
        approvals: [
          {
            step: ApprovalStep.DIVISI_SIMPAN_PINJAM,
            decision: ApprovalDecision.APPROVED,
            decidedAt: dspApprovedDate,
            approverId: divisiUser.id,
            notes: 'Disetujui oleh DSP',
          },
          {
            step: ApprovalStep.KETUA,
            decision: ApprovalDecision.APPROVED,
            decidedAt: ketuaApprovedDate,
            approverId: adminUser.id,
            notes: 'Disetujui oleh Ketua',
          },
        ],
      }
    );
  }

  console.log('✅ Created 6 approved users');

  // ===== 4. REJECTED (3 users) =====
  const rejectedUsers = [
    { empNum: '100000020', name: 'Doni Pratama', email: 'doni.p@test.com', nik: '3201012005160016', npwp: '1234567890123475', reason: 'Data tidak lengkap' },
    { empNum: '100000021', name: 'Yuni Shara', email: 'yuni.shara@test.com', nik: '3201012006170017', npwp: '1234567890123476', reason: 'NIK tidak valid' },
    { empNum: '100000022', name: 'Wawan Setiawan', email: 'wawan.s@test.com', nik: '3201012007180018', npwp: '1234567890123477', reason: 'Belum memenuhi syarat masa kerja' },
  ];

  for (const testUser of rejectedUsers) {
    const submittedDate = new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000);
    const rejectedDate = new Date(submittedDate.getTime() + 1 * 24 * 60 * 60 * 1000);

    await createUserWithApplication(
      testUser.empNum,
      {
        name: testUser.name,
        email: testUser.email,
        nik: testUser.nik,
        npwp: testUser.npwp,
        dateOfBirth: new Date('1993-08-25'),
        birthPlace: 'Medan',
        installmentPlan: 1,
      },
      {
        status: ApplicationStatus.REJECTED,
        currentStep: null,
        submittedAt: submittedDate,
        rejectedAt: rejectedDate,
        rejectionReason: testUser.reason,
        approvals: [
          {
            step: ApprovalStep.DIVISI_SIMPAN_PINJAM,
            decision: ApprovalDecision.REJECTED,
            decidedAt: rejectedDate,
            approverId: divisiUser.id,
            notes: testUser.reason,
          },
          { step: ApprovalStep.KETUA },
        ],
      }
    );
  }

  console.log('✅ Created 3 rejected users');

  console.log('');
  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });