import React, { useState, useEffect } from 'react';
import { Settings, Clock, Wrench } from 'lucide-react';
// GitHub Sync: Minor update to trigger re-push
import Home from './components/Home';
import TermsModal from './components/TermsModal';
import ApplicationForm from './components/ApplicationForm';
import SuccessScreen from './components/SuccessScreen';
import AdminPortal from './components/AdminPortal';
import CompanyLogo from './components/CompanyLogo';
import { AiEvaluation } from './types';

type ViewState = 'home' | 'apply' | 'success' | 'admin';

export default function App() {
  const [view, setView] = useState<ViewState>('home');
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'hse' | 'marketing'>('hse');

  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSiteSettings(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!siteSettings?.maintenanceMode || !siteSettings?.maintenanceEndTime) return;
    
    const updateCountdown = () => {
      const now = new Date().getTime();
      const end = new Date(siteSettings.maintenanceEndTime).getTime();
      const distance = end - now;

      if (distance < 0) {
        setTimeRemaining('اقترب الانتهاء...');
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeRemaining(`${hours} ساعة و ${minutes} دقيقة و ${seconds} ثانية`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [siteSettings]);

  
  // Success states
  const [submittedId, setSubmittedId] = useState('');
  const [submittedStatus, setSubmittedStatus] = useState('');
  const [submittedAiEval, setSubmittedAiEval] = useState<AiEvaluation | undefined>(undefined);
  const [submittedApplicantName, setSubmittedApplicantName] = useState('');

  const handleStartApply = (role?: 'hse' | 'marketing') => {
    if (role) {
      setSelectedRole(role);
    } else {
      setSelectedRole('hse');
    }
    setIsTermsOpen(true);
  };

  const handleTermsAccepted = () => {
    setIsTermsOpen(false);
    setView('apply');
  };

  const handleSubmissionSuccess = (appId: string, status: string, aiEval: any, applicantName: string) => {
    setSubmittedId(appId);
    setSubmittedStatus(status);
    setSubmittedAiEval(aiEval);
    setSubmittedApplicantName(applicantName);
    setView('success');
  };

  const handleGoHome = () => {
    setView('home');
  };

  const handleGoAdmin = () => {
    setView('admin');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-orange-500 selection:text-white antialiased">
      
      {/* Navigation Header bar */}
      <header className="bg-white border-b border-slate-200 py-3 px-6 md:px-12 sticky top-0 z-40 print:hidden flex items-center">
        <div className="w-full max-w-7xl mx-auto flex justify-between items-center">
          
          {/* Logo and title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={handleGoHome}>
            <CompanyLogo className="h-10 md:h-12 w-auto" />
            <div>
              <h1 className="text-sm md:text-base font-bold text-blue-900 leading-tight">بوابة التوظيف الرقمية</h1>
              <p className="text-[10px] md:text-xs text-slate-400">شركة مصنع جدة للدهانات والمعاجين</p>
            </div>
          </div>

          {/* Quick nav portals */}
          <div className="flex items-center gap-2 md:gap-4">
            {view !== 'admin' ? (
              <button
                onClick={handleGoAdmin}
                className="text-slate-600 hover:text-blue-900 hover:bg-slate-50 border border-slate-200 font-bold text-xs px-4 py-2 rounded-lg transition-all"
                id="admin-portal-nav-btn"
              >
                لوحة الإدارة
              </button>
            ) : (
              <button
                onClick={handleGoHome}
                className="text-slate-600 hover:text-blue-900 hover:bg-slate-50 border border-slate-200 font-bold text-xs px-4 py-2 rounded-lg transition-all"
                id="home-portal-nav-btn"
              >
                الصفحة الرئيسية
              </button>
            )}
            {view === 'home' && (
              <button
                onClick={handleStartApply}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-5 py-2 rounded-lg shadow-md transition-all active:scale-95"
                id="apply-now-header-btn"
              >
                قدّم الآن
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content viewport */}
      <main className="transition-all duration-300 min-h-[calc(100vh-64px)] flex flex-col justify-between">
        <div className="flex-1">
          {siteSettings?.maintenanceMode && view !== 'admin' ? (
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
              <div className="bg-orange-100 p-6 rounded-full mb-6 text-orange-600">
                <Wrench className="w-16 h-16" />
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mb-4">الموقع في وضع الصيانة والتحديث</h2>
              <p className="text-slate-600 max-w-md mx-auto mb-8 leading-relaxed">
                نقوم حالياً بإجراء بعض التحسينات والتحديثات على النظام لتقديم خدمة أفضل. نعتذر عن أي إزعاج ونشكركم على صبركم.
              </p>
              {siteSettings.maintenanceEndTime && timeRemaining && (
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm inline-block">
                  <div className="flex items-center justify-center gap-3 text-slate-500 mb-3">
                    <Clock className="w-5 h-5" />
                    <span className="font-bold text-sm">الوقت المتبقي المتوقع</span>
                  </div>
                  <div className="text-2xl font-mono font-bold text-blue-700" dir="ltr">
                    {timeRemaining}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {view === 'home' && (
                <Home onStartApply={handleStartApply} onGoToAdmin={handleGoAdmin} />
              )}
              {view === 'apply' && (
                <ApplicationForm 
                  jobRole={selectedRole}
                  onCancel={handleGoHome} 
                  onSubmitSuccess={handleSubmissionSuccess} 
                />
              )}
              {view === 'success' && (
                <SuccessScreen
                  applicationId={submittedId}
                  status={submittedStatus}
                  aiEvaluation={submittedAiEval}
                  applicantName={submittedApplicantName}
                  onGoHome={handleGoHome}
                />
              )}
              {view === 'admin' && (
                <AdminPortal onGoHome={handleGoHome} />
              )}
            </>
          )}

        </div>

        {/* Universal Footer */}
        {view !== 'admin' && (
          <footer className="bg-white border-t border-slate-200 py-6 px-6 md:px-12 text-right print:hidden">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400">
              <div className="text-right">
                <p className="text-[10px] text-slate-500 font-bold">حقوق الطبع والنشر © {new Date().getFullYear()} شركة مصنع جدة للدهانات والمعاجين</p>
                <p className="text-[10px] text-orange-600 font-bold mt-1">تم تصميم الموقع بواسطة عبدالرحمن سالم باشنيني • 0599222345</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1 text-[10px] text-slate-500"><div className="w-2 h-2 rounded-full bg-green-500"></div> الخادم متصل</span>
                <span className="text-[10px] text-slate-500">v4.1</span>
              </div>
            </div>
          </footer>
        )}
      </main>

      {/* Legally binding terms & conditions overlay */}
      <TermsModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
        onAccept={handleTermsAccepted}
        jobRole={selectedRole}
      />

    </div>
  );
}
