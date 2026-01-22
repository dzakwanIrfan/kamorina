import { SeederContext } from './helpers/seeder-context';
import * as crypto from 'crypto';

export async function seedEmails({ prisma }: SeederContext): Promise<void> {
  const host = process.env.MAIL_HOST;
  const port = parseInt(process.env.MAIL_PORT || '587', 10);
  const user = process.env.MAIL_USER;
  const password = process.env.MAIL_PASSWORD;
  const from = process.env.MAIL_FROM || `No Reply <${user}>`;
  const encryptionKey = process.env.ENCRYPTION_KEY;

  if (!host || !user || !password || !encryptionKey) {
    console.warn(
      '    ⚠️ Missing MAIL_ or ENCRYPTION_KEY env vars. Skipping Email seed.',
    );
    return;
  }

  // Encrypt password (AES-256-CBC)
  const key = crypto.scryptSync(encryptionKey, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encryptedPassword = cipher.update(password, 'utf8', 'hex');
  encryptedPassword += cipher.final('hex');
  const storedPassword = `${iv.toString('hex')}:${encryptedPassword}`;

  await prisma.email.upsert({
    where: { username: user },
    update: {
      host,
      port,
      password: storedPassword,
      fromName: from,
      isActive: true,
    },
    create: {
      host,
      port,
      username: user,
      password: storedPassword,
      fromName: from,
      isActive: true,
      label: 'Primary System Email',
    },
  });

  console.log(`✅ Seeded email: ${user}`);
}
