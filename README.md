# Kamorina — Sistem Manajemen Koperasi

Kamorina adalah aplikasi manajemen koperasi simpan pinjam untuk **Surya Niaga Kamorina**. Aplikasi ini menyediakan modul lengkap untuk pengelolaan anggota, simpanan, pinjaman, deposito, payroll, hingga pelaporan keuangan dalam satu platform terintegrasi.

Repository ini menggunakan arsitektur monorepo dengan dua aplikasi utama: backend (NestJS + Prisma) dan frontend (Next.js), seluruhnya di-containerize menggunakan Docker Compose.

---

## Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Tech Stack](#tech-stack)
- [Arsitektur](#arsitektur)
- [Struktur Repository](#struktur-repository)
- [Persyaratan Sistem](#persyaratan-sistem)
- [Instalasi & Setup](#instalasi--setup)
- [Konfigurasi Environment](#konfigurasi-environment)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [Database & Prisma](#database--prisma)
- [Perintah Makefile](#perintah-makefile)
- [Deployment Production](#deployment-production)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## Fitur Utama

Kamorina menyediakan modul-modul berikut:

- **Manajemen Anggota** — registrasi, member application, profil anggota, dan riwayat keanggotaan
- **Simpanan (Savings)** — buku tabungan, setoran, penarikan, dan transaksi simpanan
- **Pinjaman (Loan)** — pengajuan pinjaman, revisi, excess loan, repayment, dan loan balance report
- **Deposito** — pengelolaan deposito dengan suku bunga dinamis
- **Payroll** — penggajian karyawan, golongan, level, dan departemen
- **Salary Deduction Report** — laporan potongan gaji terintegrasi dengan modul pinjaman
- **Social Fund (Santunan)** — pengelolaan dana sosial dan santunan anggota
- **Email & Notifikasi** — sistem email berbasis template (Handlebars) dengan queue (BullMQ + Redis)
- **Authentication** — JWT-based auth dengan refresh token dan role-based access control
- **Dashboard & Reporting** — visualisasi data dan ekspor laporan ke Excel/CSV

---

## Tech Stack

### Backend

- **Framework:** [NestJS 11](https://nestjs.com/) (Node.js 20)
- **ORM:** [Prisma 7](https://www.prisma.io/) dengan PostgreSQL
- **Database:** PostgreSQL 16 (Alpine)
- **Cache & Queue:** Redis 7 + BullMQ
- **Auth:** Passport JWT + bcrypt
- **Mailer:** Nodemailer + Handlebars templates
- **Validation:** class-validator, Joi, Zod
- **API Docs:** Swagger / OpenAPI
- **File Processing:** ExcelJS, PapaParse, Multer, Archiver
- **Package Manager:** pnpm 9.12.3

### Frontend

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, React 19)
- **Styling:** Tailwind CSS 4 + tailwindcss-animate
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives)
- **Data Fetching:** TanStack Query 5 + Axios
- **Forms:** React Hook Form + Zod resolvers
- **Tables:** TanStack Table 8
- **State:** Zustand
- **Charts:** Recharts
- **Icons:** lucide-react, react-icons
- **Auth:** jwt-decode (token client-side)

### Infrastructure

- **Containerization:** Docker + Docker Compose (multi-stage builds)
- **Reverse Proxy:** *(silakan tambahkan jika menggunakan Nginx/Caddy/Traefik)*
- **CI/CD:** *(silakan tambahkan sesuai pipeline yang dipakai)*

---

## Arsitektur

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP
                           ▼
┌─────────────────────────────────────────────────────────────┐
│             Frontend — Next.js 16 (port 3000)                │
│  • App Router • TanStack Query • Tailwind • shadcn/ui        │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST /api/v1
                           ▼
┌─────────────────────────────────────────────────────────────┐
│             Backend — NestJS 11 (port 3001)                  │
│  • Auth (JWT) • Modules • Validation • Swagger               │
└────────┬─────────────────────┬────────────────┬──────────────┘
         │                     │                │
         ▼                     ▼                ▼
┌──────────────────┐   ┌──────────────┐   ┌─────────────────┐
│  PostgreSQL 16   │   │    Redis 7   │   │   File Storage  │
│  (port 5432)     │   │  (port 6379) │   │  /app/uploads   │
│                  │   │  Cache+Queue │   │  (volume)       │
└──────────────────┘   └──────────────┘   └─────────────────┘
```

Semua service berjalan dalam network Docker `kamorina-network` (bridge) sehingga isolated dari host network kecuali port yang di-publish secara eksplisit.

---

## Struktur Repository

```
kamorina/
├── backend/                    # NestJS API
│   ├── src/
│   │   ├── auth/              # Authentication & JWT
│   │   ├── users/             # User management
│   │   ├── employees/         # Employee management
│   │   ├── departments/       # Department master data
│   │   ├── golongan/          # Golongan (rank) master
│   │   ├── levels/            # Level master
│   │   ├── member-application/# Pendaftaran anggota
│   │   ├── savings/           # Modul simpanan
│   │   ├── buku-tabungan/     # Buku tabungan
│   │   ├── loan/              # Modul pinjaman
│   │   ├── loan-repayment/    # Pembayaran cicilan
│   │   ├── loan-balance-report/
│   │   ├── deposit/           # Deposito
│   │   ├── payroll/           # Penggajian
│   │   ├── salary-deduction-report/
│   │   ├── social-fund/       # Dana sosial
│   │   ├── dashboard/         # Endpoint dashboard
│   │   ├── mail/              # Mailer service
│   │   ├── email-config/
│   │   ├── email-logs/
│   │   ├── upload/            # File upload
│   │   ├── settings/          # App settings
│   │   ├── profile/
│   │   ├── prisma/            # PrismaService
│   │   ├── common/            # Decorators, guards, filters, interceptors
│   │   ├── config/            # Konfigurasi env & module
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   ├── seed.ts
│   │   └── seeds/
│   ├── uploads/               # Volume — file upload
│   ├── Dockerfile             # Multi-stage (base → deps → dev/builder/prod)
│   └── package.json
│
├── frontend/                   # Next.js App
│   ├── src/
│   │   └── app/               # App Router pages
│   ├── public/
│   ├── Dockerfile             # Multi-stage (base → deps → dev/builder/prod)
│   ├── next.config.ts
│   └── package.json
│
├── docker-compose.yml          # Development stack
├── docker-compose.prod.yml     # Production stack
├── Makefile                    # Shortcut commands
├── .env                        # Environment variables (jangan commit!)
└── README.md
```

---

## Persyaratan Sistem

Pastikan tools berikut terinstall di mesin development Anda:

| Tool | Versi Minimum | Catatan |
|------|---------------|---------|
| **Docker** | 24.x | Wajib |
| **Docker Compose** | v2.20+ | Sudah include di Docker Desktop |
| **GNU Make** | 3.81+ | Optional, tapi sangat direkomendasikan |
| **Git** | 2.30+ | |

> **Tidak perlu install Node.js, pnpm, PostgreSQL, atau Redis di host** — semuanya berjalan di dalam container.

Alokasi resource Docker yang direkomendasikan:
- **CPU:** minimal 2 cores
- **RAM:** minimal 4 GB (8 GB direkomendasikan)
- **Disk:** minimal 10 GB free space

---

## Instalasi & Setup

### 1. Clone Repository

```bash
git clone <repository-url> kamorina
cd kamorina
```

### 2. Setup Environment Variables

Buat file `.env` di root repository (sejajar dengan `docker-compose.yml`):

```bash
cp .env.example .env   # jika tersedia
# atau buat manual sesuai contoh di bagian "Konfigurasi Environment"
```

Edit `.env` dan sesuaikan dengan kebutuhan lokal Anda.

### 3. Build & Start Stack Development

```bash
make dev-build
```

Perintah ini akan:
1. Build image Docker untuk backend dan frontend (multi-stage, target `dev`)
2. Start PostgreSQL, Redis, backend, dan frontend
3. Mount source code sebagai volume sehingga **hot-reload aktif**

### 4. Jalankan Migrasi Database

Setelah container `backend` siap (tunggu beberapa detik), jalankan migrasi:

```bash
make prisma-migrate
```

Lalu (opsional) seed data awal:

```bash
make prisma-seed
```

### 5. Akses Aplikasi

| Service | URL |
|---------|-----|
| Frontend (Next.js) | http://localhost:3000 |
| Backend API | http://localhost:3001/api/v1 |
| Swagger Docs | http://localhost:3001/api/docs *(jika diaktifkan)* |
| Prisma Studio | http://localhost:5555 — jalankan `make prisma-studio` |
| PostgreSQL | `localhost:5432` |
| Redis | `localhost:6379` |

---

## Konfigurasi Environment

Berikut variable yang dibutuhkan oleh stack. Buat file `.env` di root repository:

```env
# ─── Database ─────────────────────────────────────────────
POSTGRES_USER=kamorina
POSTGRES_PASSWORD=kamorina_secret
POSTGRES_DB=kamorina_db

# ─── JWT / Auth ───────────────────────────────────────────
JWT_SECRET=ganti-dengan-string-acak-minimal-32-karakter
JWT_EXPIRATION=7d

# ─── Mailer (SMTP) ────────────────────────────────────────
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=Surya Niaga Kamorina <no-reply@kamorina.com>

# ─── URL ──────────────────────────────────────────────────
FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:3001/api/v1
BASE_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# ─── Redis ────────────────────────────────────────────────
REDIS_PASSWORD=

# ─── Encryption ───────────────────────────────────────────
# Wajib 32 karakter (AES-256)
ENCRYPTION_KEY=01234567890123456789012345678901
```

> **PENTING — keamanan:**
> - Jangan pernah commit file `.env` ke git. Pastikan ada di `.gitignore`.
> - Untuk production, generate `JWT_SECRET` dan `ENCRYPTION_KEY` dengan tool seperti `openssl rand -hex 32`.
> - Gunakan password yang kuat untuk `POSTGRES_PASSWORD` dan `REDIS_PASSWORD` di production.

---

## Menjalankan Aplikasi

### Mode Development (default)

```bash
# Start semua service (background)
make dev

# Start dengan rebuild image
make dev-build

# Start dengan attached logs (foreground)
make dev-build-attached

# Hanya start infrastructure (Postgres + Redis)
make infra
```

Hot-reload aktif untuk:
- **Backend** — perubahan di `backend/src/**` langsung di-reload via `nest start --watch`
- **Frontend** — perubahan di `frontend/src/**` langsung di-reload via `next dev` (`WATCHPACK_POLLING=true` aktif untuk konsistensi di Docker)

### Melihat Logs

```bash
make logs              # semua service
make logs-backend      # hanya backend
make logs-frontend     # hanya frontend
make logs-db           # hanya database
```

### Restart Service

```bash
make restart-backend
make restart-frontend
```

### Stop Stack

```bash
make down              # stop dev
make down-prod         # stop prod
```

### Akses Shell di Container

```bash
make shell-backend     # sh di container backend
make shell-frontend    # sh di container frontend
make shell-db          # psql ke database
make shell-redis       # redis-cli
```

---

## Database & Prisma

### Migrasi

```bash
# Buat migrasi baru (development)
make prisma-migrate

# Deploy migrasi ke production
make prisma-deploy

# Reset database (DESTRUCTIVE — hapus semua data)
make prisma-reset

# Generate Prisma Client
make prisma-generate
```

### Seed Data

```bash
make prisma-seed
```

Script seed berada di [backend/prisma/seed.ts](backend/prisma/seed.ts) dan folder [backend/prisma/seeds/](backend/prisma/seeds/).

### Prisma Studio

GUI untuk eksplorasi database tersedia di `http://localhost:5555`:

```bash
make prisma-studio
```

Service `prisma-studio` adalah container terpisah yang hanya di-start sesuai kebutuhan (lihat [docker-compose.yml](docker-compose.yml)).

### Membuat Migrasi Manual

Saat Anda mengubah `schema.prisma`, jalankan dari host:

```bash
docker compose exec backend pnpm prisma migrate dev --name nama_migrasi_anda
```

---

## Perintah Makefile

Daftar lengkap perintah dapat dilihat dengan:

```bash
make help
```

Ringkasan:

| Kategori | Perintah | Deskripsi |
|----------|----------|-----------|
| **Dev** | `make dev` | Start dev environment |
| | `make dev-build` | Rebuild + start dev |
| | `make infra` | Hanya Postgres + Redis |
| **Prod** | `make prod` | Start production |
| | `make prod-build` | Rebuild + start production |
| **Control** | `make down` | Stop dev containers |
| | `make down-prod` | Stop prod containers |
| | `make restart-backend` | Restart backend |
| | `make restart-frontend` | Restart frontend |
| **Logs** | `make logs` | Tail semua logs |
| | `make logs-backend` | Tail backend |
| | `make logs-frontend` | Tail frontend |
| | `make logs-db` | Tail database |
| **Prisma** | `make prisma-migrate` | Run dev migrations |
| | `make prisma-deploy` | Deploy migrations (prod) |
| | `make prisma-seed` | Seed database |
| | `make prisma-reset` | Reset DB (destructive) |
| | `make prisma-generate` | Generate Prisma Client |
| | `make prisma-studio` | Open Prisma Studio |
| **Shell** | `make shell-backend` | Shell backend |
| | `make shell-frontend` | Shell frontend |
| | `make shell-db` | Shell PostgreSQL |
| | `make shell-redis` | Shell Redis |
| **Cleanup** | `make clean` | Remove containers + volumes |
| | `make clean-all` | Remove EVERYTHING |
| **Status** | `make ps` | Show running containers |

---

## Deployment Production

Stack production didefinisikan di [docker-compose.prod.yml](docker-compose.prod.yml) dengan perbedaan utama:

- **Tidak ada port database/redis yang di-expose ke host** (hanya internal network)
- **Image dibuild dengan target `prod`** — Next.js menggunakan output `standalone`, NestJS menggunakan compiled `dist/`
- **Resource limits** — backend 512 MB, frontend 256 MB
- **Restart policy** — `always`
- **Environment** — `NODE_ENV=production`, mailer & secrets dari env tanpa default
- **Volumes** — `uploads_data` untuk file persistence

### Langkah Deployment

1. **Siapkan file `.env` production** di server (gunakan secrets manager untuk best practice)

2. **Build & start production stack:**

   ```bash
   make prod-build
   ```

3. **Deploy migrasi database:**

   ```bash
   make prisma-deploy
   ```

4. **Cek status:**

   ```bash
   make ps-prod
   ```

5. **Setup reverse proxy** (Nginx / Caddy / Traefik) untuk:
   - SSL/TLS termination (HTTPS)
   - Routing `kamorina.com` → frontend (`:3000`)
   - Routing `api.kamorina.com` → backend (`:3001`)
   - Rate limiting & security headers

### Update Production

```bash
git pull origin main
make prod-build
make prisma-deploy
```

> **Tip:** untuk zero-downtime deployment, pertimbangkan menggunakan blue-green deployment atau orchestrator seperti Docker Swarm / Kubernetes.

---

## Troubleshooting

### Backend tidak bisa connect ke database

```bash
# Cek status container
make ps

# Lihat logs database
make logs-db

# Pastikan migrasi sudah dijalankan
make prisma-migrate
```

### Hot-reload tidak jalan di Windows / WSL

Pastikan `WATCHPACK_POLLING=true` (sudah di-set di [frontend/Dockerfile](frontend/Dockerfile)). Untuk backend, NestJS watch mode bekerja melalui chokidar yang biasanya OK di volume mount.

### Port sudah dipakai aplikasi lain

Edit `docker-compose.yml` dan ganti port mapping, contoh:

```yaml
ports:
  - "3100:3000"   # host:container
```

### Prisma Client tidak ter-generate

```bash
make prisma-generate
make restart-backend
```

### Reset total (mulai dari nol)

```bash
make clean        # WARNING: hapus semua volume/data
make dev-build
make prisma-migrate
make prisma-seed
```

### Container backend exit dengan error `prisma generate`

Pastikan folder [backend/prisma/](backend/prisma/) ter-mount dengan benar dan `DATABASE_URL` valid. Cek logs dengan `make logs-backend`.

---

## Best Practices

### Docker Compose

- **Multi-stage builds** — Dockerfile sudah dibagi menjadi `base → deps → dev/builder/prod` untuk caching layer optimal dan image production yang ramping.
- **Named volumes untuk node_modules** — `backend_node_modules` dan `frontend_node_modules` mencegah file OS host (mac/Windows) menimpa binary native dari image Linux.
- **Healthcheck** — PostgreSQL dan Redis menggunakan healthcheck supaya backend menunggu DB benar-benar siap (`depends_on.condition: service_healthy`).
- **Network isolation** — semua service di `kamorina-network` (bridge), tidak menggunakan `network_mode: host`.
- **Non-root user di production** — backend & frontend production berjalan sebagai user `nestjs` / `nextjs` (UID 1001).
- **Resource limits** — production stack membatasi memory per container.

### NestJS

- **Module per domain** — setiap fitur (loan, savings, deposit) adalah module mandiri dengan controller, service, dan DTO sendiri.
- **DTO + class-validator** — semua input divalidasi via `ValidationPipe` global.
- **Prisma sebagai single source of truth** — schema di `schema.prisma`, migrasi terversi.
- **Queue untuk task berat** — email dan job long-running diproses BullMQ via Redis.
- **Environment via @nestjs/config + Joi** — validasi env saat startup.
- **JWT + refresh token** — short-lived access token, long-lived refresh token disimpan di DB.

### Next.js

- **App Router** — gunakan server components secara default, gunakan `"use client"` hanya jika perlu interaktivitas.
- **TanStack Query** — semua data fetching client-side melalui Query untuk caching, refetch, dan optimistic update.
- **shadcn/ui + Tailwind 4** — komponen yang konsisten, accessible, dan bisa dikustomisasi langsung di codebase.
- **React Hook Form + Zod** — single source of truth untuk schema form & validasi.
- **Output `standalone`** — production image hanya berisi file yang diperlukan, jauh lebih kecil dari `node_modules` penuh.

### PostgreSQL

- **Pakai migration, jangan `db push`** — semua perubahan schema harus melalui migrasi yang ter-commit.
- **Backup rutin di production** — gunakan `pg_dump` terjadwal atau tool seperti `wal-g`.
- **Index sesuai query pattern** — review slow query secara berkala dengan `EXPLAIN ANALYZE`.
- **Connection pooling** — pertimbangkan PgBouncer di production jika traffic tinggi.

### Keamanan

- Jangan commit `.env`, secrets, atau credentials ke git
- Rotasi `JWT_SECRET` dan `ENCRYPTION_KEY` secara berkala
- Aktifkan HTTPS di production via reverse proxy
- Update dependency rutin (`pnpm update`, `pnpm audit`)
- Batasi akses database dan redis ke network internal saja (sudah default di prod compose)

---

## Lisensi

Proprietary — Surya Niaga Kamorina. All rights reserved.

---

## Kontak

Untuk pertanyaan teknis atau bug report, silakan buka issue di repository ini.
