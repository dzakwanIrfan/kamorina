// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
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

  // Create Employees
  const employees = [
    { employeeNumber: '100000001', fullName: 'Admin Koperasi', isActive: true },
    { employeeNumber: '100000002', fullName: 'Divisi Simpan Pinjam', isActive: true },
    { employeeNumber: '100000003', fullName: 'User Test', isActive: true },
    { employeeNumber: '100000004', fullName: 'Pengawas Koperasi', isActive: true },
    { employeeNumber: '100000005', fullName: 'Payroll Staff', isActive: true },
    { employeeNumber: '100000006', fullName: 'User Testing 6', isActive: true },
    { employeeNumber: '100000007', fullName: 'User Testing 7', isActive: true },
    { employeeNumber: '100000008', fullName: 'User Testing 8', isActive: true },
    { employeeNumber: '100000009', fullName: 'User Testing 9', isActive: true },
    { employeeNumber: '100000010', fullName: 'User Testing 10', isActive: true },
  ];

  for (const emp of employees) {
    await prisma.employee.upsert({
      where: { employeeNumber: emp.employeeNumber },
      update: {},
      create: emp,
    });
  }

  console.log('✅ Employees created');

  // Get necessary data
  const ketuaLevel = await prisma.level.findFirst({
    where: { levelName: 'ketua' },
  });

  const divisiSimpanPinjamLevel = await prisma.level.findFirst({
    where: { levelName: 'divisi_simpan_pinjam' },
  });

  const pengawasLevel = await prisma.level.findFirst({
    where: { levelName: 'pengawas' },
  });

  const payrollLevel = await prisma.level.findFirst({
    where: { levelName: 'payroll' },
  });

  const mdpDept = await prisma.department.findFirst({
    where: { departmentName: 'MDP' },
  });

  const hcgaDept = await prisma.department.findFirst({
    where: { departmentName: 'HCGA' },
  });

  const financeDept = await prisma.department.findFirst({
    where: { departmentName: 'Finance' },
  });

  if (!ketuaLevel || !divisiSimpanPinjamLevel || !pengawasLevel || !payrollLevel || !mdpDept || !hcgaDept || !financeDept) {
    throw new Error('Required data not found');
  }

  // Get employees
  const adminEmployee = await prisma.employee.findUnique({
    where: { employeeNumber: '100000001' },
  });

  const divisiEmployee = await prisma.employee.findUnique({
    where: { employeeNumber: '100000002' },
  });

  const testEmployee = await prisma.employee.findUnique({
    where: { employeeNumber: '100000003' },
  });

  const pengawasEmployee = await prisma.employee.findUnique({
    where: { employeeNumber: '100000004' },
  });

  const payrollEmployee = await prisma.employee.findUnique({
    where: { employeeNumber: '100000005' },
  });

  if (!adminEmployee || !divisiEmployee || !testEmployee || !pengawasEmployee || !payrollEmployee) {
    throw new Error('Employee not found');
  }

  // Create Admin User (Ketua)
  const hashedPassword = await bcrypt.hash('Admin123!', 12);

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
      employeeId: adminEmployee.id,
      departmentId: mdpDept.id,
      dateOfBirth: new Date('1990-01-01'),
      birthPlace: 'Jakarta',
      permanentEmployeeDate: new Date('2020-01-01'),
      installmentPlan: 1,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_levelId: {
        userId: adminUser.id,
        levelId: ketuaLevel.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      levelId: ketuaLevel.id,
    },
  });

  console.log('✅ Admin user created');

  // Create Divisi Simpan Pinjam User
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
      employeeId: divisiEmployee.id,
      departmentId: financeDept.id,
      dateOfBirth: new Date('1991-01-01'),
      birthPlace: 'Bandung',
      permanentEmployeeDate: new Date('2020-02-01'),
      installmentPlan: 1,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_levelId: {
        userId: divisiUser.id,
        levelId: divisiSimpanPinjamLevel.id,
      },
    },
    update: {},
    create: {
      userId: divisiUser.id,
      levelId: divisiSimpanPinjamLevel.id,
    },
  });

  console.log('✅ Divisi Simpan Pinjam user created');

  // Create Pengawas User
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
      employeeId: pengawasEmployee.id,
      departmentId: hcgaDept.id,
      dateOfBirth: new Date('1992-01-01'),
      birthPlace: 'Surabaya',
      permanentEmployeeDate: new Date('2020-03-01'),
      installmentPlan: 1,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_levelId: {
        userId: pengawasUser.id,
        levelId: pengawasLevel.id,
      },
    },
    update: {},
    create: {
      userId: pengawasUser.id,
      levelId: pengawasLevel.id,
    },
  });

  console.log('✅ Pengawas user created');

  // Create Payroll User
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
      employeeId: payrollEmployee.id,
      departmentId: hcgaDept.id,
      dateOfBirth: new Date('1993-01-01'),
      birthPlace: 'Medan',
      permanentEmployeeDate: new Date('2020-04-01'),
      installmentPlan: 1,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_levelId: {
        userId: payrollUser.id,
        levelId: payrollLevel.id,
      },
    },
    update: {},
    create: {
      userId: payrollUser.id,
      levelId: payrollLevel.id,
    },
  });
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });