const fs = require('fs');
let file = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\s*\{siteSettings\?\.maintenanceMode && view !== 'admin' \? \(/;

const newContent = `
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
          {siteSettings?.maintenanceMode && view !== 'admin' ? (`;

file = file.replace(regex, newContent);

fs.writeFileSync('src/App.tsx', file);
