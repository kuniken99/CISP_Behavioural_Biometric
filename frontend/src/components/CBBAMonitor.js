// frontend/src/components/CBBAMonitor.js
import React from 'react';

const CBBAMonitor = ({ status = "Active", riskScore = 12, isAuthenticated = false }) => {
  if (!isAuthenticated) {
    return null; // Don't show CBBA monitor if not authenticated
  }

  return (
    <div className="cbba-monitor-fixed" style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      width: '280px',
      backgroundColor: '#ffffff',
      border: '2px solid #007bff',
      borderRadius: '8px',
      padding: '15px',
      color: '#000000',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      zIndex: 1000,
      minHeight: '120px'
    }}>
      <div style={{
        marginBottom: '12px'
      }}>
        <h4 style={{
          fontSize: '1.2rem',
          fontWeight: '700',
          margin: '0 0 8px 0',
          color: '#007bff',
          textAlign: 'center'
        }}>
          CBBA Monitoring
        </h4>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.8rem'
        }}>
          <svg width="14" height="14" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
            <path 
              d="M8 2l1.09 3.26L12 5 9.91 6.74 11 10l-3-2.25L5 10l1.09-3.26L4 5l2.91.26L8 2z" 
              fill={status === 'Active' ? '#34C759' : '#FF3B30'}
            />
          </svg>
          <span style={{
            color: '#666666'
          }}>
            Status: {status}
          </span>
        </div>
      </div>
      
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <span style={{
            fontSize: '0.8rem',
            color: '#666666'
          }}>
            Risk Score:
          </span>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: riskScore <= 20 ? '#34C759' : riskScore <= 50 ? '#FF9500' : '#FF3B30'
            }}></div>
            <span style={{
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#000000'
            }}>
              {riskScore}%
            </span>
          </div>
        </div>
        
        <div style={{
          width: '100%',
          height: '6px',
          backgroundColor: '#f0f0f0',
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${Math.min(riskScore, 100)}%`,
            height: '100%',
            backgroundColor: riskScore <= 20 ? '#34C759' : riskScore <= 50 ? '#FF9500' : '#FF3B30',
            borderRadius: '3px',
            transition: 'width 0.3s ease'
          }}></div>
        </div>
      </div>
    </div>
  );
};

export default CBBAMonitor;