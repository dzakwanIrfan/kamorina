'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserGreeting } from '@/types/dashboard.types';
import { Sun, Moon, CloudSun } from 'lucide-react';

interface DashboardHeaderProps {
  greeting: UserGreeting;
  isApprover: boolean;
  approverRoles: string[];
}

/**
 * Get greeting based on current time
 */
function getTimeGreeting(): { text: string; icon: React.ReactNode } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return { text: 'Selamat Pagi', icon: <Sun className="h-5 w-5 text-amber-500" /> };
  }
  if (hour >= 12 && hour < 17) {
    return { text: 'Selamat Siang', icon: <CloudSun className="h-5 w-5 text-orange-500" /> };
  }
  if (hour >= 17 && hour < 19) {
    return { text: 'Selamat Sore', icon: <CloudSun className="h-5 w-5 text-orange-600" /> };
  }
  return { text: 'Selamat Malam', icon: <Moon className="h-5 w-5 text-indigo-500" /> };
}

/**
 * Get initials from name for avatar fallback
 */
function getInitials(name: string): string {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

/**
 * Format role name for display
 */
function formatRoleName(role: string): string {
  return role
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function DashboardHeader({
  greeting,
  isApprover,
  approverRoles,
}: DashboardHeaderProps) {
  const timeGreeting = getTimeGreeting();

  return (
    <Card className="border-primary/20 bg-linear-to-br from-primary/5 via-background to-primary/10">
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              {greeting.avatar ? (
                <AvatarImage
                  src={`${process.env.NEXT_PUBLIC_API_URL}${greeting.avatar}`}
                  alt={greeting.name}
                />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                {getInitials(greeting.name)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {timeGreeting.icon}
                <span className="text-muted-foreground">{timeGreeting.text},</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">{greeting.name}</h1>
              <p className="text-sm text-muted-foreground">
                {greeting.employeeNumber}
              </p>
            </div>
          </div>

          {isApprover && approverRoles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {approverRoles.map((role) => (
                <Badge
                  key={role}
                  variant="secondary"
                  className="bg-primary/10 text-primary"
                >
                  {formatRoleName(role)}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
