const fs = require('fs');

let file = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

// Add "logs" to the subtabs state if it uses a type
// Actually, activeSubTab is a state. Let's see how it's defined.
// search for: const [activeSubTab, setActiveSubTab]
const subTabLine = file.match(/const \[activeSubTab, setActiveSubTab\] = useState.*$/m);
if (subTabLine) {
  file = file.replace(subTabLine[0], "const [activeSubTab, setActiveSubTab] = useState<'applicants' | 'schedules' | 'announcements' | 'templates' | 'logs'>('applicants');");
}

// Add the button
const btnRegex = /<button\s+onClick=\{\(\) => setActiveSubTab\('templates'\)\}.*?<\/button>/s;
const btnMatch = file.match(btnRegex);
if (btnMatch) {
  const newBtn = `
            <button
              onClick={() => setActiveSubTab('logs')}
              className={\`pb-4 text-xs sm:text-sm font-extrabold transition-all border-b-2 flex items-center gap-2 \${
                activeSubTab === 'logs'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }\`}
            >
              <Activity className="w-4 h-4" />
              <span>سجل العمليات 📜</span>
            </button>
  `;
  file = file.replace(btnMatch[0], btnMatch[0] + newBtn);
}

// Ensure Activity icon is imported
if (!file.includes('Activity,')) {
  file = file.replace('import { ', 'import { Activity, ');
}

fs.writeFileSync('src/components/AdminPortal.tsx', file);
