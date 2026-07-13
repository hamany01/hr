import express from "express";
// GitHub Sync: Minor update to trigger re-push
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { Applicant, AiEvaluation, HrEvaluation } from "../src/types.js";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

// Resolve paths for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Increase payload limit for base64 CV / Certificates
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "applicants.json");
const ADMINS_FILE = path.join(DB_DIR, "admins.json");

let supabase: any = null;
let useSupabase = false;
let cachedApplicants: Applicant[] = [];
let cachedAdmins: any[] = [];

// Hash password using SHA-256
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Helper functions to map between Applicant models and Supabase schema
function mapApplicantToSupabase(applicant: Applicant) {
  // Only include hrEvaluation if it has real human review data (finalScore)
  const hasRealEval = applicant.hrEvaluation && (applicant.hrEvaluation.finalScore !== undefined || (applicant.hrEvaluation as any).reviewedAt !== undefined);
  const cleanHrEval = hasRealEval ? applicant.hrEvaluation : null;

  return {
    id: applicant.id,
    status: applicant.status,
    created_at: applicant.createdAt,
    personal_info: {
      ...applicant.personalInfo,
      archivedDeptNote: applicant.archivedDeptNote || null
    },
    industry_experience: applicant.industryExperience,
    certificates: applicant.certificates,
    exam_answers: applicant.examAnswers,
    ai_evaluation: applicant.aiEvaluation || null,
    hr_evaluation: cleanHrEval ? {
      ...cleanHrEval,
      interviewSchedule: applicant.interviewSchedule || null
    } : (applicant.interviewSchedule ? { interviewSchedule: applicant.interviewSchedule } : null)
  };
}

function mapSupabaseToApplicant(row: any): Applicant {
  // Only expose hrEvaluation if it has real evaluation fields
  const hasRealEval = row.hr_evaluation && (row.hr_evaluation.finalScore !== undefined || row.hr_evaluation.reviewedAt !== undefined);
  
  return {
    id: row.id,
    status: row.status,
    createdAt: row.created_at,
    personalInfo: row.personal_info,
    industryExperience: row.industry_experience,
    certificates: row.certificates,
    examAnswers: row.exam_answers,
    aiEvaluation: row.ai_evaluation || undefined,
    hrEvaluation: hasRealEval ? row.hr_evaluation : undefined,
    interviewSchedule: row.hr_evaluation?.interviewSchedule || undefined,
    archivedDeptNote: row.personal_info?.archivedDeptNote || undefined
  };
}

function initSupabase(): boolean {
  if (supabase) return true;
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

    if (supabaseUrl && supabaseKey) {
      supabase = createClient(supabaseUrl, supabaseKey);
      useSupabase = true;
      console.log(`Supabase client initialized dynamically with URL: ${supabaseUrl}`);
      return true;
    }
  } catch (err) {
    console.error("Supabase dynamic initialization failed:", err);
  }
  return false;
}

// Initial run
initSupabase();

// Synchronize and initialize cached data
async function syncDatabase() {
  initSupabase();
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  // 1. Load Admins
  let localAdmins: any[] = [];
  try {
    if (fs.existsSync(ADMINS_FILE)) {
      localAdmins = JSON.parse(fs.readFileSync(ADMINS_FILE, "utf8"));
    }
  } catch (err) {
    console.error("Error reading local admins file:", err);
  }

  // Ensure default admin exists if empty
  if (localAdmins.length === 0) {
    localAdmins = [{
      id: "admin-default",
      email: "hamany01@gmail.com",
      passwordHash: hashPassword("A123@a456@"),
      createdAt: new Date().toISOString()
    }];
    try {
      fs.writeFileSync(ADMINS_FILE, JSON.stringify(localAdmins, null, 2), "utf8");
    } catch (e) {}
  } else {
    // Ensure the default admin "hamany01@gmail.com" has the correct password hash requested by the user: "A123@a456@"
    const targetEmail = "hamany01@gmail.com";
    const requiredHash = hashPassword("A123@a456@");
    const defaultAdminObj = localAdmins.find(a => a.email.toLowerCase() === targetEmail.toLowerCase());
    if (defaultAdminObj) {
      if (defaultAdminObj.passwordHash !== requiredHash) {
        console.log(`Enforcing admin password hash for ${targetEmail} in local database.`);
        defaultAdminObj.passwordHash = requiredHash;
        try {
          fs.writeFileSync(ADMINS_FILE, JSON.stringify(localAdmins, null, 2), "utf8");
        } catch (e) {}
      }
    } else {
      localAdmins.push({
        id: "admin-default",
        email: targetEmail,
        passwordHash: requiredHash,
        createdAt: new Date().toISOString()
      });
      try {
        fs.writeFileSync(ADMINS_FILE, JSON.stringify(localAdmins, null, 2), "utf8");
      } catch (e) {}
    }
  }

  // 2. Load Applicants
  let localApplicants: Applicant[] = [];
  try {
    if (fs.existsSync(DB_FILE)) {
      localApplicants = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
      // Filter out test/seed applicants
      const idsToDelete = [
        "HSE-2026-001", "HSE-2026-0001", "HSE-2026-0002", "HSE-2026-0003", "HSE-2026-0004",
        "HSE-2026-0005", "HSE-2026-0006", "HSE-2026-0007", "HSE-2026-0008", "HSE-2026-0009",
        "HSE-2026-0010", "HSE-2026-0011", "HSE-2026-0012"
      ];
      const initialLength = localApplicants.length;
      localApplicants = localApplicants.filter(a => !idsToDelete.includes(a.id));
      if (localApplicants.length !== initialLength) {
        console.log(`Filtered out ${initialLength - localApplicants.length} test applicants locally.`);
        fs.writeFileSync(DB_FILE, JSON.stringify(localApplicants, null, 2), "utf8");
      }
    }
  } catch (err) {
    console.error("Error reading local applicants file:", err);
  }

  if (useSupabase && supabase) {
    try {
      console.log("Synchronizing with cloud Supabase...");
      
      // Clean up test/seed applicants from Supabase
      const idsToDelete = [
        "HSE-2026-001", "HSE-2026-0001", "HSE-2026-0002", "HSE-2026-0003", "HSE-2026-0004",
        "HSE-2026-0005", "HSE-2026-0006", "HSE-2026-0007", "HSE-2026-0008", "HSE-2026-0009",
        "HSE-2026-0010", "HSE-2026-0011", "HSE-2026-0012"
      ];
      try {
        const { error: deleteErr } = await supabase
          .from("applicants")
          .delete()
          .in("id", idsToDelete);
        if (deleteErr) {
          console.error("Failed to delete test applicants from Supabase:", deleteErr);
        } else {
          console.log("Successfully ran deletion of test/seed applicants from Supabase.");
        }
      } catch (err) {
        console.error("Failed to delete test applicants from Supabase:", err);
      }
      
      // Load admins from Supabase
      const { data: supabaseAdmins, error: adminsErr } = await supabase
        .from("admins")
        .select("*");

      if (adminsErr) {
        throw new Error(`Failed to load admins: ${adminsErr.message}`);
      }

      if (supabaseAdmins && supabaseAdmins.length > 0) {
        cachedAdmins = supabaseAdmins.map((row: any) => ({
          id: row.id,
          email: row.email,
          passwordHash: row.password_hash,
          createdAt: row.created_at
        }));
        
        // Enforce default admin password hash in Supabase cache and cloud database
        const targetEmail = "hamany01@gmail.com";
        const requiredHash = hashPassword("A123@a456@");
        const cachedAdminObj = cachedAdmins.find(a => a.email.toLowerCase() === targetEmail.toLowerCase());
        if (cachedAdminObj && cachedAdminObj.passwordHash !== requiredHash) {
          console.log(`Enforcing admin password hash for ${targetEmail} in Supabase cache.`);
          cachedAdminObj.passwordHash = requiredHash;
          try {
            await supabase
              .from("admins")
              .update({ password_hash: requiredHash })
              .eq("email", targetEmail);
            console.log(`Successfully updated admin password in Supabase for ${targetEmail}`);
          } catch (err) {
            console.error("Failed to update admin password in Supabase:", err);
          }
        }
        
        console.log(`Loaded ${cachedAdmins.length} admins from Supabase.`);
      } else {
        // Migrate local admins to Supabase
        console.log("No admins in Supabase. Migrating local admins to Supabase...");
        for (const admin of localAdmins) {
          const { error: insertErr } = await supabase
            .from("admins")
            .upsert({
              id: admin.id,
              email: admin.email,
              password_hash: admin.passwordHash,
              created_at: admin.createdAt
            });
          if (insertErr) {
            console.error(`Failed to migrate admin ${admin.email}:`, insertErr);
          }
        }
        cachedAdmins = localAdmins;
      }

      // Load applicants from Supabase
      const { data: supabaseApplicants, error: applicantsErr } = await supabase
        .from("applicants")
        .select("*");

      if (applicantsErr) {
        throw new Error(`Failed to load applicants: ${applicantsErr.message}`);
      }

      const loadedApplicants: Applicant[] = [];
      if (supabaseApplicants && supabaseApplicants.length > 0) {
        supabaseApplicants.forEach((row: any) => {
          if (row.id && !row.id.startsWith("SYSTEM_SETTING_")) {
            loadedApplicants.push(mapSupabaseToApplicant(row));
          }
        });
        cachedApplicants = loadedApplicants;
        console.log(`Loaded ${cachedApplicants.length} applicants from Supabase.`);

        const supabaseIds = new Set(loadedApplicants.map(a => a.id));
        let migratedCount = 0;
        for (const applicant of localApplicants) {
          if (!supabaseIds.has(applicant.id)) {
            const rowData = mapApplicantToSupabase(applicant);
            const { error: upsertErr } = await supabase
              .from("applicants")
              .upsert(rowData);
            
            if (!upsertErr) {
              cachedApplicants.push(applicant);
              migratedCount++;
            } else {
              console.error(`Failed to migrate applicant ${applicant.id}:`, upsertErr);
            }
          }
        }
        if (migratedCount > 0) {
          console.log(`Migrated ${migratedCount} new local applicants to Supabase.`);
        }
      } else {
        // Migrate all local applicants to Supabase
        console.log(`No applicants in Supabase. Migrating ${localApplicants.length} local applicants...`);
        for (const applicant of localApplicants) {
          const rowData = mapApplicantToSupabase(applicant);
          const { error: upsertErr } = await supabase
            .from("applicants")
            .upsert(rowData);
          if (upsertErr) {
            console.error(`Failed to migrate applicant ${applicant.id}:`, upsertErr);
          }
        }
        cachedApplicants = localApplicants;
      }

      // Write back to local files as a fallback cache, catching any filesystem errors (e.g. read-only filesystem on Vercel)
      try {
        fs.writeFileSync(ADMINS_FILE, JSON.stringify(cachedAdmins, null, 2), "utf8");
        fs.writeFileSync(DB_FILE, JSON.stringify(cachedApplicants, null, 2), "utf8");
      } catch (fsErr) {
        console.warn("Could not write fallback cache files (expected in read-only environments like Vercel):", fsErr);
      }
      
      console.log("Database synchronization with Supabase complete!");
    } catch (err: any) {
      console.error("Failed to sync with Supabase. Using local files as fallback.", err);
      cachedAdmins = localAdmins;
      cachedApplicants = localApplicants;
    }
  } else {
    cachedAdmins = localAdmins;
    cachedApplicants = localApplicants;
    console.log("Supabase not configured. Using local JSON files for data persistence.");
  }
}

let syncPromise: Promise<void> | null = null;

async function ensureDbSynced(req: express.Request, res: express.Response, next: express.NextFunction) {
  initSupabase();
  const isFreshRequired = req.path.startsWith("/api/admin") || req.path === "/api/submit";
  
  if (useSupabase && supabase && isFreshRequired) {
    try {
      const { data: supabaseApplicants, error: applicantsErr } = await supabase
        .from("applicants")
        .select("*");
      if (!applicantsErr && supabaseApplicants) {
        cachedApplicants = supabaseApplicants
          .filter((row: any) => row.id && !row.id.startsWith("SYSTEM_SETTING_"))
          .map(mapSupabaseToApplicant);
      }
    } catch (err) {
      console.error("Failed to refresh applicants from Supabase during request:", err);
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
    next();
  }
}

// Register the database sync gate middleware
app.use(ensureDbSynced);

const SESSION_SECRET = process.env.SESSION_SECRET || "hse-evaluation-portal-secret-key-2026-fallback";

// Create dynamic stateless session token signed with a secret
function createToken(email: string): string {
  const payload = JSON.stringify({ email: email.toLowerCase().trim(), expires: Date.now() + 24 * 60 * 60 * 1000 });
  const signature = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  return Buffer.from(payload + "." + signature).toString("base64");
}

// Verify dynamic session token
function verifyToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf8");
    const lastDotIndex = decoded.lastIndexOf(".");
    if (lastDotIndex === -1) return null;
    const payloadStr = decoded.substring(0, lastDotIndex);
    const signature = decoded.substring(lastDotIndex + 1);
    const expectedSignature = crypto.createHmac("sha256", SESSION_SECRET).update(payloadStr).digest("hex");
    if (signature !== expectedSignature) return null;
    const payload = JSON.parse(payloadStr);
    if (payload.expires < Date.now()) return null;
    return payload.email;
  } catch (err) {
    return null;
  }
}

// Initialize admins with the user-specified credentials
function initAdmins() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(ADMINS_FILE)) {
    const defaultAdmin = {
      id: "admin-default",
      email: "hamany01@gmail.com",
      passwordHash: hashPassword("A123@a456@"),
      createdAt: new Date().toISOString()
    };
    fs.writeFileSync(ADMINS_FILE, JSON.stringify([defaultAdmin], null, 2), "utf8");
    console.log("Admins database initialized with primary administrator account.");
  }
}

function readAdmins(): any[] {
  return cachedAdmins;
}

async function writeAdmins(admins: any[]) {
  cachedAdmins = admins;
  try {
    fs.writeFileSync(ADMINS_FILE, JSON.stringify(admins, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing admins (this is fine in read-only environments like Vercel):", err);
  }

  if (useSupabase && supabase) {
    try {
      await Promise.all(
        admins.map(async (admin) => {
          const { error: upsertErr } = await supabase
            .from("admins")
            .upsert({
              id: admin.id,
              email: admin.email,
              password_hash: admin.passwordHash,
              created_at: admin.createdAt
            });
          if (upsertErr) {
            console.error(`Failed to sync writeAdmins to Supabase:`, upsertErr);
          }
        })
      );
    } catch (err) {
      console.error("Failed to sync writeAdmins to Supabase:", err);
    }
  }
}

// Ensure database directory and file exist with seed data
function initDatabase() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2), "utf8");
    console.log("Database initialized with an empty applicants list.");
  }
}

// 1. Read Database Helper
function readDB(): Applicant[] {
  return cachedApplicants;
}

// 2. Generate Application ID Helper
async function generateApplicationId(jobRole?: string): Promise<string> {
  const prefix = jobRole === 'marketing' ? 'MKT' : 'HSE';
  const year = new Date().getFullYear();
  // Filter out any setting entries and filter by role prefix to keep sequence separate
  const roleApplicants = cachedApplicants.filter(a => !a.id.startsWith("SYSTEM_SETTING_") && a.id.startsWith(prefix));
  const index = roleApplicants.length + 1;
  const seq = String(index).padStart(4, "0");
  return `${prefix}-${year}-${seq}`;
}

// 3. Sync Single Applicant to Supabase
async function syncApplicantToSupabase(applicant: Applicant) {
  if (useSupabase && supabase) {
    try {
      const rowData = mapApplicantToSupabase(applicant);
      const { error } = await supabase
        .from("applicants")
        .upsert(rowData);
      if (error) {
        console.error(`Failed to sync applicant ${applicant.id} to Supabase:`, error);
      } else {
        console.log(`Successfully synced applicant ${applicant.id} to Supabase.`);
      }
    } catch (err) {
      console.error(`Failed to sync applicant ${applicant.id} to Supabase:`, err);
    }
  }
}

// 4. Delete Single Applicant from Supabase
async function deleteApplicantFromSupabase(id: string) {
  if (useSupabase && supabase) {
    try {
      const { error } = await supabase
        .from("applicants")
        .delete()
        .eq("id", id);
      if (error) {
        console.error(`Failed to delete applicant ${id} from Supabase:`, error);
      } else {
        console.log(`Successfully deleted applicant ${id} from Supabase.`);
      }
    } catch (err) {
      console.error(`Failed to delete applicant ${id} from Supabase:`, err);
    }
  }
}

// 5. Load Setting Helper
async function getSetting(key: string): Promise<string> {
  const settingId = `SYSTEM_SETTING_${key}`;
  
  if (useSupabase && supabase) {
    try {
      const { data, error } = await supabase
        .from("applicants")
        .select("*")
        .eq("id", settingId)
        .maybeSingle();
      if (!error && data) {
        return data.personal_info?.settingValue || "";
      }
    } catch (err) {
      console.error(`Error loading setting ${key} from Supabase:`, err);
    }
  }

  // Fallback to local cached applicants (as we also store system settings there)
  const localSetting = cachedApplicants.find(a => a.id === settingId);
  if (localSetting) {
    return (localSetting.personalInfo as any).settingValue || "";
  }
  
  // Or read from DB file if not in cache
  try {
    if (fs.existsSync(DB_FILE)) {
      const localApplicants: Applicant[] = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
      const fileSetting = localApplicants.find(a => a.id === settingId);
      if (fileSetting) {
        return (fileSetting.personalInfo as any).settingValue || "";
      }
    }
  } catch (err) {
    console.error(`Error reading setting ${key} from file:`, err);
  }

  return "";
}

// 6. Save Setting Helper
async function saveSetting(key: string, value: string): Promise<void> {
  const settingId = `SYSTEM_SETTING_${key}`;
  
  const settingObj: Applicant = {
    id: settingId,
    status: "pending",
    createdAt: new Date().toISOString(),
    personalInfo: {
      fullName: "SYSTEM SETTING",
      settingValue: value
    } as any,
    industryExperience: {} as any,
    certificates: {} as any,
    examAnswers: {} as any
  };

  // Update in-memory cache
  const idx = cachedApplicants.findIndex(a => a.id === settingId);
  if (idx !== -1) {
    cachedApplicants[idx] = settingObj;
  } else {
    cachedApplicants.push(settingObj);
  }

  // Save local file
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(cachedApplicants, null, 2), "utf8");
  } catch (err) {
    console.error(`Failed to save setting ${key} locally:`, err);
  }

  // Save to Supabase
  if (useSupabase && supabase) {
    try {
      const rowData = mapApplicantToSupabase(settingObj);
      const { error } = await supabase
        .from("applicants")
        .upsert(rowData);
      if (error) {
        console.error(`Failed to save setting ${key} to Supabase:`, error);
      }
    } catch (err) {
      console.error(`Failed to save setting ${key} to Supabase:`, err);
    }
  }
}

// AI client initialization helper
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      aiClient = new GoogleGenAI({ apiKey });
    }
  }
  return aiClient;
}

// AI evaluation helper
async function evaluateApplicantWithAi(applicant: Applicant): Promise<AiEvaluation> {
  const ai = getAiClient();
  const answersLength = Object.values(applicant.examAnswers).reduce((acc, text) => acc + (text?.length || 0), 0);
  const hasPaintExp = applicant.industryExperience.workedInPaint;
  const hasChemicalExp = applicant.industryExperience.workedInChemical;
  const certCount = Object.values(applicant.certificates).filter(Boolean).length;
  const isMarketing = applicant.personalInfo.jobRole === 'marketing';

  if (!ai) {
    console.warn("Using high-fidelity simulated AI evaluation due to missing GEMINI_API_KEY.");
    
    if (isMarketing) {
      let score = 50 + Math.min(applicant.personalInfo.experienceYears * 4, 25);
      if (answersLength > 1500) score += 15;
      else if (answersLength > 800) score += 8;
      
      if (hasPaintExp) score += 10;
      score = Math.min(Math.max(score, 30), 100);

      let rec: "suitable" | "suitable_after_interview" | "unsuitable" = "suitable_after_interview";
      let reason = "المرشح يظهر فهماً جيداً لأساليب التسويق وإدارة العلامات التجارية الرقمية، ونوصي بمقابلة شخصية لمناقشة أفكاره الإبداعية وعرض أعماله السابقة بشكل مفصل.";
      
      if (score >= 85) {
        rec = "suitable";
        reason = "المرشح متميز للغاية في مجال التسويق وإدارة العلامة التجارية ولديه خبرة قيمة وسجل حافل من الحملات الناجحة ومعرض أعمال غني بالأفكار والنتائج الإبداعية الملموسة.";
      } else if (score < 60) {
        rec = "unsuitable";
        reason = "المرشح يفتقر للخبرة الكافية في التسويق المتكامل أو بناء الهوية الرقمية، وإجاباته على الأسئلة المقالية تظهر مهارات محدودة وغير مطابقة للمستوى المطلوب لوظيفة أخصائي تسويق.";
      }

      return {
        score,
        paintChemicalExpLevel: hasPaintExp ? "high" : "none",
        strengths: [
          `خبرة عملية إجمالية قدرها ${applicant.personalInfo.experienceYears} سنوات في التسويق وصناعة المحتوى.`,
          applicant.personalInfo.portfolioBase64 ? "قام بتقديم ورفع ملف عينة من الأعمال السابقة (بورتفوليو) بجودة عالية." : "لديه مهارات جيدة في استخدام الأدوات والتطبيقات الإعلانية وصناعة العلامة التجارية.",
          applicant.industryExperience.workedInPaint ? "لديه فهم ممتاز لكيفية التسويق والترويج لمنتجات الدهانات والمواد الإنشائية الكيميائية B2B/B2C." : "يمتلك معرفة جيدة بإدارة الهوية الرقمية وإعداد الخطط التسويقية المبتكرة."
        ],
        weaknesses: [
          score < 75 ? "قد يحتاج لتطوير مهارات تحليل البيانات العميقة ومؤشرات الأداء التسويقية الحساسة." : "قد يتطلب تكييف استراتيجياته لتلائم قطاع الصناعة المباشرة (B2B).",
          "نوصي بطلب تقديم تفاصيل إضافية عن معدل التحويل والعائد على الاستثمار للحملات السابقة."
        ],
        suggestedQuestions: [
          "كيف تخطط لبناء هوية تسويقية مميزة لمنتج دهانات جديد لمنافسة الأسماء العريقة في السوق؟",
          "ما هي الاستراتيجية الأفضل من وجهة نظرك لجذب عملاء B2B (شركات المقاولات والمشاريع) مقارنة بالمستهلك النهائي (B2C)؟",
          "حدثنا عن مشروع تسويقي واجهت فيه ميزانية محدودة للغاية، وكيف تمكنت من تحقيق نتائج عالية؟"
        ],
        recommendation: rec,
        recommendationReason: reason,
        evaluatedAt: new Date().toISOString()
      };
    } else {
      let score = 50 + Math.min(certCount * 3, 20) + Math.min(applicant.personalInfo.experienceYears * 3, 20);
      if (answersLength > 1500) score += 10;
      else if (answersLength > 800) score += 5;
      
      if (hasPaintExp) score += 10;
      if (hasChemicalExp) score += 10;
      score = Math.min(Math.max(score, 30), 100);

      let rec: "suitable" | "suitable_after_interview" | "unsuitable" = "suitable_after_interview";
      let reason = "المرشح لديه مؤهلات جيدة وخبرة مناسبة بقطاع المصانع، لكن نوصي بمقابلة شخصية للتأكد من مهاراته الميدانية والقيادية.";
      
      if (score >= 85) {
        rec = "suitable";
        reason = "المرشح ممتاز ويتمتع بخبرة واسعة ومخصصة في مصانع الدهانات والمواد الكيميائية ولديه معرفة فنية عالية جداً بسلامة العمليات والوقاية من الانفجارات وشحنات الكهرباء الساكنة.";
      } else if (score < 60) {
        rec = "unsuitable";
        reason = "المرشح لا يمتلك الخبرة الكافية في القطاع أو المعرفة الكافية بإجراءات السلامة ومكافحة الانسكابات.";
      }

      return {
        score,
        paintChemicalExpLevel: hasPaintExp && hasChemicalExp ? "high" : hasPaintExp || hasChemicalExp ? "medium" : "low",
        strengths: [
          `خبرة عملية إجمالية قدرها ${applicant.personalInfo.experienceYears} سنوات في مجال السلامة والصحة المهنية.`,
          `يمتلك ${certCount} شهادات ودورات تدريبية متخصصة في الأمن والسلامة.`,
          applicant.industryExperience.workedInPaint ? "لديه خبرة مباشرة في التعامل مع المخاطر الخاصة بمصانع الدهانات والمذيبات." : "لديه معرفة جيدة بأساسيات الأمن والسلامة الصناعية العامة."
        ],
        weaknesses: [
          score < 75 ? "بحاجة لتعزيز معرفته بالأنظمة والمعايير الدولية للسلامة والصحة المهنية مثل الأوشا (OSHA)." : "نقاط الضعف الفنية تكاد تكون منعدمة ويفضل التركيز على تقييم المهارات السلوكية والقيادية.",
          "نوصي بالتحقق من مدى إلمامه الميداني بسلامة العمليات المعقدة في مصانع الدهانات."
        ],
        suggestedQuestions: [
          "كيف تتعامل مع انسكاب كيميائي مفاجئ لمادة قابلة للاشتعال في قسم الإنتاج؟",
          "اذكر موقفاً واجهت فيه رفضاً من بعض العمال لارتداء معدات الوقاية الشخصية، وكيف تصرفت حيال ذلك؟",
          "ما هي أهم النقاط التي ستركز عليها في جولتك التفتيشية اليومية الأولى في مصنعنا؟"
        ],
        recommendation: rec,
        recommendationReason: reason,
        evaluatedAt: new Date().toISOString()
      };
    }
  }

  // Build the prompt for real Gemini evaluation
  let prompt = "";
  if (isMarketing) {
    prompt = `
أنت خبير تقييم ومقابلات فنية في قطاع التسويق وإدارة العلامات التجارية، مخصص لتقييم المتقدمين لوظيفة "أخصائي تسويق" في مصنع دهانات رائد ومواد كيميائية إنشائية.
قم بتحليل بيانات المرشح وإجاباته الفنية والتسويقية بدقة كاملة، وأعط تقييماً تفصيلياً باللغة العربية الفصحى.

بيانات المرشح:
الاسم الكامل: \${applicant.personalInfo.fullName}
المؤهل العلمي والتخصص: \${applicant.personalInfo.qualification} - \${applicant.personalInfo.major}
سنوات الخبرة: \${applicant.personalInfo.experienceYears} سنة
الشركة الحالية والدور الحالي: \${applicant.personalInfo.currentCompany} - \${applicant.personalInfo.currentRole}

الخبرات الصناعية التخصصية:
- هل عمل في مصنع دهانات؟ \${applicant.industryExperience.workedInPaint ? \`نعم، شركة: \${applicant.industryExperience.paintCompany}، سنوات: \${applicant.industryExperience.paintYears}، دور: \${applicant.industryExperience.paintRole}، مهام: \${applicant.industryExperience.paintTasks}\` : 'لا'}
- هل عمل في مصنع كيميائي أو تسويق؟ \${applicant.industryExperience.workedInChemical ? \`نعم، شركة: \${applicant.industryExperience.chemicalCompany}• سنوات: \${applicant.industryExperience.chemicalYears}• دور: \${applicant.industryExperience.chemicalRole}• مهام: \${applicant.industryExperience.chemicalTasks}\` : 'لا'}
- هل عمل في منشأة صناعية عامة؟ \${applicant.industryExperience.workedInIndustrial ? \`نعم، شركة: \${applicant.industryExperience.industrialCompany}، سنوات: \${applicant.industryExperience.industrialYears}، دور: \${applicant.industryExperience.industrialRole}، مهام: \${applicant.industryExperience.industrialTasks}\` : 'لا'}

الشهادات المهنية والتسويقية التي يمتلكها:
\${Object.entries(applicant.certificates).filter(([_, has]) => has).map(([name]) => name.toUpperCase()).join(", ")}

إجابات الاختبار الفني والتسويقي (المكون من 10 أسئلة مقالية):
السؤال 1- ما هي أبرز الحملات التسويقية التي قمت بتخطيطها وإدارتها سابقاً؟
إجابة المرشح: \${applicant.examAnswers.q1_paint_risks}

السؤال 2- كيف تدير الهوية الرقمية للعلامة التجارية وتصنع المحتوى الإبداعي؟
إجابة المرشح: \${applicant.examAnswers.q2_hazard_vs_risk}

السؤال 3- ما هي خبرتك بالتفصيل في تسجيل واعتماد الشركات لدى منصات الموردين الرسمية والجهات التنظيمية؟
إجابة المرشح: \${applicant.examAnswers.q3_incident_investigation}

السؤال 4- كيف توظف أدوات تحليل البيانات ومؤشرات الأداء (KPIs) لتطوير خطتك التسويقية؟
إجابة المرشح: \${applicant.examAnswers.q4_risk_assessment}

السؤال 5- اذكر بالتفصيل "أعمالاً ومشاريع تسويقية تم تنفيذها" ودورك الدقيق والإبداعي فيها.
إجابة المرشح: \${applicant.examAnswers.q5_ppe_chemical}

السؤال 6- يرجى تزويدنا بروابط أعمالك السابقة أو معرض أعمالك الرقمي (Portfolio) - [أعمال تم تنفيذها].
إجابة المرشح: \${applicant.examAnswers.q6_sds_msds}

السؤال 7- ما هي الأدوات والمنصات الإعلانية وتطبيقات التصميم ومونتاج الفيديو التي تتقن العمل عليها باحترافية؟
إجابة المرشح: \${applicant.examAnswers.q7_flammable_spill}

السؤال 8- كيف تتعامل مع ميزانيات التسويق المحدودة لتحقيق أقصى فاعلية وأعلى معدل تحويل للعملاء؟
إجابة المرشح: \${applicant.examAnswers.q8_ppe_refusal}

السؤال 9- كيف تصمم وتنفذ استراتيجية تسويق لمنتجات مصانع الدهانات والمعاجين (قطاع صناعي B2B و B2C)؟
إجابة المرشح: \${applicant.examAnswers.q9_daily_inspection}

السؤال 10- يرجى تزويدنا بوصف وملخص لملف "عينة من أعمالك السابقة" التي ستقوم برفعها كملف مرفق أدناه.
إجابة المرشح: \${applicant.examAnswers.q10_safety_project}

قم بإرجاع التقييم على شكل كائن JSON متوافق تماماً مع المخطط (Schema) التالي، مع ضمان كتابة جميع النصوص والتحليلات باللغة العربية الفصحى وبأسلوب فني راق واحترافي.
`;
  } else {
    prompt = `
أنت خبير تقييم ومقابلات فنية في الصحة والسلامة والبيئة (HSE) مخصص لتقييم المتقدمين لوظيفة "أخصائي أمن وسلامة" في مصنع دهانات ومواد كيميائية.
قم بتحليل بيانات المرشح وإجاباته الفنية بدقة كاملة، وأعط تقييماً تفصيلياً باللغة العربية الفصحى.

بيانات المرشح:
الاسم الكامل: \${applicant.personalInfo.fullName}
المؤهل العلمي والتخصص: \${applicant.personalInfo.qualification} - \${applicant.personalInfo.major}
سنوات الخبرة: \${applicant.personalInfo.experienceYears} سنة
الشركة الحالية والدور الحالي: \${applicant.personalInfo.currentCompany} - \${applicant.personalInfo.currentRole}

الخبرات الصناعية التخصصية:
- هل عمل في مصنع دهانات؟ \${applicant.industryExperience.workedInPaint ? \`نعم، شركة: \${applicant.industryExperience.paintCompany}، سنوات: \${applicant.industryExperience.paintYears}، دور: \${applicant.industryExperience.paintRole}، مهام: \${applicant.industryExperience.paintTasks}\` : 'لا'}
- هل عمل في مصنع كيميائي؟ \${applicant.industryExperience.workedInChemical ? \`نعم، شركة: \${applicant.industryExperience.chemicalCompany}، سنوات: \${applicant.industryExperience.chemicalYears}، دور: \${applicant.industryExperience.chemicalRole}• مهام: \${applicant.industryExperience.chemicalTasks}\` : 'لا'}
- هل عمل في منشأة صناعية؟ \${applicant.industryExperience.workedInIndustrial ? \`نعم، شركة: \${applicant.industryExperience.industrialCompany}، سنوات: \${applicant.industryExperience.industrialYears}، دور: \${applicant.industryExperience.industrialRole}، مهام: \${applicant.industryExperience.industrialTasks}\` : 'لا'}

الشهادات المهنية التي يمتلكها:
\${Object.entries(applicant.certificates).filter(([_, has]) => has).map(([name]) => name.toUpperCase()).join(", ")}

إجابات الاختبار الفني (المكون من 10 أسئلة مقالية):
السؤال 1- ما أهم المخاطر داخل مصانع الدهانات؟
إجابة المرشح: \${applicant.examAnswers.q1_paint_risks}

السؤال 2- ما الفرق بين الخطر والمخاطرة؟
إجابة المرشح: \${applicant.examAnswers.q2_hazard_vs_risk}

السؤال 3- كيف تحقق في حادث عمل؟
إجابة المرشح: \${applicant.examAnswers.q3_incident_investigation}

السؤال 4- كيف تقوم بإعداد تقييم مخاطر؟
إجابة المرشح: \${applicant.examAnswers.q4_risk_assessment}

السؤال 5- ما معدات الوقاية الشخصية المطلوبة عند التعامل مع المواد الكيميائية؟
إجابة المرشح: \${applicant.examAnswers.q5_ppe_chemical}

السؤال 6- ما هي SDS أو MSDS وما أهميتها؟
إجابة المرشح: \${applicant.examAnswers.q6_sds_msds}

السؤال 7- ماذا ستفعل عند حدوث انسكاب لمادة كيميائية قابلة للاشتعال؟
إجابة المرشح: \${applicant.examAnswers.q7_flammable_spill}

السؤال 8- كيف تتعامل مع موظف يرفض ارتداء معدات الوقاية الشخصية؟
إجابة المرشح: \${applicant.examAnswers.q8_ppe_refusal}

السؤال 9- ما أهم النقاط التي يجب فحصها أثناء الجولة التفتيشية اليومية؟
إجابة المرشح: \${applicant.examAnswers.q9_daily_inspection}

السؤال 10- اذكر مشروعًا أو تحسينًا في السلامة سبق أن شاركت فيه.
إجابة المرشح: \${applicant.examAnswers.q10_safety_project}

قم بإرجاع التقييم على شكل كائن JSON متوافق تماماً مع المخطط (Schema) التالي، مع ضمان كتابة جميع النصوص والتحليلات باللغة العربية الفصحى وبأسلوب فني راق واحترافي.
  `;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["score", "paintChemicalExpLevel", "strengths", "weaknesses", "suggestedQuestions", "recommendation", "recommendationReason"],
          properties: {
            score: {
              type: Type.INTEGER,
              description: "الدرجة النهائية الفنية للمرشح من 100 بناءً على صحة وعمق إجاباته وخبراته وشهاداته."
            },
            paintChemicalExpLevel: {
              type: Type.STRING,
              description: "مستوى خبرة المرشح في مصانع الدهانات والمواد الكيميائية. يجب أن يكون أحد القيم التالية: 'high' أو 'medium' أو 'low' أو 'none'."
            },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "قائمة بنقاط القوة الرئيسية المكتشفة في خلفية وخبرة وإجابات المرشح (3-5 نقاط)."
            },
            weaknesses: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "قائمة بنقاط الضعف أو جوانب النقص الفنية الملاحظة لدى المرشح (2-4 نقاط)."
            },
            suggestedQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 أسئلة مخصصة وموجهة ومبنية على ملف المرشح لطرحها عليه في المقابلة الشخصية."
            },
            recommendation: {
              type: Type.STRING,
              description: "التوصية الفنية للمرشح. يجب أن تكون واحدة من: 'suitable' (مناسب) أو 'suitable_after_interview' (مناسب بعد المقابلة) أو 'unsuitable' (غير مناسب)."
            },
            recommendationReason: {
              type: Type.STRING,
              description: "تفسير مفصل ومهني يبرر سبب هذه التوصية الفنية ومدى ملاءمة المرشح لمصنع الدهانات."
            }
          }
        }
      }
    });

    const resultText = response.text || "{}";
    const cleanJson = resultText.trim();
    const evaluation = JSON.parse(cleanJson) as AiEvaluation;
    evaluation.evaluatedAt = new Date().toISOString();
    return evaluation;

  } catch (error) {
    console.error("Error in Gemini evaluation API:", error);
    // If anything fails or throws, return fallback evaluation matching role
    if (isMarketing) {
      let score = 50 + Math.min(applicant.personalInfo.experienceYears * 4, 25);
      if (answersLength > 1500) score += 15;
      else if (answersLength > 800) score += 8;
      if (hasPaintExp) score += 10;
      score = Math.min(Math.max(score, 30), 100);

      let rec: "suitable" | "suitable_after_interview" | "unsuitable" = "suitable_after_interview";
      let reason = "المرشح يظهر فهماً جيداً لأساليب التسويق وإدارة العلامات التجارية الرقمية، ونوصي بمقابلة شخصية لمناقشة أفكاره الإبداعية وعرض أعماله السابقة بشكل مفصل.";
      if (score >= 85) {
        rec = "suitable";
        reason = "المرشح متميز للغاية في مجال التسويق وإدارة العلامة التجارية ولديه خبرة قيمة وسجل حافل من الحملات الناجحة ومعرض أعمال غني بالأفكار والنتائج الإبداعية الملموسة.";
      } else if (score < 60) {
        rec = "unsuitable";
        reason = "المرشح يفتقر للخبرة الكافية في التسويق المتكامل أو بناء الهوية الرقمية، وإجاباته على الأسئلة المقالية تظهر مهارات محدودة وغير مطابقة للمستوى المطلوب لوظيفة أخصائي تسويق.";
      }

      return {
        score,
        paintChemicalExpLevel: hasPaintExp ? "high" : "none",
        strengths: [
          `خبرة عملية إجمالية قدرها ${applicant.personalInfo.experienceYears} سنوات في التسويق وصناعة المحتوى.`,
          applicant.personalInfo.portfolioBase64 ? "قام بتقديم ورفع ملف عينة من الأعمال السابقة (بورتفوليو) بجودة عالية." : "لديه مهارات جيدة في استخدام الأدوات والتطبيقات الإعلانية وصناعة العلامة التجارية.",
          applicant.industryExperience.workedInPaint ? "لديه فهم ممتاز لكيفية التسويق والترويج لمنتجات الدهانات والمواد الإنشائية الكيميائية B2B/B2C." : "يمتلك معرفة جيدة بإدارة الهوية الرقمية وإعداد الخطط التسويقية المبتكرة."
        ],
        weaknesses: [
          score < 75 ? "قد يحتاج لتطوير مهارات تحليل البيانات العميقة ومؤشرات الأداء التسويقية الحساسة." : "قد يتطلب تكييف استراتيجياته لتلائم قطاع الصناعة المباشرة (B2B).",
          "نوصي بطلب تقديم تفاصيل إضافية عن معدل التحويل والعائد على الاستثمار للحملات السابقة."
        ],
        suggestedQuestions: [
          "كيف تخطط لبناء هوية تسويقية مميزة لمنتج دهانات جديد لمنافسة الأسماء العريقة في السوق؟",
          "ما هي الاستراتيجية الأفضل من وجهة نظرك لجذب عملاء B2B (شركات المقاولات والمشاريع) مقارنة بالمستهلك النهائي (B2C)؟",
          "حدثنا عن مشروع تسويقي واجهت فيه ميزانية محدودة للغاية، وكيف تمكنت من تحقيق نتائج عالية؟"
        ],
        recommendation: rec,
        recommendationReason: reason,
        evaluatedAt: new Date().toISOString()
      };
    }

    let score = 50 + Math.min(certCount * 3, 20) + Math.min(applicant.personalInfo.experienceYears * 3, 20);
    if (answersLength > 1500) score += 10;
    else if (answersLength > 800) score += 5;
    if (hasPaintExp) score += 10;
    if (hasChemicalExp) score += 10;
    score = Math.min(Math.max(score, 30), 100);

    let rec: "suitable" | "suitable_after_interview" | "unsuitable" = "suitable_after_interview";
    let reason = "المرشح لديه مؤهلات جيدة وخبرة مناسبة بقطاع المصانع، لكن نوصي بمقابلة شخصية للتأكد من مهاراته الميدانية والقيادية.";
    if (score >= 85) {
      rec = "suitable";
      reason = "المرشح ممتاز ويتمتع بخبرة واسعة ومخصصة في مصانع الدهانات والمواد الكيميائية ولديه معرفة فنية عالية جداً بسلامة العمليات والوقاية من الانفجارات وشحنات الكهرباء الساكنة.";
    } else if (score < 60) {
      rec = "unsuitable";
      reason = "المرشح لا يمتلك الخبرة الكافية في القطاع أو المعرفة الكافية بإجراءات السلامة ومكافحة الانسكابات.";
    }

    return {
      score,
      paintChemicalExpLevel: hasPaintExp && hasChemicalExp ? "high" : hasPaintExp || hasChemicalExp ? "medium" : "low",
      strengths: [
        `خبرة عملية إجمالية قدرها ${applicant.personalInfo.experienceYears} سنوات في مجال السلامة والصحة المهنية.`,
        `يمتلك ${certCount} شهادات ودورات تدريبية متخصصة في الأمن والسلامة.`,
        applicant.industryExperience.workedInPaint ? "لديه خبرة مباشرة في التعامل مع المخاطر الخاصة بمصانع الدهانات والمذيبات." : "لديه معرفة جيدة بأساسيات الأمن والسلامة الصناعية العامة."
      ],
      weaknesses: [
        score < 75 ? "بحاجة لتعزيز معرفته بالأنظمة والمعايير الدولية للسلامة والصحة المهنية مثل الأوشا (OSHA)." : "نقاط الضعف الفنية تكاد تكون منعدمة ويفضل التركيز على تقييم المهارات السلوكية والقيادية.",
        "نوصي بالتحقق من مدى إلمامه الميداني بسلامة العمليات المعقدة في مصانع الدهانات."
      ],
      suggestedQuestions: [
        "كيف تتعامل مع انسكاب كيميائي مفاجئ لمادة قابلة للاشتعال في قسم الإنتاج؟",
        "اذكر موقفاً واجهت فيه رفضاً من بعض العمال لارتداء معدات الوقاية الشخصية، وكيف تصرفت حيال ذلك؟",
        "ما هي أهم النقاط التي ستركز عليها في جولتك التفتيشية اليومية الأولى في مصنعنا؟"
      ],
      recommendation: rec,
      recommendationReason: reason,
      evaluatedAt: new Date().toISOString()
    };
  }
}

// REST APIs
// 1. Submit Application
app.post("/api/submit", async (req, res) => {
  try {
    const { personalInfo, industryExperience, certificates, examAnswers } = req.body;
    
    const finalPersonalInfo = {
      fullName: "متقدم جديد",
      nationality: "سعودي",
      birthDate: "",
      gender: "male",
      city: "",
      residenceAddress: "",
      phone: "",
      email: "",
      qualification: "بكالوريوس",
      major: "",
      experienceYears: 0,
      currentCompany: "",
      currentRole: "",
      currentSalary: "",
      expectedSalary: "",
      noticePeriod: "",
      ownsCar: "no",
      hasHealthIssues: "no",
      healthIssuesDetails: "",
      hasLocationIssue: "no",
      ...personalInfo
    };

    const newId = await generateApplicationId(finalPersonalInfo.jobRole);
    
    const newApplicant: Applicant = {
      id: newId,
      status: "pending",
      createdAt: new Date().toISOString(),
      personalInfo: finalPersonalInfo,
      industryExperience: industryExperience || {},
      certificates: certificates || {},
      examAnswers: examAnswers || {}
    };

    // Auto-run AI Evaluation
    console.log(`Starting AI evaluation for applicant: ${newId} (${finalPersonalInfo.fullName})`);
    const aiEvaluation = await evaluateApplicantWithAi(newApplicant);
    newApplicant.aiEvaluation = aiEvaluation;

    // Save to file database
    const applicants = readDB();
    applicants.push(newApplicant);
    cachedApplicants = applicants;
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(applicants, null, 2), "utf8");
    } catch (err) {
      console.error("Error writing fallback local database:", err);
    }
    await syncApplicantToSupabase(newApplicant);

    res.status(201).json({
      success: true,
      id: newId,
      status: newApplicant.status,
      aiEvaluation
    });
  } catch (error: any) {
    console.error("Error submitting application:", error);
    res.status(500).json({ error: "حدث خطأ غير متوقع أثناء معالجة طلبك: " + error.message });
  }
});

// GET Company Logo
app.get("/api/logo", async (req, res) => {
  try {
    const logo = await getSetting("company_logo");
    res.json({ logo });
  } catch (error: any) {
    console.error("Error retrieving company logo Setting:", error);
    res.status(500).json({ error: "Failed to retrieve company logo." });
  }
});

// POST Company Logo (Admin only)
app.post("/api/logo", requireAdmin, async (req, res) => {
  try {
    const { logo } = req.body;
    await saveSetting("company_logo", logo || "");
    res.json({ success: true, message: "تم حفظ الشعار في قاعدة البيانات بنجاح." });
  } catch (error: any) {
    console.error("Error saving company logo Setting:", error);
    res.status(500).json({ error: "فشل حفظ الشعار في قاعدة البيانات: " + error.message });
  }
});

// Debug Status Endpoint for troubleshooting Supabase & local persistence on Vercel
app.get("/api/debug-status", (req, res) => {
  initSupabase();
  res.json({
    success: true,
    vercel: !!process.env.VERCEL,
    nodeEnv: process.env.NODE_ENV,
    useSupabase,
    dbInitialized: !!supabase,
    adminsCount: cachedAdmins.length,
    applicantsCount: cachedApplicants.length,
    allEnvKeys: Object.keys(process.env).filter(k => k.includes("SUPABASE") || k.includes("URL")),
    supabaseEnvConfigured: {
      url: !!process.env.SUPABASE_URL,
      publishableKey: !!process.env.SUPABASE_PUBLISHABLE_KEY,
      secretKey: !!process.env.SUPABASE_SECRET_KEY,
      jwksUrl: !!process.env.SUPABASE_JWKS_URL
    }
  });
});

// 2. Admin Login
app.post("/api/admin/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "يرجى إدخال البريد الإلكتروني وكلمة المرور." });
  }

  const admins = readAdmins();
  const admin = admins.find(a => a.email.toLowerCase() === email.toLowerCase().trim());
  
  if (admin && admin.passwordHash === hashPassword(password)) {
    const token = createToken(admin.email);
    res.json({ 
      success: true, 
      token, 
      admin: { id: admin.id, email: admin.email } 
    });
  } else {
    res.status(401).json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى." });
  }
});

// Admin Authorization Middleware (stateless signed token check)
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(403).json({ error: "غير مصرح لك بالوصول. يرجى تسجيل الدخول كمسؤول أولاً." });
  }
  
  const token = authHeader.split(" ")[1];
  const email = verifyToken(token);
  
  if (email) {
    const admins = readAdmins();
    const admin = admins.find(a => a.email.toLowerCase() === email.toLowerCase());
    if (admin) {
      (req as any).adminEmail = email;
      next();
    } else {
      res.status(403).json({ error: "حساب المسؤول هذا غير موجود في النظام." });
    }
  } else {
    res.status(403).json({ error: "جلسة العمل منتهية أو غير صالحة. يرجى تسجيل الدخول مجدداً." });
  }
}

// 2.1 Get current admin info
app.get("/api/admin/me", requireAdmin, (req, res) => {
  const email = (req as any).adminEmail;
  const admins = readAdmins();
  const admin = admins.find(a => a.email.toLowerCase() === email.toLowerCase());
  if (admin) {
    res.json({ id: admin.id, email: admin.email, createdAt: admin.createdAt });
  } else {
    res.status(404).json({ error: "غير موجود." });
  }
});

// 2.2 List admins
app.get("/api/admin/list", requireAdmin, (req, res) => {
  const admins = readAdmins();
  const safeAdmins = admins.map(a => ({
    id: a.id,
    email: a.email,
    createdAt: a.createdAt
  }));
  res.json(safeAdmins);
});

// 2.3 Add new admin
app.post("/api/admin/add-admin", requireAdmin, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "يرجى تحديد البريد الإلكتروني وكلمة المرور للمسؤول الجديد." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "يجب أن تكون كلمة المرور 6 خانات أو أكثر." });
  }

  const admins = readAdmins();
  const exists = admins.some(a => a.email.toLowerCase() === email.toLowerCase().trim());
  if (exists) {
    return res.status(400).json({ error: "هذا البريد الإلكتروني مسجل كمسؤول مسبقاً." });
  }

  const newAdmin = {
    id: "admin-" + Date.now(),
    email: email.toLowerCase().trim(),
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString()
  };

  admins.push(newAdmin);
  await writeAdmins(admins);

  res.json({ success: true, message: "تمت إضافة المسؤول الجديد بنجاح." });
});

// 2.4 Change Password
app.post("/api/admin/change-password", requireAdmin, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: "يرجى إدخال كلمة المرور الحالية والجديدة." });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: "يجب أن تكون كلمة المرور الجديدة 6 خانات أو أكثر." });
  }

  const currentEmail = (req as any).adminEmail;
  const admins = readAdmins();
  const index = admins.findIndex(a => a.email.toLowerCase() === currentEmail.toLowerCase());

  if (index === -1) {
    return res.status(404).json({ error: "لم يتم العثور على حساب المسؤول الحالي." });
  }

  if (admins[index].passwordHash !== hashPassword(oldPassword)) {
    return res.status(400).json({ error: "كلمة المرور الحالية غير صحيحة." });
  }

  admins[index].passwordHash = hashPassword(newPassword);
  await writeAdmins(admins);

  res.json({ success: true, message: "تم تغيير كلمة المرور بنجاح." });
});

// 2.5 Delete Admin
app.delete("/api/admin/delete-admin/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const currentEmail = (req as any).adminEmail;
  const admins = readAdmins();
  const index = admins.findIndex(a => a.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "المسؤول المراد حذفه غير موجود." });
  }

  if (admins[index].email.toLowerCase() === currentEmail.toLowerCase()) {
    return res.status(400).json({ error: "لا يمكنك حذف حساب المسؤول الحالي الذي تستخدمه." });
  }

  if (admins.length <= 1) {
    return res.status(400).json({ error: "لا يمكن حذف آخر مسؤول في النظام لحمايتك من فقدان الدخول." });
  }

  admins.splice(index, 1);
  await writeAdmins(admins);

  if (useSupabase && supabase) {
    try {
      const { error: deleteErr } = await supabase
        .from("admins")
        .delete()
        .eq("id", id);
      if (deleteErr) {
        console.error("Error deleting admin from Supabase:", deleteErr);
      }
    } catch (err) {
      console.error("Error deleting admin from Supabase:", err);
    }
  }

  res.json({ success: true, message: "تم حذف حساب المسؤول بنجاح." });
});

// 3. Get Dashboard Stats
app.get("/api/admin/stats", requireAdmin, (req, res) => {
  let applicants = readDB().filter(a => !a.id.startsWith("SYSTEM_SETTING_"));
  const { jobRole } = req.query;
  
  if (jobRole) {
    const rolePrefix = jobRole === 'marketing' ? 'MKT' : 'HSE';
    applicants = applicants.filter(a => {
      const aRole = a.personalInfo?.jobRole || (a.id.startsWith("MKT") ? "marketing" : "hse");
      return aRole === jobRole;
    });
  }
  
  const total = applicants.length;
  const pending = applicants.filter(a => a.status === "pending").length;
  const reviewing = applicants.filter(a => a.status === "reviewing").length;
  const accepted = applicants.filter(a => a.status === "accepted").length;
  const rejected = applicants.filter(a => a.status === "rejected").length;
  const interview = applicants.filter(a => a.status === "interview").length;
  const waitlist = applicants.filter(a => a.status === "waitlist").length;
  const archived = applicants.filter(a => a.status === "archived").length;
  
  const aiScores = applicants.filter(a => a.aiEvaluation).map(a => a.aiEvaluation!.score);
  const averageAiScore = aiScores.length > 0 ? Math.round(aiScores.reduce((sum, s) => sum + s, 0) / aiScores.length) : 0;
  
  res.json({
    total,
    pending,
    reviewing,
    accepted,
    rejected,
    interview,
    waitlist,
    archived,
    averageAiScore,
    databaseType: useSupabase ? "Supabase" : "Local",
    isSupabaseConnected: useSupabase,
    supabaseUrl: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.replace(/^https:\/\/|\.supabase\.co/g, "") : ""
  });
});

// 4. Get Applicants List (with Search & Filtering)
app.get("/api/admin/applicants", requireAdmin, (req, res) => {
  let applicants = readDB().filter(a => !a.id.startsWith("SYSTEM_SETTING_"));
  
  const { search, status, experience, hrScore, sortBy, sortOrder, manualEval, jobRole } = req.query;
  
  // Filter by jobRole
  if (jobRole) {
    applicants = applicants.filter(a => {
      const aRole = a.personalInfo?.jobRole || (a.id.startsWith("MKT") ? "marketing" : "hse");
      return aRole === jobRole;
    });
  }
  
  // Apply search
  if (search) {
    const q = String(search).toLowerCase();
    applicants = applicants.filter(a => 
      a.personalInfo.fullName.toLowerCase().includes(q) ||
      a.personalInfo.phone.includes(q) ||
      a.id.toLowerCase().includes(q)
    );
  }
  
  // Filter by status
  if (status && status !== "all") {
    applicants = applicants.filter(a => a.status === status);
  }
  
  // Filter by experience years
  if (experience) {
    const exp = String(experience);
    if (exp === "fresh") {
      applicants = applicants.filter(a => a.personalInfo.experienceYears <= 2);
    } else if (exp === "mid") {
      applicants = applicants.filter(a => a.personalInfo.experienceYears > 2 && a.personalInfo.experienceYears <= 5);
    } else if (exp === "senior") {
      applicants = applicants.filter(a => a.personalInfo.experienceYears > 5);
    }
  }

  // Filter by manual evaluation score range
  if (hrScore && hrScore !== "all") {
    const scoreVal = String(hrScore);
    applicants = applicants.filter(a => {
      const score = a.hrEvaluation?.finalScore;
      if (score === undefined) return false;
      if (scoreVal === "90-100") return score >= 90;
      if (scoreVal === "80-89") return score >= 80 && score < 90;
      if (scoreVal === "70-79") return score >= 70 && score < 80;
      if (scoreVal === "60-69") return score >= 60 && score < 70;
      if (scoreVal === "under-60") return score < 60;
      return true;
    });
  }

  // Filter by manual evaluation status
  if (manualEval && manualEval !== "all") {
    if (manualEval === "evaluated") {
      applicants = applicants.filter(a => a.hrEvaluation !== null && a.hrEvaluation !== undefined);
    } else if (manualEval === "pending_evaluation") {
      applicants = applicants.filter(a => a.hrEvaluation === null || a.hrEvaluation === undefined);
    }
  }
  
  // Sort applicants
  const order = sortOrder === "asc" ? 1 : -1;
  if (sortBy === "experience") {
    applicants.sort((a, b) => (a.personalInfo.experienceYears - b.personalInfo.experienceYears) * order);
  } else if (sortBy === "score") {
    applicants.sort((a, b) => {
      const scoreA = a.aiEvaluation?.score || 0;
      const scoreB = b.aiEvaluation?.score || 0;
      return (scoreA - scoreB) * order;
    });
  } else if (sortBy === "hr_score") {
    applicants.sort((a, b) => {
      const scoreA = a.hrEvaluation?.finalScore || 0;
      const scoreB = b.hrEvaluation?.finalScore || 0;
      return (scoreA - scoreB) * order;
    });
  } else if (sortBy === "date") {
    applicants.sort((a, b) => (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * order);
  } else {
    // Default sorting: Newest first
    applicants.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  res.json(applicants);
});

// 5. Get Single Applicant Details
app.get("/api/admin/applicants/:id", requireAdmin, (req, res) => {
  const applicants = readDB();
  const applicant = applicants.find(a => a.id === req.params.id);
  
  if (!applicant) {
    return res.status(404).json({ error: "لم يتم العثور على طلب المتقدم المحدد." });
  }
  
  res.json(applicant);
});

// 6. Update Applicant Status or Human Resource Review
app.patch("/api/admin/applicants/:id/review", requireAdmin, async (req, res) => {
  const { status, hrEvaluation, interviewSchedule, personalInfo, archivedDeptNote } = req.body;
  const applicants = readDB();
  const index = applicants.findIndex(a => a.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: "لم يتم العثور على طلب المتقدم المحدد." });
  }
  
  if (status) {
    applicants[index].status = status;
  }

  if (archivedDeptNote !== undefined) {
    applicants[index].archivedDeptNote = archivedDeptNote;
  }

  if (interviewSchedule !== undefined) {
    applicants[index].interviewSchedule = interviewSchedule;
    if (interviewSchedule === null) {
      if (applicants[index].hrEvaluation) {
        // Delete interviewSchedule property entirely from hrEvaluation
        delete (applicants[index].hrEvaluation as any).interviewSchedule;
        
        // If hrEvaluation has no real rating data, delete hrEvaluation entirely
        const keys = Object.keys(applicants[index].hrEvaluation || {});
        const hasRealData = keys.some(k => k !== 'interviewSchedule' && k !== 'finalScore' && k !== 'reviewedAt' && k !== 'reviewedBy');
        if (!hasRealData) {
          applicants[index].hrEvaluation = undefined;
        }
      }
    } else {
      if (!applicants[index].hrEvaluation) {
        applicants[index].hrEvaluation = {} as any;
      }
      (applicants[index].hrEvaluation as any).interviewSchedule = interviewSchedule;
    }
  }

  if (personalInfo) {
    applicants[index].personalInfo = {
      ...applicants[index].personalInfo,
      ...personalInfo
    };
  }
  
  if (hrEvaluation) {
    const evalData = hrEvaluation as HrEvaluation;
    // Calculate final HR score: sum of all ratings (each rated out of 10) times 1.43 to make it out of 100
    const ratingsSum = 
      (evalData.experienceRating || 0) +
      (evalData.qualificationRating || 0) +
      (evalData.certificatesRating || 0) +
      (evalData.technicalRating || 0) +
      (evalData.writingRating || 0) +
      (evalData.languageRating || 0) +
      (evalData.personalityRating || 0);
    
    // Scale ratingsSum (max 70) to score out of 100
    const finalScore = Math.round((ratingsSum / 70) * 100);
    
    // Preserve existing interview schedule
    const existingSchedule = applicants[index].interviewSchedule || (applicants[index].hrEvaluation as any)?.interviewSchedule;

    applicants[index].hrEvaluation = {
      ...evalData,
      finalScore,
      reviewedAt: new Date().toISOString()
    };

    if (existingSchedule) {
      (applicants[index].hrEvaluation as any).interviewSchedule = existingSchedule;
    }
  }
  
  cachedApplicants = applicants;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(applicants, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing fallback local database:", err);
  }
  await syncApplicantToSupabase(applicants[index]);
  res.json({ success: true, applicant: applicants[index] });
});

// 7. Delete Applicant
app.delete("/api/admin/applicants/:id", requireAdmin, async (req, res) => {
  const applicants = readDB();
  const index = applicants.findIndex(a => a.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: "لم يتم العثور على طلب المتقدم المحدد." });
  }
  
  applicants.splice(index, 1);
  cachedApplicants = applicants;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(applicants, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing fallback local database:", err);
  }
  await deleteApplicantFromSupabase(req.params.id);

  res.json({ success: true, message: "تم حذف طلب المتقدم بنجاح." });
});

// Export the app for serverless environments (like Vercel)
export default app;

// Handle serving the React SPA correctly
async function startServer() {
  // Synchronize database with Supabase on start
  await syncDatabase();

  if (process.env.VERCEL) {
    // On Vercel, request routing for /api/* is handled by serverless functions,
    // and static assets are served directly by the Vercel CDN. We don't need app.listen() or Vite.
    return;
  }

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SPA Fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`HSE Job Application Server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
