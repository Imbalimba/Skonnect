import React, { useContext, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import SkStyleManager from './SkStyleManager';
import SkNavbar from './SkNavbar';
import { AuthContext } from '../../Contexts/AuthContext';
import LogService from '../../services/LogService'; // Import LogService
import '../css/SkGlobal.css';

// A layout wrapper for all SK pages
const SkLayout = ({ children, requireAuth = false }) => {
  const { skUser, loading, pending2FA } = useContext(AuthContext);
  const location = useLocation();
  
  // Define routes where navbar should be hidden
  const hideNavbarRoutes = [
    '/sk-login',
    '/sk-signup',
    '/sk-verify-email',
    '/sk-forgot-password',
    '/sk-reset-verify',
    '/sk-reset-password',
    '/sk-2fa-verify',
  ];
  
  // Check if current route should hide navbar
  const shouldHideNavbar = hideNavbarRoutes.includes(location.pathname);
  
  // Log page visits when route changes
  useEffect(() => {
    // Only log after loading is complete and for authenticated routes if user is logged in
    if (!loading) {
      const userId = skUser ? skUser.id : null;
      
      // Don't log on initial loading state
      if (location.pathname !== '/loading') {
        LogService.logPageVisit(location.pathname, userId);
      }
    }
  }, [location.pathname, skUser, loading]);
  
  // If we're still loading, show nothing or a loading spinner
  if (loading) {
    return <div className="sk-cmn-sklcss-loading">Loading...</div>;
  }
  
  // If authentication is required but user isn't logged in, redirect to login
  if (requireAuth && !skUser) {
    return <Navigate to="/sk-login" replace />;
  }
  
  // Protect the 2FA page - prevent access if not in pending2FA state
  if (location.pathname === '/sk-2fa-verify' && !pending2FA?.waiting) {
    return <Navigate to="/sk-login" replace />;
  }

  // Check if user is logged in but needs 2FA - force them to complete 2FA
  if (skUser && pending2FA?.waiting && location.pathname !== '/sk-2fa-verify') {
    return <Navigate to="/sk-2fa-verify" replace />;
  }
  
  return (
    <SkStyleManager>
      <div className="sk-cmn-sklcss-container">
        {/* Only render navbar if not in the hide list */}
        {!shouldHideNavbar && <SkNavbar />}
        {children}
      </div>
    </SkStyleManager>
  );
};

export default SkLayout;