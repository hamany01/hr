const fs = require('fs');
let file = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

const renderBlock = `
          {activeSubTab === 'logs' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-sm">سجل النظام والعمليات (Audit Logs)</h3>
                <span className="text-xs text-slate-500 font-semibold">{logs.length} عملية مسجلة</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50/50 text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-bold">التاريخ والوقت</th>
                      <th className="px-4 py-3 font-bold">الإجراء</th>
                      <th className="px-4 py-3 font-bold">التفاصيل</th>
                      <th className="px-4 py-3 font-bold">رقم المرشح</th>
                      <th className="px-4 py-3 font-bold">حساب المسؤول</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500">لا توجد عمليات مسجلة حتى الآن</td>
                      </tr>
                    ) : (
                      logs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 text-slate-600" dir="ltr">{new Date(log.timestamp).toLocaleString('ar-SA')}</td>
                          <td className="px-4 py-3 font-bold text-blue-600">{log.action}</td>
                          <td className="px-4 py-3 text-slate-700">{log.details}</td>
                          <td className="px-4 py-3 font-mono text-slate-500">{log.applicantId || '-'}</td>
                          <td className="px-4 py-3 text-slate-500">{log.adminEmail || 'النظام (تلقائي)'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
`;

if (!file.includes("Audit Logs")) {
  file = file.replace("{activeSubTab === 'applicants' && (", renderBlock + "\n          {activeSubTab === 'applicants' && (");
}

fs.writeFileSync('src/components/AdminPortal.tsx', file);
