import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Building2, ArrowRight } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-liniear-to-br from-primary/5 via-background to-primary/10">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="flex flex-col items-center justify-center text-center space-y-8">
          {/* Logo */}
          <div className="flex items-center justify-center">
            <Image src="assets/logo.svg" alt="Kamorina Logo" width={80} height={80} />
          </div>

          {/* Hero Text */}
          <div className="space-y-4 max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Selamat Datang di{' '}
              <div className="text-primary">Surya Niaga Kamorina</div>
            </h1>
            <p className="text-xl text-muted-foreground">
              Sistem Informasi Koperasi Surya Niaga Kamorina
            </p>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Platform modern untuk mengelola koperasi dengan mudah dan efisien. 
              Kelola anggota, produk, dan transaksi dalam satu sistem terintegrasi.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" asChild>
              <Link href="/auth/login">
                Masuk
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/register">
                Daftar Sekarang
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}