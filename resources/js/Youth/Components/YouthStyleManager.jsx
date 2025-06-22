import React, { useEffect } from 'react';

// This component dynamically adds/removes Youth styles when Youth pages are mounted/unmounted
const YouthStyleManager = ({ children }) => {
  useEffect(() => {
    // Create a link element for the Youth-specific stylesheet
    const linkElement = document.createElement('link');
    linkElement.setAttribute('rel', 'stylesheet');
    linkElement.setAttribute('type', 'text/css');
    linkElement.setAttribute('href', '/css/youth-styles.css'); // Path to your Youth CSS
    linkElement.setAttribute('id', 'youth-styles');
    
    // Add the stylesheet to the document head
    document.head.appendChild(linkElement);
    
    // Cleanup function to remove the stylesheet when component unmounts
    return () => {
      const styleElement = document.getElementById('youth-styles');
      if (styleElement) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);
  
  return <>{children}</>;
};

export default YouthStyleManager;