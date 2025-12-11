import { SeederContext, logSuccess, logInfo } from './helpers/seeder-context';

/**
 * Seed Levels/Roles
 */
export async function seedLevels(ctx: SeederContext): Promise<void> {
    logInfo('Levels', 'Seeding levels/roles...');

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
        await ctx.prisma.level.upsert({
            where: { levelName: level.levelName },
            update: {},
            create: level,
        });
    }

    // Store references in context
    const allLevels = await ctx.prisma.level.findMany();
    ctx.levels.ketua = allLevels.find(l => l.levelName === 'ketua');
    ctx.levels.divisiSimpanPinjam = allLevels.find(l => l.levelName === 'divisi_simpan_pinjam');
    ctx.levels.pengawas = allLevels.find(l => l.levelName === 'pengawas');
    ctx.levels.bendahara = allLevels.find(l => l.levelName === 'bendahara');
    ctx.levels.payroll = allLevels.find(l => l.levelName === 'payroll');
    ctx.levels.shopkeeper = allLevels.find(l => l.levelName === 'shopkeeper');
    ctx.levels.anggota = allLevels.find(l => l.levelName === 'anggota');

    logSuccess('Levels', `Created ${levels.length} levels`);
}
