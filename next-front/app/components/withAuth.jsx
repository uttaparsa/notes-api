// app/components/withAuth.js
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function withAuth(Component) {
  return function AuthenticatedComponent(props) {
    const router = useRouter();

    useEffect(() => {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        router.push('/login');
      }
    }, [router]);

    return <Component {...props} />;
  };
}