'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, ArrowLeft, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ErrorLayoutProps {
  statusCode: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  showBackButton?: boolean;
  showHomeButton?: boolean;
  showRefreshButton?: boolean;
  children?: React.ReactNode;
}

export function ErrorLayout({
  statusCode,
  title,
  description,
  icon,
  showBackButton = true,
  showHomeButton = true,
  showRefreshButton = false,
  children,
}: ErrorLayoutProps) {
  const router = useRouter();

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-background via-background to-muted/20">
      <div className="w-full max-w-2xl">
        <Card className="border-2 shadow-lg">
          <CardContent className="pt-12 pb-10 px-6 sm:px-10">
            {/* Icon & Status Code */}
            <div className="flex flex-col items-center text-center space-y-6">
              {/* Animated Icon */}
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                <div className="relative bg-primary/10 p-6 rounded-full border-2 border-primary/20">
                  {icon}
                </div>
              </div>

              {/* Status Code */}
              <div className="space-y-2">
                <h1 className="text-7xl sm:text-8xl font-bold bg-linear-to-br from-primary to-primary/60 bg-clip-text text-transparent">
                  {statusCode}
                </h1>
                <div className="h-1 w-20 mx-auto bg-linear-to-r from-primary/50 via-primary to-primary/50 rounded-full" />
              </div>

              {/* Title & Description */}
              <div className="space-y-3 max-w-md">
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                  {title}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>

              {/* Custom Content */}
              {children && (
                <div className="w-full max-w-md pt-4">
                  {children}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 w-full max-w-md">
                {showBackButton && (
                  <Button
                    onClick={handleBack}
                    variant="outline"
                    className="flex-1 gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Kembali
                  </Button>
                )}
                
                {showRefreshButton && (
                  <Button
                    onClick={handleRefresh}
                    variant="outline"
                    className="flex-1 gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Muat Ulang
                  </Button>
                )}

                {showHomeButton && (
                  <Button
                    asChild
                    className="flex-1 gap-2"
                  >
                    <Link href="/">
                      <Home className="h-4 w-4" />
                      Ke Beranda
                    </Link>
                  </Button>
                )}
              </div>

              {/* Help Text */}
              <p className="text-sm text-muted-foreground pt-4">
                Butuh bantuan?{' '}
                <Link 
                  href="/contact" 
                  className="text-primary hover:underline font-medium"
                >
                  Hubungi Support
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Error Code: {statusCode} • Koperasi Surya Niaga Kamorina
          </p>
        </div>
      </div>
    </div>
  );
}