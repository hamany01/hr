const fs = require('fs');
let server = fs.readFileSync('api/server.ts', 'utf8');

const settingsCode = `
const SETTINGS_FILE = path.join(DB_DIR, "settings.json");

export interface SiteSettings {
  maintenanceMode: boolean;
  maintenanceEndTime: string | null;
}

let cachedSettings: SiteSettings = {
  maintenanceMode: false,
  maintenanceEndTime: null
};

if (fs.existsSync(SETTINGS_FILE)) {
  try {
    cachedSettings = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8"));
  } catch (e) {
    cachedSettings = { maintenanceMode: false, maintenanceEndTime: null };
  }
} else {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(cachedSettings, null, 2));
}

// [GET] Settings (Public)
app.get("/api/settings", (req, res) => {
  res.json(cachedSettings);
});

// [POST] Settings (Admin Only)
app.post("/api/settings", authMiddleware, (req, res) => {
  const { maintenanceMode, maintenanceEndTime } = req.body;
  if (maintenanceMode !== undefined) {
    cachedSettings.maintenanceMode = maintenanceMode;
    cachedSettings.maintenanceEndTime = maintenanceEndTime || null;
    
    try {
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(cachedSettings, null, 2), "utf8");
    } catch (e) {
      console.error("Failed to write settings", e);
    }
    
    writeLog("تحديث إعدادات الموقع", \`تم \${maintenanceMode ? 'تفعيل' : 'إيقاف'} وضع الصيانة\`, undefined, (req as any).adminEmail);
  }
  res.json({ success: true, settings: cachedSettings });
});
`;

server = server.replace('let cachedApplicants: Applicant[] = [];', settingsCode + '\nlet cachedApplicants: Applicant[] = [];');

fs.writeFileSync('api/server.ts', server);
