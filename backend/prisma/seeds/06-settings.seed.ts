import { SettingCategory, SettingType } from '@prisma/client';
import { SeederContext, logSuccess, logInfo } from './helpers/seeder-context';

/**
 * Default cooperative settings
 */
const DEFAULT_SETTINGS = [
  // MEMBERSHIP
  {
    key: 'initial_membership_fee',
    value: '500000',
    type: SettingType.NUMBER,
    category: SettingCategory.MEMBERSHIP,
    label: 'Iuran Awal Anggota',
    description: 'Biaya pendaftaran anggota baru koperasi',
    unit: 'Rupiah',
    validation: { min: 0, required: true },
  },
  {
    key: 'monthly_membership_fee',
    value: '100000',
    type: SettingType.NUMBER,
    category: SettingCategory.MEMBERSHIP,
    label: 'Iuran Bulanan Anggota',
    description: 'Iuran wajib bulanan untuk anggota',
    unit: 'Rupiah',
    validation: { min: 0, required: true },
  },

  // SAVINGS
  {
    key: 'deposit_interest_rate',
    value: '4',
    type: SettingType.NUMBER,
    category: SettingCategory.SAVINGS,
    label: 'Bunga Deposito',
    description: 'Persentase bunga deposito per tahun',
    unit: 'Persen',
    validation: { min: 0, max: 100, required: true },
  },
  {
    key: 'deposit_change_admin_fee',
    value: '15000',
    type: SettingType.NUMBER,
    category: SettingCategory.SAVINGS,
    label: 'Biaya Admin Perubahan Deposito',
    description: 'Biaya administrasi untuk setiap perubahan tabungan deposito',
    unit: 'Rupiah',
    validation: { min: 0, required: true },
  },

  // LOAN
  {
    key: 'max_goods_loan_amount',
    value: '15000000',
    type: SettingType.NUMBER,
    category: SettingCategory.LOAN,
    label: 'Maksimal Kredit Barang Reimburs',
    description: 'Jumlah maksimal kredit barang reimburs yang dapat diajukan',
    unit: 'Rupiah',
    validation: { min: 0, required: true },
  },
  {
    key: 'min_loan_amount',
    value: '500000',
    type: SettingType.NUMBER,
    category: SettingCategory.LOAN,
    label: 'Minimal Pinjaman',
    description: 'Jumlah minimal pinjaman yang dapat diajukan',
    unit: 'Rupiah',
    validation: { min: 0, required: true },
  },
  {
    key: 'max_loan_tenor',
    value: '36',
    type: SettingType.NUMBER,
    category: SettingCategory.LOAN,
    label: 'Maksimal Tenor Pinjaman',
    description: 'Jangka waktu maksimal pinjaman',
    unit: 'Bulan',
    validation: { min: 1, max: 120, required: true },
  },

  // INTEREST
  {
    key: 'loan_interest_rate',
    value: '8',
    type: SettingType.NUMBER,
    category: SettingCategory.INTEREST,
    label: 'Bunga Pinjaman',
    description: 'Persentase bunga pinjaman per tahun',
    unit: 'Persen',
    validation: { min: 0, max: 100, required: true },
  },
  {
    key: 'shop_margin_rate',
    value: '5',
    type: SettingType.NUMBER,
    category: SettingCategory.INTEREST,
    label: 'Margin Toko',
    description: 'Persentase margin toko pada kredit barang (online)',
    unit: 'Persen',
    validation: { min: 0, max: 100, required: true },
  },
  {
    key: 'interest_calculation_method',
    value: 'FLAT',
    type: SettingType.STRING,
    category: SettingCategory.INTEREST,
    label: 'Metode Perhitungan Bunga',
    description: 'Metode perhitungan bunga pinjaman (FLAT/EFFECTIVE)',
    unit: null,
    validation: { required: true, enum: ['FLAT', 'EFFECTIVE'] },
  },

  // PENALTY
  {
    key: 'deposit_early_withdrawal_penalty_rate',
    value: '3',
    type: SettingType.NUMBER,
    category: SettingCategory.PENALTY,
    label: 'Penalty Penarikan Deposito Awal',
    description:
      'Persentase penalty untuk penarikan deposito sebelum jatuh tempo',
    unit: 'Persen',
    validation: { min: 0, max: 100, required: true },
  },

  // GENERAL
  {
    key: 'cooperative_name',
    value: 'Koperasi Surya Niaga Kamorina',
    type: SettingType.STRING,
    category: SettingCategory.GENERAL,
    label: 'Nama Koperasi',
    description: 'Nama resmi koperasi',
    unit: null,
    validation: { required: true },
  },
  {
    key: 'cooperative_cutoff_date',
    value: '15',
    type: SettingType.NUMBER,
    category: SettingCategory.GENERAL,
    label: 'Tanggal Cutoff Koperasi',
    description: 'Tanggal cutoff untuk perhitungan simpanan dan pinjaman',
    unit: 'Tanggal',
    validation: { min: 1, max: 31, required: true },
  },
  {
    key: 'cooperative_payroll_date',
    value: '27',
    type: SettingType.NUMBER,
    category: SettingCategory.GENERAL,
    label: 'Tanggal Gajian Koperasi',
    description: 'Tanggal gajian untuk potongan koperasi',
    unit: 'Tanggal',
    validation: { min: 1, max: 31, required: true },
  },
];

/**
 * Seed Cooperative Settings
 */
export async function seedSettings(ctx: SeederContext): Promise<void> {
  logInfo('Settings', 'Seeding cooperative settings...');

  for (const setting of DEFAULT_SETTINGS) {
    await ctx.prisma.cooperativeSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  logSuccess(
    'Settings',
    `Created ${DEFAULT_SETTINGS.length} cooperative settings`,
  );
}
