const fs = require('fs');
let file = fs.readFileSync('api/server.ts', 'utf8');

file = file.replace(/async function ensureDbSynced[\s\S]*?next\(err\);\n  }\n}/, `let lastSupabaseFetch = 0;
async function ensureDbSynced(req: express.Request, res: express.Response, next: express.NextFunction) {
  initSupabase();
  const isFreshRequired = req.path.startsWith("/api/admin") || req.path === "/api/submit";
  
  if (useSupabase && supabase && isFreshRequired) {
    const now = Date.now();
    if (now - lastSupabaseFetch > 30000) {
      lastSupabaseFetch = now;
      supabase
        .from("applicants")
        .select("*")
        .then(({ data: supabaseApplicants, error: applicantsErr }) => {
          if (!applicantsErr && supabaseApplicants) {
            cachedApplicants = supabaseApplicants
              .filter((row) => row.id && !row.id.startsWith("SYSTEM_SETTING_"))
              .map(mapSupabaseToApplicant);
          }
        })
        .catch((err) => {
          console.error("Failed to refresh applicants from Supabase during request:", err);
        });
    }
  }

  if (!syncPromise) {
    syncPromise = syncDatabase();
  }
  
  try {
    await syncPromise;
    next();
  } catch (err) {
    console.error("Database synchronization failed during request processing:", err);
    next(err);
  }
}`);

fs.writeFileSync('api/server.ts', file);
