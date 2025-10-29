'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import '@/styles/nprogress.css';

// Configure NProgress
NProgress.configure({
  showSpinner: false, // Hide spinner, hanya bar
  trickleSpeed: 200,
  minimum: 0.08,
  easing: 'ease',
  speed: 500,
});

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.done();

    return () => {
      NProgress.start();
    };
  }, [pathname, searchParams]);

  return <>{children}</>;
}