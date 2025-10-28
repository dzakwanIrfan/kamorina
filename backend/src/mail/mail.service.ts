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
    const verificationUrl = `${this.configService.get('FRONTEND_URL', { infer: true })}/verify-email?token=${token}`;

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM', { infer: true }),
      to: email,
      subject: 'Verifikasi Email - Koperasi',
      html: `
        <h2>Halo ${name},</h2>
        <p>Terima kasih telah mendaftar di Koperasi Simpan Pinjam.</p>
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
    const resetUrl = `${this.configService.get('FRONTEND_URL', { infer: true })}/reset-password?token=${token}`;

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM', { infer: true }),
      to: email,
      subject: 'Reset Password - Koperasi',
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
}