// frontend/src/pages/PrivacyPolicyPage.js

import React from 'react';

const PrivacyPolicyPage = () => {
  return (
    <div className="card">
      <div style={{ lineHeight: '1.6' }}>
        <p style={{ color: '#6b7280', marginBottom: '32px' }}>Last updated: October 6, 2025</p>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>1. Introduction</h2>
          <p>
            By accessing and using the CBBA Admin system, you accept and agree to be bound by the terms and provisions of this 
            agreement. If you do not agree to these terms, you should not use this service.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>2. Data We Collect</h2>
          <p>We collect specific types of information to provide and improve our security service to you and your organization:</p>
          <ul style={{ paddingLeft: '20px', marginTop: '12px' }}>
            <li><strong>Personal Identification Information:</strong> When an account is created for you, we collect basic information such as your 
            full name, corporate email address, and username.</li>
            <li><strong>Behavioral Biometric Data:</strong> This is the core of our Service. We continuously collect data related to your interaction 
            patterns with your computer. This includes:</li>
            <li><strong>Keystroke Dynamics:</strong> The unique rhythm and patterns of your typing. We do not record the actual keys you press 
            but rather how you type.</li>
            <li><strong>Mouse Movement Dynamics:</strong> The velocity, acceleration, and patterns of your mouse movements, clicks, and 
            scrolling.</li>
            <li><strong>Usage and Log Data:</strong> We automatically collect information such as your IP address, browser type, login timestamps, 
            and actions taken within the Service for security auditing and diagnostic purposes.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>3. How We Use Your Data</h2>
          <p>Your data is used exclusively for security purposes. We do not sell or rent your personal data to third parties.</p>
          <ul style={{ paddingLeft: '20px', marginTop: '12px' }}>
            <li><strong>To Provide and Secure the Service:</strong> Your personal biometric data is used to create a unique, personal behavioral 
            profile that serves as your digital signature and behavior is compared to continuously verify your identity.</li>
            <li><strong>To Detect and Prevent Unauthorized Access:</strong> The primary use case for our data is to identify anomalies in behavior that 
            could indicate an account compromise or session hijacking.</li>
            <li><strong>To Communicate With You:</strong> We use your email address to send critical security alerts, such as notifications of a 
            potential account compromise.</li>
            <li><strong>For Auditing and Compliance:</strong> Log data is used to maintain a secure audit trail of all activities related to privileged 
            accounts.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>4. Data Storage and Security</h2>
          <p>We implement a range of security measures to protect your information:</p>
          <ul style={{ paddingLeft: '20px', marginTop: '12px' }}>
            <li><strong>Encryption:</strong> Your Behavioral Biometric Profile is stored as an encrypted BLOB (Binary Large Object) using strong 
            encryption methods. All data transmitted between your browser and our servers is protected with TLS 1.3 
            encryption.</li>
            <li><strong>Hashing:</strong> Your account password is not stored. We store a strong, salted hash of your password using the Bcrypt 
            algorithm.</li>
            <li><strong>Data Minimization:</strong> We only collect the data that is strictly necessary to provide the security service.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>5. Your Data Protection Rights under PDPA</h2>
          <p>In accordance with Singapore's Personal Data Protection Act (PDPA), you have the following rights:</p>
          <ul style={{ paddingLeft: '20px', marginTop: '12px' }}>
            <li>The right to access: You can request copies of your personal data that we hold.</li>
            <li>The right to rectification: You can request that we correct any information you believe is inaccurate.</li>
            <li>The right to withdraw consent: You may withdraw your consent for the collection, use, and disclosure of your 
            personal data. Please note that withdrawing consent will result in the termination of your access to the Service.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>6. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, feel free to contact us at{' '}
            <a href="mailto:tank108@uni.coventry.ac.uk" style={{ color: '#2563eb', textDecoration: 'underline' }}>
              tank108@uni.coventry.ac.uk
            </a>
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
