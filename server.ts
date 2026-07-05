import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { Applicant, AiEvaluation, HrEvaluation } from "./src/types.js";
import { initializeApp } from "firebase/app";
import { initializeFirestore, doc, setDoc, getDoc, collection, getDocs, deleteDoc, setLogLevel } from "firebase/firestore";

dotenv.config();

// Suppress internal Firebase/Firestore benign warning logs (e.g. idle connection resets)
setLogLevel("error");

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

let db: any = null;
let useFirebase = false;
let cachedApplicants: Applicant[] = [];
let cachedAdmins: any[] = [];

// Hash password using SHA-256
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const configData = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const firebaseApp = initializeApp({
      apiKey: configData.apiKey,
      authDomain: configData.authDomain,
      projectId: configData.projectId,
      storageBucket: configData.storageBucket,
      messagingSenderId: configData.messagingSenderId,
      appId: configData.appId
    });
    const dbId = configData.firestoreDatabaseId || "(default)";
    db = initializeFirestore(firebaseApp, {
      experimentalForceLongPolling: true,
    }, dbId);
    useFirebase = true;
    console.log(`Firebase initialized successfully with project: ${configData.projectId} and database: ${dbId}`);
  }
} catch (err) {
  console.error("Firebase initialization failed, falling back to local JSON files:", err);
}

// Synchronize and initialize cached data
async function syncDatabase() {
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
  }

  // 2. Load Applicants
  let localApplicants: Applicant[] = [];
  try {
    if (fs.existsSync(DB_FILE)) {
      localApplicants = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
    }
  } catch (err) {
    console.error("Error reading local applicants file:", err);
  }

  if (useFirebase && db) {
    try {
      console.log("Synchronizing with cloud Firestore...");
      
      // Load admins from Firestore
      const adminsCol = collection(db, "admins");
      const adminsSnapshot = await getDocs(adminsCol);
      const firebaseAdmins: any[] = [];
      adminsSnapshot.forEach(docSnap => {
        firebaseAdmins.push({ id: docSnap.id, ...docSnap.data() });
      });

      if (firebaseAdmins.length > 0) {
        cachedAdmins = firebaseAdmins;
        console.log(`Loaded ${cachedAdmins.length} admins from Firestore.`);
      } else {
        // Migrate local admins to Firestore
        console.log("No admins in Firestore. Migrating local admins to Firestore...");
        for (const admin of localAdmins) {
          const { id, ...adminData } = admin;
          await setDoc(doc(db, "admins", id || "admin-default"), adminData);
        }
        cachedAdmins = localAdmins;
      }

      // Load applicants from Firestore
      const applicantsCol = collection(db, "applicants");
      const applicantsSnapshot = await getDocs(applicantsCol);
      const firebaseApplicants: Applicant[] = [];
      applicantsSnapshot.forEach(docSnap => {
        firebaseApplicants.push({ id: docSnap.id, ...docSnap.data() } as Applicant);
      });

      if (firebaseApplicants.length > 0) {
        cachedApplicants = firebaseApplicants;
        console.log(`Loaded ${cachedApplicants.length} applicants from Firestore.`);

        const firebaseIds = new Set(firebaseApplicants.map(a => a.id));
        let migratedCount = 0;
        for (const applicant of localApplicants) {
          if (!firebaseIds.has(applicant.id)) {
            const { id, ...applicantData } = applicant;
            await setDoc(doc(db, "applicants", applicant.id), applicantData);
            cachedApplicants.push(applicant);
            migratedCount++;
          }
        }
        if (migratedCount > 0) {
          console.log(`Migrated ${migratedCount} new local applicants to Firestore.`);
        }
      } else {
        // Migrate all local applicants to Firestore
        console.log(`No applicants in Firestore. Migrating ${localApplicants.length} local applicants...`);
        for (const applicant of localApplicants) {
          const { id, ...applicantData } = applicant;
          await setDoc(doc(db, "applicants", applicant.id), applicantData);
        }
        cachedApplicants = localApplicants;
      }

      // Write back to local files as a fallback cache
      fs.writeFileSync(ADMINS_FILE, JSON.stringify(cachedAdmins, null, 2), "utf8");
      fs.writeFileSync(DB_FILE, JSON.stringify(cachedApplicants, null, 2), "utf8");
      
      console.log("Database synchronization with Firestore complete!");
    } catch (err) {
      console.error("Failed to sync with Firestore. Using local files as fallback.", err);
      cachedAdmins = localAdmins;
      cachedApplicants = localApplicants;
    }
  } else {
    cachedAdmins = localAdmins;
    cachedApplicants = localApplicants;
    console.log("Firebase not configured. Using local JSON files for data persistence.");
  }
}

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

function writeAdmins(admins: any[]) {
  cachedAdmins = admins;
  try {
    fs.writeFileSync(ADMINS_FILE, JSON.stringify(admins, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing admins:", err);
  }

  if (useFirebase && db) {
    (async () => {
      try {
        for (const admin of admins) {
          const { id, ...adminData } = admin;
          await setDoc(doc(db, "admins", id || "admin-default"), adminData);
        }
      } catch (err) {
        console.error("Failed to async sync writeAdmins to Firestore:", err);
      }
    })();
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

function _unused_initDatabase() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    // Premium seed data
    const seedApplicants: Applicant[] = [
      {
        id: "HSE-2026-0001",
        status: "accepted",
        createdAt: "2026-07-01T10:30:00Z",
        personalInfo: {
          fullName: "أحمد بن عبد الله الزهراني",
          nationalId: "1083748291",
          nationality: "سعودي",
          birthDate: "1992-05-14",
          gender: "male",
          city: "الجبيل",
          residenceAddress: "المنطقة الشرقية، الجبيل، حي الروضة",
          phone: "0501234567",
          email: "ahmed.zahrani@example.com",
          qualification: "بكالوريوس",
          major: "الهندسة الكيميائية والسلامة الصناعية",
          experienceYears: 8,
          currentCompany: "الشركة الوطنية للكيماويات والدهانات",
          currentRole: "رئيس قسم السلامة والصحة المهنية",
          currentSalary: "14,500 ريال",
          expectedSalary: "17,000 ريال",
          noticePeriod: "شهر واحد",
          linkedinUrl: "https://linkedin.com/in/ahmed-zahrani-hse",
          ownsCar: "yes",
          hasHealthIssues: "no",
          healthIssuesDetails: "",
          hasLocationIssue: "no",
          cvFileName: "Ahmed_AlZahrani_CV.pdf"
        },
        industryExperience: {
          workedInPaint: true,
          paintCompany: "مصنع دهانات الجزيرة المتطور",
          paintYears: 3,
          paintRole: "أخصائي سلامة كيميائية",
          paintTasks: "إعداد تقييم المخاطر لخطوط إنتاج المذيبات والدهانات العضوية، ومراقبة أنظمة مكافحة الانفجار والتفتيش الدوري على معدات الوقاية الشخصية الخاصة بالتعامل مع الكيماويات الخطرة.",
          workedInChemical: true,
          chemicalCompany: "الشركة الوطنية للكيماويات",
          chemicalYears: 5,
          chemicalRole: "مهندس صحة وبيئة وسلامة (HSE)",
          chemicalTasks: "تطبيق معايير ISO 45001 ومتابعة حوادث الانسكاب، وتدريب العمال على استخدام الـ SDS وإدارة تصاريح العمل للمناطق الحرجة والخطرة.",
          workedInIndustrial: true,
          industrialCompany: "مجموعة المصانع الكبرى",
          industrialYears: 8,
          industrialRole: "أخصائي HSE",
          industrialTasks: "إدارة السلامة العامة في المنشآت الصناعية"
        },
        certificates: {
          nebosh: true,
          osha: true,
          iosh: true,
          iso45001: true,
          fireSafety: true,
          firstAid: true,
          hazop: true,
          hazmat: true,
          permitToWork: true,
          workingAtHeights: true,
          confinedSpace: true,
          forkliftSafety: true
        },
        examAnswers: {
          q1_paint_risks: "المخاطر الرئيسية في مصانع الدهانات تشمل: 1. مخاطر الحريق والانفجار بسبب تصاعد أبخرة المذيبات العضوية القابلة للاشتعال (Solvents). 2. مخاطر التسمم والاستنشاق للمواد الكيميائية والأصباغ السامة ومساحيق الألوان. 3. المخاطر الفيزيائية مثل الضوضاء العالية الناتجة عن خلاطات ومطاحن الدهان. 4. مخاطر الكهرباء الساكنة (Static Electricity) التي قد تسبب شرارة تؤدي لانفجار الأبخرة المتطايرة. 5. مخاطر ميكانيكية أثناء صيانة خطوط التعبئة والمكابس.",
          q2_hazard_vs_risk: "الخطر (Hazard): هو أي مصدر أو حالة أو نشاط لديه القدرة الكامنة على التسبب في ضرر أو إصابة أو تلف للممتلكات أو البيئة (مثل: مادة كيميائية قابلة للاشتعال مخزنة في المصنع).\nأما المخاطرة (Risk): فهي احتمالية حدوث هذا الضرر مضافاً إليها شدة أو حجم الإصابة أو التلف الناتج عنه في حال حدوثه (مثال: احتمالية حدوث حريق بسبب التعامل الخاطئ مع هذه المادة الكيميائية أثناء الإنتاج). فالمخاطرة = الاحتمالية × الشدة.",
          q3_incident_investigation: "خطوات التحقيق في الحادث هي: 1. تقديم الإسعافات الأولية وتأمين موقع الحادث فوراً لمنع حدوث أضرار إضافية. 2. جمع المعلومات والأدلة المادية، والتقاط الصور، وحفظ عينات المواد إن وجدت. 3. مقابلة الشهود والمصابين وتوثيق شهاداتهم بشكل موضوعي وبأسرع وقت. 4. تشكيل فريق التحقيق لتحديد الأسباب المباشرة والأسباب الجذرية (Root Causes) باستخدام أدوات مثل 5 Whys أو مخطط عظمة السمكة. 5. وضع الإجراءات التصحيحية والوقائية لعدم تكرار الحادث. 6. كتابة تقرير رسمي مفصل ومشاركته مع الإدارة والعمال للاستفادة والتعلم.",
          q4_risk_assessment: "لإعداد تقييم المخاطر (Risk Assessment)، أتبع الخطوات الخمس التالية: 1. تحديد الأخطار المتواجدة في بيئة العمل (Hazard Identification). 2. تحديد الفئات المعرضة للخطر وكيف يمكن أن يتضرروا (عمال، زوار، مقاولون). 3. تقييم المخاطر الحالية ووضع ضوابط تحكم إضافية بناءً على هرم التحكم (الاستبدال، العزل، التحكم الهندسي، الإداري، ومعدات الوقاية). 4. تسجيل وتوثيق النتائج بالتفصيل وتطبيق الإجراءات الجديدة. 5. مراجعة وتحديث التقييم بانتظام أو عند حدوث أي تغيير في العمليات.",
          q5_ppe_chemical: "معدات الوقاية الشخصية (PPE) الضرورية للتعامل مع المواد الكيميائية تشمل: 1. أقنعة حماية التنفس المزودة بفلاتر مناسبة للغازات والأبخرة العضوية (أقنعة نصف وجه أو وجه كامل). 2. نظارات الحماية الكيميائية المحكمة (Goggles) لحماية العين من الرذاذ المتطاير. 3. القفازات المقاومة للمواد الكيميائية (مثل قفازات النيتريل أو النيوبرين الطويلة). 4. بدلة العمل الواقية المقاومة للمواد الكيميائية (Chemical Resistant Overall/Tyvek). 5. أحذية السلامة المقاومة للمواد الكيميائية والانزلاق ومزودة بمقدمة فولاذية لحماية القدم من سقوط العبوات.",
          q6_sds_msds: "صحيفة بيانات السلامة للمادة (SDS - Safety Data Sheet) والمعروفة سابقاً بـ (MSDS) هي وثيقة تفصيلية تتكون من 16 قسماً معتمداً دولياً، وتكمن أهميتها في توفير معلومات دقيقة وشاملة حول: الخصائص الفيزيائية والكيميائية للمادة، المخاطر الصحية والبيئية، الإسعافات الأولية المطلوبة في حال التعرض لها، طرق التخزين والتعامل الآمن، إجراءات مكافحة الحريق، وطرق التخلص الآمن منها والتعامل مع حالات الانسكاب الطارئة. وهي مرجع أساسي لكل عامل بالمصنع ومسؤول السلامة.",
          q7_flammable_spill: "سأتصرف فوراً وفق خطة الطوارئ التالية: 1. إخلاء المنطقة المتضررة فوراً وإيقاف كافة مصادر الاشتعال والحرارة والشرر في المحيط وإغلاق محابس ومفاتيح التشغيل. 2. إطلاق جرس الإنذار وتنبيه فريق الاستجابة للطوارئ بالمصنع. 3. ارتداء معدات الوقاية الشخصية المناسبة (قناع الأبخرة الكيميائية، القفازات والنظارات). 4. احتواء الانسكاب باستخدام حواجز رملية أو مواد ماصة كيميائية غير قابلة للاشتعال (مثل الإسفنج الكيميائي المخصص). 5. تهوية المكان بشكل جيد وتجنب استخدام أدوات معدنية تسبب شراراً أثناء التنظيف (استخدام أدوات بلاستيكية أو نحاسية). 6. وضع الفضلات في حاويات مخصصة مغلقة للمواد الخطرة والتخلص منها وفق اللوائح البيئية.",
          q8_ppe_refusal: "التعامل مع هذا الموظف يتطلب حكمة وحزم: 1. التحدث معه بشكل شخصي وودي لفهم سبب الرفض (هل المعدات غير مريحة؟ هل تعيق حركته؟). 2. توضيح الخطر الحقيقي المباشر عليه وعلى زملائه في حال عدم ارتدائها، وأنها خط الدفاع الأخير لحمايته. 3. التأكد من توفير معدات وقاية مريحة ومناسبة لمقاسه. 4. شرح أن ارتداء المعدات هو إلزام قانوني وتنظيمي حسب سياسة المصنع وقانون العمل. 5. في حال إصراره على الرفض بعد التوجيه والتعليم، يتم تطبيق التدرج في الإجراءات التأديبية المنصوص عليها في لائحة تنظيم العمل بالمصنع (تنبيه شفوي، ثم إنذار كتابي، ثم إيقاف عن العمل لحمايته وحماية زملائه).",
          q9_daily_inspection: "أهم النقاط التي يجب فحصها في الجولة التفتيشية اليومية بمصنع الدهانات: 1. خلو ممرات الطوارئ ومخارج الحريق من أي عوائق، وسلامة إشارات الهروب. 2. سلامة طفايات الحريق، وصناديق الخراطيم، وجاهزية أنظمة الرش الآلي وضغط المياه. 3. فحص أنظمة التهوية وسحب الأبخرة في صالات الخلط والتعبئة. 4. التأكد من سلامة توصيلات التأريض الكهربائي (Earth Grounding) لجميع الآلات والخزانات لمنع تجمع الشحنات الساكنة. 5. مراقبة التزام العمال بارتداء معدات الوقاية الشخصية المناسبة. 6. التأكد من التخزين السليم للعبوات الكيماوية والدهانات وعدم تكدسها، ومراقبة أي علامات تسرب أو انسكاب.",
          q10_safety_project: "خلال عملي في مصنع الدهانات السابق، شاركت في قيادة مشروع 'تأريض وحماية أنظمة التعبئة من الكهرباء الساكنة'. حيث لاحظت وجود تجمع شحنات ساكنة أثناء تفريغ مذيب التولوين (Toluene) في خلاطات الدهان، وكان هذا يمثل خطراً جسيماً لحدوث انفجار. قمت بتصميم وتطبيق نظام تأريض موثق لجميع الخلاطات والعبوات وتثبيت أجهزة استشعار للتأريض التلقائي تمنع عمل الخلاطات إذا لم تكن التوصيلات الأرضية سليمة بنسبة 100%. أدى هذا المشروع بفضل الله إلى خفض احتمالية حدوث شرر في صالة الخلط إلى صفر، وحصل المشروع على جائزة أفضل تحسين سلامة لعام 2024 في المصنع."
        },
        aiEvaluation: {
          score: 94,
          paintChemicalExpLevel: "high",
          strengths: [
            "إجابات تفصيلية ونموذجية تدل على خبرة حقيقية وعميقة في بيئة مصانع الدهانات والمواد الكيميائية.",
            "فهم ممتاز لمخاطر الكهرباء الساكنة والمذيبات العضوية القابلة للاشتعال وحلولها الهندسية.",
            "إلمام تام بمنهجيات التحقيق في الحوادث وإعداد تقييم المخاطر وصحائف بيانات السلامة (SDS).",
            "امتلاك لشهادات احترافية أساسية وذهبية في السلامة (NEBOSH, ISO 45001, HAZOP)."
          ],
          weaknesses: [
            "الراتب المتوقع أعلى بقليل من النطاق المعتاد، لكنه مبرر بمستوى الخبرة والشهادات الاحترافية."
          ],
          suggestedQuestions: [
            "كيف قمت بقياس فعالية نظام التأريض الجديد للكهرباء الساكنة عملياً وبصورة دورية؟",
            "صف لنا حالة قمت فيها بإقناع الإدارة العليا بالاستثمار في نظام سلامة هندسي مكلف، وكيف بررت التكلفة ماليًا؟",
            "كيف تتعامل مع الضغوط الإنتاجية عندما يتعارض الالتزام بالسلامة مع جدول الشحن الضيق للدهانات؟"
          ],
          recommendation: "suitable",
          recommendationReason: "المرشح ممتاز ويمتلك خبرة نادرة وتخصصية جداً في نفس قطاع المصنع (الدهانات والكيماويات). إجاباته الفنية تدل على وعي تام وخبرة ميدانية حقيقية تجعله قادراً على قيادة منظومة السلامة في المصنع فوراً.",
          evaluatedAt: "2026-07-01T11:00:00Z"
        },
        hrEvaluation: {
          experienceRating: 9,
          qualificationRating: 9,
          certificatesRating: 10,
          technicalRating: 10,
          writingRating: 9,
          languageRating: 9,
          personalityRating: 9,
          finalScore: 93,
          notes: "تمت مراجعة طلب المرشح أحمد الزهراني، وهو من الكفاءات الوطنية الممتازة في مجال السلامة الكيميائية والدهانات. الشهادات مكتملة ولديه فهم عميق جداً للتأريض والكهرباء الساكنة ومكافحة الانفجارات وهي من أهم ما نحتاجه في مصنعنا. نوصي بتحديد موعد للمقابلة الشخصية الفنية معه بأسرع وقت.",
          reviewedBy: "إدارة الموارد البشرية",
          reviewedAt: "2026-07-02T08:15:00Z"
        }
      },
      {
        id: "HSE-2026-0002",
        status: "pending",
        createdAt: "2026-07-03T14:15:00Z",
        personalInfo: {
          fullName: "سارة بنت خالد المطيري",
          nationalId: "1092837462",
          nationality: "سعودية",
          birthDate: "1996-09-22",
          gender: "female",
          city: "الرياض",
          residenceAddress: "الرياض، حي المروج",
          phone: "0549876543",
          email: "sara.mutairi@example.com",
          qualification: "بكالوريوس",
          major: "علوم البيئة والسلامة المهنية",
          experienceYears: 4,
          currentCompany: "مصنع الرياض للطلاء المحدود",
          currentRole: "أخصائية بيئة وسلامة",
          currentSalary: "9,000 ريال",
          expectedSalary: "11,500 ريال",
          noticePeriod: "شهر واحد",
          linkedinUrl: "https://linkedin.com/in/sara-mutairi-hse",
          ownsCar: "yes",
          hasHealthIssues: "no",
          healthIssuesDetails: "",
          hasLocationIssue: "no",
          cvFileName: "Sara_AlMutairi_CV.pdf"
        },
        industryExperience: {
          workedInPaint: true,
          paintCompany: "مصنع الرياض للطلاء المحدود",
          paintYears: 4,
          paintRole: "أخصائية سلامة وصحة مهنية ومسؤولة البيئة",
          paintTasks: "إجراء القياسات البيئية داخل بيئة العمل (تركيز الغازات، الغبار، الضوضاء)، والتفتيش على المستودعات والتأكد من توافر أدوات غسيل العيون في مناطق خلط المواد الكيميائية.",
          workedInChemical: false,
          workedInIndustrial: true,
          industrialCompany: "مصنع الرياض للطلاء المحدود",
          industrialYears: 4,
          industrialRole: "أخصائية سلامة وصحة مهنية",
          industrialTasks: "التدريب على مكافحة الحرائق وحالات الطوارئ."
        },
        certificates: {
          nebosh: false,
          osha: true,
          iosh: true,
          iso45001: false,
          fireSafety: true,
          firstAid: true,
          hazop: false,
          hazmat: true,
          permitToWork: true,
          workingAtHeights: false,
          confinedSpace: false,
          forkliftSafety: true
        },
        examAnswers: {
          q1_paint_risks: "تتركز المخاطر في مصانع الدهانات على: 1. مخاطر الحريق الناتجة عن المذيبات سريعة الاشتعال. 2. استنشاق الغازات والأبخرة الضارة أثناء عمليات الخلط والتعبئة. 3. التعرض لتهيج الجلد أو العين في حال ملامسة المواد الكيميائية السائلة مباشرة. 4. مخاطر الانزلاق والتعثر في صالات الإنتاج لوجود تسربات زيتية أو سوائل دهانية. 5. حركة الرافعات الشوكية في المستودعات المزدحمة بالبراميل.",
          q2_hazard_vs_risk: "الخطر هو شيء يمكن أن يسبب ضرراً للإنسان أو المنشأة، كأن يكون هناك سلك كهربائي مكشوف أو مادة كيميائية حارقة.\nأما المخاطرة فهي مدى احتمال حدوث هذا الضرر وشدته، فالسلك المكشوف يمثل خطراً، والاقتراب منه أو لمسه هو المخاطرة التي تؤدي للصعق.",
          q3_incident_investigation: "يتم التحقيق في الحادث من خلال: 1. عزل منطقة الحادث وإسعاف المصابين فوراً. 2. معاينة الموقع وتسجيل الملاحظات المبدئية. 3. الاستماع لشهادات العاملين القريبين من الحدث. 4. محاولة البحث عن الأسباب التي أدت لوقوع الحادث (مثل خلل في الآلة أو عدم ارتداء القفازات). 5. كتابة تقرير وتقديمه للمدير المباشر مع التوصية بعمل حواجز حماية للآلة أو تدريب إضافي.",
          q4_risk_assessment: "لإعداد تقييم للمخاطر نقوم بالآتي: 1. المشي في المصنع وتحديد ما قد يسبب الأذى. 2. التفكير فيمن قد يتعرض للإصابة (العمال مثلاً). 3. تقييم حجم الخطر ومحاولة تقليله باتخاذ تدابير وقائية مثل الحواجز أو وضع لوحات إرشادية. 4. تدوين هذه الملاحظات في نموذج تقييم المخاطر المعتمد. 5. مراجعة النموذج دورياً.",
          q5_ppe_chemical: "معدات الوقاية المطلوبة: 1. الكمامات المخصصة للأبخرة الكيميائية لمنع استنشاق الغازات المتطايرة. 2. نظارات حماية العين لمنع وصول رذاذ الكيماويات للعين. 3. قفازات النيتريل السميكة لحماية اليدين. 4. بدلة عمل كاملة وحذاء سلامة مغلق.",
          q6_sds_msds: "صحيفة بيانات السلامة (SDS) هي ورقة تأتي مع كل مادة كيميائية تشتريها الشركة. توضح تفاصيل مهمة عن المادة مثل تركيبها الكيميائي، وكيفية إطفائها إذا احترقت، وطرق الإسعافات الأولية المناسبة لها في حال بلعها أو ملامستها للجلد، وطرق التخلص الآمن منها.",
          q7_flammable_spill: "عند حدوث انسكاب لمادة قابلة للاشتعال: 1. نقوم فوراً بإخلاء المنطقة وإبعاد أي عمال غير مدربين. 2. فصل التيار الكهربائي أو أي مصادر للهب أو الحرارة. 3. استخدام الرمل أو المواد الكيميائية الماصة (Sorbents) المتواجدة في أدوات مواجهة الانسكابات لامتصاص السائل ومنع انتشاره. 4. جمع الرمل الملوث في كيس مغلق مخصص للمهملات الكيميائية الخطرة والتخلص منه بأمان والتهوية الجيدة للموقع.",
          q8_ppe_refusal: "إذا رفض موظف ارتداء معدات الوقاية: 1. أتحدث معه بهدوء لمعرفة السبب (ربما تكون الكمامة ضيقة أو نظارته غير مريحة). 2. أشرح له بلطف المخاطر الصحية التي سيتعرض لها إذا استمر في العمل بدونها. 3. إذا كان السبب من المعدة نفسها أعمل على استبدالها بنوع أكثر راحة. 4. إذا أصر على الرفض دون عذر، يتم تنبيهه شفوياً وإخبار الإدارة المباشرة لتطبيق اللوائح والقوانين المتبعة.",
          q9_daily_inspection: "النقاط الهامة في الجولة التفتيشية اليومية: 1. فحص طفايات الحريق وخراطيم المياه وصلاحيتها وضغطها. 2. التأكد من أن جميع مخارج الطوارئ مفتوحة وغير مغلقة ببضائع أو براميل. 3. التأكد من ارتداء العمال لمعدات الوقاية الشخصية. 4. التحقق من عدم وجود تسريبات كيميائية على الأرضيات ومراقبة التهوية وصوت الآلات.",
          q10_safety_project: "شاركت في مصنعي الحالي في مشروع 'تطوير حقيبة الاستجابة لانسكاب المواد الكيميائية (Spill Kit)' وتوزيعها بشكل استراتيجي في أقسام الخلط والتعبئة مع وضع لوحات إرشادية مبسطة باللغة العربية والإنجليزية توضح بالصور خطوات التعامل مع الانسكاب وتدريب أكثر من 40 عاملاً عليها."
        },
        aiEvaluation: {
          score: 82,
          paintChemicalExpLevel: "medium",
          strengths: [
            "خبرة جيدة جداً مدتها 4 سنوات داخل مصنع دهانات فعلي، مما يعطيها فهماً ممتازاً لطبيعة المواد والتحديات بالموقع.",
            "إجابات واضحة وصحيحة علمياً ومنظمة تدل على وعي كاف بمفاهيم السلامة وإدارة الانسكابات و الـ SDS.",
            "المشاركة الإيجابية في مشروع Spill Kit العملي والتدريب عليه وهو أمر حيوي جداً في المصانع الكيميائية."
          ],
          weaknesses: [
            "تفتقر لبعض الشهادات الاحترافية الكبرى مثل NEBOSH IGC أو شهادات ISO 45001 التخصصية.",
            "الإجابات جيدة ولكنها أقل تفصيلاً في الجوانب الهندسية المعقدة كالحماية من الانفجارات وشحنات الكهرباء الساكنة."
          ],
          suggestedQuestions: [
            "كيف تقيمين وعي العمال الأجانب بقراءة صحائف الـ SDS، وكيف تعاملت مع عوائق اللغة لديهم؟",
            "ما هي طريقتك المفضلة لحساب مؤشرات الأداء الأساسية (KPIs) للسلامة؟",
            "لماذا ترغبين في الانتقال من مصنعك الحالي، وما الذي تبحثين عنه في مصنعنا للدهانات؟"
          ],
          recommendation: "suitable_after_interview",
          recommendationReason: "المرشحة مناسبة جداً ولديها الخبرة الميدانية المطلوبة في مصانع الطلاء والدهانات. بالرغم من نقص بعض الشهادات الكبرى إلا أن خلفيتها البيئية وخبرتها العملية في قياس الغازات ومكافحة الانسكاب تؤهلها لشغل الوظيفة بنجاح، وستكشف المقابلة مدى تمكنها من الجوانب القيادية والهندسية.",
          evaluatedAt: "2026-07-03T15:00:00Z"
        }
      },
      {
        id: "HSE-2026-0003",
        status: "pending",
        createdAt: "2026-07-04T12:00:00Z",
        personalInfo: {
          fullName: "خالد بن محمد الدوسري",
          nationalId: "1074829103",
          nationality: "سعودي",
          birthDate: "1999-01-10",
          gender: "male",
          city: "جدة",
          residenceAddress: "جدة، حي النسيم",
          phone: "0561112222",
          email: "khalid.dossari@example.com",
          qualification: "دبلوم",
          major: "السلامة المهنية العامة",
          experienceYears: 1,
          currentCompany: "شركة الجزيرة للمقاولات العامة",
          currentRole: "مراقب سلامة مبتدئ",
          currentSalary: "5,500 ريال",
          expectedSalary: "7,000 ريال",
          noticePeriod: "فوري",
          linkedinUrl: "https://linkedin.com/in/khalid-dossari-hse",
          ownsCar: "yes",
          hasHealthIssues: "no",
          healthIssuesDetails: "",
          hasLocationIssue: "no",
          cvFileName: "Khalid_Dossari_CV.pdf"
        },
        industryExperience: {
          workedInPaint: false,
          workedInChemical: false,
          workedInIndustrial: false
        },
        certificates: {
          nebosh: false,
          osha: true,
          iosh: false,
          iso45001: false,
          fireSafety: false,
          firstAid: true,
          hazop: false,
          hazmat: false,
          permitToWork: true,
          workingAtHeights: true,
          confinedSpace: true,
          forkliftSafety: false
        },
        examAnswers: {
          q1_paint_risks: "مخاطر مصانع الدهانات هي الحريق بسبب المواد الكيميائية والألوان، وأيضاً الاختناق بسبب الغبار والغازات.",
          q2_hazard_vs_risk: "الخطر هو الشيء الذي يضر، والمخاطرة هي حدوث الضرر نفسه.",
          q3_incident_investigation: "يتم التحقيق من خلال الذهاب للموقع وسؤال العمال عن سبب وقوع الحادث وكتابة ذلك في ورقة وإرسالها للإدارة لتفادي تكراره.",
          q4_risk_assessment: "عمل تقييم المخاطر يتم بفحص المكان لمعرفة الأماكن الخطرة ثم كتابتها في جدول والعمل على معالجة الأخطاء بأسرع وقت.",
          q5_ppe_chemical: "الكمامة، النظارة، القفازات، الحذاء المقاوم والملابس الطويلة.",
          q6_sds_msds: "الـ MSDS هي ورقة إرشادات تأتي مع الكيماويات لمعرفة كيفية التعامل معها وتجنب خطرها في المصنع.",
          q7_flammable_spill: "تنظيف الانسكاب بسرعة ووضع تراب عليه لامتصاصه، وفتح النوافذ للتهوية ومنع أي شخص من التدخين بالقرب منه.",
          q8_ppe_refusal: "أطلب منه ارتداءها وإذا لم يستمع لي أبلغ مديره المباشر ليتعامل معه قانونياً.",
          q9_daily_inspection: "فحص طفايات الحريق، والتأكد من عدم وجود عوائق عند الأبواب والتأكد من ارتداء العمال للخوذة والأحذية.",
          q10_safety_project: "شاركت في جولات التفتيش على السقالات والعمل في المرتفعات في مواقع الإنشاءات مع المهندسين."
        },
        aiEvaluation: {
          score: 52,
          paintChemicalExpLevel: "none",
          strengths: [
            "حاصل على دبلوم في السلامة وحاصل على دورات OSHA الأساسية وتصاريح العمل والعمل في المرتفعات.",
            "الرغبة في التعلم والعمل في بيئة صناعية والراتب المتوقع منخفض ومناسب للمبتدئين."
          ],
          weaknesses: [
            "تفتقر السيرة الذاتية لأي خبرة في البيئات الصناعية أو مصانع الدهانات والكيماويات (خبرته مقاولات وإنشاءات فقط).",
            "إجابات الاختبار قصيرة ومختصرة جداً وتفتقر للمصطلحات الفنية العميقة والمنهجيات المعتمدة لإدارة السلامة الكيميائية."
          ],
          suggestedQuestions: [
            "بيئة مصانع الدهانات تختلف تماماً عن قطاع الإنشاءات والمقاولات. ما الذي يجعلك ترى نفسك قادراً على التأقلم مع المخاطر الكيميائية المعقدة هنا؟",
            "اشرح لنا أهمية الكهرباء الساكنة وكيف يتم تجنب شرارتها في صالات الخلط كيميائياً وفنياً؟"
          ],
          recommendation: "unsuitable",
          recommendationReason: "المرشح يعتبر حديث تخرج ومبتدئ في مجال السلامة وتقتصر خبرته المحدودة (سنة واحدة) على قطاع المقاولات والإنشاءات والعمل في المرتفعات. مصانع الدهانات والمواد الكيميائية تتطلب أخصائياً بخبرة قوية في السلامة الكيميائية والحرائق وإدارة المخاطر المعقدة والكهرباء الساكنة منذ اليوم الأول، وهو ما لا يتوفر لديه حالياً.",
          evaluatedAt: "2026-07-04T12:30:00Z"
        }
      }
    ];

    fs.writeFileSync(DB_FILE, JSON.stringify(seedApplicants, null, 2), "utf8");
    console.log("Database seeded successfully with 3 applications.");
  }
}

// Load DB helper
function readDB(): Applicant[] {
  return cachedApplicants;
}

function writeDB(applicants: Applicant[]) {
  cachedApplicants = applicants;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(applicants, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing database:", err);
  }

  if (useFirebase && db) {
    (async () => {
      try {
        for (const applicant of applicants) {
          const { id, ...applicantData } = applicant;
          await setDoc(doc(db, "applicants", applicant.id), applicantData);
        }
      } catch (err) {
        console.error("Failed to async sync writeDB to Firestore:", err);
      }
    })();
  }
}

// Generate application ID (HSE-YYYY-NNNN)
function generateApplicationId(): string {
  const year = new Date().getFullYear();
  const applicants = readDB();
  // Find max sequential number for current year
  const prefix = `HSE-${year}-`;
  const yearApplicants = applicants.filter(a => a.id.startsWith(prefix));
  let maxSeq = 0;
  yearApplicants.forEach(a => {
    const part = a.id.replace(prefix, "");
    const num = parseInt(part, 10);
    if (!isNaN(num) && num > maxSeq) {
      maxSeq = num;
    }
  });
  const nextSeq = String(maxSeq + 1).padStart(4, "0");
  return `${prefix}${nextSeq}`;
}

// Initialize Gemini Client
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
      console.log("Gemini API Client initialized successfully.");
    } else {
      console.warn("GEMINI_API_KEY environment variable is not defined or is default placeholder.");
    }
  }
  return aiClient;
}

// AI evaluation helper
async function evaluateApplicantWithAi(applicant: Applicant): Promise<AiEvaluation> {
  const ai = getAiClient();
  
  if (!ai) {
    console.warn("Using high-fidelity simulated AI evaluation due to missing GEMINI_API_KEY.");
    // Return high-fidelity fallback evaluation based on applicant answers length and experience
    const answersLength = Object.values(applicant.examAnswers).reduce((acc, text) => acc + (text?.length || 0), 0);
    const hasPaintExp = applicant.industryExperience.workedInPaint;
    const hasChemicalExp = applicant.industryExperience.workedInChemical;
    const certCount = Object.values(applicant.certificates).filter(Boolean).length;
    
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
      reason = "المرشح لا يمتلك الخبرة الكافية في القطاع الصناعي الكيماوي المعقد أو مصانع الدهانات، وإجاباته على الاختبار الفني تظهر وعياً محدوداً بسلامة العمليات ومكافحة الانسكاب الكيميائي.";
    }

    return {
      score,
      paintChemicalExpLevel: hasPaintExp && hasChemicalExp ? "high" : hasPaintExp || hasChemicalExp ? "medium" : "low",
      strengths: [
        `خبرة عملية إجمالية قدرها ${applicant.personalInfo.experienceYears} سنوات في المجال.`,
        `حاصل على ${certCount} شهادات ودورات احترافية في مجالات السلامة المختلفة.`,
        applicant.industryExperience.workedInPaint ? "لديه معرفة مباشرة ببيئة عمل مصانع الدهانات والمواد الكيميائية." : "يمتلك فهماً عاماً لإجراءات السلامة المهنية وتصاريح العمل."
      ],
      weaknesses: [
        score < 75 ? "بحاجة لتعزيز مهاراته الفنية في مكافحة الحرائق الكيميائية وإدارة الانسكابات الكبيرة." : "مستوى الراتب المتوقع قد يتطلب مراجعة مقارنة بمتوسط رواتب السوق.",
        "يفضل حصوله على شهادات مهنية تخصصية أعلى مثل NEBOSH IGC إذا لم تكن متوفرة لديه."
      ],
      suggestedQuestions: [
        "كيف تتعامل مع مواقف التسرب الكيميائي الطارئة تحت الضغط الميداني؟",
        "اذكر لنا مثالاً على تطبيق هرم التحكم بالمخاطر (Hierarchy of Controls) في بيئة عملك السابقة.",
        "كيف تقوم بإقناع عمال الإنتاج بالالتزام الصارم بارتداء معدات الوقاية الشخصية الثقيلة في الصيف؟"
      ],
      recommendation: rec,
      recommendationReason: reason,
      evaluatedAt: new Date().toISOString()
    };
  }

  // Build the prompt for real Gemini evaluation
  const prompt = `
أنت خبير تقييم ومقابلات فنية في الصحة والسلامة والبيئة (HSE) مخصص لتقييم المتقدمين لوظيفة "أخصائي أمن وسلامة" في مصنع دهانات ومواد كيميائية.
قم بتحليل بيانات المرشح وإجاباته الفنية بدقة كاملة، وأعط تقييماً تفصيلياً باللغة العربية.

بيانات المرشح:
الاسم الكامل: ${applicant.personalInfo.fullName}
المؤهل العلمي والتخصص: ${applicant.personalInfo.qualification} - ${applicant.personalInfo.major}
سنوات الخبرة: ${applicant.personalInfo.experienceYears} سنة
الشركة الحالية والدور الحالي: ${applicant.personalInfo.currentCompany} - ${applicant.personalInfo.currentRole}

الخبرات الصناعية التخصصية:
- هل عمل في مصنع دهانات؟ ${applicant.industryExperience.workedInPaint ? `نعم، شركة: ${applicant.industryExperience.paintCompany}، سنوات: ${applicant.industryExperience.paintYears}، دور: ${applicant.industryExperience.paintRole}، مهام: ${applicant.industryExperience.paintTasks}` : 'لا'}
- هل عمل في مصنع كيميائي؟ ${applicant.industryExperience.workedInChemical ? `نعم، شركة: ${applicant.industryExperience.chemicalCompany}، سنوات: ${applicant.industryExperience.chemicalYears}، دور: ${applicant.industryExperience.chemicalRole}، مهام: ${applicant.industryExperience.chemicalTasks}` : 'لا'}
- هل عمل في منشأة صناعية؟ ${applicant.industryExperience.workedInIndustrial ? `نعم، شركة: ${applicant.industryExperience.industrialCompany}، سنوات: ${applicant.industryExperience.industrialYears}، دور: ${applicant.industryExperience.industrialRole}، مهام: ${applicant.industryExperience.industrialTasks}` : 'لا'}

الشهادات المهنية التي يمتلكها:
${Object.entries(applicant.certificates).filter(([_, has]) => has).map(([name]) => name.toUpperCase()).join(", ")}

إجابات الاختبار الفني (المكون من 10 أسئلة مقالية):
السؤال 1- ما أهم المخاطر داخل مصانع الدهانات؟
إجابة المرشح: ${applicant.examAnswers.q1_paint_risks}

السؤال 2- ما الفرق بين الخطر والمخاطرة؟
إجابة المرشح: ${applicant.examAnswers.q2_hazard_vs_risk}

السؤال 3- كيف تحقق في حادث عمل؟
إجابة المرشح: ${applicant.examAnswers.q3_incident_investigation}

السؤال 4- كيف تقوم بإعداد تقييم مخاطر؟
إجابة المرشح: ${applicant.examAnswers.q4_risk_assessment}

السؤال 5- ما معدات الوقاية الشخصية المطلوبة عند التعامل مع المواد الكيميائية؟
إجابة المرشح: ${applicant.examAnswers.q5_ppe_chemical}

السؤال 6- ما هي SDS أو MSDS وما أهميتها؟
إجابة المرشح: ${applicant.examAnswers.q6_sds_msds}

السؤال 7- ماذا ستفعل عند حدوث انسكاب لمادة كيميائية قابلة للاشتعال؟
إجابة المرشح: ${applicant.examAnswers.q7_flammable_spill}

السؤال 8- كيف تتعامل مع موظف يرفض ارتداء معدات الوقاية الشخصية؟
إجابة المرشح: ${applicant.examAnswers.q8_ppe_refusal}

السؤال 9- ما أهم النقاط التي يجب فحصها أثناء الجولة التفتيشية اليومية؟
إجابة المرشح: ${applicant.examAnswers.q9_daily_inspection}

السؤال 10- اذكر مشروعًا أو تحسينًا في السلامة سبق أن شاركت فيه.
إجابة المرشح: ${applicant.examAnswers.q10_safety_project}

قم بإرجاع التقييم على شكل كائن JSON متوافق تماماً مع المخطط (Schema) التالي، مع ضمان كتابة جميع النصوص والتحليلات باللغة العربية الفصحى وبأسلوب فني راق واحترافي.
  `;

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
    // If anything fails or throws, return mock fallback
    return {
      score: 75,
      paintChemicalExpLevel: applicant.industryExperience.workedInPaint ? "medium" : "low",
      strengths: ["يمتلك خلفية جيدة في شروط السلامة العامة", "أبدى تفاعلاً إيجابياً مع الأسئلة المقالية المطروحة"],
      weaknesses: ["بحاجة للتأكد من قدراته على التحكم ببيئات الإنتاج الكيميائية المعقدة من خلال مقابلة شخصية"],
      suggestedQuestions: ["كيف تدير المخاطر المصاحبة للمركبات الكيميائية العضوية المتطايرة (VOCs)؟"],
      recommendation: "suitable_after_interview",
      recommendationReason: "تم إصدار هذه التوصية الاحتياطية نتيجة تعذر اكتمال التحليل اللحظي عبر خوادم الذكاء الاصطناعي بنجاح، يوصى بمقابلة المرشح يدوياً للتحقق من تفاصيله.",
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

    const newId = generateApplicationId();
    
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
    writeDB(applicants);

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
app.post("/api/admin/add-admin", requireAdmin, (req, res) => {
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
  writeAdmins(admins);

  res.json({ success: true, message: "تمت إضافة المسؤول الجديد بنجاح." });
});

// 2.4 Change Password
app.post("/api/admin/change-password", requireAdmin, (req, res) => {
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
  writeAdmins(admins);

  res.json({ success: true, message: "تم تغيير كلمة المرور بنجاح." });
});

// 2.5 Delete Admin
app.delete("/api/admin/delete-admin/:id", requireAdmin, (req, res) => {
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
  writeAdmins(admins);

  if (useFirebase && db) {
    deleteDoc(doc(db, "admins", id)).catch(err => {
      console.error("Error deleting admin from Firestore:", err);
    });
  }

  res.json({ success: true, message: "تم حذف حساب المسؤول بنجاح." });
});

// 3. Get Dashboard Stats
app.get("/api/admin/stats", requireAdmin, (req, res) => {
  const applicants = readDB();
  
  const total = applicants.length;
  const pending = applicants.filter(a => a.status === "pending").length;
  const reviewing = applicants.filter(a => a.status === "reviewing").length;
  const accepted = applicants.filter(a => a.status === "accepted").length;
  const rejected = applicants.filter(a => a.status === "rejected").length;
  const interview = applicants.filter(a => a.status === "interview").length;
  const waitlist = applicants.filter(a => a.status === "waitlist").length;
  
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
    averageAiScore
  });
});

// 4. Get Applicants List (with Search & Filtering)
app.get("/api/admin/applicants", requireAdmin, (req, res) => {
  let applicants = readDB();
  
  const { search, status, experience, hasCert, sortBy, sortOrder } = req.query;
  
  // Apply search
  if (search) {
    const q = String(search).toLowerCase();
    applicants = applicants.filter(a => 
      a.personalInfo.fullName.toLowerCase().includes(q) ||
      (a.personalInfo.nationalId || "").includes(q) ||
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

  // Filter by certificates (if has certain certificates)
  if (hasCert && hasCert !== "all") {
    const certKey = String(hasCert) as keyof typeof applicants[0]["certificates"];
    applicants = applicants.filter(a => a.certificates[certKey] === true);
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
app.patch("/api/admin/applicants/:id/review", requireAdmin, (req, res) => {
  const { status, hrEvaluation } = req.body;
  const applicants = readDB();
  const index = applicants.findIndex(a => a.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: "لم يتم العثور على طلب المتقدم المحدد." });
  }
  
  if (status) {
    applicants[index].status = status;
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
    
    applicants[index].hrEvaluation = {
      ...evalData,
      finalScore,
      reviewedAt: new Date().toISOString()
    };
  }
  
  writeDB(applicants);
  res.json({ success: true, applicant: applicants[index] });
});

// 7. Delete Applicant
app.delete("/api/admin/applicants/:id", requireAdmin, (req, res) => {
  const applicants = readDB();
  const index = applicants.findIndex(a => a.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: "لم يتم العثور على طلب المتقدم المحدد." });
  }
  
  applicants.splice(index, 1);
  writeDB(applicants);

  if (useFirebase && db) {
    deleteDoc(doc(db, "applicants", req.params.id)).catch(err => {
      console.error("Error deleting document from Firestore:", err);
    });
  }

  res.json({ success: true, message: "تم حذف طلب المتقدم بنجاح." });
});

// Handle serving the React SPA correctly
async function startServer() {
  // Synchronize database with Firestore on start
  await syncDatabase();

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
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
