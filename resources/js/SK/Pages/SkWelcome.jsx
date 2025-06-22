import React from 'react';

const SkWelcome = () => {
  return (
    <div className="sk-cmn-sklcss-content">
      <div className="sk-cmn-sklcss-welcome-header">
        <h1>Welcome to SKonnect</h1>
        <p>Your unified platform for Sangguniang Kabataan management</p>
      </div>
      
      <div className="sk-cmn-sklcss-card-grid">
        <div className="sk-cmn-sklcss-feature-card">
          <div className="sk-cmn-sklcss-feature-card-icon">
            {/* Icon placeholder */}
          </div>
          <div className="sk-cmn-sklcss-feature-card-body">
            <h3>Event Management</h3>
            <p>Plan, organize, and track SK events in your community</p>
          </div>
        </div>
        
        <div className="sk-cmn-sklcss-feature-card">
          <div className="sk-cmn-sklcss-feature-card-icon">
            {/* Icon placeholder */}
          </div>
          <div className="sk-cmn-sklcss-feature-card-body">
            <h3>Project Monitoring</h3>
            <p>Monitor ongoing projects and track their progress</p>
          </div>
        </div>
        
        <div className="sk-cmn-sklcss-feature-card">
          <div className="sk-cmn-sklcss-feature-card-icon">
            {/* Icon placeholder */}
          </div>
          <div className="sk-cmn-sklcss-feature-card-body">
            <h3>Youth Profiles</h3>
            <p>Manage profiles of youth in your barangay</p>
          </div>
        </div>
        
        <div className="sk-cmn-sklcss-feature-card">
          <div className="sk-cmn-sklcss-feature-card-icon">
            {/* Icon placeholder */}
          </div>
          <div className="sk-cmn-sklcss-feature-card-body">
            <h3>Content Management</h3>
            <p>Manage policies, announcements, and other content</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SkWelcome;