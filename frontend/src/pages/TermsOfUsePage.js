// frontend/src/pages/TermsOfUsePage.js

import React from 'react';

const TermsOfUsePage = () => {
  return (
    <div className="card">
      <h2>Terms & Conditions</h2>
      <div style={{ lineHeight: '1.6' }}>
        <h3>Acceptance of Terms</h3>
        <p>
          By accessing and using the CBBA Security System, you agree to be bound by these Terms and Conditions 
          and all applicable laws and regulations.
        </p>
        
        <h3>System Usage</h3>
        <p>
          This system is designed for authorized personnel only. Users must have valid credentials and 
          appropriate access levels to use this database administration console.
        </p>
        
        <h3>User Responsibilities</h3>
        <ul>
          <li>Maintain the confidentiality of your login credentials</li>
          <li>Report any security incidents or anomalies immediately</li>
          <li>Use the system only for authorized business purposes</li>
          <li>Comply with all organizational policies and procedures</li>
        </ul>
        
        <h3>System Availability</h3>
        <p>
          While we strive to maintain system availability, we do not guarantee uninterrupted service. 
          Scheduled maintenance and security updates may cause temporary service interruptions.
        </p>
        
        <h3>Acceptable Use Policy</h3>
        <p>
          Users must not attempt to circumvent security measures, access unauthorized data, or use 
          the system for any illegal or unauthorized purposes.
        </p>
        
        <h3>Account Termination</h3>
        <p>
          Access may be suspended or terminated immediately for violations of these terms, security 
          breaches, or inappropriate system usage.
        </p>
        
        <h3>Limitation of Liability</h3>
        <p>
          The system is provided "as is" without warranties of any kind. Users assume responsibility 
          for their actions within the system.
        </p>
        
        <h3>Changes to Terms</h3>
        <p>
          These terms may be updated periodically. Continued use of the system constitutes acceptance 
          of any changes to these terms.
        </p>
      </div>
    </div>
  );
};

export default TermsOfUsePage;
