import React from 'react';
import '../css/global.css';
import Navbar from './Navbar';
import YouthStyleManager from './YouthStyleManager';

const AuthLayout = ({ children }) => {
  return (
    <YouthStyleManager>
      <div className="youth-auth-page">      
        <Navbar />
        {children}
      </div>
    </YouthStyleManager>
  );
};

export default AuthLayout;