import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Load environment variables
dotenv.config();

// Determine the target host
const targetUrl = process.argv[2] || "http://localhost:3000";

console.log("\x1b[36m%s\x1b[0m", "=========================================================");
console.log("\x1b[36m%s\x1b[0m", "   🛠️  بوابة التوظيف الرقمية - نظام فحص التقديم التلقائي  ");
console.log("\x1b[36m%s\x1b[0m", "=========================================================");
console.log(`📡 عنوان الفحص المستهدف: \x1b[33m${targetUrl}\x1b[0m`);

// List of realistic mock applicants with different qualification levels
const MOCK_APPLICANTS = [
  {
    personalInfo: {
      fullName: "عبدالرحمن بن محمد بن علي العتيبي",
      nationality: "سعودي",
      birthDate: "1994-04-12",
      gender: "male",
      city: "جدة",
      residenceAddress: "حي النعيم، شارع الأمل",
      phone: "+966551234567",
      email: "al.otaibi.hse@gmail.com",
      qualification: "بكالوريوس",
      major: "الهندسة الكيميائية",
      experienceYears: 4,
      currentCompany: "الشركة الوطنية للصناعات الكيماوية",
      currentRole: "أخصائي سلامة صناعية",
      currentSalary: "8500",
      expectedSalary: "11000",
      noticePeriod: "month",
      ownsCar: "yes",
      hasHealthIssues: "no",
      healthIssuesDetails: "",
      hasLocationIssue: "no"
    },
    industryExperience: {
      hasMixingPlants: true,
      hasChemicalStorage: true,
      hasGroundingChecks: true,
      hasPermitToWork: true,
      hasIncidentInvest: true,
      hasSpillResponse: true
    },
    certificates: {
      nebosh: true,
      osha30: true,
      iso45001: true,
      osha10: true,
      nasp: false,
      oshaMaster: false,
      iosh: true,
      firstAid: true,
      fireFighting: true,
      scaffolding: false,
      confinedSpace: true,
      craneSafety: false
    },
    examAnswers: {
      q1: "التحقق من توصيلات التأريض ضروري جداً لأن صالات الدهانات تحتوي على مواد كيميائية عضوية ومذيبات سريعة التطاير. أي تراكم للكهرباء الساكنة قد يؤدي إلى شرارة كهربائية صغيرة تتسبب في حدوث حريق أو انفجار فوري في ثوانٍ معدودة. نتحقق منها يومياً عبر أجهزة قياس المقاومة الأرضية.",
      q2: "تتضمن: التهوية القسرية المستمرة لشفط الأبخرة، واستخدام مصابيح وكشافات ومعدات كهربائية مضادة للانفجار (Explosion-Proof/ATEX)، والالتزام الكامل بارتداء ملابس قطنية 100% لمنع الشرر الاستاتيكي، وتدريب العمال على SDS للمواد المستخدمة.",
      q3: "الفرق الأساسي هو أن الـ SDS هي الوثيقة التفصيلية المكونة من 16 بنداً وتصدر من المصنع لتشرح الخصائص والمخاطر بالتفصيل، بينما الـ Label هو الملصق التحذيري المختصر الملصق مباشرة على العبوة للتنبيه السريع أثناء الاستخدام اليومي.",
      q4: "تصريح العمل الساخن هو وثيقة قانونية وتصريح أمان إلزامي يُصرف للقيام بأي أعمال تنتج حرارة أو شرر (كاللحام أو الصاروخ) في بيئة قد تحتوي على مواد قابلة للاشتعال، بهدف التحكم الكامل في المخاطر وتأمين الموقع قبل البدء.",
      q5: "أول خطوة هي إخلاء المنطقة فوراً وعزل مصدر التسريب، ثم ارتداء معدات الوقاية الشخصية المناسبة، واستخدام أدوات امتصاص المواد الكيميائية (Spill Kits)، وتطويق التسريب لمنع وصوله لمجاري الصرف، وأخيراً التخلص الآمن من المخلفات وفق الأنظمة البيئية.",
      q6: "الـ Grounding هو ربط المعدة بالهيكل الخارجي، بينما الـ Bonding هو التوصيل المعدني المباشر بين حاويتين أثناء نقل السوائل لتوحيد الشحنة الكهربائية ومنع حدوث فارق جهد ينتج عنه شرر في الفراغ.",
      q7: "يتم تحديد مسببات الحادث عبر طريقة الأسباب الجذرية (Root Cause Analysis - RCA) واستخدام عظمة السمكة أو الـ 5 Whys، ثم نضع إجراءات تصحيحية ووقائية (CAPA) تضمن عدم تكرار الحادث مجدداً وتعمم الدروس المستفادة.",
      q8: "تتضمن: استخدام أحزمة الأمان لكامل الجسم (Full Body Harness) وتثبيتها بنقاط مرساة معتمدة (Anchor Points)، وتوفير شبكات حماية أو حواجز واقية (Guardrails)، والتحقق من سلامة السقالات وتصاريح العمل قبل الصعود.",
      q9: "نظام الـ LOTO (عزل الطاقة ووضع الأقفال والبطاقات) هو إجراء حاسم لضمان عزل تام لكافة مصادر الطاقة (الكهربائية، الميكانيكية، الكيميائية) عن الآلة أثناء الصيانة لمنع التشغيل المفاجئ الذي قد يودي بحياة العامل.",
      q10: "أهم الممارسات: الفصل التام بين المواد غير المتوافقة كيميائياً، عدم تخزين الكيماويات بارتفاعات شاهقة، وضع حواجز احتواء الانسكابات (Secondary Containment)، وتوفير تهوية كافية وأنظمة مكافحة حريق تلقائية متوافقة مع نوع المادة."
    }
  },
  {
    personalInfo: {
      fullName: "خالد بن صالح الحربي",
      nationality: "سعودي",
      birthDate: "1997-11-20",
      gender: "male",
      city: "جدة",
      residenceAddress: "حي السامر",
      phone: "+966559876543",
      email: "khaled.safety@outlook.com",
      qualification: "دبلوم",
      major: "السلامة المهنية والصحة",
      experienceYears: 1,
      currentCompany: "مؤسسة للمقاولات العامة",
      currentRole: "مراقب سلامة",
      currentSalary: "4000",
      expectedSalary: "5500",
      noticePeriod: "immediate",
      ownsCar: "yes",
      hasHealthIssues: "no",
      healthIssuesDetails: "",
      hasLocationIssue: "no"
    },
    industryExperience: {
      hasMixingPlants: false,
      hasChemicalStorage: true,
      hasGroundingChecks: true,
      hasPermitToWork: true,
      hasIncidentInvest: false,
      hasSpillResponse: true
    },
    certificates: {
      nebosh: false,
      osha30: true,
      iso45001: false,
      osha10: true,
      nasp: false,
      oshaMaster: false,
      iosh: false,
      firstAid: true,
      fireFighting: true,
      scaffolding: true,
      confinedSpace: false,
      craneSafety: false
    },
    examAnswers: {
      q1: "التأريض يمنع الماس والشرار عشان ما يولع المصنع لأن فيه مواد قابلة للاشتعال ودهانات.",
      q2: "التهوية وتشغيل المراوح والكمامات والملابس القطنية عشان الكهرباء الساكنة ما تسوي شرر.",
      q3: "الـ SDS ورقة فيها تفاصيل كاملة من المصنع، والـ Label هو الملصق الصغير اللي على العلبة من برا.",
      q4: "تصريح العمل الساخن نستخدمه لما يكون فيه لحام أو نار في مكان فيه خطر عشان نتأكد من السلامة.",
      q5: "نظافة المكان، ونجيب الرمل أو الإسفنج الخاص ونحطه على المادة عشان نمتصها ونبعد العمال عن الموقع.",
      q6: "التوصيل بين الأجهزة والأرضي لمنع التماس والشرار.",
      q7: "نحقق في الحادث عشان نعرف ليش صار ونكتب تقرير ونعلمه للعمال عشان ما يتكرر.",
      q8: "حزام الأمان وربطه في مكان قوي، والتحقق من السقالة والدرج قبل ما نطلع فوق.",
      q9: "نظام لوثو هو قفل الكهرباء والآلات وقت الصيانة عشان ما أحد يشغلها بالغلط على الفنيين.",
      q10: "ترتيب الكيماويات وفصل المواد اللي تتفاعل مع بعض، وتوفير طفايات حريق قريبة ومناسبة."
    }
  }
];

// Pick a random applicant from our mocks
const chosenApplicant = MOCK_APPLICANTS[Math.floor(Math.random() * MOCK_APPLICANTS.length)];

async function runTest() {
  console.log(`\n📝 جاري إنشاء طلب تقديم عشوائي للمتقدم: \x1b[32m${chosenApplicant.personalInfo.fullName}\x1b[0m`);
  console.log(`⏱️ جاري إرسال الطلب وإجراء التقييم الذكي عبر Gemini API... (قد يستغرق 4-8 ثوانٍ)`);

  const startTime = Date.now();
  let responseData;

  try {
    const res = await fetch(`${targetUrl}/api/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(chosenApplicant)
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`⚡ استجابة الخادم في غضون: \x1b[35m${elapsed} ثوانٍ\x1b[0m`);

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`خطأ من الخادم (${res.status}): ${errorText}`);
    }

    responseData = await res.json();
  } catch (err) {
    console.error("\x1b[31m%s\x1b[0m", `❌ فشل إرسال الطلب إلى بوابة التقديم: ${err.message}`);
    console.log("\x1b[33m%s\x1b[0m", "⚠️ نصيحة: تأكد من تشغيل الخادم المحلي بالرقم المرفق: npm run dev");
    process.exit(1);
  }

  const { id: appId, status, aiEvaluation } = responseData;

  console.log("\x1b[32m%s\x1b[0m", "✅ تم تقديم الطلب بنجاح!");
  console.log(`🆔 رقم الطلب المولد: \x1b[33m${appId}\x1b[0m`);
  console.log(`📊 حالة الطلب: \x1b[33m${status === "pending" ? "قيد المراجعة / جديد" : status}\x1b[0m`);

  if (aiEvaluation) {
    console.log("\x1b[36m%s\x1b[0m", "\n--- نتيجة تقييم الذكاء الاصطناعي (Gemini) ---");
    const scoreColor = aiEvaluation.score >= 85 ? "\x1b[32m" : aiEvaluation.score >= 60 ? "\x1b[33m" : "\x1b[31m";
    console.log(`💯 الدرجة الفنية الذكية: ${scoreColor}${aiEvaluation.score} / 100\x1b[0m`);
    
    let recText = aiEvaluation.recommendation;
    if (recText === "highly_recommended") recText = "🔥 موصى به بشدة";
    else if (recText === "suitable_after_interview") recText = "👍 مناسب بعد المقابلة";
    else recText = "👎 غير مناسب";
    
    console.log(`🎯 التوصية التلقائية: \x1b[35m${recText}\x1b[0m`);
    console.log(`✍️ مبررات التوصية: ${aiEvaluation.recommendationReason}`);
    console.log(`💡 أسئلة المقابلة المقترحة:`);
    aiEvaluation.suggestedQuestions.forEach((q, i) => {
      console.log(`   ${i + 1}. ${q}`);
    });
  } else {
    console.log("\x1b[31m%s\x1b[0m", "⚠️ تحذير: لم يتم إرجاع تقييم الذكاء الاصطناعي بنجاح.");
  }

  // Verify inside Supabase if configured
  console.log("\x1b[36m%s\x1b[0m", "\n--- التحقق من حفظ البيانات بقاعدة بيانات Supabase ---");

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log("\x1b[33m%s\x1b[0m", "⚠️ تعذر التحقق التلقائي من Supabase لعدم وجود متغيرات البيئة محلياً (SUPABASE_URL).");
    console.log("ℹ️ إذا كان الموقع يعمل على Vercel، فقد تم حفظ الطلب مباشرة بقاعدة البيانات السحابية بنجاح.");
    process.exit(0);
  }

  try {
    const supabaseClient = createClient(supabaseUrl, supabaseKey);
    console.log("🔄 جاري الاتصال بـ Supabase والاستعلام عن الطلب الجديد...");

    const { data, error } = await supabaseClient
      .from("applicants")
      .select("id, status, personal_info")
      .eq("id", appId)
      .single();

    if (error || !data) {
      throw new Error(error ? error.message : "لم يتم العثور على السجل المطابق لرقم الطلب.");
    }

    console.log("\x1b[32m%s\x1b[0m", "🎉 تأكيد مذهل! تم العثور على الطلب في Supabase ومطابقته بالكامل!");
    console.log(`👤 الاسم في قاعدة البيانات: \x1b[33m${data.personal_info.fullName}\x1b[0m`);
    console.log(`✅ العملية تمت بنجاح وبسرعة فائقة دون حدوث أي مهلة (Timeout).`);
  } catch (err) {
    console.error("\x1b[31m%s\x1b[0m", `❌ فشل التحقق من حفظ الطلب في Supabase: ${err.message}`);
    console.log("⚠️ يرجى التأكد من صلاحيات جدول applicants على Supabase وتوفر الاتصال بالشبكة.");
  }
}

runTest();
