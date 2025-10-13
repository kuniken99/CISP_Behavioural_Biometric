// frontend/src/pages/TermsOfUsePage.js

import React from 'react';

const TermsOfUsePage = () => {
  return (
    <div className="card">
      <div style={{ lineHeight: '1.6' }}>
        <p style={{ color: '#6b7280', marginBottom: '32px' }}>Last updated: October 6, 2025</p>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>1. Acceptance of Terms</h2>
          <p>
            By creating an account and using this CBBA Security System ("Service"), you agree to be bound by these Terms and 
            Conditions. If you disagree with any part of the terms, you may not access the Service.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>2. The Service</h2>
          <p>
            The Service is designed to provide continuous, real-time identity verification for privileged administrative accounts by 
            analyzing behavioral biometric data. The Service monitors your keyboard and mouse usage patterns to create a unique 
            profile and detect unusual behavioral security incidents or unauthorized user.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>3. User Account</h2>
          <ul style={{ paddingLeft: '20px' }}>
            <li>You are responsible for safeguarding the password that you use to access the Service and for any activities or 
            actions under your account.</li>
            <li>You agree to provide accurate, complete, and current information at all times.</li>
            <li>Your account is for your use only and must not be shared with any other individual.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>4. Explicit Consent for Biometric Data</h2>
          <p>
            By using this Service, you provide explicit consent to the collection, processing, and storage of your 
            Behavioral Biometric Data (keystroke and mouse dynamics) as described in our Privacy Policy. You acknowledge that 
            this data is essential for the Service to function and to secure your account and the underlying systems.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>5. Acceptable Use Policy</h2>
          <p>You agree not to misuse the Service. You will not, and will not attempt to:</p>
          <ul style={{ paddingLeft: '20px', marginTop: '12px' }}>
            <li>Interfere with or disrupt the normal operation of the Service.</li>
            <li>Attempt to test the vulnerability of any system or network.</li>
            <li>Attempt to reverse-engineer, disassemble, or otherwise discover the source code or underlying algorithms of the 
            Service.</li>
            <li>Use the Service for any illegal or unauthorized purpose.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>6. Termination</h2>
          <p>
            We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, 
            including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately 
            cease, and your associated data will be deleted in accordance with our data retention policies.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>7. Disclaimer of Warranties</h2>
          <p>
            The Service is provided on an "AS IS" and "AS AVAILABLE" basis. While the Service is designed to enhance security, we 
            do not warrant that it will be completely error-free or that it will detect 100% of unauthorized access attempts.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>8. Limitation of Liability</h2>
          <p>
            In no event shall the Company, or its directors, employees, or partners, be liable for any indirect, incidental, special, 
            consequential, or punitive damages arising out of or in connection with your use of the Service.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>9. Governing Law</h2>
          <p>
            These Terms shall be governed and construed in accordance with the laws of the Republic of Singapore, without 
            regard to its conflict of law provisions.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>10. Contact Us</h2>
          <p>
            If you have any questions about these Terms, feel free to contact us at{' '}
            <a href="mailto:tank108@uni.coventry.ac.uk" style={{ color: '#2563eb', textDecoration: 'underline' }}>
              tank108@uni.coventry.ac.uk
            </a>
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfUsePage;
