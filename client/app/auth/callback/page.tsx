"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../src/context/AuthContext';
import { LoadingState } from '../../../src/components/LoadingState';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { currentUser, needsOnboarding, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (currentUser) {
        const target = needsOnboarding ? '/onboarding' : '/home';
        router.replace(target);
      } else {
        router.replace('/login');
      }
    }
  }, [currentUser, needsOnboarding, isLoading, router]);

  return <LoadingState message="Signing you in..." className="bg-[#05000a] fixed inset-0 z-[999]" />;
}
