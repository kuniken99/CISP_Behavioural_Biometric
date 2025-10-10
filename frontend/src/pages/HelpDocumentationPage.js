import React from 'react';
import HelpIcon from '../assets/help-icon.svg';

const HelpDocumentationPage = () => (
  <div className="card">
    <h3>Dashboard</h3>
    <p>Provides a quick overview of database health and performance metrics.</p>
    <h3>Database Entry Management</h3>
    <p>Allows DBAs to view, add, edit, and delete records within selected database tables. Use with caution!</p>
    <h3>User Management</h3>
    <p>Create, modify, activate, or deactivate user accounts, including setting initial passwords and roles.</p>
    <h3>Role-Based Access Control</h3>
    <p>Assign specific roles (e.g., 'DBA', 'User', 'Admin') to users to manage their privileges across the system.</p>
    <h3>Activity History / Audit Logs</h3>
    <p>View a chronological record of all significant actions performed by users and the system.</p>
    <h3>Database Configuration</h3>
    <p>Update critical database parameters directly from the web interface. Requires extreme caution and understanding of the impact.</p>
    <h3>Alert System</h3>
    <p>Displays real-time alerts for security incidents (like anomalous behavior detected by CBBA) or critical performance issues.</p>
    <h3>Website Administration</h3>
    <p>Manage static content or metadata of this administration website.</p>
  </div>
);

export default HelpDocumentationPage;