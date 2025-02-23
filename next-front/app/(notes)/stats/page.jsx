'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchWithAuth } from '../../lib/api';

const Card = ({ children, className = '' }) => (
  <div className={`card ${className}`}>
    {children}
  </div>
);

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
        <Card>
          <div className="card-body text-center">
            Loading stats...
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <Card>
        <div className="card-header">
          <h5 className="card-title mb-1">Revision Activity (Last 7 Days)</h5>
          <div className="text-muted small">
            Total Revisions: {totalRevisions}
          </div>
        </div>
        <div className="card-body">
          <div style={{ height: '300px' }}>
            <div className="h-100 d-flex justify-content-between">
              {stats.map((day) => {
                const heightPercentage = (day.count / maxCount) * 100;
                return (
                  <div
                    key={day.date}
                    className="d-flex flex-column justify-content-end align-items-center"
                    style={{ width: `${100 / stats.length}%`, padding: '0 4px' }}
                  >
                    <div 
                      style={{ 
                        height: `${heightPercentage}%`,
                        width: '100%',
                        backgroundColor: 'var(--bs-primary)',
                        transition: 'height 0.3s ease',
                        borderRadius: '4px 4px 0 0',
                        minHeight: day.count > 0 ? '4px' : '0'
                      }} 
                    />
                    <div className="text-center mt-2">
                      <div className="small text-muted">{day.date}</div>
                      <div className="fw-bold small">{day.count}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
      <div className="mt-3">
        <Link href="/sessions" className="text-decoration-none">
          Sessions
        </Link>
      </div>
    </div>
  );
};

export default RevisionStats;