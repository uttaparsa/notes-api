'use client';

import dynamic from 'next/dynamic';

// Import the client-side wrapper component with ssr disabled
const ClientSideSearchWrapper = dynamic(() => import('../../components/ClientSideSearchWrapper'), { ssr: false });

export default function SearchPage() {
  return <ClientSideSearchWrapper />;
}