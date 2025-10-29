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

  // Create Admin User (Ketua)
  const hashedPassword = await bcrypt.hash('Admin123!', 12);
  
  // Get ketua level
  const ketuaLevel = await prisma.level.findFirst({
    where: { levelName: 'ketua' },
  });

  if (!ketuaLevel) {
    throw new Error('Ketua level not found. Please check the levels creation.');
  }

  // Get MDP department
  const mdpDept = await prisma.department.findFirst({
    where: { departmentName: 'MDP' },
  });

  if (!mdpDept) {
    throw new Error('MDP department not found. Please check the departments creation.');
  }

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@koperasi.com' },
    update: {},
    create: {
      name: 'Admin Koperasi',
      email: 'admin@koperasi.com',
      nik: '1234567890',
      password: hashedPassword,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      memberVerified: true,
      memberVerifiedAt: new Date(),
      departmentId: mdpDept.id,
      dateOfBirth: new Date('1990-01-01'),
      birthPlace: 'Jakarta',
      permanentEmployeeDate: new Date('2020-01-01'),
      installmentPlan: 1,
    },
  });

  // Assign ketua role to admin
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
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('📧 Email: admin@koperasi.com');
  console.log('🔑 Password: Admin123!');
  console.log('👤 NIK: 1234567890');
  console.log('═══════════════════════════════════════════');
  console.log('');
  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });