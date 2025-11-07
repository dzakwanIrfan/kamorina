'use client';

import { AdminApplicationDetail } from '@/components/member-application/admin-application-detail';
import { useParams } from 'next/navigation';

export default function ApplicationDetailPage() {
  const params = useParams();
  const applicationId = params.id as string;

  return (
    <div className="container mx-auto py-6">
      <AdminApplicationDetail applicationId={applicationId} />
    </div>
  );
}