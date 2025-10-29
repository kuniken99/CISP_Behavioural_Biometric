import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LoginPage.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

function TrainingProgressPage() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState({
    isTraining: true,
    totalSamples: 1000,
    completedSamples: 0,
    percentComplete: 0,
    status: 'Starting training...'
  });
  const [error, setError] = useState('');

  useEffect(() => {
    // Start auto-training when component mounts
    const startTraining = async () => {
      try {
        const token = localStorage.getItem('jwt_token');
        if (!token) {
          setError('Not authenticated');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/Biometric/start-auto-training`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ numSamples: 1000 })
        });

        if (!response.ok) {
          throw new Error('Failed to start training');
        }

        // Start polling for progress
        const intervalId = setInterval(async () => {
          try {
            const progressResponse = await fetch(`${API_BASE_URL}/Biometric/training-progress`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            if (progressResponse.ok) {
              const data = await progressResponse.json();
              setProgress(data);

              // If training complete, redirect to dashboard after 2 seconds
              if (!data.isTraining && data.percentComplete === 100) {
                clearInterval(intervalId);
                setTimeout(() => {
                  navigate('/dashboard');
                }, 2000);
              }

              // If training failed, show error
              if (!data.isTraining && data.error) {
                clearInterval(intervalId);
                setError(data.error);
              }
            }
          } catch (err) {
            console.error('Error fetching progress:', err);
          }
        }, 1000); // Poll every second

        // Cleanup interval on unmount
        return () => clearInterval(intervalId);
      } catch (err) {
        setError(err.message);
      }
    };

    startTraining();
  }, [navigate]);

  return (
    <div className="auth-container">
      <div className="auth-card training-card">
        <div className="auth-header">
          <h2 className="auth-title">Setting Up Your Profile</h2>
        </div>

        <div className="training-content">
          {error ? (
            <div className="training-error">
              <svg className="error-icon" width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="#EF4444" strokeWidth="2"/>
                <path d="M12 8V12M12 16H12.01" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <h3>Training Failed</h3>
              <p>{error}</p>
              <button 
                className="auth-button" 
                onClick={() => navigate('/dashboard')}
                style={{ marginTop: '20px' }}
              >
                Continue to Dashboard
              </button>
            </div>
          ) : (
            <>
              {/* Training Icon */}
              <div className="training-icon">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  {progress.isTraining && (
                    <animateTransform
                      attributeName="transform"
                      attributeType="XML"
                      type="rotate"
                      from="0 12 12"
                      to="360 12 12"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  )}
                </svg>
              </div>

              {/* Status Text */}
              <h3 className="training-title">
                {progress.percentComplete === 100 ? 'Training Complete!' : 'Training Your Behavioral Profile'}
              </h3>
              <p className="training-subtitle">
                {progress.status}
              </p>

              {/* Progress Bar */}
              <div className="progress-container">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${progress.percentComplete}%` }}
                  >
                    <span className="progress-text">{progress.percentComplete}%</span>
                  </div>
                </div>
                <p className="progress-details">
                  {progress.completedSamples} / {progress.totalSamples} samples
                </p>
              </div>

              {/* Info Box */}
              <div className="training-info">
                <div className="info-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="#6B7280" strokeWidth="2"/>
                    <path d="M12 16V12M12 8H12.01" stroke="#6B7280" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span>Learning your typing patterns...</span>
                </div>
                <div className="info-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#6B7280" strokeWidth="2"/>
                  </svg>
                  <span>Training machine learning models...</span>
                </div>
                <div className="info-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#6B7280" strokeWidth="2"/>
                    <path d="M12 6V12L16 14" stroke="#6B7280" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span>This may take 1-2 minutes...</span>
                </div>
              </div>

              {progress.percentComplete === 100 && (
                <div className="success-message">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#10B981"/>
                    <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Redirecting to dashboard...</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default TrainingProgressPage;
