import React from 'react';
import '../css/global.css';
import Navbar from './Navbar';
import Footer from './Footer';
import ChatComponent from './ChatComponent';
import YouthStyleManager from './YouthStyleManager';

const YouthLayout = ({ children }) => {
  return (
    <YouthStyleManager>
      <div className="youth-page">
        <Navbar />
        <main className="youth-main-content">
          {children}
        </main>
        <Footer />
        <ChatComponent />
      </div>
    </YouthStyleManager>
  );
};

export default YouthLayout;