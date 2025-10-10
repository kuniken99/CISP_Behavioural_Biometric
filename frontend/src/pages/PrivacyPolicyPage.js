// frontend/src/pages/PrivacyPolicyPage.js

import React from 'react';

const PrivacyPolicyPage = () => {
  return (
    <div className="card">
      <h2>Privacy Policy</h2>
      <div style={{ lineHeight: '1.6' }}>
        <h3>Information Collection</h3>
        <p>
          The CBBA Security System collects behavioral biometric data including keyboard typing patterns 
          and mouse movement patterns for the purpose of continuous authentication and anomaly detection.
        </p>
        
        <h3>Data Usage</h3>
        <p>
          Collected biometric data is used solely for security purposes to protect privileged accounts 
          from unauthorized access. This data is processed in real-time and is not stored permanently.
        </p>
        
        <h3>Data Protection</h3>
        <p>
          All biometric data is encrypted during transmission and processing. We implement industry-standard 
          security measures to protect your behavioral patterns from unauthorized access.
        </p>
        
        <h3>Data Retention</h3>
        <p>
          Behavioral biometric data is temporarily stored during active sessions for analysis purposes. 
          This data is automatically purged upon session termination.
        </p>
        
        <h3>User Rights</h3>
        <p>
          Users have the right to request information about their data processing and to discontinue 
          the use of behavioral biometric authentication through system administrators.
        </p>
        
        <h3>Contact Information</h3>
        <p>
          For questions about this privacy policy or data processing, please contact your system administrator.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
