import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../config/env.config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService<EnvironmentVariables>) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('MAIL_HOST', { infer: true }),
      port: this.configService.get('MAIL_PORT', { infer: true }),
      secure: false,
      auth: {
        user: this.configService.get('MAIL_USER', { infer: true }),
        pass: this.configService.get('MAIL_PASSWORD', { infer: true }),
      },
    });
  }

  // Helper untuk format currency
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  async sendEmailVerification(email: string, name: string, token: string) {
    const verificationUrl = `${this.configService.get('FRONTEND_URL', { infer: true })}/auth/verify-email?token=${token}`;

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM', { infer: true }),
      to: email,
      subject: 'Verifikasi Email - Koperasi Kamorina Surya Niaga',
      html: `
        <h2>Halo ${name},</h2>
        <p>Terima kasih telah mendaftar di Koperasi Kamorina Surya Niaga. </p>
        <p>Silakan klik link berikut untuk memverifikasi email Anda:</p>
        <a href="${verificationUrl}" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
          Verifikasi Email
        </a>
        <p>Atau copy paste link berikut ke browser Anda:</p>
        <p>${verificationUrl}</p>
        <p>Link ini akan kadaluarsa dalam 24 jam.</p>
        <br>
        <p>Jika Anda tidak melakukan pendaftaran, abaikan email ini.</p>
      `,
    });
  }

  async sendPasswordResetEmail(email: string, name: string, token: string) {
    const resetUrl = `${this.configService.get('FRONTEND_URL', { infer: true })}/auth/reset-password?token=${token}`;

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM', { infer: true }),
      to: email,
      subject: 'Reset Password - Koperasi Kamorina Surya Niaga',
      html: `
        <h2>Halo ${name},</h2>
        <p>Kami menerima permintaan untuk reset password akun Anda.</p>
        <p>Silakan klik link berikut untuk reset password:</p>
        <a href="${resetUrl}" style="padding: 10px 20px; background-color: #f44336; color: white; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
          Reset Password
        </a>
        <p>Atau copy paste link berikut ke browser Anda:</p>
        <p>${resetUrl}</p>
        <p>Link ini akan kadaluarsa dalam 1 jam.</p>
        <br>
        <p>Jika Anda tidak melakukan permintaan ini, abaikan email ini.</p>
      `,
    });
  }

  /**
   * Send approval request notification to approver
   */
  async sendApprovalRequest(
    email: string,
    approverName: string,
    applicantName: string,
    employeeNumber: string,
    roleName: string,
  ) {
    const dashboardUrl = `${this.configService.get('FRONTEND_URL', { infer: true })}/dashboard/member-application`;

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM', { infer: true }),
      to: email,
      subject: 'Pengajuan Member Baru Menunggu Persetujuan - Koperasi Kamorina Surya Niaga',
      html: `
        <h2>Halo ${approverName},</h2>
        <p>Ada pengajuan member baru yang menunggu persetujuan Anda.</p>
        <br>
        <h3>Detail Pemohon:</h3>
        <ul>
          <li><strong>Nama:</strong> ${applicantName}</li>
          <li><strong>NIK:</strong> ${employeeNumber}</li>
        </ul>
        <br>
        <p>Sebagai <strong>${roleName.toUpperCase().replace('_', ' ')}</strong>, Anda diminta untuk meninjau dan menyetujui/menolak pengajuan ini.</p>
        <br>
        <a href="${dashboardUrl}" style="padding: 10px 20px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
          Lihat Pengajuan
        </a>
        <p>Atau akses dashboard di: ${dashboardUrl}</p>
        <br>
        <p>Terima kasih atas perhatian Anda.</p>
      `,
    });
  }

  /**
   * Send rejection notification to applicant
   */
  async sendApplicationRejected(
    email: string,
    applicantName: string,
    reason: string,
  ) {
    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM', { infer: true }),
      to: email,
      subject: 'Pengajuan Keanggotaan Ditolak - Koperasi Kamorina Surya Niaga',
      html: `
        <h2>Halo ${applicantName},</h2>
        <p>Kami informasikan bahwa pengajuan keanggotaan Anda di Koperasi Kamorina Surya Niaga telah <strong>DITOLAK</strong>.</p>
        <br>
        <h3>Alasan Penolakan:</h3>
        <p style="background-color: #ffebee; padding: 15px; border-left: 4px solid #f44336;">
          ${reason}
        </p>
        <br>
        <p>Jika Anda memiliki pertanyaan atau ingin mengajukan ulang, silakan hubungi admin koperasi.</p>
        <br>
        <p>Terima kasih atas pengertian Anda.</p>
      `,
    });
  }

  /**
   * Send final approval notification to new member
   */
  async sendMembershipApproved(email: string, memberName: string) {
    const dashboardUrl = `${this.configService.get('FRONTEND_URL', { infer: true })}/dashboard`;

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM', { infer: true }),
      to: email,
      subject: 'Keanggotaan Anda Disetujui - Koperasi Kamorina Surya Niaga',
      html: `
        <h2>Selamat ${memberName},</h2>
        <p>Kami dengan senang hati menginformasikan bahwa pengajuan keanggotaan Anda di Koperasi Kamorina Surya Niaga telah <strong>DISETUJUI</strong>.</p>
        <br>
        <p>Sekarang Anda dapat mengakses seluruh fitur member koperasi, termasuk:</p>
        <ul>
          <li>Simpanan Wajib & Sukarela</li>
          <li>Pengajuan Pinjaman</li>
          <li>Belanja di Toko Koperasi</li>
          <li>Dan banyak lagi</li>
        </ul>
        <br>
        <a href="${dashboardUrl}" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
          Akses Dashboard
        </a>
        <p>Atau kunjungi: ${dashboardUrl}</p>
        <br>
        <p>Selamat bergabung dengan keluarga besar Koperasi.</p>
      `,
    });
  }

  /**
   * Send notification to pengawas and payroll about new member
   */
  async sendNewMemberNotification(
    email: string,
    recipientName: string,
    memberName: string,
    memberEmail: string,
  ) {
    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM', { infer: true }),
      to: email,
      subject: 'Member Baru Telah Disetujui - Koperasi Kamorina Surya Niaga',
      html: `
        <h2>Halo ${recipientName},</h2>
        <p>Kami informasikan bahwa ada member baru yang telah disetujui oleh Ketua Koperasi.</p>
        <br>
        <h3>Detail Member Baru:</h3>
        <ul>
          <li><strong>Nama:</strong> ${memberName}</li>
          <li><strong>Email:</strong> ${memberEmail}</li>
        </ul>
        <br>
        <p>Mohon untuk diproses lebih lanjut sesuai dengan prosedur yang berlaku.</p>
        <br>
        <p>Terima kasih atas perhatian Anda.</p>
      `,
    });
  }

  async sendLoanApprovalRequest(
    email: string,
    approverName: string,
    applicantName: string,
    loanNumber: string,
    loanAmount: number,
    roleName: string,
  ) {
    const dashboardUrl = `${this.configService.get('FRONTEND_URL', { infer: true })}/dashboard/loans`;
    const formattedAmount = this.formatCurrency(loanAmount);

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM', { infer: true }),
      to: email,
      subject: 'Pengajuan Pinjaman Menunggu Persetujuan - Koperasi Kamorina Surya Niaga',
      html: `
        <h2>Halo ${approverName},</h2>
        <p>Ada pengajuan pinjaman baru yang menunggu persetujuan Anda.</p>
        <br>
        <h3>Detail Pinjaman:</h3>
        <ul>
          <li><strong>Nomor Pinjaman:</strong> ${loanNumber}</li>
          <li><strong>Pemohon:</strong> ${applicantName}</li>
          <li><strong>Jumlah Pinjaman:</strong> ${formattedAmount}</li>
        </ul>
        <br>
        <p>Sebagai <strong>${roleName.toUpperCase().replace('_', ' ')}</strong>, Anda diminta untuk meninjau dan menyetujui/menolak pengajuan ini.</p>
        <br>
        <a href="${dashboardUrl}" style="padding: 10px 20px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
          Lihat Pengajuan
        </a>
        <p>Atau akses dashboard di: ${dashboardUrl}</p>
        <br>
        <p>Terima kasih atas perhatian Anda.</p>
      `,
    });
  }

  /**
   * Send loan revised notification to applicant
   */
  async sendLoanRevised(
    email: string,
    applicantName: string,
    loanNumber: string,
    revisionNotes: string,
  ) {
    const dashboardUrl = `${this.configService.get('FRONTEND_URL', { infer: true })}/dashboard/loans/my-loans`;

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM', { infer: true }),
      to: email,
      subject: 'Pengajuan Pinjaman Anda Direvisi - Koperasi Kamorina Surya Niaga',
      html: `
        <h2>Halo ${applicantName},</h2>
        <p>Pengajuan pinjaman Anda dengan nomor <strong>${loanNumber}</strong> telah direvisi oleh Divisi Simpan Pinjam.</p>
        <br>
        <h3>Catatan Revisi:</h3>
        <p style="background-color: #fff3e0; padding: 15px; border-left: 4px solid #ff9800;">
          ${revisionNotes}
        </p>
        <br>
        <p>Silakan cek detail pinjaman Anda di dashboard.</p>
        <br>
        <a href="${dashboardUrl}" style="padding: 10px 20px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
          Lihat Detail Pinjaman
        </a>
        <p>Atau akses: ${dashboardUrl}</p>
        <br>
        <p>Terima kasih.</p>
      `,
    });
  }

  /**
   * Send loan rejected notification to applicant
   */
  async sendLoanRejected(
    email: string,
    applicantName: string,
    loanNumber: string,
    reason: string,
  ) {
    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM', { infer: true }),
      to: email,
      subject: 'Pengajuan Pinjaman Ditolak - Koperasi Kamorina Surya Niaga',
      html: `
        <h2>Halo ${applicantName},</h2>
        <p>Kami informasikan bahwa pengajuan pinjaman Anda dengan nomor <strong>${loanNumber}</strong> telah <strong>DITOLAK</strong>.</p>
        <br>
        <h3>Alasan Penolakan:</h3>
        <p style="background-color: #ffebee; padding: 15px; border-left: 4px solid #f44336;">
          ${reason}
        </p>
        <br>
        <p>Jika Anda memiliki pertanyaan, silakan hubungi Divisi Simpan Pinjam.</p>
        <br>
        <p>Terima kasih atas pengertian Anda.</p>
      `,
    });
  }

  /**
   * Send disbursement request to shopkeeper
   */
  async sendLoanDisbursementRequest(
    email: string,
    shopkeeperName: string,
    applicantName: string,
    loanNumber: string,
    loanAmount: number,
    bankAccountNumber: string,
  ) {
    const dashboardUrl = `${this.configService.get('FRONTEND_URL', { infer: true })}/dashboard/loans/disbursement`;
    const formattedAmount = this.formatCurrency(loanAmount);

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM', { infer: true }),
      to: email,
      subject: 'Pinjaman Menunggu Pencairan - Koperasi Kamorina Surya Niaga',
      html: `
        <h2>Halo ${shopkeeperName},</h2>
        <p>Ada pinjaman yang sudah disetujui dan menunggu untuk dicairkan.</p>
        <br>
        <h3>Detail Pinjaman:</h3>
        <ul>
          <li><strong>Nomor Pinjaman:</strong> ${loanNumber}</li>
          <li><strong>Pemohon:</strong> ${applicantName}</li>
          <li><strong>Jumlah:</strong> ${formattedAmount}</li>
          <li><strong>No. Rekening:</strong> ${bankAccountNumber}</li>
        </ul>
        <br>
        <p>Silakan proses transaksi BCA dan konfirmasi pencairan di sistem.</p>
        <br>
        <a href="${dashboardUrl}" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
          Proses Pencairan
        </a>
        <p>Atau akses: ${dashboardUrl}</p>
        <br>
        <p>Terima kasih.</p>
      `,
    });
  }

  /**
   * Send authorization request to ketua
   */
  async sendLoanAuthorizationRequest(
    email: string,
    ketuaName: string,
    applicantName: string,
    loanNumber: string,
    loanAmount: number,
  ) {
    const dashboardUrl = `${this.configService.get('FRONTEND_URL', { infer: true })}/dashboard/loans/authorization`;
    const formattedAmount = this.formatCurrency(loanAmount);

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM', { infer: true }),
      to: email,
      subject: 'Pinjaman Menunggu Otorisasi - Koperasi Kamorina Surya Niaga',
      html: `
        <h2>Halo ${ketuaName},</h2>
        <p>Ada pinjaman yang sudah dicairkan oleh Shopkeeper dan menunggu otorisasi dari Anda.</p>
        <br>
        <h3>Detail Pinjaman:</h3>
        <ul>
          <li><strong>Nomor Pinjaman:</strong> ${loanNumber}</li>
          <li><strong>Pemohon:</strong> ${applicantName}</li>
          <li><strong>Jumlah:</strong> ${formattedAmount}</li>
        </ul>
        <br>
        <p>Silakan lakukan otorisasi transaksi BCA dan konfirmasi di sistem.</p>
        <br>
        <a href="${dashboardUrl}" style="padding: 10px 20px; background-color: #f44336; color: white; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
          Proses Otorisasi
        </a>
        <p>Atau akses: ${dashboardUrl}</p>
        <br>
        <p>Terima kasih.</p>
      `,
    });
  }

  /**
   * Send loan disbursed notification to applicant
   */
  async sendLoanDisbursed(
    email: string,
    applicantName: string,
    loanNumber: string,
    loanAmount: number,
    bankAccountNumber: string,
  ) {
    const formattedAmount = this.formatCurrency(loanAmount);

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM', { infer: true }),
      to: email,
      subject: 'Pinjaman Anda Telah Dicairkan - Koperasi Kamorina Surya Niaga',
      html: `
        <h2>Selamat ${applicantName},</h2>
        <p>Pinjaman Anda dengan nomor <strong>${loanNumber}</strong> telah <strong>DICAIRKAN</strong>.</p>
        <br>
        <h3>Detail Pencairan:</h3>
        <ul>
          <li><strong>Jumlah:</strong> ${formattedAmount}</li>
          <li><strong>No. Rekening:</strong> ${bankAccountNumber}</li>
        </ul>
        <br>
        <p>Dana akan segera masuk ke rekening Anda. Harap periksa mutasi rekening Anda.</p>
        <br>
        <p style="background-color: #e3f2fd; padding: 15px; border-left: 4px solid #2196F3;">
          <strong>Catatan Penting:</strong><br>
          Jangan lupa untuk membayar cicilan sesuai jadwal yang telah ditentukan.
        </p>
        <br>
        <p>Terima kasih telah menggunakan layanan koperasi.</p>
      `,
    });
  }

  /**
   * Send loan completion notification to all relevant parties
   */
  async sendLoanCompletionNotification(
    email: string,
    applicantName: string,
    loanNumber: string,
    loanAmount: number,
  ) {
    const formattedAmount = this.formatCurrency(loanAmount);

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM', { infer: true }),
      to: email,
      subject: 'Pinjaman Telah Selesai Dicairkan - Koperasi Kamorina Surya Niaga',
      html: `
        <h2>Notifikasi Pencairan Pinjaman</h2>
        <p>Pinjaman berikut telah selesai diproses dan dicairkan:</p>
        <br>
        <h3>Detail:</h3>
        <ul>
          <li><strong>Nomor Pinjaman:</strong> ${loanNumber}</li>
          <li><strong>Pemohon:</strong> ${applicantName}</li>
          <li><strong>Jumlah:</strong> ${formattedAmount}</li>
        </ul>
        <br>
        <p>Terima kasih atas kontribusi Anda dalam proses ini.</p>
      `,
    });
  }

  /**
   * Send deposit approval request notification to approver
   */
  async sendDepositApprovalRequest(
    email: string,
    approverName: string,
    applicantName: string,
    depositNumber: string,
    depositAmount: number,
    roleName: string,
  ) {
    const dashboardUrl = `${this.configService.get('FRONTEND_URL', { infer: true })}/dashboard/deposits/approvals`;
    const formattedAmount = this.formatCurrency(depositAmount);

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM', { infer: true }),
      to: email,
      subject: 'Pengajuan Deposito Menunggu Persetujuan - Koperasi Kamorina Surya Niaga',
      html: `
        <h2>Halo ${approverName},</h2>
        <p>Ada pengajuan deposito baru yang menunggu persetujuan Anda.</p>
        <br>
        <h3>Detail Deposito:</h3>
        <ul>
          <li><strong>Nomor Deposito:</strong> ${depositNumber}</li>
          <li><strong>Pemohon:</strong> ${applicantName}</li>
          <li><strong>Jumlah Deposito:</strong> ${formattedAmount}</li>
        </ul>
        <br>
        <p>Sebagai <strong>${roleName.toUpperCase().replace('_', ' ')}</strong>, Anda diminta untuk meninjau dan menyetujui/menolak pengajuan ini.</p>
        <br>
        <a href="${dashboardUrl}" style="padding: 10px 20px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
          Lihat Pengajuan
        </a>
        <p>Atau akses dashboard di: ${dashboardUrl}</p>
        <br>
        <p>Terima kasih atas perhatian Anda.</p>
      `,
    });
  }

  /**
   * Send deposit rejected notification to applicant
   */
  async sendDepositRejected(
    email: string,
    applicantName: string,
    depositNumber: string,
    reason: string,
  ) {
    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM', { infer: true }),
      to: email,
      subject: 'Pengajuan Deposito Ditolak - Koperasi Kamorina Surya Niaga',
      html: `
        <h2>Halo ${applicantName},</h2>
        <p>Kami informasikan bahwa pengajuan deposito Anda dengan nomor <strong>${depositNumber}</strong> telah <strong>DITOLAK</strong>.</p>
        <br>
        <h3>Alasan Penolakan:</h3>
        <p style="background-color: #ffebee; padding: 15px; border-left: 4px solid #f44336;">
          ${reason}
        </p>
        <br>
        <p>Jika Anda memiliki pertanyaan, silakan hubungi Divisi Simpan Pinjam.</p>
        <br>
        <p>Terima kasih atas pengertian Anda.</p>
      `,
    });
  }

  /**
   * Send deposit approved notification to applicant
   */
  async sendDepositApproved(
    email: string,
    applicantName: string,
    depositNumber: string,
    depositAmount: number,
    tenorMonths: number,
  ) {
    const formattedAmount = this.formatCurrency(depositAmount);

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM', { infer: true }),
      to: email,
      subject: 'Pengajuan Deposito Disetujui - Koperasi Kamorina Surya Niaga',
      html: `
        <h2>Selamat ${applicantName},</h2>
        <p>Pengajuan deposito Anda dengan nomor <strong>${depositNumber}</strong> telah <strong>DISETUJUI</strong>.</p>
        <br>
        <h3>Detail Deposito:</h3>
        <ul>
          <li><strong>Jumlah:</strong> ${formattedAmount}</li>
          <li><strong>Jangka Waktu:</strong> ${tenorMonths} bulan</li>
        </ul>
        <br>
        <p style="background-color: #e3f2fd; padding: 15px; border-left: 4px solid #2196F3;">
          <strong>Catatan Penting:</strong><br>
          Deposito akan dipotong dari gaji bulanan Anda. Pastikan saldo gaji mencukupi.
        </p>
        <br>
        <p>Terima kasih telah menggunakan layanan koperasi.</p>
      `,
    });
  }

  /**
   * Send deposit notification to payroll
   */
  async sendDepositPayrollNotification(
    email: string,
    payrollName: string,
    applicantName: string,
    depositNumber: string,
    depositAmount: number,
  ) {
    const formattedAmount = this.formatCurrency(depositAmount);

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM', { infer: true }),
      to: email,
      subject: 'Deposito Baru Telah Disetujui - Koperasi Kamorina Surya Niaga',
      html: `
        <h2>Halo ${payrollName},</h2>
        <p>Ada deposito baru yang telah disetujui dan perlu diproses untuk pemotongan gaji.</p>
        <br>
        <h3>Detail:</h3>
        <ul>
          <li><strong>Nomor Deposito:</strong> ${depositNumber}</li>
          <li><strong>Karyawan:</strong> ${applicantName}</li>
          <li><strong>Jumlah per Bulan:</strong> ${formattedAmount}</li>
        </ul>
        <br>
        <p>Mohon untuk menambahkan pemotongan deposito ini ke dalam sistem payroll.</p>
        <br>
        <p>Terima kasih atas perhatian Anda.</p>
      `,
    });
  }

  // DEPOSIT CHANGE EMAIL METHODS

  /**
   * Send deposit change approval request to approvers
   */
  async sendDepositChangeApprovalRequest(
    email: string,
    approverName: string,
    applicantName: string,
    changeNumber: string,
    depositNumber: string,
    currentAmount: number,
    newAmount: number,
    roleName: string,
  ) {
    const dashboardUrl = `${this.configService.get('FRONTEND_URL', { infer: true })}/dashboard/deposit-changes/approvals`;
    const formattedCurrentAmount = this.formatCurrency(currentAmount);
    const formattedNewAmount = this.formatCurrency(newAmount);
    const roleLabel = roleName === 'divisi_simpan_pinjam'
      ? 'Divisi Simpan Pinjam'
      : 'Ketua Koperasi';

    const amountDifference = newAmount - currentAmount;
    const differenceLabel = amountDifference >= 0
      ? `+${this.formatCurrency(amountDifference)}`
      : this.formatCurrency(amountDifference);

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM', { infer: true }),
      to: email,
      subject: `[Perlu Review] Pengajuan Perubahan Deposito ${changeNumber} - Koperasi Kamorina`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1976d2;">Halo ${approverName},</h2>
          <p>Ada pengajuan perubahan deposito yang memerlukan persetujuan Anda.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Detail Pengajuan:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Nomor Perubahan:</td>
                <td style="padding: 8px 0; font-weight: bold;">${changeNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Nomor Deposito:</td>
                <td style="padding: 8px 0; font-weight: bold;">${depositNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Pemohon:</td>
                <td style="padding: 8px 0; font-weight: bold;">${applicantName}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #e65100;">Perubahan Deposito:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Jumlah Saat Ini:</td>
                <td style="padding: 8px 0; font-weight: bold;">${formattedCurrentAmount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Jumlah Baru:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #1976d2;">${formattedNewAmount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Selisih:</td>
                <td style="padding: 8px 0; font-weight: bold; color: ${amountDifference >= 0 ? '#4caf50' : '#f44336'};">
                  ${differenceLabel}
                </td>
              </tr>
            </table>
          </div>

          <p>Sebagai <strong>${roleLabel}</strong>, Anda diminta untuk meninjau dan menyetujui/menolak pengajuan ini.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" style="padding: 12px 30px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">
              Review Pengajuan
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">Atau akses dashboard di: <a href="${dashboardUrl}">${dashboardUrl}</a></p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            Email ini dikirim secara otomatis oleh sistem Koperasi Kamorina Surya Niaga. 
          </p>
        </div>
      `,
    });
  }

  /**
   * Send deposit change rejected notification to applicant
   */
  async sendDepositChangeRejected(
    email: string,
    applicantName: string,
    changeNumber: string,
    depositNumber: string,
    reason: string,
  ) {
    const dashboardUrl = `${this.configService.get('FRONTEND_URL', { infer: true })}/dashboard/deposit-changes/my-requests`;

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM', { infer: true }),
      to: email,
      subject: `Pengajuan Perubahan Deposito Ditolak - ${changeNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d32f2f;">Halo ${applicantName},</h2>
          <p>Kami informasikan bahwa pengajuan perubahan deposito Anda telah <strong style="color: #d32f2f;">DITOLAK</strong>.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Detail Pengajuan:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Nomor Perubahan:</td>
                <td style="padding: 8px 0; font-weight: bold;">${changeNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Nomor Deposito:</td>
                <td style="padding: 8px 0; font-weight: bold;">${depositNumber}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #ffebee; padding: 20px; border-radius: 8px; border-left: 4px solid #d32f2f; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #d32f2f;">Alasan Penolakan:</h4>
            <p style="margin-bottom: 0; color: #333;">${reason}</p>
          </div>

          <p>Jika Anda memiliki pertanyaan, silakan hubungi Divisi Simpan Pinjam.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" style="padding: 12px 30px; background-color: #757575; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">
              Lihat Riwayat Pengajuan
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            Email ini dikirim secara otomatis oleh sistem Koperasi Kamorina Surya Niaga.
          </p>
        </div>
      `,
    });
  }

  /**
   * Send deposit change approved notification to applicant
   */
  async sendDepositChangeApproved(
    email: string,
    applicantName: string,
    changeNumber: string,
    depositNumber: string,
    currentAmount: number,
    newAmount: number,
    currentTenor: number,
    newTenor: number,
    adminFee: number,
  ) {
    const dashboardUrl = `${this.configService.get('FRONTEND_URL', { infer: true })}/dashboard/deposits/my-deposits`;
    const formattedCurrentAmount = this.formatCurrency(currentAmount);
    const formattedNewAmount = this.formatCurrency(newAmount);
    const formattedAdminFee = this.formatCurrency(adminFee);

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM', { infer: true }),
      to: email,
      subject: `Perubahan Deposito Disetujui - ${changeNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4caf50;">Selamat ${applicantName},</h2>
          <p>Pengajuan perubahan deposito Anda telah <strong style="color: #4caf50;">DISETUJUI</strong> dan telah diterapkan.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Detail Pengajuan:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Nomor Perubahan:</td>
                <td style="padding: 8px 0; font-weight: bold;">${changeNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Nomor Deposito:</td>
                <td style="padding: 8px 0; font-weight: bold;">${depositNumber}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2e7d32;">Ringkasan Perubahan:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; width: 40%; color: #666;"></td>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Sebelum</td>
                <td style="padding: 8px 0; font-weight: bold; color: #2e7d32;">Sesudah</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Jumlah:</td>
                <td style="padding: 8px 0;">${formattedCurrentAmount}</td>
                <td style="padding: 8px 0; font-weight: bold; color: #2e7d32;">${formattedNewAmount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Tenor:</td>
                <td style="padding: 8px 0;">${currentTenor} bulan</td>
                <td style="padding: 8px 0; font-weight: bold; color: #2e7d32;">${newTenor} bulan</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #fff3e0; padding: 15px; border-radius: 8px; border-left: 4px solid #ff9800; margin: 20px 0;">
            <p style="margin: 0; color: #e65100;">
              <strong>Biaya Admin:</strong> ${formattedAdminFee}<br>
              <small>Biaya admin akan dipotong langsung dari tabungan/gaji Anda.</small>
            </p>
          </div>

          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3; margin: 20px 0;">
            <p style="margin: 0; color: #1565c0;">
              <strong>Catatan Penting:</strong><br>
              Perubahan deposito telah berlaku efektif. Pemotongan gaji akan disesuaikan mulai periode berikutnya.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" style="padding: 12px 30px; background-color: #4caf50; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">
              Lihat Deposito Saya
            </a>
          </div>
          
          <p>Terima kasih telah menggunakan layanan koperasi.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            Email ini dikirim secara otomatis oleh sistem Koperasi Kamorina Surya Niaga.
          </p>
        </div>
      `,
    });
  }

  /**
   * Send deposit change notification to payroll
   */
  async sendDepositChangePayrollNotification(
    email: string,
    payrollName: string,
    applicantName: string,
    changeNumber: string,
    depositNumber: string,
    currentAmount: number,
    newAmount: number,
    adminFee: number,
  ) {
    const dashboardUrl = `${this.configService.get('FRONTEND_URL', { infer: true })}/dashboard/payroll/deposit-changes`;
    const formattedCurrentAmount = this.formatCurrency(currentAmount);
    const formattedNewAmount = this.formatCurrency(newAmount);
    const formattedAdminFee = this.formatCurrency(adminFee);

    const amountDifference = newAmount - currentAmount;
    const differenceLabel = amountDifference >= 0
      ? `+${this.formatCurrency(amountDifference)}`
      : this.formatCurrency(amountDifference);

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM', { infer: true }),
      to: email,
      subject: `[Payroll] Perubahan Deposito Karyawan - ${changeNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1976d2;">Halo ${payrollName},</h2>
          <p>Ada perubahan deposito karyawan yang telah disetujui dan perlu diupdate di sistem payroll.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Detail Perubahan:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Nomor Perubahan:</td>
                <td style="padding: 8px 0; font-weight: bold;">${changeNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Nomor Deposito:</td>
                <td style="padding: 8px 0; font-weight: bold;">${depositNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Karyawan:</td>
                <td style="padding: 8px 0; font-weight: bold;">${applicantName}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #e65100;">Perubahan Pemotongan Gaji:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Pemotongan Lama:</td>
                <td style="padding: 8px 0; font-weight: bold;">${formattedCurrentAmount}/bulan</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Pemotongan Baru:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #1976d2;">${formattedNewAmount}/bulan</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Selisih:</td>
                <td style="padding: 8px 0; font-weight: bold; color: ${amountDifference >= 0 ? '#4caf50' : '#f44336'};">
                  ${differenceLabel}/bulan
                </td>
              </tr>
            </table>
          </div>

          <div style="background-color: #ffebee; padding: 15px; border-radius: 8px; border-left: 4px solid #d32f2f; margin: 20px 0;">
            <p style="margin: 0; color: #c62828;">
              <strong>Biaya Admin (potong sekali):</strong> ${formattedAdminFee}<br>
              <small>Biaya admin harus dipotong pada periode gaji berikutnya.</small>
            </p>
          </div>

          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #1565c0;">Yang Perlu Dilakukan:</h4>
            <ol style="margin-bottom: 0; padding-left: 20px; color: #333;">
              <li>Update pemotongan deposito bulanan di sistem payroll</li>
              <li>Potong biaya admin ${formattedAdminFee} pada gaji periode berikutnya</li>
              <li>Pastikan perubahan berlaku mulai periode gaji mendatang</li>
            </ol>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" style="padding: 12px 30px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">
              Lihat Detail di Dashboard
            </a>
          </div>
          
          <p>Terima kasih atas perhatian Anda.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            Email ini dikirim secara otomatis oleh sistem Koperasi Kamorina Surya Niaga.
          </p>
        </div>
      `,
    });
  }

  /**
   * Send deposit change notification to employee (when change is applied)
   */
  async sendDepositChangeNotificationToEmployee(
    email: string,
    employeeName: string,
    changeNumber: string,
    depositNumber: string,
    currentAmount: number,
    newAmount: number,
    currentTenor: number,
    newTenor: number,
    adminFee: number,
    effectiveDate: Date,
  ) {
    const dashboardUrl = `${this.configService.get('FRONTEND_URL', { infer: true })}/dashboard/deposits/my-deposits`;
    const formattedCurrentAmount = this.formatCurrency(currentAmount);
    const formattedNewAmount = this.formatCurrency(newAmount);
    const formattedAdminFee = this.formatCurrency(adminFee);
    const formattedDate = effectiveDate.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM', { infer: true }),
      to: email,
      subject: `Notifikasi Perubahan Deposito - ${depositNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1976d2;">Halo ${employeeName},</h2>
          <p>Berikut adalah konfirmasi perubahan deposito Anda yang telah disetujui dan diterapkan:</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Informasi Deposito:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Nomor Perubahan:</td>
                <td style="padding: 8px 0; font-weight: bold;">${changeNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Nomor Deposito:</td>
                <td style="padding: 8px 0; font-weight: bold;">${depositNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Tanggal Efektif:</td>
                <td style="padding: 8px 0; font-weight: bold;">${formattedDate}</td>
              </tr>
            </table>
          </div>

          <div style="display: flex; gap: 20px; margin: 20px 0;">
            <div style="flex: 1; background-color: #ffebee; padding: 15px; border-radius: 8px;">
              <h4 style="margin-top: 0; color: #c62828;">Sebelum</h4>
              <p style="margin: 5px 0;"><strong>Jumlah:</strong> ${formattedCurrentAmount}</p>
              <p style="margin: 5px 0;"><strong>Tenor:</strong> ${currentTenor} bulan</p>
            </div>
            <div style="flex: 1; background-color: #e8f5e9; padding: 15px; border-radius: 8px;">
              <h4 style="margin-top: 0; color: #2e7d32;">Sesudah</h4>
              <p style="margin: 5px 0;"><strong>Jumlah:</strong> ${formattedNewAmount}</p>
              <p style="margin: 5px 0;"><strong>Tenor:</strong> ${newTenor} bulan</p>
            </div>
          </div>

          <div style="background-color: #fff3e0; padding: 15px; border-radius: 8px; border-left: 4px solid #ff9800; margin: 20px 0;">
            <p style="margin: 0; color: #e65100;">
              <strong>Biaya Admin:</strong> ${formattedAdminFee}<br>
              <small>Biaya admin akan dipotong dari gaji Anda pada periode berikutnya.</small>
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" style="padding: 12px 30px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">
              Lihat Deposito Saya
            </a>
          </div>
          
          <p>Jika Anda memiliki pertanyaan, silakan hubungi Divisi Simpan Pinjam.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            Email ini dikirim secara otomatis oleh sistem Koperasi Kamorina Surya Niaga.
          </p>
        </div>
      `,
    });
  }

  /**
   * Send deposit change step notification (when moving to next approval step)
   */
  async sendDepositChangeStepNotification(
    email: string,
    applicantName: string,
    changeNumber: string,
    depositNumber: string,
    currentStep: string,
    approverName: string,
  ) {
    const dashboardUrl = `${this.configService.get('FRONTEND_URL', { infer: true })}/dashboard/deposit-changes/my-requests`;

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM', { infer: true }),
      to: email,
      subject: `Update Status Pengajuan Perubahan Deposito - ${changeNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1976d2;">Halo ${applicantName},</h2>
          <p>Pengajuan perubahan deposito Anda sedang diproses.</p>
          
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1565c0;">Status Terkini:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Nomor Perubahan:</td>
                <td style="padding: 8px 0; font-weight: bold;">${changeNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Nomor Deposito:</td>
                <td style="padding: 8px 0; font-weight: bold;">${depositNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Step Saat Ini:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #ff9800;">${currentStep}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Disetujui oleh:</td>
                <td style="padding: 8px 0; font-weight: bold;">${approverName}</td>
              </tr>
            </table>
          </div>

          <p>Pengajuan Anda telah disetujui pada tahap sebelumnya dan sedang menunggu persetujuan selanjutnya.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" style="padding: 12px 30px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">
              Lihat Status Pengajuan
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            Email ini dikirim secara otomatis oleh sistem Koperasi Kamorina Surya Niaga.
          </p>
        </div>
      `,
    });
  }

  /**
   * Send deposit withdrawal approval request
   */
  async sendDepositWithdrawalApprovalRequest(
    email: string,
    approverName: string,
    applicantName: string,
    withdrawalNumber: string,
    depositNumber: string,
    withdrawalAmount: number,
    roleName: string,
  ) {
    const dashboardUrl = `${this.configService.get('FRONTEND_URL', { infer: true })}/dashboard/deposit-withdrawals/approvals`;
    const formattedAmount = this.formatCurrency(withdrawalAmount);
    const roleLabel = roleName === 'divisi_simpan_pinjam'
      ? 'Divisi Simpan Pinjam'
      : 'Ketua Koperasi';

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM', { infer: true }),
      to: email,
      subject: `[Perlu Review] Pengajuan Penarikan Deposito ${withdrawalNumber} - Koperasi Kamorina`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1976d2;">Halo ${approverName},</h2>
          <p>Ada pengajuan penarikan deposito yang memerlukan persetujuan Anda.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Detail Pengajuan:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Nomor Penarikan:</td>
                <td style="padding: 8px 0; font-weight: bold;">${withdrawalNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Nomor Deposito:</td>
                <td style="padding: 8px 0; font-weight: bold;">${depositNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Pemohon:</td>
                <td style="padding: 8px 0; font-weight: bold;">${applicantName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Jumlah Penarikan:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #d32f2f;">${formattedAmount}</td>
              </tr>
            </table>
          </div>

          <p>Sebagai <strong>${roleLabel}</strong>, Anda diminta untuk meninjau dan menyetujui/menolak pengajuan ini.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" style="padding: 12px 30px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">
              Review Pengajuan
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">Atau akses dashboard di: <a href="${dashboardUrl}">${dashboardUrl}</a></p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            Email ini dikirim secara otomatis oleh sistem Koperasi Kamorina Surya Niaga.
          </p>
        </div>
      `,
    });
  }

  /**
   * Send deposit withdrawal rejected notification
   */
  async sendDepositWithdrawalRejected(
    email: string,
    applicantName: string,
    withdrawalNumber: string,
    depositNumber: string,
    reason: string,
  ) {
    const dashboardUrl = `${this.configService.get('FRONTEND_URL', { infer: true })}/dashboard/deposit-withdrawals/my-withdrawals`;

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM', { infer: true }),
      to: email,
      subject: `Pengajuan Penarikan Deposito Ditolak - ${withdrawalNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d32f2f;">Halo ${applicantName},</h2>
          <p>Kami informasikan bahwa pengajuan penarikan deposito Anda telah <strong style="color: #d32f2f;">DITOLAK</strong>.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Detail Pengajuan:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Nomor Penarikan:</td>
                <td style="padding: 8px 0; font-weight: bold;">${withdrawalNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Nomor Deposito:</td>
                <td style="padding: 8px 0; font-weight: bold;">${depositNumber}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #ffebee; padding: 20px; border-radius: 8px; border-left: 4px solid #d32f2f; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #d32f2f;">Alasan Penolakan:</h4>
            <p style="margin-bottom: 0; color: #333;">${reason}</p>
          </div>

          <p>Jika Anda memiliki pertanyaan, silakan hubungi Divisi Simpan Pinjam.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" style="padding: 12px 30px; background-color: #757575; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">
              Lihat Riwayat Penarikan
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            Email ini dikirim secara otomatis oleh sistem Koperasi Kamorina Surya Niaga.
          </p>
        </div>
      `,
    });
  }

  /**
   * Send disbursement request to shopkeeper
   */
  async sendDepositWithdrawalDisbursementRequest(
    email: string,
    shopkeeperName: string,
    applicantName: string,
    withdrawalNumber: string,
    netAmount: number,
    bankAccountNumber: string,
  ) {
    const dashboardUrl = `${this.configService.get('FRONTEND_URL', { infer: true })}/dashboard/deposit-withdrawals/disbursement`;
    const formattedAmount = this.formatCurrency(netAmount);

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM', { infer: true }),
      to: email,
      subject: `[Action Required] Penarikan Deposito Menunggu Pencairan - ${withdrawalNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4caf50;">Halo ${shopkeeperName},</h2>
          <p>Ada penarikan deposito yang sudah disetujui dan menunggu untuk dicairkan.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Detail Penarikan:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Nomor Penarikan:</td>
                <td style="padding: 8px 0; font-weight: bold;">${withdrawalNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Pemohon:</td>
                <td style="padding: 8px 0; font-weight: bold;">${applicantName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Jumlah Net:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #4caf50;">${formattedAmount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">No. Rekening:</td>
                <td style="padding: 8px 0; font-weight: bold;">${bankAccountNumber}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #fff3e0; padding: 15px; border-radius: 8px; border-left: 4px solid #ff9800; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #e65100;">Yang Perlu Dilakukan:</h4>
            <ol style="margin-bottom: 0; padding-left: 20px; color: #333;">
              <li>Proses transaksi BCA untuk transfer dana</li>
              <li>Konfirmasi pencairan di sistem setelah transaksi selesai</li>
            </ol>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" style="padding: 12px 30px; background-color: #4caf50; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">
              Proses Pencairan
            </a>
          </div>
          
          <p>Terima kasih atas perhatian Anda.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            Email ini dikirim secara otomatis oleh sistem Koperasi Kamorina Surya Niaga.
          </p>
        </div>
      `,
    });
  }

  /**
   * Send authorization request to ketua
   */
  async sendDepositWithdrawalAuthorizationRequest(
    email: string,
    ketuaName: string,
    applicantName: string,
    withdrawalNumber: string,
    netAmount: number,
  ) {
    const dashboardUrl = `${this.configService.get('FRONTEND_URL', { infer: true })}/dashboard/deposit-withdrawals/authorization`;
    const formattedAmount = this.formatCurrency(netAmount);

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM', { infer: true }),
      to: email,
      subject: `[Action Required] Penarikan Deposito Menunggu Otorisasi - ${withdrawalNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f44336;">Halo ${ketuaName},</h2>
          <p>Ada penarikan deposito yang sudah dicairkan oleh Shopkeeper dan menunggu otorisasi dari Anda.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Detail Penarikan:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Nomor Penarikan:</td>
                <td style="padding: 8px 0; font-weight: bold;">${withdrawalNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Pemohon:</td>
                <td style="padding: 8px 0; font-weight: bold;">${applicantName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Jumlah Net:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #f44336;">${formattedAmount}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #ffebee; padding: 15px; border-radius: 8px; border-left: 4px solid #f44336; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #c62828;">Otorisasi Diperlukan:</h4>
            <p style="margin-bottom: 0; color: #333;">
              Silakan lakukan otorisasi transaksi BCA dan konfirmasi di sistem untuk menyelesaikan proses penarikan.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" style="padding: 12px 30px; background-color: #f44336; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">
              Proses Otorisasi
            </a>
          </div>
          
          <p>Terima kasih.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            Email ini dikirim secara otomatis oleh sistem Koperasi Kamorina Surya Niaga.
          </p>
        </div>
      `,
    });
  }

  /**
   * Send withdrawal completed notification to user
   */
  async sendDepositWithdrawalCompleted(
    email: string,
    applicantName: string,
    withdrawalNumber: string,
    depositNumber: string,
    netAmount: number,
  ) {
    const dashboardUrl = `${this.configService.get('FRONTEND_URL', { infer: true })}/dashboard/deposit-withdrawals/my-withdrawals`;
    const formattedAmount = this.formatCurrency(netAmount);

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM', { infer: true }),
      to: email,
      subject: `Penarikan Deposito Berhasil Diselesaikan - ${withdrawalNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4caf50;">Selamat ${applicantName},</h2>
          <p>Pengajuan penarikan deposito Anda telah <strong style="color: #4caf50;">BERHASIL DISELESAIKAN</strong> dan dana telah ditransfer.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Detail Penarikan:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Nomor Penarikan:</td>
                <td style="padding: 8px 0; font-weight: bold;">${withdrawalNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Nomor Deposito:</td>
                <td style="padding: 8px 0; font-weight: bold;">${depositNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Jumlah Diterima:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #4caf50; font-size: 18px;">${formattedAmount}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #e8f5e9; padding: 15px; border-radius: 8px; border-left: 4px solid #4caf50; margin: 20px 0;">
            <p style="margin: 0; color: #2e7d32;">
              <strong>Status: SELESAI</strong><br>
              <small>Dana telah ditransfer ke rekening Anda. Silakan cek mutasi rekening Anda.</small>
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" style="padding: 12px 30px; background-color: #4caf50; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">
              Lihat Riwayat Penarikan
            </a>
          </div>
          
          <p>Terima kasih telah menggunakan layanan koperasi!</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            Email ini dikirim secara otomatis oleh sistem Koperasi Kamorina Surya Niaga.
          </p>
        </div>
      `,
    });
  }

  // SAVINGS WITHDRAWAL EMAIL METHODS

  /**
   * Send savings withdrawal approval request to approvers
   */
  async sendSavingsWithdrawalApprovalRequest(
    email: string,
    approverName: string,
    applicantName: string,
    withdrawalNumber: string,
    withdrawalAmount: number,
    roleName: string,
  ) {
    const dashboardUrl = `${this.configService.get('FRONTEND_URL', { infer: true })}/dashboard/savings-withdrawals/approvals`;
    const formattedAmount = this.formatCurrency(withdrawalAmount);
    const roleLabel = roleName === 'divisi_simpan_pinjam'
      ? 'Divisi Simpan Pinjam'
      : 'Ketua Koperasi';

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM', { infer: true }),
      to: email,
      subject: `[Perlu Review] Pengajuan Penarikan Tabungan ${withdrawalNumber} - Koperasi Kamorina`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1976d2;">Halo ${approverName},</h2>
          <p>Ada pengajuan penarikan tabungan yang memerlukan persetujuan Anda.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Detail Pengajuan:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Nomor Penarikan:</td>
                <td style="padding: 8px 0; font-weight: bold;">${withdrawalNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Pemohon:</td>
                <td style="padding: 8px 0; font-weight: bold;">${applicantName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Jumlah Penarikan:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #d32f2f;">${formattedAmount}</td>
              </tr>
            </table>
          </div>

          <p>Sebagai <strong>${roleLabel}</strong>, Anda diminta untuk meninjau dan menyetujui/menolak pengajuan ini.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" style="padding: 12px 30px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">
              Review Pengajuan
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">Atau akses dashboard di: <a href="${dashboardUrl}">${dashboardUrl}</a></p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            Email ini dikirim secara otomatis oleh sistem Koperasi Kamorina Surya Niaga.
          </p>
        </div>
      `,
    });
  }

  /**
   * Send savings withdrawal rejected notification to applicant
   */
  async sendSavingsWithdrawalRejected(
    email: string,
    applicantName: string,
    withdrawalNumber: string,
    reason: string,
  ) {
    const dashboardUrl = `${this.configService.get('FRONTEND_URL', { infer: true })}/dashboard/savings-withdrawals/my-withdrawals`;

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM', { infer: true }),
      to: email,
      subject: `Pengajuan Penarikan Tabungan Ditolak - ${withdrawalNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d32f2f;">Halo ${applicantName},</h2>
          <p>Kami informasikan bahwa pengajuan penarikan tabungan Anda telah <strong style="color: #d32f2f;">DITOLAK</strong>.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Detail Pengajuan:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Nomor Penarikan:</td>
                <td style="padding: 8px 0; font-weight: bold;">${withdrawalNumber}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #ffebee; padding: 20px; border-radius: 8px; border-left: 4px solid #d32f2f; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #d32f2f;">Alasan Penolakan:</h4>
            <p style="margin-bottom: 0; color: #333;">${reason}</p>
          </div>

          <p>Jika Anda memiliki pertanyaan, silakan hubungi Divisi Simpan Pinjam.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" style="padding: 12px 30px; background-color: #757575; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">
              Lihat Riwayat Penarikan
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            Email ini dikirim secara otomatis oleh sistem Koperasi Kamorina Surya Niaga.
          </p>
        </div>
      `,
    });
  }

  /**
   * Send savings withdrawal disbursement request to shopkeeper
   */
  async sendSavingsWithdrawalDisbursementRequest(
    email: string,
    shopkeeperName: string,
    applicantName: string,
    withdrawalNumber: string,
    netAmount: number,
    bankAccountNumber: string,
  ) {
    const dashboardUrl = `${this.configService.get('FRONTEND_URL', { infer: true })}/dashboard/savings-withdrawals/disbursement`;
    const formattedAmount = this.formatCurrency(netAmount);

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM', { infer: true }),
      to: email,
      subject: `[Action Required] Penarikan Tabungan Menunggu Pencairan - ${withdrawalNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4caf50;">Halo ${shopkeeperName},</h2>
          <p>Ada penarikan tabungan yang sudah disetujui dan menunggu untuk dicairkan.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Detail Penarikan:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Nomor Penarikan:</td>
                <td style="padding: 8px 0; font-weight: bold;">${withdrawalNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Pemohon:</td>
                <td style="padding: 8px 0; font-weight: bold;">${applicantName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Jumlah Net:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #4caf50;">${formattedAmount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">No. Rekening:</td>
                <td style="padding: 8px 0; font-weight: bold;">${bankAccountNumber}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #fff3e0; padding: 15px; border-radius: 8px; border-left: 4px solid #ff9800; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #e65100;">Yang Perlu Dilakukan:</h4>
            <ol style="margin-bottom: 0; padding-left: 20px; color: #333;">
              <li>Proses transaksi BCA untuk transfer dana</li>
              <li>Konfirmasi pencairan di sistem setelah transaksi selesai</li>
            </ol>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" style="padding: 12px 30px; background-color: #4caf50; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">
              Proses Pencairan
            </a>
          </div>
          
          <p>Terima kasih atas perhatian Anda.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            Email ini dikirim secara otomatis oleh sistem Koperasi Kamorina Surya Niaga.
          </p>
        </div>
      `,
    });
  }

  /**
   * Send savings withdrawal authorization request to ketua
   */
  async sendSavingsWithdrawalAuthorizationRequest(
    email: string,
    ketuaName: string,
    applicantName: string,
    withdrawalNumber: string,
    netAmount: number,
  ) {
    const dashboardUrl = `${this.configService.get('FRONTEND_URL', { infer: true })}/dashboard/savings-withdrawals/authorization`;
    const formattedAmount = this.formatCurrency(netAmount);

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM', { infer: true }),
      to: email,
      subject: `[Action Required] Penarikan Tabungan Menunggu Otorisasi - ${withdrawalNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f44336;">Halo ${ketuaName},</h2>
          <p>Ada penarikan tabungan yang sudah dicairkan oleh Shopkeeper dan menunggu otorisasi dari Anda.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Detail Penarikan:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Nomor Penarikan:</td>
                <td style="padding: 8px 0; font-weight: bold;">${withdrawalNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Pemohon:</td>
                <td style="padding: 8px 0; font-weight: bold;">${applicantName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Jumlah Net:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #f44336;">${formattedAmount}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #ffebee; padding: 15px; border-radius: 8px; border-left: 4px solid #f44336; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #c62828;">Otorisasi Diperlukan:</h4>
            <p style="margin-bottom: 0; color: #333;">
              Silakan lakukan otorisasi transaksi BCA dan konfirmasi di sistem untuk menyelesaikan proses penarikan.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" style="padding: 12px 30px; background-color: #f44336; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">
              Proses Otorisasi
            </a>
          </div>
          
          <p>Terima kasih.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            Email ini dikirim secara otomatis oleh sistem Koperasi Kamorina Surya Niaga.
          </p>
        </div>
      `,
    });
  }

  /**
   * Send savings withdrawal completed notification to user
   */
  async sendSavingsWithdrawalCompleted(
    email: string,
    applicantName: string,
    withdrawalNumber: string,
    netAmount: number,
  ) {
    const dashboardUrl = `${this.configService.get('FRONTEND_URL', { infer: true })}/dashboard/savings-withdrawals/my-withdrawals`;
    const formattedAmount = this.formatCurrency(netAmount);

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM', { infer: true }),
      to: email,
      subject: `Penarikan Tabungan Berhasil Diselesaikan - ${withdrawalNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4caf50;">Selamat ${applicantName},</h2>
          <p>Pengajuan penarikan tabungan Anda telah <strong style="color: #4caf50;">BERHASIL DISELESAIKAN</strong> dan dana telah ditransfer.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Detail Penarikan:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Nomor Penarikan:</td>
                <td style="padding: 8px 0; font-weight: bold;">${withdrawalNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Jumlah Diterima:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #4caf50; font-size: 18px;">${formattedAmount}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #e8f5e9; padding: 15px; border-radius: 8px; border-left: 4px solid #4caf50; margin: 20px 0;">
            <p style="margin: 0; color: #2e7d32;">
              <strong>Status: SELESAI</strong><br>
              <small>Dana telah ditransfer ke rekening Anda. Silakan cek mutasi rekening Anda.</small>
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" style="padding: 12px 30px; background-color: #4caf50; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">
              Lihat Riwayat Penarikan
            </a>
          </div>
          
          <p>Terima kasih telah menggunakan layanan koperasi!</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            Email ini dikirim secara otomatis oleh sistem Koperasi Kamorina Surya Niaga.
          </p>
        </div>
      `,
    });
  }

  /**
   * Send savings withdrawal approved notification to applicant
   */
  async sendSavingsWithdrawalApproved(
    email: string,
    applicantName: string,
    withdrawalNumber: string,
    netAmount: number,
    bankAccountNumber: string,
  ) {
    const dashboardUrl = `${this.configService.get('FRONTEND_URL', { infer: true })}/dashboard/savings-withdrawals/my-withdrawals`;
    const formattedAmount = this.formatCurrency(netAmount);

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM', { infer: true }),
      to: email,
      subject: `Pengajuan Penarikan Tabungan Disetujui - ${withdrawalNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4caf50;">Halo ${applicantName},</h2>
          <p>Pengajuan penarikan tabungan Anda telah <strong style="color: #4caf50;">DISETUJUI</strong>!</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Detail Penarikan:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Nomor Penarikan:</td>
                <td style="padding: 8px 0; font-weight: bold;">${withdrawalNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Jumlah Net:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #4caf50;">${formattedAmount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">No. Rekening Tujuan:</td>
                <td style="padding: 8px 0; font-weight: bold;">${bankAccountNumber}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3; margin: 20px 0;">
            <p style="margin: 0; color: #1565c0;">
              <strong>Informasi:</strong><br>
              Dana sedang dalam proses pencairan. Anda akan menerima notifikasi lagi setelah pencairan selesai.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" style="padding: 12px 30px; background-color: #4caf50; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">
              Lihat Status Penarikan
            </a>
          </div>
          
          <p>Terima kasih telah menggunakan layanan koperasi!</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            Email ini dikirim secara otomatis oleh sistem Koperasi Kamorina Surya Niaga.
          </p>
        </div>
      `,
    });
  }

  /**
   * Send generic email with custom subject and HTML content
   * Used by the queue system for flexible email sending
   */
  async sendGenericEmail(email: string, subject: string, html: string) {
    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM', { infer: true }),
      to: email,
      subject,
      html,
    });
  }
}