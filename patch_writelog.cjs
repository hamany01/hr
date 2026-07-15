const fs = require('fs');
let server = fs.readFileSync('api/server.ts', 'utf8');

const auditCode = `
export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  applicantId?: string;
  adminEmail?: string;
}

let cachedLogs: AuditLog[] = [];

if (fs.existsSync(LOGS_FILE)) {
  try {
    cachedLogs = JSON.parse(fs.readFileSync(LOGS_FILE, "utf8"));
  } catch (e) {
    cachedLogs = [];
  }
} else {
  fs.writeFileSync(LOGS_FILE, JSON.stringify([]));
}

function writeLog(action: string, details: string, applicantId?: string, adminEmail?: string) {
  const log = {
    id: Date.now().toString() + Math.random().toString(36).substring(7),
    timestamp: new Date().toISOString(),
    action,
    details,
    applicantId,
    adminEmail
  };
  cachedLogs.push(log);
  if (cachedLogs.length > 5000) cachedLogs = cachedLogs.slice(-5000); // Keep last 5000
  try {
    fs.writeFileSync(LOGS_FILE, JSON.stringify(cachedLogs, null, 2), "utf8");
  } catch (e) {
    console.error("Failed to write log", e);
  }
}
`;

server = server.replace('let cachedApplicants: Applicant[] = [];', auditCode + '\nlet cachedApplicants: Applicant[] = [];');

const logEndpoint = `
// [GET] Audit Logs
app.get("/api/logs", authMiddleware, (req, res) => {
  res.json(cachedLogs);
});

`;

server = server.replace('app.get("/api/applicants", authMiddleware, (req, res) => {', logEndpoint + 'app.get("/api/applicants", authMiddleware, (req, res) => {');

fs.writeFileSync('api/server.ts', server);

