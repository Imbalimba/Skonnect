import React, { useEffect } from 'react';

// This component dynamically adds/removes SK styles when SK pages are mounted/unmounted
const SkStyleManager = ({ children }) => {
  useEffect(() => {
    // Create a link element for the SK-specific stylesheet
    const linkElement = document.createElement('link');
    linkElement.setAttribute('rel', 'stylesheet');
    linkElement.setAttribute('type', 'text/css');
    linkElement.setAttribute('href', '/css/sk-styles.css'); // Path to your SK CSS
    linkElement.setAttribute('id', 'sk-styles');
    
    // Add the stylesheet to the document head
    document.head.appendChild(linkElement);
    
    // Also add global CSS for root variables
    const globalLinkElement = document.createElement('link');
    globalLinkElement.setAttribute('rel', 'stylesheet');
    globalLinkElement.setAttribute('type', 'text/css');
    globalLinkElement.setAttribute('href', '/css/skglobal.css'); // Path to global CSS with root variables
    globalLinkElement.setAttribute('id', 'sk-global-styles');
    
    // Add the global stylesheet to the document head
    document.head.appendChild(globalLinkElement);
    
    // Cleanup function to remove the stylesheets when component unmounts
    return () => {
      const styleElement = document.getElementById('sk-styles');
      if (styleElement) {
        document.head.removeChild(styleElement);
      }
      
      const globalStyleElement = document.getElementById('sk-global-styles');
      if (globalStyleElement) {
        document.head.removeChild(globalStyleElement);
      }
    };
  }, []);
  
  return <>{children}</>;
};

export default SkStyleManager;