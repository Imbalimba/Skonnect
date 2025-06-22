import '../css/app.css';
import './bootstrap';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import { AuthProvider } from './Contexts/AuthContext';
import axios from 'axios';
import ScrollToTop from './Components/ScrollToTop';
import SkLayout from './SK/Components/SkLayout';

// Set axios defaults for CSRF protection
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.withCredentials = true;

// Import Youth pages
import HomePage from './Youth/Pages/HomePage';
import Login from './Youth/Pages/Login';
import Signup from './Youth/Pages/Signup';
import VerifyOtp from './Youth/Pages/VerifyOtp';
import Awards from './Youth/Pages/Awards';
import Directory from './Youth/Pages/Directory';
import FAQs from './Youth/Pages/FAQs';
import ProgramEvents from './Youth/Pages/ProgramEvents';
import Templates from './Youth/Pages/Templates';
import YouthDevelopmentPolicy from './Youth/Pages/YouthDevelopmentPolicy';
import ForgotPassword from './Youth/Pages/ForgotPassword';
import ResetVerify from './Youth/Pages/ResetVerify';
import ResetPassword from './Youth/Pages/ResetPassword';
import YouthProfile from './Youth/Pages/YouthProfileForm';
import AllAnnouncements from './Youth/Pages/AllAnnouncement';


// Import SK pages
import SkLogin from './SK/Pages/SkLogin';
import SkSignup from './SK/Pages/SkSignup';
import Sk2FAVerify from './SK/Pages/Sk2faVerify';
import SkVerifyOtp from './SK/Pages/SkVerifyOtp';
import SkWelcome from './SK/Pages/SkWelcome';
import SkForgotPassword from './SK/Pages/SkForgotPassword';
import SkResetVerify from './SK/Pages/SkResetVerify';
import SkResetPassword from './SK/Pages/SkResetPassword';
import SkUserAuthentication from './SK/Pages/SkUserAuthentication';
import SkUserLogs from './SK/Pages/SkUserLogs';
import KKProfiling from './SK/Pages/KKProfiling';
import PolicyManagement from './SK/Pages/PolicyManagement';
import AnnouncementManagement from './SK/Pages/AnnouncementManagement';
import AwardManagement from './SK/Pages/AwardManagement';
import DirectoryManagement from './SK/Pages/DirectoryManagement';
import TemplateManagement from './SK/Pages/TemplateManagement';
import SkFeedback from './SK/Pages/SkFeedback';
import EventManagement from "./SK/Components/Event_Management";
import ProjectMonitoring from "./SK/Components/Project_Monitoring";
import Dashboard from "./SK/Components/Dashboard";

const App = () => {
    return (
    <AuthProvider>
        <BrowserRouter>
            <ScrollToTop />
            <Routes>
                {/* Youth Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/verify-email" element={<VerifyOtp />} />
                <Route path="/awards" element={<Awards />} />
                <Route path="/directory" element={<Directory />} />
                <Route path="/faqs" element={<FAQs />} />
                <Route path="/program-events" element={<ProgramEvents />} />
                <Route path="/templates" element={<Templates />} />
                <Route path="/youth-development-policies" element={<YouthDevelopmentPolicy />} />
                <Route path="/profile" element={<YouthProfile />} />
                <Route path="/announcements" element={<AllAnnouncements />} />

                
                {/* Youth Password Reset Routes */}
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-verify" element={<ResetVerify />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                
                {/* SK Routes - Wrapped with SkLayout to isolate CSS */}
                <Route path="/sk-login" element={<SkLayout><SkLogin /></SkLayout>} />
                <Route path="/sk-signup" element={<SkLayout><SkSignup /></SkLayout>} />
                <Route path="/sk-verify-email" element={<SkLayout><SkVerifyOtp /></SkLayout>} />
                
                {/* SK Password Reset Routes */}
                <Route path="/sk-forgot-password" element={<SkLayout><SkForgotPassword /></SkLayout>} />
                <Route path="/sk-reset-verify" element={<SkLayout><SkResetVerify /></SkLayout>} />
                <Route path="/sk-reset-password" element={<SkLayout><SkResetPassword /></SkLayout>} />
                <Route path="/sk-2fa-verify" element={<SkLayout><Sk2FAVerify /></SkLayout>} />              
                
                {/* Protected SK routes - Require authentication */}
                <Route path="/sk-welcome" element={<SkLayout requireAuth={true}><SkWelcome /></SkLayout>} />
                <Route path="/sk-user-authentication" element={<SkLayout requireAuth={true}><SkUserAuthentication /></SkLayout>} />
                <Route path="/sk-user-logs" element={<SkLayout requireAuth={true}><SkUserLogs /></SkLayout>} />
                <Route path="/sk-profiles" element={<SkLayout requireAuth={true}><KKProfiling /></SkLayout>} />
                <Route path="/policy-management" element={<SkLayout requireAuth={true}><PolicyManagement /></SkLayout>} />
                <Route path="/announcement-management" element={<SkLayout requireAuth={true}><AnnouncementManagement /></SkLayout>} />
                <Route path="/award-management" element={<SkLayout requireAuth={true}><AwardManagement /></SkLayout>} />
                <Route path="/directory-management" element={<SkLayout requireAuth={true}><DirectoryManagement /></SkLayout>} /> 
                <Route path="/template-management" element={<SkLayout requireAuth={true}><TemplateManagement /></SkLayout>} />
                <Route path="/sk-feedback" element={<SkLayout requireAuth={true}><SkFeedback /></SkLayout>} />
                <Route path="/event"element={<SkLayout requireAuth={true}><EventManagement /></SkLayout>}/>
                <Route path="/project_monitor" element={<SkLayout requireAuth={true}> <ProjectMonitoring /></SkLayout>}/>
                <Route path="/dashboard" element={<SkLayout requireAuth={true}><Dashboard /></SkLayout>}/>

                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    </AuthProvider>
    );
};

// Mount the app
const container = document.getElementById('app');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}