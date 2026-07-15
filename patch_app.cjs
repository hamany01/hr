const fs = require('fs');
let file = fs.readFileSync('src/App.tsx', 'utf8');

const maintenanceView = `
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
`;

const regex = /{view === 'home' && \([\s\S]*?<AdminPortal onGoHome=\{handleGoHome\} \/>\s*\)}/;
file = file.replace(regex, maintenanceView);

fs.writeFileSync('src/App.tsx', file);
