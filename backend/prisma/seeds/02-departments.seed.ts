import { SeederContext, logSuccess, logInfo } from './helpers/seeder-context';

/**
 * Seed Departments
 */
export async function seedDepartments(ctx: SeederContext): Promise<void> {
  logInfo('Departments', 'Seeding departments...');

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
    await ctx.prisma.department.upsert({
      where: { departmentName: dept.departmentName },
      update: {},
      create: dept,
    });
  }

  // Store references in context
  const allDepts = await ctx.prisma.department.findMany();
  ctx.departments.mdp = allDepts.find((d) => d.departmentName === 'MDP');
  ctx.departments.hcga = allDepts.find((d) => d.departmentName === 'HCGA');
  ctx.departments.finance = allDepts.find(
    (d) => d.departmentName === 'Finance',
  );
  ctx.departments.bda = allDepts.find((d) => d.departmentName === 'BDA');
  ctx.departments.production = allDepts.find(
    (d) => d.departmentName === 'Production',
  );
  ctx.departments.warehouse = allDepts.find(
    (d) => d.departmentName === 'Warehouse',
  );
  ctx.departments.qc = allDepts.find((d) => d.departmentName === 'QC');
  ctx.departments.engineering = allDepts.find(
    (d) => d.departmentName === 'Engineering',
  );
  ctx.departments.ios = allDepts.find((d) => d.departmentName === 'IOS');

  logSuccess('Departments', `Created ${departments.length} departments`);
}
