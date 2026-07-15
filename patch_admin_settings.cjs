const fs = require('fs');
let file = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

if (!file.includes("setActiveSubTab('site_settings')")) {
  const settingsBtn = `
            <button
              onClick={() => setActiveSubTab('site_settings')}
              className={\`pb-4 text-xs sm:text-sm font-extrabold transition-all border-b-2 flex items-center gap-2 \${
                activeSubTab === 'site_settings'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }\`}
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <span>إعدادات الموقع</span>
            </button>
  `;
  file = file.replace(
    /<button\s+onClick=\{\(\) => setActiveSubTab\('logs'\)\}.*?<\/button>/s,
    match => match + settingsBtn
  );
  
  // also add site_settings to the subTab types if it has a strict type
  file = file.replace(
    /useState<'applicants' \| 'schedules' \| 'announcements' \| 'templates' \| 'logs'>/,
    "useState<'applicants' | 'schedules' | 'announcements' | 'templates' | 'logs' | 'site_settings'>"
  );
}

// Add the rendering logic for site_settings
const renderSettings = `
          {activeSubTab === 'site_settings' && (
            <SiteSettingsPanel token={token} />
          )}
`;

if (!file.includes("activeSubTab === 'site_settings' &&")) {
  file = file.replace(
    /{activeSubTab === 'logs' && \(/,
    renderSettings + "\n          {activeSubTab === 'logs' && ("
  );
}

// Add SiteSettingsPanel component
const panelComponent = `
function SiteSettingsPanel({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceHours, setMaintenanceHours] = useState('');
  const [maintenanceMinutes, setMaintenanceMinutes] = useState('');
  const [hasTimer, setHasTimer] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setMaintenanceMode(data.maintenanceMode);
        if (data.maintenanceEndTime) {
          setHasTimer(true);
          const diff = Math.max(0, new Date(data.maintenanceEndTime).getTime() - new Date().getTime());
          const hrs = Math.floor(diff / (1000 * 60 * 60));
          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setMaintenanceHours(hrs.toString());
          setMaintenanceMinutes(mins.toString());
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    let endTime = null;
    
    if (maintenanceMode && hasTimer) {
      const now = new Date();
      const addMs = (parseInt(maintenanceHours || '0') * 60 * 60 * 1000) + (parseInt(maintenanceMinutes || '0') * 60 * 1000);
      endTime = new Date(now.getTime() + addMs).toISOString();
    }

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: \`Bearer \${token}\`
        },
        body: JSON.stringify({ maintenanceMode, maintenanceEndTime: endTime })
      });
      if (res.ok) {
        setMessage('تم حفظ الإعدادات بنجاح');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('فشل في حفظ الإعدادات');
      }
    } catch (e) {
      setMessage('حدث خطأ أثناء الاتصال بالخادم');
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-center text-slate-500">جاري التحميل...</div>;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm p-6">
      <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Settings className="w-5 h-5 text-orange-500" />
        إعدادات الموقع المتقدمة
      </h3>

      <div className="max-w-2xl border border-slate-200 rounded-xl p-5 bg-slate-50">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
          <div>
            <h4 className="font-bold text-slate-800 text-sm">وضع الصيانة (Maintenance Mode)</h4>
            <p className="text-xs text-slate-500 mt-1">عند تفعيل وضع الصيانة، لن يتمكن الزوار من تقديم طلبات جديدة وسيرون صفحة تفيد بوجود تحديثات.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={maintenanceMode}
              onChange={(e) => setMaintenanceMode(e.target.checked)}
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
          </label>
        </div>

        {maintenanceMode && (
          <div className="space-y-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={hasTimer}
                onChange={(e) => setHasTimer(e.target.checked)}
                className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500 border-slate-300"
              />
              <span className="text-sm font-semibold text-slate-700">تفعيل عداد تنازلي للإيقاف (اختياري)</span>
            </label>

            {hasTimer && (
              <div className="flex gap-4 items-center bg-white p-3 rounded-lg border border-slate-200">
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">الساعات</label>
                  <input 
                    type="number" 
                    min="0"
                    value={maintenanceHours}
                    onChange={(e) => setMaintenanceHours(e.target.value)}
                    className="w-full text-sm border-slate-300 rounded focus:ring-orange-500 focus:border-orange-500 p-2"
                    placeholder="0"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">الدقائق</label>
                  <input 
                    type="number" 
                    min="0" max="59"
                    value={maintenanceMinutes}
                    onChange={(e) => setMaintenanceMinutes(e.target.value)}
                    className="w-full text-sm border-slate-300 rounded focus:ring-orange-500 focus:border-orange-500 p-2"
                    placeholder="0"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className={\`text-sm font-bold \${message.includes('بنجاح') ? 'text-green-600' : 'text-red-600'}\`}>
          {message}
        </p>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-2 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          <Save className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
`;

if (!file.includes('function SiteSettingsPanel')) {
  file = file + "\n" + panelComponent;
}

fs.writeFileSync('src/components/AdminPortal.tsx', file);
