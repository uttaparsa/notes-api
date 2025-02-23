'use client'
import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../lib/api';
import { formatDateShort } from "../utils/dateFormatters";

const StatsDisplay = ({ title, endpoint }) => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [maxCount, setMaxCount] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetchWithAuth(`/api/note/${endpoint}`);
        const data = await response.json();

        console.log("data is "+JSON.stringify(data));
        
        
        // Calculate totals
        const total = data.reduce((sum, day) => sum + day.count, 0);
        const max = Math.max(...data.map(day => day.count));
        
        // Format dates
        const formattedData = data.map(item => ({
          ...item,
          date: formatDateShort(item.date)
        }));

        setStats(formattedData);
        setTotalCount(total);
        setMaxCount(max);
        setLoading(false);
      } catch (error) {
        console.error(`Error fetching ${title} stats:`, error);
        setLoading(false);
      }
    };

    fetchStats();
  }, [endpoint]);

  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center">
          Loading stats...
        </div>
      </div>
    );
  }

  return (
    <div className="card mb-4">
      <div className="card-header">
        <h5 className="card-title mb-1">{title} (Last 7 Days)</h5>
        <div className="text-muted small">
          Total {title}: {totalCount}
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
    </div>
  );
};

export default StatsDisplay;