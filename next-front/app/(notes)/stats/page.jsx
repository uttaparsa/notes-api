'use client'
import React from 'react';
import Link from 'next/link';
import StatsDisplay from '../../components/StatsDisplay';
import FileAccessStats from '../../components/FileAccessStats';

const StatsPage = () => {
  return (
    <div className="container py-4">
    
      <StatsDisplay 
        title="Revision Activity" 
        endpoint="stats/revisions/"
      />
      <StatsDisplay 
        title="Note Activity" 
        endpoint="stats/notes/"
      />
      <div className="mt-3">
        <Link href="/sessions" className="text-decoration-none">
          Sessions
        </Link>
      </div>
      <FileAccessStats />
    </div>
  );
};

export default StatsPage;