// frontend/src/components/CBBAMonitor.js
import React from 'react';
import ActivityLogsIcon from '../assets/activity-logs-icon.svg';
import ShieldIcon from '../assets/shield-icon.svg';

const CBBAMonitor = ({ status = "Active", riskScore = 12, isAuthenticated = false }) => {
  if (!isAuthenticated) {
    return null; // Don't show CBBA monitor if not authenticated
  }

  return (
    <div className="cbba-monitor" style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '15px',
      color: '#000000',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      minHeight: '120px'
    }}>
      <div style={{
        marginBottom: '12px'
      }}>
        <h4 style={{
          fontSize: '1.1rem',
          fontWeight: '600',
          margin: '0 0 12px 0',
          color: '#1F2937',
          textAlign: 'left'
        }}>
          CBBA Monitoring
        </h4>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          fontSize: '0.9rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img 
              src={ActivityLogsIcon} 
              alt="Activity Logs" 
              style={{ 
                width: '16px', 
                height: '16px', 
                flexShrink: 0 
              }} 
            />
            <span style={{
              color: '#374151',
              fontWeight: '500'
            }}>
              Status: {status}
            </span>
          </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#D1FAE5',
              padding: '4px 8px',
              borderRadius: '8px'
            }}>
              <img 
                src={ShieldIcon} 
                alt="Shield" 
                style={{ 
                  width: '20px', 
                  height: '20px', 
                  flexShrink: 0, 
                  filter: 'brightness(0) saturate(100%) invert(20%) sepia(77%) saturate(2985%) hue-rotate(133deg) brightness(96%) contrast(96%)'
                }} 
              />
              <span style={{
                fontSize: '1rem',
                fontWeight: '700',
                color: '#016630'
              }}>
                {riskScore}%
              </span>
          </div>
        </div>
      </div>
      
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px'

        }}>
          <span style={{
            fontSize: '0.85rem',
            color: '#016630',
            fontWeight: '600'
          }}>
            Risk Score: Low Risk
          </span>
        </div>
        
        <div style={{
          width: '100%',
          height: '8px',
          backgroundColor: '#E5E7EB',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: '12%',
            backgroundColor: riskScore <= 20 ? '#10B981' : riskScore <= 50 ? '#F59E0B' : '#EF4444',
            borderRadius: '4px',
            transition: 'width 0.3s ease'
          }}></div>
        </div>
      </div>
    </div>
  );
};

export default CBBAMonitor;