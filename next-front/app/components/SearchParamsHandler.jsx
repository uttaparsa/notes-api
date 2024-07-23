'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export function SearchParamsHandler({ onParamsChange }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.get('q');
    const listSlug = searchParams.get('list_slug') || 'All';
    if (query) {
      onParamsChange(query, listSlug);
    }
  }, [searchParams, onParamsChange]);

  return null; // This component doesn't render anything
}