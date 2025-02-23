'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchWithAuth } from '../../lib/api';

const RevisionStats = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRevisions, setTotalRevisions] = useState(0);
  const [maxCount, setMaxCount] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetchWithAuth('/api/note/stats/revisions/');
        const data = await response.json();
        
        // Calculate total revisions and max count
        const total = data.reduce((sum, day) => sum + day.count, 0);
        const max = Math.max(...data.map(day => day.count));
        
        // Format dates for display
        const formattedData = data.map(item => ({
          ...item,
          date: new Date(item.date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
          })
        }));
        
        setStats(formattedData);
        setTotalRevisions(total);
        setMaxCount(max);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching revision stats:', error);
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="container py-4">
        <div className="card">
          <div className="card-body text-center">
            Loading stats...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="card">
        <div className="card-header">
          <h5 className="card-title mb-0">Revision Activity (Last 7 Days)</h5>
          <div className="text-muted small">
            Total Revisions: {totalRevisions}
          </div>
        </div>
        <div className="card-body">
          <div className="d-flex align-items-end" style={{ height: "300px", gap: "8px" }}>
            {stats.map((day) => (
              <div 
                key={day.date} 
                className="d-flex flex-column align-items-center" 
                style={{ flex: 1 }}
              >
                <div 
                  className="bg-primary rounded-top w-100" 
                  style={{ 
                    height: `${(day.count / maxCount) * 100}%`,
                    minHeight: day.count > 0 ? '10px' : '0px',
                    transition: 'height 0.3s ease'
                  }} 
                />
                <div className="text-center mt-2" style={{ fontSize: '0.8rem' }}>
                  <div>{day.date}</div>
                  <div className="font-weight-bold">{day.count}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Link href="/sessions" passHref legacyBehavior>
                Sessions
              </Link>

    </div>
  );
};

export default RevisionStats;