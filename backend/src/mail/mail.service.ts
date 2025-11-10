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

  async sendEmailVerification(email: string, name: string, token: string) {
    const verificationUrl = `${this.configService.get('FRONTEND_URL', { infer: true })}/auth/verify-email?token=${token}`;

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM', { infer: true }),
      to: email,
      subject: 'Verifikasi Email - Koperasi Kamorina Surya Niaga',
      html: `
        <h2>Halo ${name},</h2>
        <p>Terima kasih telah mendaftar di Koperasi Kamorina Surya Niaga.</p>
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
    const dashboardUrl = `${this.configService.get('FRONTEND_URL', { infer: true })}/dashboard/member-applications`;

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
      subject: 'Selamat! Keanggotaan Anda Disetujui - Koperasi Kamorina Surya Niaga',
      html: `
        <h2>Selamat ${memberName}! 🎉</h2>
        <p>Kami dengan senang hati menginformasikan bahwa pengajuan keanggotaan Anda di Koperasi Kamorina Surya Niaga telah <strong>DISETUJUI</strong>!</p>
        <br>
        <p>Sekarang Anda dapat mengakses seluruh fitur member koperasi, termasuk:</p>
        <ul>
          <li>✓ Simpanan Wajib & Sukarela</li>
          <li>✓ Pengajuan Pinjaman</li>
          <li>✓ Belanja di Toko Koperasi</li>
          <li>✓ Dan banyak lagi...</li>
        </ul>
        <br>
        <a href="${dashboardUrl}" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
          Akses Dashboard
        </a>
        <p>Atau kunjungi: ${dashboardUrl}</p>
        <br>
        <p>Selamat bergabung dengan keluarga besar Koperasi!</p>
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
    const formattedAmount = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(loanAmount);

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
    const formattedAmount = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(loanAmount);

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
    const formattedAmount = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(loanAmount);

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
    const formattedAmount = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(loanAmount);

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM', { infer: true }),
      to: email,
      subject: 'Pinjaman Anda Telah Dicairkan - Koperasi Kamorina Surya Niaga',
      html: `
        <h2>Selamat ${applicantName}! 🎉</h2>
        <p>Pinjaman Anda dengan nomor <strong>${loanNumber}</strong> telah <strong>DICAIRKAN</strong>!</p>
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
    const formattedAmount = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(loanAmount);

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
}