// frontend/src/components/CBBAMonitor.js
import React, { useEffect, useState } from 'react';
import ActivityLogsIcon from '../assets/activity-logs-icon.svg';
import ShieldIcon from '../assets/shield-icon.svg';

const CBBAMonitor = React.memo(({ riskScore: propRiskScore, riskLevel: propRiskLevel, status: propStatus, isAuthenticated = false }) => {
  const [riskScore, setRiskScore] = useState(propRiskScore || 0);
  const [riskLevel, setRiskLevel] = useState(propRiskLevel || 'low');
  const [status, setStatus] = useState(propStatus || 'Active');

  // Update when props change
  useEffect(() => {
    if (propRiskScore !== undefined) setRiskScore(propRiskScore);
    if (propRiskLevel !== undefined) setRiskLevel(propRiskLevel);
    if (propStatus !== undefined) setStatus(propStatus);
  }, [propRiskScore, propRiskLevel, propStatus]);

  // Determine colors based on risk level
  // Green (0-49%): Normal behavior
  // Orange (50-79%): Suspicious/moderate anomalous behavior
  // Red (80-100%): Highly anomalous behavior
  const getRiskColor = () => {
    if (riskScore < 50) return { bg: '#D1FAE5', text: '#016630', bar: '#10B981' }; // Green
    if (riskScore < 80) return { bg: '#FED7AA', text: '#9A3412', bar: '#F97316' }; // Orange
    return { bg: '#FEE2E2', text: '#991B1B', bar: '#EF4444' }; // Red
  };

  const getRiskLabel = () => {
    if (riskScore < 50) return 'Low Risk';
    if (riskScore < 80) return 'Moderate Risk';
    return 'High Risk';
  };

  const colors = getRiskColor();

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
            backgroundColor: colors.bg,
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
                filter: riskScore < 50
                  ? 'brightness(0) saturate(100%) invert(20%) sepia(77%) saturate(2985%) hue-rotate(133deg) brightness(96%) contrast(96%)'
                  : 'none'
              }} 
            />
            <span style={{
              fontSize: '1rem',
              fontWeight: '700',
              color: colors.text
            }}>
              {Math.round(riskScore)}%
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
            color: colors.text,
            fontWeight: '600'
          }}>
            Risk Score: {getRiskLabel()}
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
            width: `${Math.min(riskScore, 100)}%`,
            backgroundColor: colors.bar,
            borderRadius: '4px',
            transition: 'width 0.3s ease, background-color 0.3s ease'
          }}></div>
        </div>
      </div>
    </div>
  );
});

// Add display name for debugging
CBBAMonitor.displayName = 'CBBAMonitor';

export default CBBAMonitor;