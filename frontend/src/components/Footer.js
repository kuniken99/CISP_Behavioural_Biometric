// frontend/src/components/Footer.js

import React from 'react';
import { useNavigate } from 'react-router-dom';

const Footer = () => {
  const navigate = useNavigate();

  const handleLinkClick = (e, path) => {
    e.preventDefault();
    navigate(path);
  };

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>CBBA Security System</h3>
          <p>Protecting privileged accounts by continuously analysing user's keyboard and mouse behaviour.</p>
        </div>
        <div className="footer-section">
          <div className="footer-links">
            <a 
              href="/privacy-policy" 
              className="footer-link"
              onClick={(e) => handleLinkClick(e, '/privacy-policy')}
            >
              Privacy & Policy
            </a>
            <span className="footer-divider">|</span>
            <a 
              href="/terms-conditions" 
              className="footer-link"
              onClick={(e) => handleLinkClick(e, '/terms-conditions')}
            >
              Terms & Condition
            </a>
          </div>
        </div>
      </div>
      <div className="footer-copyright">
        <p>© 2025 All Rights Reserved</p>
      </div>
    </footer>
  );
};

export default Footer;
