import React, { useState, useEffect } from 'react';
import { safeStorage } from '../lib/safeStorage';
// GitHub Sync: Minor update to trigger re-push
import { 
  User, Briefcase, FileQuestion, Eye, ArrowLeft, ArrowRight, ShieldCheck, 
  Upload, Trash2, CheckCircle, AlertTriangle, HelpCircle, Loader2, Link as LinkIcon, FileText, Check
} from 'lucide-react';
import { PersonalInfo, IndustryExperience, ProfessionalCertificates, ExamAnswers, Applicant } from '../types';

interface ApplicationFormProps {
  onCancel: () => void;
  onSubmitSuccess: (applicationId: string, status: string, aiEvaluation: any, applicantName: string) => void;
  jobRole?: 'hse' | 'marketing';
}

export default function ApplicationForm({ onCancel, onSubmitSuccess, jobRole = 'hse' }: ApplicationFormProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // --- Step 1: Personal Info ---
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    fullName: '',
    nationality: 'سعودي',
    birthDate: '',
    gender: 'male',
    city: '',
    residenceAddress: '',
    phone: '',
    email: '',
    qualification: 'بكالوريوس',
    major: '',
    experienceYears: 0,
    currentCompany: '',
    currentRole: '',
    currentSalary: '',
    expectedSalary: '',
    noticePeriod: 'شهر واحد',
    linkedinUrl: '',
    ownsCar: '',
    hasHealthIssues: '',
    healthIssuesDetails: '',
    hasLocationIssue: '',
    hasKawaderLicense: '',
    kawaderLicenseFileName: '',
    kawaderLicenseBase64: '',
    cvFileName: '',
    cvBase64: '',
    certsFileName: '',
    certsBase64: '',
    portfolioFileName: '',
    portfolioBase64: '',
    additionalDocuments: [],
    jobRole: jobRole,
    isJeddahResident: '',
    hasCarAndLicense: ''
  });

  // --- Step 2: Experience & Certifications ---
  const [industryExperience, setIndustryExperience] = useState<IndustryExperience>({
    workedInPaint: false,
    paintCompany: '',
    paintYears: 0,
    paintRole: '',
    paintTasks: '',
    workedInChemical: false,
    chemicalCompany: '',
    chemicalYears: 0,
    chemicalRole: '',
    chemicalTasks: '',
    workedInIndustrial: false,
    industrialCompany: '',
    industrialYears: 0,
    industrialRole: '',
    industrialTasks: ''
  });

  const [certificates, setCertificates] = useState<ProfessionalCertificates>({
    nebosh: false,
    osha: false,
    iosh: false,
    iso45001: false,
    fireSafety: false,
    firstAid: false,
    hazop: false,
    hazmat: false,
    permitToWork: false,
    workingAtHeights: false,
    confinedSpace: false,
    forkliftSafety: false
  });

  // --- Step 3: Technical Exam Answers ---
  const [examAnswers, setExamAnswers] = useState<ExamAnswers>({
    q1_paint_risks: '',
    q2_hazard_vs_risk: '',
    q3_incident_investigation: '',
    q4_risk_assessment: '',
    q5_ppe_chemical: '',
    q6_sds_msds: '',
    q7_flammable_spill: '',
    q8_ppe_refusal: '',
    q9_daily_inspection: '',
    q10_safety_project: ''
  });

  // --- Autosave & State Restoring for Step 3 ---
  useEffect(() => {
    const roleKey = jobRole;
    
    const cachedInfo = safeStorage.getItem(`personal_autosave_${roleKey}`);
    if (cachedInfo) {
      try {
        const parsed = JSON.parse(cachedInfo);
        setPersonalInfo({ ...parsed, jobRole: roleKey });
      } catch (e) {}
    } else {
      setPersonalInfo(prev => ({
        ...prev,
        fullName: '',
        phone: '',
        email: '',
        major: '',
        experienceYears: 0,
        currentCompany: '',
        currentRole: '',
        cvFileName: '',
        cvBase64: '',
        certsFileName: '',
        certsBase64: '',
        portfolioFileName: '',
        portfolioBase64: '',
        kawaderLicenseFileName: '',
        kawaderLicenseBase64: '',
        jobRole: roleKey,
        isJeddahResident: '',
        hasCarAndLicense: '',
        ownsCar: '',
        hasHealthIssues: '',
        healthIssuesDetails: '',
        hasLocationIssue: '',
        hasKawaderLicense: ''
      }));
    }
    
    const cachedExp = safeStorage.getItem(`experience_autosave_${roleKey}`);
    if (cachedExp) {
      try { setIndustryExperience(JSON.parse(cachedExp)); } catch (e) {}
    } else {
      setIndustryExperience({
        workedInPaint: false,
        paintCompany: '',
        paintYears: 0,
        paintRole: '',
        paintTasks: '',
        workedInChemical: false,
        chemicalCompany: '',
        chemicalYears: 0,
        chemicalRole: '',
        chemicalTasks: '',
        workedInIndustrial: false,
        industrialCompany: '',
        industrialYears: 0,
        industrialRole: '',
        industrialTasks: ''
      });
    }

    const cachedCerts = safeStorage.getItem(`certs_autosave_${roleKey}`);
    if (cachedCerts) {
      try { setCertificates(JSON.parse(cachedCerts)); } catch (e) {}
    } else {
      setCertificates({
        nebosh: false, osha: false, iosh: false, iso45001: false,
        fireSafety: false, firstAid: false, hazop: false, hazmat: false,
        permitToWork: false, workingAtHeights: false, confinedSpace: false, forkliftSafety: false
      });
    }

    const cachedExam = safeStorage.getItem(`exam_autosave_${roleKey}`);
    if (cachedExam) {
      try { setExamAnswers(JSON.parse(cachedExam)); } catch (e) {}
    } else {
      setExamAnswers({
        q1_paint_risks: '', q2_hazard_vs_risk: '', q3_incident_investigation: '', q4_risk_assessment: '',
        q5_ppe_chemical: '', q6_sds_msds: '', q7_flammable_spill: '', q8_ppe_refusal: '',
        q9_daily_inspection: '', q10_safety_project: ''
      });
    }
  }, [jobRole]);

  // Autosave triggers
  useEffect(() => {
    const roleKey = jobRole;
    safeStorage.setItem(`personal_autosave_${roleKey}`, JSON.stringify(personalInfo));
  }, [personalInfo, jobRole]);

  useEffect(() => {
    const roleKey = jobRole;
    safeStorage.setItem(`experience_autosave_${roleKey}`, JSON.stringify(industryExperience));
  }, [industryExperience, jobRole]);

  useEffect(() => {
    const roleKey = jobRole;
    safeStorage.setItem(`certs_autosave_${roleKey}`, JSON.stringify(certificates));
  }, [certificates, jobRole]);

  useEffect(() => {
    const roleKey = jobRole;
    safeStorage.setItem(`exam_autosave_${roleKey}`, JSON.stringify(examAnswers));
  }, [examAnswers, jobRole]);

  // --- Helper to check file size and total uploaded files size to prevent 413 payload too large errors ---
  const checkFileSizeAndTotal = (
    newFile: File,
    fieldToReplace?: 'cv' | 'certs' | 'kawader' | 'portfolio' | string
  ): boolean => {
    const MAX_SINGLE_SIZE = 2 * 1024 * 1024; // 2.0MB
    const MAX_TOTAL_SIZE = 4 * 1024 * 1024; // 4.0MB

    // 1. Check single file size
    if (newFile.size > MAX_SINGLE_SIZE) {
      const sizeInMB = (newFile.size / (1024 * 1024)).toFixed(2);
      alert(
        `عذراً، حجم ملف "${newFile.name}" هو (${sizeInMB} ميغابايت)، وهو يتجاوز الحد الأقصى المسموح به للملف الواحد (2.0 ميغابايت).\n\n💡 نصيحة: يرجى استخدام مواقع ضغط الـ PDF المجانية عبر الإنترنت (مثل iLovePDF أو Smallpdf) لضغط الملف وتقليل حجمه ومن ثم إعادة إرفاقه.`
      );
      return false;
    }

    // 2. Calculate current total size of other files
    let currentTotalSize = 0;
    if (fieldToReplace !== 'cv' && personalInfo.cvBase64) {
      currentTotalSize += Math.round(personalInfo.cvBase64.length * 0.75);
    }
    if (fieldToReplace !== 'certs' && personalInfo.certsBase64) {
      currentTotalSize += Math.round(personalInfo.certsBase64.length * 0.75);
    }
    if (fieldToReplace !== 'kawader' && personalInfo.kawaderLicenseBase64) {
      currentTotalSize += Math.round(personalInfo.kawaderLicenseBase64.length * 0.75);
    }
    if (fieldToReplace !== 'portfolio' && personalInfo.portfolioBase64) {
      currentTotalSize += Math.round(personalInfo.portfolioBase64.length * 0.75);
    }
    if (personalInfo.additionalDocuments && personalInfo.additionalDocuments.length > 0) {
      personalInfo.additionalDocuments.forEach(doc => {
        if (fieldToReplace !== doc.id && doc.base64) {
          currentTotalSize += Math.round(doc.base64.length * 0.75);
        }
      });
    }

    // 3. Estimate new total size
    const estimatedNewTotal = currentTotalSize + newFile.size;
    if (estimatedNewTotal > MAX_TOTAL_SIZE) {
      const estimatedNewTotalMB = (estimatedNewTotal / (1024 * 1024)).toFixed(2);
      const currentTotalMB = (currentTotalSize / (1024 * 1024)).toFixed(2);
      const fileSizeMB = (newFile.size / (1024 * 1024)).toFixed(2);
      alert(
        `عذراً! لا يمكن إضافة هذا الملف لأن إجمالي حجم كافة المستندات المرفقة سيصل إلى (${estimatedNewTotalMB} ميغابايت)، وهو ما يتجاوز الحد الأقصى المسموح به لكافة الملفات معاً (4.0 ميغابايت) لضمان إرسال طلبك للخادم بنجاح.\n\nتفاصيل الحجم:\n- حجم الملف الحالي: ${fileSizeMB} ميغابايت\n- حجم الملفات المرفقة الأخرى: ${currentTotalMB} ميغابايت\n\n💡 نصيحة: يرجى تقليل حجم أو ضغط ملفاتك الأخرى باستخدام أدوات ضغط الـ PDF عبر الإنترنت لتقليل الحجم الكلي ومن ثم إرفاق الملف.`
      );
      return false;
    }

    return true;
  };

  // --- Helper to convert files to Base64 ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'cv' | 'certs' | 'kawader') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!checkFileSizeAndTotal(file, type)) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      if (type === 'cv') {
        setPersonalInfo(prev => ({
          ...prev,
          cvFileName: file.name,
          cvBase64: base64String
        }));
      } else if (type === 'certs') {
        setPersonalInfo(prev => ({
          ...prev,
          certsFileName: file.name,
          certsBase64: base64String
        }));
      } else if (type === 'kawader') {
        setPersonalInfo(prev => ({
          ...prev,
          kawaderLicenseFileName: file.name,
          kawaderLicenseBase64: base64String
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePortfolioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!checkFileSizeAndTotal(file, 'portfolio')) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      setPersonalInfo(prev => ({
        ...prev,
        portfolioFileName: file.name,
        portfolioBase64: base64String
      }));
      // Clear validation error if any
      if (errors.portfolioFile) {
        setErrors(prev => {
          const updated = { ...prev };
          delete updated.portfolioFile;
          return updated;
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const removePortfolioFile = () => {
    setPersonalInfo(prev => ({
      ...prev,
      portfolioFileName: '',
      portfolioBase64: ''
    }));
  };

  const removeUploadedFile = (type: 'cv' | 'certs' | 'kawader') => {
    if (type === 'cv') {
      setPersonalInfo(prev => ({
        ...prev,
        cvFileName: '',
        cvBase64: ''
      }));
    } else if (type === 'certs') {
      setPersonalInfo(prev => ({
        ...prev,
        certsFileName: '',
        certsBase64: ''
      }));
    } else if (type === 'kawader') {
      setPersonalInfo(prev => ({
        ...prev,
        kawaderLicenseFileName: '',
        kawaderLicenseBase64: ''
      }));
    }
  };

  const handleMultipleFilesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files as FileList).forEach((file: File) => {
      if (!checkFileSizeAndTotal(file, 'new_doc')) {
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        const newDoc = {
          id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
          name: file.name.split('.').slice(0, -1).join('.') || 'مستند إضافي',
          fileName: file.name,
          base64: base64String,
          uploadedAt: new Date().toISOString()
        };

        setPersonalInfo(prev => {
          const currentDocs = prev.additionalDocuments || [];
          if (currentDocs.some(d => d.fileName === file.name)) {
            return prev;
          }
          return {
            ...prev,
            additionalDocuments: [...currentDocs, newDoc]
          };
        });
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const removeAdditionalFile = (id: string) => {
    setPersonalInfo(prev => ({
      ...prev,
      additionalDocuments: (prev.additionalDocuments || []).filter(doc => doc.id !== id)
    }));
  };

  // --- Form Validation Helpers ---
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    const isMkt = jobRole === 'marketing';

    if (!isMkt) {
      if (!personalInfo.fullName.trim()) {
        newErrors.fullName = 'الاسم الكامل مطلوب';
      } else if (personalInfo.fullName.trim().split(/\s+/).filter(Boolean).length < 2) {
        newErrors.fullName = 'يرجى كتابة الاسم الثنائي على الأقل (الاسم واسم العائلة)';
      }

      if (!personalInfo.nationality.trim()) {
        newErrors.nationality = 'الجنسية مطلوبة';
      }

      if (!personalInfo.phone.trim()) {
        newErrors.phone = 'رقم الجوال مطلوب';
      } else if (!/^(05|5)\d{8}$/.test(personalInfo.phone.trim())) {
        newErrors.phone = 'يجب إدخال رقم جوال سعودي صحيح يبدأ بـ 05 ويتكون من 10 أرقام';
      }

      if (!personalInfo.email.trim()) {
        newErrors.email = 'البريد الإلكتروني مطلوب';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalInfo.email.trim())) {
        newErrors.email = 'البريد الإلكتروني المدخل غير صحيح';
      }

      if (!personalInfo.city.trim()) {
        newErrors.city = 'المدينة مطلوبة';
      }

      if (!personalInfo.residenceAddress.trim()) {
        newErrors.residenceAddress = 'العنوان السكني التفصيلي مطلوب';
      }

      if (!personalInfo.major.trim()) {
        newErrors.major = 'التخصص العلمي مطلوب';
      }

      if (!personalInfo.birthDate) {
        newErrors.birthDate = 'تاريخ الميلاد مطلوب';
      }

      if (!personalInfo.expectedSalary.trim()) {
        newErrors.expectedSalary = 'الراتب المتوقع مطلوب';
      }

      if (!personalInfo.cvBase64) {
        newErrors.cv = 'ملف السيرة الذاتية (CV) بصيغة PDF مطلوب للتقديم';
      }

      if (!personalInfo.ownsCar) {
        newErrors.ownsCar = 'يرجى الإجابة على هذا السؤال';
      }
      if (!personalInfo.hasLocationIssue) {
        newErrors.hasLocationIssue = 'يرجى الإجابة على هذا السؤال';
      }
      if (!personalInfo.hasHealthIssues) {
        newErrors.hasHealthIssues = 'يرجى الإجابة على هذا السؤال';
      }
      if (personalInfo.hasHealthIssues === 'yes' && !personalInfo.healthIssuesDetails?.trim()) {
        newErrors.healthIssuesDetails = 'يرجى توضيح المشاكل الصحية';
      }
      if (!personalInfo.hasKawaderLicense) {
        newErrors.hasKawaderLicense = 'يرجى الإجابة على هذا السؤال';
      }

      if (personalInfo.hasKawaderLicense === 'yes' && !personalInfo.kawaderLicenseBase64) {
        newErrors.kawaderLicense = 'يرجى تحميل ترخيص منصة كوادر لتأكيد إجابتك';
      }
    } else {
      // For marketing, fields are optional. We only validate formats if value is provided.
      if (personalInfo.fullName.trim() && personalInfo.fullName.trim().split(/\s+/).filter(Boolean).length < 2) {
        newErrors.fullName = 'يرجى كتابة الاسم الثنائي على الأقل (الاسم واسم العائلة)';
      }
      if (personalInfo.phone.trim() && !/^(05|5)\d{8}$/.test(personalInfo.phone.trim())) {
        newErrors.phone = 'يجب إدخال رقم جوال سعودي صحيح يبدأ بـ 05 ويتكون من 10 أرقام';
      }
      if (personalInfo.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalInfo.email.trim())) {
        newErrors.email = 'البريد الإلكتروني المدخل غير صحيح';
      }
      
      // But these radio questions are mandatory for marketing too
      if (!personalInfo.isJeddahResident) {
        newErrors.isJeddahResident = 'يرجى الإجابة على هذا السؤال';
      }
      if (personalInfo.isJeddahResident === 'yes' && !personalInfo.hasCarAndLicense) {
        newErrors.hasCarAndLicense = 'يرجى الإجابة على هذا السؤال';
      }
      if (!personalInfo.hasLocationIssue) {
        newErrors.hasLocationIssue = 'يرجى الإجابة على هذا السؤال';
      }
      if (!personalInfo.hasHealthIssues) {
        newErrors.hasHealthIssues = 'يرجى الإجابة على هذا السؤال';
      }
      if (personalInfo.hasHealthIssues === 'yes' && !personalInfo.healthIssuesDetails?.trim()) {
        newErrors.healthIssuesDetails = 'يرجى توضيح المشاكل الصحية';
      }
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      alert("يرجى ملء كافة الحقول الإلزامية وتصحيح الأخطاء الموضحة باللون الأحمر للمتابعة.");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    const isMkt = jobRole === 'marketing';

    if (!isMkt) {
      if (industryExperience.workedInPaint) {
        if (!industryExperience.paintCompany.trim()) {
          newErrors.paintCompany = 'اسم شركة الدهانات مطلوب';
        }
        if (Number(industryExperience.paintYears) <= 0) newErrors.paintYears = 'عدد سنوات الخبرة مطلوب';
        if (!industryExperience.paintRole.trim()) {
          newErrors.paintRole = 'المسمى الوظيفي مطلوب';
        }
        if (!industryExperience.paintTasks.trim()) {
          newErrors.paintTasks = 'المهام والمسؤوليات مطلوبة لتقييم عمق خبرتك';
        }
      }
      if (industryExperience.workedInChemical) {
        if (!industryExperience.chemicalCompany.trim()) {
          newErrors.chemicalCompany = 'اسم شركة الصناعات الكيماوية مطلوب';
        }
        if (Number(industryExperience.chemicalYears) <= 0) newErrors.chemicalYears = 'عدد سنوات الخبرة مطلوب';
        if (!industryExperience.chemicalRole.trim()) {
          newErrors.chemicalRole = 'المسمى الوظيفي مطلوب';
        }
        if (!industryExperience.chemicalTasks.trim()) {
          newErrors.chemicalTasks = 'المهام والمسؤوليات مطلوبة لتقييم عمق خبرتك';
        }
      }
      if (industryExperience.workedInIndustrial) {
        if (!industryExperience.industrialCompany.trim()) {
          newErrors.industrialCompany = 'اسم المنشأة الصناعية مطلوب';
        }
        if (Number(industryExperience.industrialYears) <= 0) newErrors.industrialYears = 'عدد سنوات الخبرة مطلوب';
        if (!industryExperience.industrialRole.trim()) {
          newErrors.industrialRole = 'المسمى الوظيفي مطلوب';
        }
        if (!industryExperience.industrialTasks.trim()) {
          newErrors.industrialTasks = 'المهام والمسؤوليات مطلوبة لتقييم عمق خبرتك';
        }
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      alert("يرجى إكمال تفاصيل الخبرات المهنية التي قمت بتفعيلها أولاً.");
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};
    
    // Answering questions is only mandatory for HSE role
    if (jobRole !== 'marketing') {
      const questions = [
        'q1_paint_risks', 'q2_hazard_vs_risk', 'q3_incident_investigation',
        'q4_risk_assessment', 'q5_ppe_chemical', 'q6_sds_msds',
        'q7_flammable_spill', 'q8_ppe_refusal', 'q9_daily_inspection',
        'q10_safety_project'
      ];
      
      questions.forEach((q) => {
        const ans = examAnswers[q as keyof ExamAnswers] || '';
        if (ans.trim().length < 15) {
          newErrors[q] = `الإجابة مطلوبة ويجب ألا تقل عن 15 حرفاً لضمان دقة التقييم الذكي`;
        }
      });
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      alert("يرجى الإجابة على جميع أسئلة الاختبار الفني بوضوح وبما لا يقل عن 15 حرفاً لكل سؤال لتفعيل التقييم الذكي التلقائي.");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep1()) setCurrentStep(2);
    } else if (currentStep === 2) {
      if (validateStep2()) setCurrentStep(3);
    } else if (currentStep === 3) {
      if (validateStep3()) setCurrentStep(4);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as any);
    }
  };

  // --- Count exam statistics ---
  const answeredCount = (Object.values(examAnswers) as string[]).filter(ans => ans.trim().length > 0).length;
  const progressPercent = Math.round((answeredCount / 10) * 100);

  // --- Final Form Submission ---
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalInfo,
          industryExperience,
          certificates,
          examAnswers
        })
      });

      const responseText = await response.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch (parseErr) {
        if (response.status === 413 || responseText.toLowerCase().includes("too large") || responseText.toLowerCase().includes("payload too large")) {
          throw new Error("عذراً، حجم الملفات والمستندات المرفقة كبير جداً ويتجاوز الحد الأقصى المسموح به لخادم الاستضافة. يرجى ضغط جميع ملفات الـ PDF المرفقة (بحيث لا يتجاوز حجم كل ملف 1.5 ميغابايت والمجموع الكلي 4 ميغابايت) باستخدام مواقع ضغط ملفات الـ PDF المجانية (مثل iLovePDF) ثم محاولة تقديم الطلب مرة أخرى.");
        }
        throw new Error("حدث خطأ فني أثناء إرسال طلبك إلى الخادم (غالباً بسبب الحجم الزائد للملفات المرفقة). يرجى مراجعة أحجام مستنداتك وضغطها ثم المحاولة مجدداً.");
      }

      if (!response.ok) {
        throw new Error(data.error || "فشل إرسال الطلب، يرجى المحاولة لاحقاً.");
      }

      // Success! Clear local autosave data
      const roleKey = jobRole;
      safeStorage.removeItem(`personal_autosave_${roleKey}`);
      safeStorage.removeItem(`experience_autosave_${roleKey}`);
      safeStorage.removeItem(`certs_autosave_${roleKey}`);
      safeStorage.removeItem(`exam_autosave_${roleKey}`);

      onSubmitSuccess(data.id, data.status, data.aiEvaluation, personalInfo.fullName);
    } catch (err: any) {
      setSubmitError(err.message || "حدث خطأ غير متوقع أثناء الاتصال بالخادم.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 md:px-6">
      
      {/* Wizard Header Progress Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8" id="wizard-progress-header">
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={onCancel}
            className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-xs font-bold transition-all"
            id="cancel-apply-btn"
          >
            <ArrowLeft className="w-4 h-4 rotate-180" />
            العودة للرئيسية
          </button>
          <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200/40 px-3 py-1 rounded-full">
            حفظ تلقائي نشط
          </span>
        </div>

        {/* Steps Indicators */}
        <div className="relative flex justify-between items-center max-w-3xl mx-auto">
          {/* Connector Line */}
          <div className="absolute top-1/2 left-0 right-0 h-[3px] bg-slate-100 -translate-y-1/2 z-0"></div>
          <div 
            className="absolute top-1/2 left-0 right-0 h-[3px] bg-blue-900 -translate-y-1/2 z-0 transition-all duration-300"
            style={{ 
              width: currentStep === 1 ? '0%' : currentStep === 2 ? '33.3%' : currentStep === 3 ? '66.6%' : '100%' 
            }}
          ></div>

          {/* Step 1 Circle */}
          <div className="relative z-10 flex flex-col items-center">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              currentStep >= 1 ? 'bg-blue-900 text-white shadow-sm' : 'bg-slate-100 text-slate-400'
            }`}>
              <User className="w-4 h-4" />
            </div>
            <span className={`text-[10px] font-bold mt-2 ${currentStep >= 1 ? 'text-slate-800' : 'text-slate-400'}`}>البيانات الشخصية</span>
          </div>

          {/* Step 2 Circle */}
          <div className="relative z-10 flex flex-col items-center">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              currentStep >= 2 ? 'bg-blue-900 text-white shadow-sm' : 'bg-slate-100 text-slate-400'
            }`}>
              <Briefcase className="w-4 h-4" />
            </div>
            <span className={`text-[10px] font-bold mt-2 ${currentStep >= 2 ? 'text-slate-800' : 'text-slate-400'}`}>الخبرات والشهادات</span>
          </div>

          {/* Step 3 Circle */}
          <div className="relative z-10 flex flex-col items-center">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              currentStep >= 3 ? 'bg-blue-900 text-white shadow-sm' : 'bg-slate-100 text-slate-400'
            }`}>
              <FileQuestion className="w-4 h-4" />
            </div>
            <span className={`text-[10px] font-bold mt-2 ${currentStep >= 3 ? 'text-slate-800' : 'text-slate-400'}`}>الاختبار الفني</span>
          </div>

          {/* Step 4 Circle */}
          <div className="relative z-10 flex flex-col items-center">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              currentStep >= 4 ? 'bg-blue-900 text-white shadow-sm' : 'bg-slate-100 text-slate-400'
            }`}>
              <Eye className="w-4 h-4" />
            </div>
            <span className={`text-[10px] font-bold mt-2 ${currentStep >= 4 ? 'text-slate-800' : 'text-slate-400'}`}>المراجعة والإرسال</span>
          </div>
        </div>
      </div>

      {/* --- STEP 1: PERSONAL INFORMATION --- */}
      {currentStep === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="step-1-personal">
          <div className="bg-white text-slate-800 p-6 md:p-8 border-b border-slate-200">
            <h3 className="text-lg md:text-xl font-bold text-blue-900 mb-1">الخطوة الأولى: البيانات الشخصية والتعليمية</h3>
            <p className="text-xs text-slate-400 font-medium">الرجاء إدخال بياناتك بدقة ووضوح لتسهيل عملية المراجعة والتقييم.</p>
          </div>

          <div className="p-6 md:p-8 space-y-8">
            {/* Form grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  الاسم الكامل (ثلاثي أو رباعي) {jobRole === 'marketing' ? ' (اختياري)' : ' *'}
                </label>
                            
                <input
                  type="text"
                  required={jobRole !== 'marketing'}
                  value={personalInfo.fullName}
                  onChange={(e) => {
                    setPersonalInfo(prev => ({ ...prev, fullName: e.target.value }));
                    if (errors.fullName) setErrors(prev => { const n = { ...prev }; delete n.fullName; return n; });
                  }}
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none transition-all ${
                    errors.fullName 
                      ? 'border-red-500 bg-red-50/20' 
                      : `border-slate-200 focus:border-${jobRole === 'marketing' ? 'blue-600' : 'orange-500'}`
                  } ${
                    jobRole === 'marketing' ? 'focus:ring-blue-600/20' : 'focus:ring-orange-500/20'
                  }`}
                  placeholder="أدخل اسمك الكامل كما في الهوية"
                />
                {errors.fullName && <p className="text-red-500 text-xs font-bold mt-1">{errors.fullName}</p>}
              </div>

              {/* Nationality */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  الجنسية {jobRole === 'marketing' ? ' (اختياري)' : ' *'}
                </label>
                            
                <input
                  type="text"
                  required={jobRole !== 'marketing'}
                  value={personalInfo.nationality}
                  onChange={(e) => {
                    setPersonalInfo(prev => ({ ...prev, nationality: e.target.value }));
                    if (errors.nationality) setErrors(prev => { const n = { ...prev }; delete n.nationality; return n; });
                  }}
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none transition-all ${
                    errors.nationality 
                      ? 'border-red-500 bg-red-50/20' 
                      : `border-slate-200 focus:border-${jobRole === 'marketing' ? 'blue-600' : 'orange-500'}`
                  } ${
                    jobRole === 'marketing' ? 'focus:ring-blue-600/20' : 'focus:ring-orange-500/20'
                  }`}
                  placeholder="مثال: سعودي"
                />
                {errors.nationality && <p className="text-red-500 text-xs font-bold mt-1">{errors.nationality}</p>}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">الجنس *</label>
                            
                <select
                  value={personalInfo.gender}
                  onChange={(e) => setPersonalInfo(prev => ({ ...prev, gender: e.target.value }))}
                  className={`w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-${jobRole === 'marketing' ? 'blue-600' : 'orange-500'} focus:ring-2 focus:ring-${jobRole === 'marketing' ? 'blue-600/20' : 'orange-500/20'} outline-none transition-all bg-white`}
                >
                  <option value="male">ذكر</option>
                  <option value="female">أنثى</option>
                </select>
              </div>

              {/* Birth Date */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  تاريخ الميلاد {jobRole === 'marketing' ? ' (اختياري)' : ' *'}
                </label>
                            
                <input
                  type="date"
                  required={jobRole !== 'marketing'}
                  value={personalInfo.birthDate}
                  onChange={(e) => {
                    setPersonalInfo(prev => ({ ...prev, birthDate: e.target.value }));
                    if (errors.birthDate) setErrors(prev => { const n = { ...prev }; delete n.birthDate; return n; });
                  }}
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none transition-all ${
                    errors.birthDate 
                      ? 'border-red-500 bg-red-50/20' 
                      : `border-slate-200 focus:border-${jobRole === 'marketing' ? 'blue-600' : 'orange-500'}`
                  } ${
                    jobRole === 'marketing' ? 'focus:ring-blue-600/20' : 'focus:ring-orange-500/20'
                  }`}
                />
                {errors.birthDate && <p className="text-red-500 text-xs font-bold mt-1">{errors.birthDate}</p>}
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  مدينة الإقامة الحالية {jobRole === 'marketing' ? ' (اختياري)' : ' *'}
                </label>
                            
                <input
                  type="text"
                  required={jobRole !== 'marketing'}
                  value={personalInfo.city}
                  onChange={(e) => {
                    setPersonalInfo(prev => ({ ...prev, city: e.target.value }));
                    if (errors.city) setErrors(prev => { const n = { ...prev }; delete n.city; return n; });
                  }}
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none transition-all ${
                    errors.city 
                      ? 'border-red-500 bg-red-50/20' 
                      : `border-slate-200 focus:border-${jobRole === 'marketing' ? 'blue-600' : 'orange-500'}`
                  } ${
                    jobRole === 'marketing' ? 'focus:ring-blue-600/20' : 'focus:ring-orange-500/20'
                  }`}
                  placeholder="مثال: الجبيل، الرياض، جدة"
                />
                {errors.city && <p className="text-red-500 text-xs font-bold mt-1">{errors.city}</p>}
              </div>

              {/* Residence Address */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  عنوان السكن التفصيلي {jobRole === 'marketing' ? ' (اختياري)' : ' *'}
                </label>
                            
                <input
                  type="text"
                  required={jobRole !== 'marketing'}
                  value={personalInfo.residenceAddress}
                  onChange={(e) => {
                    setPersonalInfo(prev => ({ ...prev, residenceAddress: e.target.value }));
                    if (errors.residenceAddress) setErrors(prev => { const n = { ...prev }; delete n.residenceAddress; return n; });
                  }}
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none transition-all ${
                    errors.residenceAddress 
                      ? 'border-red-500 bg-red-50/20' 
                      : `border-slate-200 focus:border-${jobRole === 'marketing' ? 'blue-600' : 'orange-500'}`
                  } ${
                    jobRole === 'marketing' ? 'focus:ring-blue-600/20' : 'focus:ring-orange-500/20'
                  }`}
                  placeholder="مثال: جدة، حي الصفا، شارع الأربعين"
                />
                {errors.residenceAddress && <p className="text-red-500 text-xs font-bold mt-1">{errors.residenceAddress}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  رقم الجوال النشط {jobRole === 'marketing' ? ' (اختياري)' : ' *'}
                </label>
                            
                <input
                  type="tel"
                  required={jobRole !== 'marketing'}
                  value={personalInfo.phone}
                  onChange={(e) => {
                    setPersonalInfo(prev => ({ ...prev, phone: e.target.value }));
                    if (errors.phone) setErrors(prev => { const n = { ...prev }; delete n.phone; return n; });
                  }}
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none transition-all ${
                    errors.phone 
                      ? 'border-red-500 bg-red-50/20' 
                      : `border-slate-200 focus:border-${jobRole === 'marketing' ? 'blue-600' : 'orange-500'}`
                  } ${
                    jobRole === 'marketing' ? 'focus:ring-blue-600/20' : 'focus:ring-orange-500/20'
                  }`}
                  placeholder="مثال: 05XXXXXXXX"
                />
                {errors.phone && <p className="text-red-500 text-xs font-bold mt-1">{errors.phone}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  البريد الإلكتروني {jobRole === 'marketing' ? ' (اختياري)' : ' *'}
                </label>
                            
                <input
                  type="email"
                  required={jobRole !== 'marketing'}
                  value={personalInfo.email}
                  onChange={(e) => {
                    setPersonalInfo(prev => ({ ...prev, email: e.target.value }));
                    if (errors.email) setErrors(prev => { const n = { ...prev }; delete n.email; return n; });
                  }}
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none transition-all ${
                    errors.email 
                      ? 'border-red-500 bg-red-50/20' 
                      : `border-slate-200 focus:border-${jobRole === 'marketing' ? 'blue-600' : 'orange-500'}`
                  } ${
                    jobRole === 'marketing' ? 'focus:ring-blue-600/20' : 'focus:ring-orange-500/20'
                  }`}
                  placeholder="example@domain.com"
                />
                {errors.email && <p className="text-red-500 text-xs font-bold mt-1">{errors.email}</p>}
              </div>

              {/* Qualification */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">المؤهل العلمي *</label>
                            
                <select
                  value={personalInfo.qualification}
                  onChange={(e) => setPersonalInfo(prev => ({ ...prev, qualification: e.target.value }))}
                  className={`w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-${jobRole === 'marketing' ? 'blue-600' : 'orange-500'} focus:ring-2 focus:ring-${jobRole === 'marketing' ? 'blue-600/20' : 'orange-500/20'} outline-none transition-all bg-white`}
                >
                  <option value="دبلوم">دبلوم</option>
                  <option value="بكالوريوس">بكالوريوس</option>
                  <option value="ماجستير">ماجستير</option>
                  <option value="دكتوراه">دكتوراه</option>
                </select>
              </div>

              {/* Major */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  التخصص الدراسي الدقيق {jobRole === 'marketing' ? ' (اختياري)' : ' *'}
                </label>
                            
                <input
                  type="text"
                  required={jobRole !== 'marketing'}
                  value={personalInfo.major}
                  onChange={(e) => {
                    setPersonalInfo(prev => ({ ...prev, major: e.target.value }));
                    if (errors.major) setErrors(prev => { const n = { ...prev }; delete n.major; return n; });
                  }}
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none transition-all ${
                    errors.major 
                      ? 'border-red-500 bg-red-50/20' 
                      : `border-slate-200 focus:border-${jobRole === 'marketing' ? 'blue-600' : 'orange-500'}`
                  } ${
                    jobRole === 'marketing' ? 'focus:ring-blue-600/20' : 'focus:ring-orange-500/20'
                  }`}
                  placeholder="مثال: الهندسة الكيميائية / سلامة مهنية"
                />
                {errors.major && <p className="text-red-500 text-xs font-bold mt-1">{errors.major}</p>}
              </div>

              {/* Experience Years */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  {jobRole === 'marketing' ? 'سنوات الخبرة في مجال التسويق *' : 'سنوات الخبرة في مجال السلامة (HSE) *'}
                </label>
                            
                <input
                  type="number"
                  min={0}
                  max={45}
                  required
                  value={personalInfo.experienceYears}
                  onChange={(e) => setPersonalInfo(prev => ({ ...prev, experienceYears: parseInt(e.target.value, 10) || 0 }))}
                  className={`w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-${jobRole === 'marketing' ? 'blue-600' : 'orange-500'} focus:ring-2 focus:ring-${jobRole === 'marketing' ? 'blue-600/20' : 'orange-500/20'} outline-none transition-all`}
                />
              </div>

              {/* Current Company */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">جهة العمل الحالية (أو السابقة)</label>
                            
                <input
                  type="text"
                  value={personalInfo.currentCompany}
                  onChange={(e) => setPersonalInfo(prev => ({ ...prev, currentCompany: e.target.value }))}
                  className={`w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-${jobRole === 'marketing' ? 'blue-600' : 'orange-500'} focus:ring-2 focus:ring-${jobRole === 'marketing' ? 'blue-600/20' : 'orange-500/20'} outline-none transition-all`}
                  placeholder="اسم الشركة الحالية"
                />
              </div>

              {/* Current Role */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">المسمى الوظيفي الحالي (أو السابق)</label>
                            
                <input
                  type="text"
                  value={personalInfo.currentRole}
                  onChange={(e) => setPersonalInfo(prev => ({ ...prev, currentRole: e.target.value }))}
                  className={`w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-${jobRole === 'marketing' ? 'blue-600' : 'orange-500'} focus:ring-2 focus:ring-${jobRole === 'marketing' ? 'blue-600/20' : 'orange-500/20'} outline-none transition-all`}
                  placeholder="المسمى الوظيفي"
                />
              </div>

              {/* Current Salary */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">الراتب الاجمالي الحالي</label>
                            
                <input
                  type="text"
                  value={personalInfo.currentSalary}
                  onChange={(e) => setPersonalInfo(prev => ({ ...prev, currentSalary: e.target.value }))}
                  className={`w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-${jobRole === 'marketing' ? 'blue-600' : 'orange-500'} focus:ring-2 focus:ring-${jobRole === 'marketing' ? 'blue-600/20' : 'orange-500/20'} outline-none transition-all`}
                  placeholder="إذا لا توجد وظيفة ضع 0"
                />
              </div>

              {/* Expected Salary */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">الراتب المتوقع *</label>
                            
                <input
                  type="text"
                  required
                  value={personalInfo.expectedSalary}
                  onChange={(e) => {
                    setPersonalInfo(prev => ({ ...prev, expectedSalary: e.target.value }));
                    if (errors.expectedSalary) setErrors(prev => { const n = { ...prev }; delete n.expectedSalary; return n; });
                  }}
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none transition-all ${
                    errors.expectedSalary 
                      ? 'border-red-500 bg-red-50/20' 
                      : `border-slate-200 focus:border-${jobRole === 'marketing' ? 'blue-600' : 'orange-500'}`
                  } ${
                    jobRole === 'marketing' ? 'focus:ring-blue-600/20' : 'focus:ring-orange-500/20'
                  }`}
                  placeholder="مثال: 12,000 ريال"
                />
                {errors.expectedSalary && <p className="text-red-500 text-xs font-bold mt-1">{errors.expectedSalary}</p>}
              </div>

              {/* Notice Period */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">فترة الإشعار للبدء بالعمل *</label>
                            
                <select
                  value={personalInfo.noticePeriod}
                  onChange={(e) => setPersonalInfo(prev => ({ ...prev, noticePeriod: e.target.value }))}
                  className={`w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-${jobRole === 'marketing' ? 'blue-600' : 'orange-500'} focus:ring-2 focus:ring-${jobRole === 'marketing' ? 'blue-600/20' : 'orange-500/20'} outline-none transition-all bg-white`}
                >
                  <option value="فوري">بدء فوري / بدون إشعار</option>
                  <option value="أسبوعين">أسبوعين</option>
                  <option value="شهر واحد">شهر واحد</option>
                  <option value="شهرين">شهرين</option>
                </select>
              </div>

              {/* LinkedIn URL */}
              <div className="md:col-span-3">
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <LinkIcon className="w-4 h-4 text-slate-400" />
                  رابط حساب LinkedIn (اختياري)
                </label>
                            
                <input
                  type="url"
                  value={personalInfo.linkedinUrl}
                  onChange={(e) => setPersonalInfo(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                  className={`w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-${jobRole === 'marketing' ? 'blue-600' : 'orange-500'} focus:ring-2 focus:ring-${jobRole === 'marketing' ? 'blue-600/20' : 'orange-500/20'} outline-none transition-all ltr`}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>

              {/* Additional Critical Questions */}
              <div className="border-t border-slate-100 pt-8 mt-4 md:col-span-3">
                <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <ShieldCheck className={`${jobRole === 'marketing' ? 'text-blue-600' : 'text-orange-500'} w-4 h-4`} />
                  {jobRole === 'marketing' ? 'معلومات إضافية هامة للعمل بالإدارة' : 'معلومات إضافية هامة للعمل بالمصنع'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {jobRole === 'marketing' ? (
                    <>
                      {/* Is Jeddah Resident */}
                      <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-150 space-y-3">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">
                            هل أنت من سكان مدينة جدة؟ *
                            {errors.isJeddahResident && <span className="text-red-500 text-[10px] mr-2">{errors.isJeddahResident}</span>}
                          </label>
                            
                          <div className="flex gap-6 mt-1">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="isJeddahResident"
                                value="yes"
                                checked={personalInfo.isJeddahResident === 'yes'}
                                onChange={() => setPersonalInfo(prev => ({ ...prev, isJeddahResident: 'yes' }))}
                                className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                              />
                              <span className="text-xs font-semibold text-slate-800">نعم</span>
                            </label>
                            
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="isJeddahResident"
                                value="no"
                                checked={personalInfo.isJeddahResident === 'no'}
                                onChange={() => setPersonalInfo(prev => ({ ...prev, isJeddahResident: 'no', hasCarAndLicense: 'no' }))}
                                className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                              />
                              <span className="text-xs font-semibold text-slate-800">لا</span>
                            </label>
                            
                          </div>
                        </div>

                        {personalInfo.isJeddahResident === 'yes' && (
                          <div className="border-t border-slate-200/60 pt-3 mt-2">
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                              هل عندك سيارة ورخصة قيادة؟ *
                              {errors.hasCarAndLicense && <span className="text-red-500 text-[10px] mr-2">{errors.hasCarAndLicense}</span>}
                            </label>
                            
                            <div className="flex gap-6 mt-1">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="hasCarAndLicense"
                                  value="yes"
                                  checked={personalInfo.hasCarAndLicense === 'yes'}
                                  onChange={() => setPersonalInfo(prev => ({ ...prev, hasCarAndLicense: 'yes' }))}
                                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                                />
                                <span className="text-xs font-semibold text-slate-800">نعم (عندي رخصة وسيارة للتنقل)</span>
                              </label>
                            
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="hasCarAndLicense"
                                  value="no"
                                  checked={personalInfo.hasCarAndLicense === 'no'}
                                  onChange={() => setPersonalInfo(prev => ({ ...prev, hasCarAndLicense: 'no' }))}
                                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                                />
                                <span className="text-xs font-semibold text-slate-800">لا</span>
                              </label>
                            
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Location Issue (Admin Office map link for marketing) */}
                      <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-150">
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                          هل لديك أي مشكلة في العمل بموقع الإدارة هذا؟ *
                          {errors.hasLocationIssue && <span className="text-red-500 text-[10px] mr-2">{errors.hasLocationIssue}</span>}
                          <a
                            href="https://maps.app.goo.gl/vwvTg73b6S1b26Si9"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-xs mr-2 font-bold inline-block"
                          >
                            (موقع الإدارة على الخريطة 🗺️)
                          </a>
                        </label>
                            
                        <div className="flex gap-6 mt-1">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="hasLocationIssue"
                              value="yes"
                              checked={personalInfo.hasLocationIssue === 'yes'}
                              onChange={() => setPersonalInfo(prev => ({ ...prev, hasLocationIssue: 'yes' }))}
                              className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                            />
                            <span className="text-xs font-semibold text-slate-800">نعم (لدي مشكلة)</span>
                          </label>
                            
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="hasLocationIssue"
                              value="no"
                              checked={personalInfo.hasLocationIssue === 'no'}
                              onChange={() => setPersonalInfo(prev => ({ ...prev, hasLocationIssue: 'no' }))}
                              className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                            />
                            <span className="text-xs font-semibold text-slate-800">لا (لا توجد مشكلة)</span>
                          </label>
                            
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Owns Car */}
                      <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-150">
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                          هل تملك سيارة خاصة؟ *
                          {errors.ownsCar && <span className="text-red-500 text-[10px] mr-2">{errors.ownsCar}</span>}
                        </label>
                            
                        <div className="flex gap-6 mt-1">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="ownsCar"
                              value="yes"
                              checked={personalInfo.ownsCar === 'yes'}
                              onChange={() => setPersonalInfo(prev => ({ ...prev, ownsCar: 'yes' }))}
                              className="w-4 h-4 text-orange-500 border-slate-300 focus:ring-orange-500"
                            />
                            <span className="text-xs font-semibold text-slate-800">نعم</span>
                          </label>
                            
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="ownsCar"
                              value="no"
                              checked={personalInfo.ownsCar === 'no'}
                              onChange={() => setPersonalInfo(prev => ({ ...prev, ownsCar: 'no' }))}
                              className="w-4 h-4 text-orange-500 border-slate-300 focus:ring-orange-500"
                            />
                            <span className="text-xs font-semibold text-slate-800">لا</span>
                          </label>
                            
                        </div>
                      </div>

                      {/* Location Issue */}
                      <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-150">
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                          هل لديك أي مشكلة في العمل بموقع المصنع هذا؟ *
                          {errors.hasLocationIssue && <span className="text-red-500 text-[10px] mr-2">{errors.hasLocationIssue}</span>}
                          <a
                            href="https://maps.app.goo.gl/XuLsfxrUidjELkBD7"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange-500 hover:underline text-xs mr-2 font-bold inline-block"
                          >
                            (موقع المصنع على الخريطة 🗺️)
                          </a>
                        </label>
                            
                        <div className="flex gap-6 mt-1">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="hasLocationIssue"
                              value="yes"
                              checked={personalInfo.hasLocationIssue === 'yes'}
                              onChange={() => setPersonalInfo(prev => ({ ...prev, hasLocationIssue: 'yes' }))}
                              className="w-4 h-4 text-orange-500 border-slate-300 focus:ring-orange-500"
                            />
                            <span className="text-xs font-semibold text-slate-800">نعم (لدي مشكلة)</span>
                          </label>
                            
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="hasLocationIssue"
                              value="no"
                              checked={personalInfo.hasLocationIssue === 'no'}
                              onChange={() => setPersonalInfo(prev => ({ ...prev, hasLocationIssue: 'no' }))}
                              className="w-4 h-4 text-orange-500 border-slate-300 focus:ring-orange-500"
                            />
                            <span className="text-xs font-semibold text-slate-800">لا (لا توجد مشكلة)</span>
                          </label>
                            
                        </div>
                      </div>
                    </>
                  )}

                  {/* Health Issues */}
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-150 md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      هل تعاني من أي مشاكل صحية؟ *
                      {errors.hasHealthIssues && <span className="text-red-500 text-[10px] mr-2">{errors.hasHealthIssues}</span>}
                    </label>
                            
                    <div className="flex gap-6 mt-1 mb-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="hasHealthIssues"
                          value="yes"
                          checked={personalInfo.hasHealthIssues === 'yes'}
                          onChange={() => setPersonalInfo(prev => ({ ...prev, hasHealthIssues: 'yes' }))}
                          className={`w-4 h-4 ${jobRole === 'marketing' ? 'text-blue-600 focus:ring-blue-500' : 'text-orange-500 focus:ring-orange-500'} border-slate-300`}
                        />
                        <span className="text-xs font-semibold text-slate-800">نعم (أعاني من مشاكل صحية)</span>
                      </label>
                            
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="hasHealthIssues"
                          value="no"
                          checked={personalInfo.hasHealthIssues === 'no'}
                          onChange={() => setPersonalInfo(prev => ({ ...prev, hasHealthIssues: 'no' }))}
                          className={`w-4 h-4 ${jobRole === 'marketing' ? 'text-blue-600 focus:ring-blue-500' : 'text-orange-500 focus:ring-orange-500'} border-slate-300`}
                        />
                        <span className="text-xs font-semibold text-slate-800">لا (سليم والحمد لله)</span>
                      </label>
                            
                    </div>

                    {personalInfo.hasHealthIssues === 'yes' && (
                      <div className="mt-2">
                        <label className="block text-xs font-bold text-slate-500 mb-1">يرجى كتابة وتفصيل المشكلة الصحية بالتفصيل: *</label>
                            
                        <input
                          type="text"
                          required
                          value={personalInfo.healthIssuesDetails || ''}
                          onChange={(e) => setPersonalInfo(prev => ({ ...prev, healthIssuesDetails: e.target.value }))}
                          className={`w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 outline-none transition-all font-sans text-xs ${
                            jobRole === 'marketing' 
                              ? 'focus:border-blue-600 focus:ring-blue-600/20' 
                              : 'focus:border-orange-500 focus:ring-orange-500/20'
                          }`}
                          placeholder="مثال: حساسية شديدة من المركبات العضوية المتطايرة، ضيق تنفس..."
                        />
                      </div>
                    )}
                  </div>

                  {/* Kawader Platform License Question (Safety Inspector only) */}
                  {jobRole !== 'marketing' && (
                    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-150 md:col-span-2 space-y-3">
                      <label className="block text-sm font-bold text-slate-700">
                        هل لديك ترخيص من منصة كوادر؟ *
                        {errors.hasKawaderLicense && <span className="text-red-500 text-[10px] mr-2">{errors.hasKawaderLicense}</span>}
                      </label>
                            
                      <div className="flex gap-6 mt-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="hasKawaderLicense"
                            value="yes"
                            checked={personalInfo.hasKawaderLicense === 'yes'}
                            onChange={() => {
                              setPersonalInfo(prev => ({ ...prev, hasKawaderLicense: 'yes' }));
                              if (errors.kawaderLicense) setErrors(prev => { const n = { ...prev }; delete n.kawaderLicense; return n; });
                            }}
                            className="w-4 h-4 text-orange-500 border-slate-300 focus:ring-orange-500"
                          />
                          <span className="text-xs font-semibold text-slate-800">نعم (لدي ترخيص)</span>
                        </label>
                            
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="hasKawaderLicense"
                            value="no"
                            checked={personalInfo.hasKawaderLicense === 'no'}
                            onChange={() => {
                              setPersonalInfo(prev => ({ ...prev, hasKawaderLicense: 'no', kawaderLicenseFileName: '', kawaderLicenseBase64: '' }));
                              if (errors.kawaderLicense) setErrors(prev => { const n = { ...prev }; delete n.kawaderLicense; return n; });
                            }}
                            className="w-4 h-4 text-orange-500 border-slate-300 focus:ring-orange-500"
                          />
                          <span className="text-xs font-semibold text-slate-800">لا (لا يوجد ترخيص)</span>
                        </label>
                            
                      </div>

                      {personalInfo.hasKawaderLicense === 'yes' && (
                        <div className="mt-3 bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                          <label className="block text-xs font-bold text-slate-600">يرجى تحميل ترخيص منصة كوادر المعتمد: *</label>
                            
                          {!personalInfo.kawaderLicenseFileName ? (
                            <div className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer bg-slate-50/50 hover:bg-white transition-all relative group ${
                              errors.kawaderLicense ? 'border-red-500 bg-red-50/10 animate-pulse' : 'border-slate-200 hover:border-orange-500'
                            }`}>
                              <input
                                type="file"
                                accept=".pdf,image/*"
                                onChange={(e) => {
                                  handleFileUpload(e, 'kawader');
                                  if (errors.kawaderLicense) setErrors(prev => { const n = { ...prev }; delete n.kawaderLicense; return n; });
                                }}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                id="upload-kawader-license"
                              />
                              <Upload className="w-6 h-6 text-slate-400 group-hover:text-orange-500 mx-auto mb-2 transition-colors" />
                              <p className="text-xs font-bold text-slate-700 group-hover:text-orange-600 transition-colors">اسحب وأفلت ترخيص كوادر أو انقر هنا للرفع</p>
                              <p className="text-[10px] text-slate-400 mt-1">المدعوم: PDF أو صور (بحد أقصى 10 ميجابايت)</p>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between p-3 border border-emerald-200 bg-emerald-50 rounded-xl">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="bg-emerald-500 p-1.5 rounded-lg text-white shrink-0">
                                  <CheckCircle className="w-4 h-4" />
                                </div>
                                <div className="text-right min-w-0">
                                  <p className="text-xs font-bold text-slate-800 truncate max-w-[200px] sm:max-w-xs">{personalInfo.kawaderLicenseFileName}</p>
                                  <p className="text-[10px] text-emerald-600 font-medium">تم التحميل بنجاح</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeUploadedFile('kawader')}
                                className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-all shrink-0"
                                title="حذف الملف"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          {errors.kawaderLicense && <p className="text-red-500 text-xs font-bold mt-1">{errors.kawaderLicense}</p>}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            </div>

            {/* File Upload Section */}
            <div className="border-t border-slate-100 pt-8">
              <h4 className="text-lg font-bold text-slate-900 mb-6">رفع المستندات والمرفقات الرسمية</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* CV File Input */}
                <div className="space-y-3">
                  <div className="flex justify-between items-baseline flex-wrap gap-1">
                    <label className="block text-sm font-bold text-slate-700">
                      السيرة الذاتية (ملف PDF حديث) {jobRole === 'marketing' ? ' [اختياري]' : ' *'}
                    </label>
                            
                    <span className={`text-[11px] font-bold ${jobRole === 'marketing' ? 'text-blue-600 bg-blue-50' : 'text-orange-600 bg-orange-50'} px-2 py-0.5 rounded-md`}>يفضل السيرة الذاتية باللغة العربية 🇸🇦</span>
                  </div>
                  {!personalInfo.cvFileName ? (
                    <div className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer bg-slate-50/50 hover:bg-white transition-all relative group ${
                      errors.cv ? 'border-red-500 bg-red-50/10 animate-pulse' : `border-slate-200 hover:border-${jobRole === 'marketing' ? 'blue-600' : 'orange-500'}`
                    }`}>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                          handleFileUpload(e, 'cv');
                          if (errors.cv) setErrors(prev => { const n = { ...prev }; delete n.cv; return n; });
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        id="upload-cv-file"
                      />
                      <Upload className={`w-10 h-10 text-slate-400 group-hover:text-${jobRole === 'marketing' ? 'blue-600' : 'orange-500'} mx-auto mb-3 transition-colors`} />
                      <p className={`text-sm font-bold text-slate-700 group-hover:text-${jobRole === 'marketing' ? 'blue-600' : 'orange-500'} transition-colors`}>اسحب وأفلت السيرة الذاتية أو انقر هنا للرفع</p>
                      <p className="text-xs text-slate-400 mt-1">المستند المدعوم: PDF فقط (بحد أقصى 10 ميجابايت)</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 border border-emerald-200 bg-emerald-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="bg-emerald-500 p-2 rounded-lg text-white">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-800 truncate max-w-xs">{personalInfo.cvFileName}</p>
                          <p className="text-xs text-emerald-600 font-medium">تم التحميل والترميز بنجاح</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeUploadedFile('cv')}
                        className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all"
                        title="حذف الملف"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                  {errors.cv && <p className="text-red-500 text-xs font-bold mt-1">{errors.cv}</p>}
                </div>

                {/* Certificates Upload */}
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-slate-700">الشهادات المهنية المعتمدة والمرفقات الأخرى</label>
                            
                  {!personalInfo.certsFileName ? (
                    <div className="border-2 border-dashed border-slate-200 hover:border-orange-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50/50 hover:bg-white transition-all relative group">
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        onChange={(e) => handleFileUpload(e, 'certs')}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        id="upload-certs-file"
                      />
                      <Upload className="w-10 h-10 text-slate-400 group-hover:text-orange-500 mx-auto mb-3 transition-colors" />
                      <p className="text-sm font-bold text-slate-700 group-hover:text-orange-600 transition-colors">اسحب وأفلت ملفات الشهادات أو انقر هنا للرفع</p>
                      <p className="text-xs text-slate-400 mt-1">الملفات المدعومة: PDF أو صور (بحد أقصى 10 ميجابايت)</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 border border-emerald-200 bg-emerald-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="bg-emerald-500 p-2 rounded-lg text-white">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-800 truncate max-w-xs">{personalInfo.certsFileName}</p>
                          <p className="text-xs text-emerald-600 font-medium">تم التحميل والترميز بنجاح</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeUploadedFile('certs')}
                        className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all"
                        title="حذف الملف"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Additional Multiple Files Upload */}
                <div className="col-span-1 md:col-span-2 border-t border-slate-100 pt-6 mt-2 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h5 className="text-sm font-bold text-slate-800">مستندات ومرفقات إضافية</h5>
                      <p className="text-xs text-slate-400 mt-0.5">يمكنك رفع عدة ملفات إضافية مثل الهوية، كرت العائلة، شهادات خبرة سابقة، إلخ.</p>
                    </div>
                    <span className="text-xs font-semibold bg-orange-50 text-orange-600 px-3 py-1 rounded-full self-start">
                      مرفوع: {personalInfo.additionalDocuments?.length || 0} ملفات
                    </span>
                  </div>

                  <div className="border-2 border-dashed border-slate-200 hover:border-orange-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50/50 hover:bg-white transition-all relative group">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,image/*"
                      onChange={handleMultipleFilesUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      id="upload-additional-files"
                    />
                    <Upload className="w-10 h-10 text-slate-400 group-hover:text-orange-500 mx-auto mb-3 transition-colors" />
                    <p className="text-sm font-bold text-slate-700 group-hover:text-orange-600 transition-colors">اسحب وأفلت الملفات الإضافية معاً أو انقر لتحديد عدة ملفات 📂</p>
                    <p className="text-xs text-slate-400 mt-1">يمكنك اختيار ملفات متعددة (PDF أو صور، بحد أقصى 10 ميجابايت للملف الواحد)</p>
                  </div>

                  {personalInfo.additionalDocuments && personalInfo.additionalDocuments.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                      {personalInfo.additionalDocuments.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3.5 border border-slate-200/60 bg-white hover:bg-slate-50/50 rounded-xl transition-all shadow-xs">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="bg-orange-500/10 text-orange-600 p-2 rounded-lg shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="text-right min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-800 truncate" title={doc.fileName}>
                                {doc.fileName}
                              </p>
                              <p className="text-[10px] text-slate-400">مرفق إضافي جاهز للإرسال</p>
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => removeAdditionalFile(doc.id)}
                            className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-all shrink-0"
                            title="حذف الملف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-between">
            <button
              onClick={onCancel}
              className="bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-semibold px-6 py-3 rounded-xl transition-all"
            >
              إلغاء التقديم
            </button>
            <button
              onClick={handleNext}
              className={`text-white font-bold px-8 py-3 rounded-xl shadow-lg flex items-center gap-2 transition-all hover:gap-3 active:scale-95 ${
                jobRole === 'marketing' 
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/10' 
                  : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/10'
              }`}
              id="step1-next-btn"
            >
              المتابعة للخطوة التالية
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* --- STEP 2: PROFESSIONAL EXPERIENCES & CERTIFICATES --- */}
      {currentStep === 2 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="step-2-experience">
          <div className="bg-white text-slate-800 p-6 md:p-8 border-b border-slate-200">
            <h3 className="text-lg md:text-xl font-bold text-blue-900 mb-1 font-sans">الخطوة الثانية: الخبرات المهنية التخصصية والشهادات</h3>
            <p className="text-xs text-slate-400 font-medium">
              {jobRole === 'marketing' 
                ? 'نبحث بشكل مركز عن الخبرات التسويقية والمهارات الرقمية والاعتمادات الرسمية. يرجى تحديد خبراتك وإثبات مهاراتك.'
                : 'نبحث بشكل مركز عن الخبرات داخل بيئات التصنيع والمصانع الكيميائية. يرجى تحديد خبراتك وإثبات شهاداتك المهنية.'}
            </p>
          </div>

          <div className="p-6 md:p-8 space-y-8">
            {/* Experience Checks */}
            <div>
              <h4 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-2">
                {jobRole === 'marketing' 
                  ? 'هل تملك خبرات عمل في المجالات التسويقية والتنظيمية التالية؟'
                  : 'هل تملك خبرات عمل في القطاعات الصناعية التالية؟'}
              </h4>
              <div className="space-y-6">

                {/* Paint Factory */}
                <div className="border border-slate-100 rounded-2xl p-6 bg-slate-50/30">
                  <label className="flex items-start gap-3.5 cursor-pointer group mb-4">
                    <input
                      type="checkbox"
                      checked={industryExperience.workedInPaint}
                      onChange={(e) => setIndustryExperience(prev => ({ ...prev, workedInPaint: e.target.checked }))}
                      className="sr-only"
                    />
                    <div className={`w-6 h-6 rounded-lg border-2 mt-0.5 transition-all flex items-center justify-center ${
                      industryExperience.workedInPaint 
                        ? jobRole === 'marketing' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-orange-500 border-orange-500 text-white' 
                        : 'border-slate-300 bg-white group-hover:border-slate-400'
                    }`}>
                      {industryExperience.workedInPaint && <CheckCircle className="w-4 h-4 text-white" />}
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-800 group-hover:text-slate-950">
                        {jobRole === 'marketing' ? 'لقد سبق لي العمل التسويقي أو المبيعات في قطاع الدهانات والصناعة' : 'لقد سبق لي العمل في مصانع للدهانات والطلاء'}
                      </h5>
                      <p className="text-xs text-slate-500">
                        {jobRole === 'marketing' ? 'حدد هذا الخيار إذا كنت قد عملت في تسويق أو مبيعات الدهانات والطلاء أو في القطاع الصناعي عموماً.' : 'حدد هذا الخيار إذا كنت قد أشرفت على السلامة داخل خطوط إنتاج أو تعبئة أو تخزين الطلاء والدهانات سابقاً.'}
                      </p>
                    </div>
                  </label>
                            

                  {industryExperience.workedInPaint && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-200/60 pt-4 mt-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          {jobRole === 'marketing' ? 'اسم شركة الدهانات / المنشأة الصناعية *' : 'اسم شركة الدهانات *'}
                        </label>
                            
                        <input
                          type="text"
                          required
                          value={industryExperience.paintCompany || ''}
                          onChange={(e) => setIndustryExperience(prev => ({ ...prev, paintCompany: e.target.value }))}
                          className={`w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-${jobRole === 'marketing' ? 'blue' : 'orange'}-500`}
                          placeholder={jobRole === 'marketing' ? 'مثال: شركة دهانات وطنية' : 'مثال: مصنع دهانات وطني'}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">عدد سنوات الخبرة بها *</label>
                            
                        <input
                          type="number"
                          min={0}
                          value={industryExperience.paintYears || 0}
                          onChange={(e) => setIndustryExperience(prev => ({ ...prev, paintYears: parseInt(e.target.value, 10) || 0 }))}
                          className={`w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-${jobRole === 'marketing' ? 'blue' : 'orange'}-500`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          {jobRole === 'marketing' ? 'المسمى الوظيفي التسويقي لديك *' : 'المسمى الوظيفي لديك *'}
                        </label>
                            
                        <input
                          type="text"
                          required
                          value={industryExperience.paintRole || ''}
                          onChange={(e) => setIndustryExperience(prev => ({ ...prev, paintRole: e.target.value }))}
                          className={`w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-${jobRole === 'marketing' ? 'blue' : 'orange'}-500`}
                          placeholder={jobRole === 'marketing' ? 'أخصائي تسويق رقمي / ممثل مبيعات' : 'أخصائي سلامة'}
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          {jobRole === 'marketing' ? 'أبرز مسؤولياتك وإنجازاتك التسويقية هناك' : 'أبرز مسؤولياتك وإنجازاتك في المصنع'}
                        </label>
                            
                        <textarea
                          rows={2}
                          value={industryExperience.paintTasks || ''}
                          onChange={(e) => setIndustryExperience(prev => ({ ...prev, paintTasks: e.target.value }))}
                          className={`w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none resize-none focus:border-${jobRole === 'marketing' ? 'blue' : 'orange'}-500`}
                          placeholder={jobRole === 'marketing' ? 'توضيح المهام مثل بناء العلاقات، ترويج المنتجات، تنظيم عينات الألوان والكتالوجات...' : 'اكتب باختصار المهام مثل الإشراف على التأريض والكهرباء الساكنة وفحص التخزين...'}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Chemical Factory */}
                <div className="border border-slate-100 rounded-2xl p-6 bg-slate-50/30">
                  <label className="flex items-start gap-3.5 cursor-pointer group mb-4">
                    <input
                      type="checkbox"
                      checked={industryExperience.workedInChemical}
                      onChange={(e) => setIndustryExperience(prev => ({ ...prev, workedInChemical: e.target.checked }))}
                      className="sr-only"
                    />
                    <div className={`w-6 h-6 rounded-lg border-2 mt-0.5 transition-all flex items-center justify-center ${
                      industryExperience.workedInChemical 
                        ? jobRole === 'marketing' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-orange-500 border-orange-500 text-white' 
                        : 'border-slate-300 bg-white group-hover:border-slate-400'
                    }`}>
                      {industryExperience.workedInChemical && <CheckCircle className="w-4 h-4 text-white" />}
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-800 group-hover:text-slate-950">
                        {jobRole === 'marketing' ? 'خبرة في التسويق الرقمي وإدارة قنوات التواصل وصناعة المحتوى' : 'لقد سبق لي العمل في مصانع للصناعات الكيماوية والمواد الخطرة'}
                      </h5>
                      <p className="text-xs text-slate-500">
                        {jobRole === 'marketing' ? 'حدد هذا الخيار إذا كان لديك خبرة تسويقية في إدارة الإعلانات الرقمية، أو إدارة حسابات التواصل الاجتماعي، أو كتابة وتصميم المحتوى الإبداعي.' : 'حدد هذا الخيار إذا كنت قد عملت في مصانع للكيماويات، المنظفات، الغازات، المواد القابلة للاشتعال أو المتفجرة وتعرف إجراءات الوقاية المناسبة لها.'}
                      </p>
                    </div>
                  </label>
                            

                  {industryExperience.workedInChemical && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-200/60 pt-4 mt-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          {jobRole === 'marketing' ? 'اسم الجهة / الشركة التي عملت لصالحها *' : 'اسم المصنع الكيماوي *'}
                        </label>
                            
                        <input
                          type="text"
                          required
                          value={industryExperience.chemicalCompany || ''}
                          onChange={(e) => setIndustryExperience(prev => ({ ...prev, chemicalCompany: e.target.value }))}
                          className={`w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-${jobRole === 'marketing' ? 'blue' : 'orange'}-500`}
                          placeholder={jobRole === 'marketing' ? 'وكالة تسويق رقمي / شركة تجارية' : 'اسم المصنع الكيماوي'}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">عدد سنوات الخبرة بها *</label>
                            
                        <input
                          type="number"
                          min={0}
                          value={industryExperience.chemicalYears || 0}
                          onChange={(e) => setIndustryExperience(prev => ({ ...prev, chemicalYears: parseInt(e.target.value, 10) || 0 }))}
                          className={`w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-${jobRole === 'marketing' ? 'blue' : 'orange'}-500`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          {jobRole === 'marketing' ? 'المسمى الوظيفي التسويقي لديك *' : 'المسمى الوظيفي لديك *'}
                        </label>
                            
                        <input
                          type="text"
                          required
                          value={industryExperience.chemicalRole || ''}
                          onChange={(e) => setIndustryExperience(prev => ({ ...prev, chemicalRole: e.target.value }))}
                          className={`w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-${jobRole === 'marketing' ? 'blue' : 'orange'}-500`}
                          placeholder={jobRole === 'marketing' ? 'أخصائي تسويق / كاتب محتوى' : 'أخصائي سلامة كيميائية'}
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          {jobRole === 'marketing' ? 'أبرز مسؤولياتك وإنجازاتك التسويقية هناك' : 'أبرز مسؤولياتك وإنجازاتك هناك'}
                        </label>
                            
                        <textarea
                          rows={2}
                          value={industryExperience.chemicalTasks || ''}
                          onChange={(e) => setIndustryExperience(prev => ({ ...prev, chemicalTasks: e.target.value }))}
                          className={`w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none resize-none focus:border-${jobRole === 'marketing' ? 'blue' : 'orange'}-500`}
                          placeholder={jobRole === 'marketing' ? 'إدارة الإعلانات، تحسين SEO، صناعة وتصميم المنشورات...' : 'الإشراف على المواد الخطرة، تطبيق صحائف SDS، إدارة الانسكابات...'}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Industrial Factory */}
                <div className="border border-slate-100 rounded-2xl p-6 bg-slate-50/30">
                  <label className="flex items-start gap-3.5 cursor-pointer group mb-4">
                    <input
                      type="checkbox"
                      checked={industryExperience.workedInIndustrial}
                      onChange={(e) => setIndustryExperience(prev => ({ ...prev, workedInIndustrial: e.target.checked }))}
                      className="sr-only"
                    />
                    <div className={`w-6 h-6 rounded-lg border-2 mt-0.5 transition-all flex items-center justify-center ${
                      industryExperience.workedInIndustrial 
                        ? jobRole === 'marketing' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-orange-500 border-orange-500 text-white' 
                        : 'border-slate-300 bg-white group-hover:border-slate-400'
                    }`}>
                      {industryExperience.workedInIndustrial && <CheckCircle className="w-4 h-4 text-white" />}
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-800 group-hover:text-slate-950">
                        {jobRole === 'marketing' ? 'خبرة في تسجيل واعتماد الشركات في منصات الموردين والجهات الرسمية' : 'لقد سبق لي العمل في مصانع صناعية عامة (أخرى)'}
                      </h5>
                      <p className="text-xs text-slate-500">
                        {jobRole === 'marketing' ? 'حدد هذا الخيار إذا كان لديك خبرة عملية في التعامل مع منصة اعتماد، بلدي، سابر، الهيئة العامة للغذاء والدواء، أو أي جهات حكومية وخاصة لتسجيل وتحديث وثائق الموردين والاعتمادات.' : 'حدد هذا الخيار إذا كنت قد عملت في مصانع لإنتاج الأغذية، الحديد، التعبئة، السيارات أو أي بيئة تصنيع عامة غير كيماوية.'}
                      </p>
                    </div>
                  </label>
                            

                  {industryExperience.workedInIndustrial && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-200/60 pt-4 mt-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          {jobRole === 'marketing' ? 'اسم الجهة / الشركة التي عملت لصالحها *' : 'اسم المنشأة الصناعية *'}
                        </label>
                            
                        <input
                          type="text"
                          required
                          value={industryExperience.industrialCompany || ''}
                          onChange={(e) => setIndustryExperience(prev => ({ ...prev, industrialCompany: e.target.value }))}
                          className={`w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-${jobRole === 'marketing' ? 'blue' : 'orange'}-500`}
                          placeholder={jobRole === 'marketing' ? 'وكالة تسويق رقمي / شركة تجارية' : 'اسم المنشأة الصناعية'}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">عدد سنوات الخبرة بها *</label>
                            
                        <input
                          type="number"
                          min={0}
                          value={industryExperience.industrialYears || 0}
                          onChange={(e) => setIndustryExperience(prev => ({ ...prev, industrialYears: parseInt(e.target.value, 10) || 0 }))}
                          className={`w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-${jobRole === 'marketing' ? 'blue' : 'orange'}-500`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          {jobRole === 'marketing' ? 'المسمى الوظيفي التسويقي لديك *' : 'المسمى الوظيفي لديك *'}
                        </label>
                            
                        <input
                          type="text"
                          required
                          value={industryExperience.industrialRole || ''}
                          onChange={(e) => setIndustryExperience(prev => ({ ...prev, industrialRole: e.target.value }))}
                          className={`w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-${jobRole === 'marketing' ? 'blue' : 'orange'}-500`}
                          placeholder={jobRole === 'marketing' ? 'أخصائي تسويق / كاتب محتوى' : 'أخصائي سلامة صناعية'}
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          {jobRole === 'marketing' ? 'أبرز مسؤولياتك وإنجازاتك التسويقية هناك' : 'أبرز مسؤولياتك وإنجازاتك هناك'}
                        </label>
                            
                        <textarea
                          rows={2}
                          value={industryExperience.industrialTasks || ''}
                          onChange={(e) => setIndustryExperience(prev => ({ ...prev, industrialTasks: e.target.value }))}
                          className={`w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none resize-none focus:border-${jobRole === 'marketing' ? 'blue' : 'orange'}-500`}
                          placeholder={jobRole === 'marketing' ? 'إدارة الإعلانات، تحسين SEO، صناعة وتصميم المنشورات...' : 'الإشراف على سلامة الآلات، مخاطر الكهرباء، الرافعات الشوكية، وتدريب العمال على الإخلاء...'}
                        />
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Certificates selection (only if Safety Inspector) */}
            {jobRole !== 'marketing' && (
              <div>
                <h4 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-2 font-sans">
                  الشهادات المهنية والاعتمادات التي تحملها
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { id: 'nebosh', label: 'NEBOSH IGC' },
                    { id: 'osha', label: 'OSHA 30-Hour' },
                    { id: 'iosh', label: 'IOSH Managing Safely' },
                    { id: 'iso45001', label: 'ISO 45001 Lead Auditor' },
                    { id: 'fireSafety', label: 'Industrial Fire Safety' },
                    { id: 'firstAid', label: 'First Aid & CPR' },
                    { id: 'hazop', label: 'HAZOP' },
                    { id: 'hazmat', label: 'HAZMAT' },
                    { id: 'permitToWork', label: 'Permit To Work' },
                    { id: 'workingAtHeights', label: 'Working At Heights' },
                    { id: 'confinedSpace', label: 'Confined Space' },
                    { id: 'forkliftSafety', label: 'Forklift Safety' }
                  ].map((cert) => (
                    <label key={cert.id} className="flex items-center gap-3 p-3.5 border border-slate-100 rounded-xl bg-slate-50/30 hover:bg-slate-50 cursor-pointer transition-all group">
                      <input
                        type="checkbox"
                        checked={!!(certificates as any)[cert.id]}
                        onChange={(e) => setCertificates(prev => ({ ...prev, [cert.id]: e.target.checked }))}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${
                        (certificates as any)[cert.id]
                          ? 'bg-orange-500 border-orange-500 text-white'
                          : 'border-slate-300 bg-white group-hover:border-slate-400'
                      }`}>
                        {(certificates as any)[cert.id] && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900">{cert.label}</span>
                    </label>
                            
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Action buttons */}
          <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-between">
            <button
              onClick={handleBack}
              className="bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-semibold px-6 py-3 rounded-xl flex items-center gap-2 transition-all active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              العودة للسابق
            </button>
            <button
              onClick={handleNext}
              className={`text-white font-bold px-8 py-3 rounded-xl shadow-lg flex items-center gap-2 transition-all hover:gap-3 active:scale-95 ${
                jobRole === 'marketing' 
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/10' 
                  : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/10'
              }`}
              id="step2-next-btn"
            >
              المتابعة للخطوة التالية
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      

{/* --- STEP 3: TECHNICAL EXAM / PORTFOLIO --- */}
      {currentStep === 3 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="step-3-exam">
          <div className="bg-white text-slate-800 p-6 md:p-8 border-b border-slate-200">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div>
                <h3 className={`text-lg md:text-xl font-bold mb-1 ${jobRole === 'marketing' ? 'text-blue-900' : 'text-orange-600'}`}>
                  {jobRole === 'marketing' ? 'الخطوة الثالثة: اختبار الجدارة والكفاءة التسويقية والمهنية' : 'الخطوة الثالثة: اختبار الجدارة والكفاءة الفنية (HSE)'}
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  {jobRole === 'marketing' 
                    ? 'يتكون هذا الاختبار من 10 أسئلة تخصصية وتفصيلية لقياس مدى وعيك وإدراكك لأساسيات التسويق وإدارة الهوية والمنصات الحكومية.' 
                    : 'يتكون هذا الاختبار من 10 أسئلة مقالية تخصصية لقياس مدى وعيك وإدراكك الميداني لبيئة مصانع الطلاء.'}
                </p>
              </div>
              <div className={`text-left px-4 py-2 rounded-xl border self-start md:self-auto shrink-0 ${
                jobRole === 'marketing' ? 'bg-blue-50 border-blue-100 text-blue-900' : 'bg-orange-50 border-orange-100 text-orange-950'
              }`}>
                <span className="text-[10px] block uppercase font-bold">نسبة إنجاز الأجوبة</span>
                <span className="text-xs font-bold font-mono">{answeredCount} / 10 أسئلة ({progressPercent}%)</span>
              </div>
            </div>

            {/* Dynamic Progress Indicator */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-6 overflow-hidden">
              <div className={`h-full transition-all duration-300 ${jobRole === 'marketing' ? 'bg-blue-600' : 'bg-orange-500'}`} style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-8">
            <div className="bg-amber-50 border-r-4 border-amber-500 p-4 rounded-xl flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm text-slate-700 leading-relaxed">
                <span className="font-bold block text-slate-800 mb-1">تعليمات هامة للاختبار:</span>
                • يرجى الإجابة بلغة عربية واضحة ومستفيضة وتجنب الإجابات المختصرة جداً بكلمة أو اثنتين.<br />
                • سيقوم محرك الذكاء الاصطناعي (AI) بفحص وتحليل إجاباتك الفنية والتحقق من استخدامك للمفاهيم الصحيحة وهرم التحكم لتصنيف طلبك.<br />
                • يتم حفظ إجاباتك تلقائياً لحظة كتابتها، ويمكنك العودة وإكمالها في أي وقت دون خوف من انقطاع الصفحة.
              </div>
            </div>

            {/* Questions list */}
            <div className="space-y-8">
              {(jobRole === 'marketing' ? [
                { 
                  id: 'q1_paint_risks', 
                  q: '1- ما هي أبرز الحملات التسويقية التي قمت بتخطيطها وإدارتها سابقاً؟', 
                  placeholder: 'يرجى ذكر اسم الحملة، القنوات التسويقية المستخدمة (مثل منصات التواصل الإعلانية)، الميزانية الإجمالية التقريبية، وأبرز النتائج والمبيعات والأرقام المحققة بالتفصيل...' 
                },
                { 
                  id: 'q2_hazard_vs_risk', 
                  q: '2- كيف تدير الهوية الرقمية للعلامة التجارية وتصنع المحتوى الإبداعي؟', 
                  placeholder: 'تحدث عن منهجيتك في بناء الهوية البصرية والمكتوبة، كتابة النصوص الإعلانية (Copywriting)، وتفاعل الجماهير المستهدفة في السوشيال ميديا...' 
                },
                { 
                  id: 'q3_incident_investigation', 
                  q: '3- ما هي خبرتك بالتفصيل في تسجيل واعتماد الشركات لدى منصات الموردين الرسمية والجهات التنظيمية؟', 
                  placeholder: 'تحدث بالتفصيل عن خبرتك في منصات مثل (منصة اعتماد، بلدي، سابر، الهيئة العامة للغذاء والدواء أو غيرها) والوثائق والإجراءات المطلوبة...' 
                },
                { 
                  id: 'q4_risk_assessment', 
                  q: '4- كيف توظف أدوات تحليل البيانات ومؤشرات الأداء (KPIs) لتطوير خطتك التسويقية؟', 
                  placeholder: 'اشرح كيف تقيس العائد على الإنفاق الإعلاني (ROAS)، تكلفة اكتساب العميل (CAC)، ومعدل التحويل الرقمي لتعديل استراتيجية الحملة الإعلانية...' 
                },
                { 
                  id: 'q5_ppe_chemical', 
                  q: '5- اذكر بالتفصيل "أعمالاً ومشاريع تسويقية تم تنفيذها" ودورك الدقيق والإبداعي فيها.', 
                  placeholder: 'تحدث عن مشاريع ترويجية قمت بتنفيذها بنفسك، مثل إعداد وتصميم منشورات، إطلاق حملات مبيعات، تنظيم معارض تسويقية، أو إدارة فرق عمل فرعية...' 
                },
                { 
                  id: 'q6_sds_msds', 
                  q: '6- يرجى تزويدنا بروابط أعمالك السابقة أو معرض أعمالك الرقمي (Portfolio) - [أعمال تم تنفيذها].', 
                  placeholder: 'ضع هنا روابط (URLs) لمواقع ويب صممتها أو أدرتها، حسابات تواصل اجتماعي أطلقتها، ملفات بورتفوليو على Behance أو Google Drive، إلخ...' 
                },
                { 
                  id: 'q7_flammable_spill', 
                  q: '7- ما هي الأدوات والمنصات الإعلانية وتطبيقات التصميم ومونتاج الفيديو التي تتقن العمل عليها باحترافية؟', 
                  placeholder: 'يرجى تحديد مستواك في أدوات مثل (Canva, Photoshop, Premiere, Meta Ads, TikTok Ads Manager, Google Ads or Snapchat Ads)...' 
                },
                { 
                  id: 'q8_ppe_refusal', 
                  q: '8- كيف تتعامل مع ميزانيات التسويق المحدودة لتحقيق أقصى فاعلية وأعلى معدل تحويل للعملاء؟', 
                  placeholder: 'تحدث عن استراتيجيتك المتبعة في تحسين الاستهداف الجغرافي والديمغرافي وترشيد الميزانيات بما يضمن زيادة العوائد بأقل النفقات...' 
                },
                { 
                  id: 'q9_daily_inspection', 
                  q: '9- كيف تصمم وتنفذ استراتيجية تسويق لمنتجات مصانع الدهانات والمعاجين (قطاع صناعي B2B و B2C)؟', 
                  placeholder: 'ما هي رؤيتك في تسويق منتجات الطلاء الإنشائية والصناعية للمقاولين وأصحاب المنازل؟ ما القنوات الإعلانية الأنسب والأقوى تأثيراً؟...' 
                },
                { 
                  id: 'q10_safety_project', 
                  q: '10- يرجى تزويدنا بوصف وملخص لملف "عينة من أعمالك السابقة" التي ستقوم برفعها كملف مرفق أدناه.', 
                  placeholder: 'اكتب وصفاً أو ملخصاً مختصراً للملف الذي ستقوم بتحميله بالأسفل (البورتفوليو، حملات، تصميم، عرض تقديمي، إلخ) وما يحتويه من نماذج...' 
                }
              ] : [
                { 
                  id: 'q1_paint_risks', 
                  q: '1- ما أهم المخاطر داخل مصانع الدهانات؟', 
                  placeholder: 'اكتب بالتفصيل مخاطر الحريق، استنشاق الأبخرة الكيماوية والصلبة، مخاطر الانفجار، الضجيج والكهرباء الساكنة...' 
                },
                { 
                  id: 'q2_hazard_vs_risk', 
                  q: '2- ما الفرق بين الخطر والمخاطرة؟', 
                  placeholder: 'اشرح المعنى الكامن والعملي لكل منهما مع ضرب مثال واقعي يوضح الفرق بدقة.' 
                },
                { 
                  id: 'q3_incident_investigation', 
                  q: '3- كيف تحقق في حادث عمل؟', 
                  placeholder: 'ما هي الخطوات الميدانية والإدارية التي ستتخذها فوراً لجمع الأدلة والشهادات وتحديد الأسباب الجذرية (Root Causes)؟' 
                },
                { 
                  id: 'q4_risk_assessment', 
                  q: '4- كيف تقوم بإعداد تقييم مخاطر؟', 
                  placeholder: 'ما هي الخطوات الخمس المعتمدة عالمياً لتصميم تقييم المخاطر (Risk Assessment) لمهام معينة بالمصنع؟' 
                },
                { 
                  id: 'q5_ppe_chemical', 
                  q: '5- ما معدات الوقاية الشخصية المطلوبة عند التعامل مع المواد الكيميائية؟', 
                  placeholder: 'حدد بدقة نوع الكمامات، الفلاتر، القفازات، النظارات، وبدلات العمل المخصصة لصالتي الخلط والمختبرات.' 
                },
                { 
                  id: 'q6_sds_msds', 
                  q: '6- ما هي SDS أو MSDS وما أهميتها؟', 
                  placeholder: 'ما هي صحيفة بيانات سلامة المادة، وكم عدد أقسامها الرئيسية، وكيف توظفها عملياً لتأمين عمال المصنع؟' 
                },
                { 
                  id: 'q7_flammable_spill', 
                  q: '7- ماذا ستفعل عند حدوث انسكاب لمادة كيميائية قابلة للاشتعال؟', 
                  placeholder: 'اكتب بروتوكول الاستجابة السريعة خطوة بخطوة من العزل والإخلاء ومكافحة مصادر الاشتعال والتحكم بالانسكاب تنظيفاً وتخلصاً.' 
                },
                { 
                  id: 'q8_ppe_refusal', 
                  q: '8- كيف تتعامل مع موظف يرفض ارتداء معدات الوقاية الشخصية؟', 
                  placeholder: 'ما هي منهجيتك القيادية والإدارية في الإقناع ورفع الوعي والتدرج بالجزاءات والأنظمة لحماية حياته وحياة زملائه؟' 
                },
                { 
                  id: 'q9_daily_inspection', 
                  q: '9- ما أهم النقاط التي يجب فحصها أثناء الجولة التفتيشية اليومية؟', 
                  placeholder: 'ما هي قائمتك الذهبية اليومية للتأكد من ممرات الطوارئ، أدوات الإطفاء، أنظمة التهوية والتوصيلات الأرضية للتأريض؟' 
                },
                { 
                  id: 'q10_safety_project', 
                  q: '10- اذكر مشروعًا أو تحسينًا في السلامة سبق أن شاركت فيه.', 
                  placeholder: 'تحدث عن مشروع، مبادرة، تدريب، أو تعديل قمت به أو شاركت فيه لزيادة الأمان والصحة في منشأتك السابقة أو الحالية.' 
                }
              ]).map((item, index) => {
                const currentVal = (examAnswers as any)[item.id] || '';
                const wordCount = currentVal.trim().split(/\s+/).filter(Boolean).length;
                return (
                  <div key={item.id} className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100 flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                      <h5 className="font-bold text-slate-900 text-base">{item.q}</h5>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-md shrink-0 self-start ${
                        wordCount > 30 ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                        wordCount > 10 ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                        'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}>
                        {wordCount} كلمة {wordCount > 30 ? '• إجابة كافية' : wordCount > 0 ? '• إجابة مختصرة' : '• لم تتم الإجابة'}
                      </span>
                    </div>
                    <textarea
                      rows={5}
                      value={currentVal}
                      onChange={(e) => setExamAnswers(prev => ({ ...prev, [item.id]: e.target.value }))}
                      className={`w-full bg-white px-4 py-3 rounded-xl border border-slate-200 focus:border-${jobRole === 'marketing' ? 'blue-600' : 'orange-500'} focus:ring-2 focus:ring-${jobRole === 'marketing' ? 'blue-600/20' : 'orange-500/20'} outline-none transition-all text-sm leading-relaxed`}
                      placeholder={item.placeholder}
                    />
                    
                    {/* Portfolio file upload uploader for Marketing under Q10 */}
                    {item.id === 'q10_safety_project' && jobRole === 'marketing' && (
                      <div className="mt-4 border-t border-slate-100 pt-4">
                        <label className="block text-xs font-bold text-slate-600 mb-2">
                          رفع ملف عينة الأعمال أو الملف التعريفي (PDF أو صور - بحد أقصى 10 ميغابايت) [اختياري]
                        </label>
                            
                        <div className="flex items-center gap-3">
                          <label className="cursor-pointer flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-4 py-2 rounded-xl text-xs font-semibold transition-all">
                            <Upload className="w-4 h-4" />
                            اختر الملف لتحميله
                            <input
                              type="file"
                              accept=".pdf,image/*"
                              onChange={handlePortfolioUpload}
                              className="hidden"
                            />
                          </label>
                            
                          {personalInfo.portfolioFileName && (
                            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700">
                              <span className="truncate max-w-[200px]">{personalInfo.portfolioFileName}</span>
                              <button
                                type="button"
                                onClick={removePortfolioFile}
                                className="text-red-500 hover:text-red-700 font-bold ml-1 text-sm focus:outline-none"
                              >
                                &times;
                              </button>
                            </div>
                          )}
                        </div>
                        {errors.portfolioFile && (
                          <p className="text-red-500 text-xs mt-1.5 font-bold">{errors.portfolioFile}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Help Prompt Card */}
            <div className="bg-slate-900 text-slate-300 p-6 rounded-2xl border border-slate-800 flex gap-4">
              <HelpCircle className={`w-8 h-8 shrink-0 mt-1 ${jobRole === 'marketing' ? 'text-blue-400' : 'text-orange-400'}`} />
              <div>
                <h5 className="font-bold text-white text-base mb-1">هل أكملت جميع الإجابات المطلوبة؟</h5>
                <p className="text-xs text-slate-400 leading-relaxed">
                  الرجاء مراجعة إجاباتك الفنية والتحقق من عدم ترك أي سؤال فارغاً. الإجابات التخصصية المفصلة تُعد دليلاً ممتازاً على كفاءتك وتدعم قرار محرك التقييم الذكي التلقائي بشكل مباشر قبل المراجعة البشرية.
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-between">
            <button
              onClick={handleBack}
              className="bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-semibold px-6 py-3 rounded-xl flex items-center gap-2 transition-all active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              العودة للسابق
            </button>
            <button
              onClick={handleNext}
              className={`text-white font-bold px-8 py-3 rounded-xl shadow-lg flex items-center gap-2 transition-all hover:gap-3 active:scale-95 ${
                jobRole === 'marketing'
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/10'
                  : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/10'
              }`}
              id="step3-next-btn"
            >
              الانتقال لصفحة المراجعة والملخص
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* --- STEP 4: REVIEW & SUBMIT --- */}
      {currentStep === 4 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in" id="step-4-review">
          <div className="bg-white text-slate-800 p-6 md:p-8 border-b border-slate-200">
            <h3 className="text-lg md:text-xl font-bold text-blue-900 mb-1">الخطوة الرابعة: مراجعة الطلب وتأكيد الإرسال</h3>
            <p className="text-xs text-slate-400 font-medium">يرجى مراجعة ملخص بياناتك المعبأة بدقة وتأكيد إرسالها النهائي لقسم التوظيف ومحرك الفحص الذكي.</p>
          </div>

          <div className="p-6 md:p-8 space-y-8">
            
            {/* Display error if there was a problem during submission */}
            {submitError && (
              <div className="bg-red-50 border-r-4 border-red-500 p-4 rounded-xl flex gap-3 text-red-700 text-sm font-semibold">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p>{submitError}</p>
              </div>
            )}

            {/* Personal Details Summary */}
            <div className="border border-slate-150 rounded-2xl p-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <h4 className="font-extrabold text-slate-900 flex items-center gap-2 text-base">
                  <User className="text-orange-500 w-5 h-5" />
                  الملخص الشخصي والتعليمي
                </h4>
                <button 
                  onClick={() => setCurrentStep(1)}
                  className="text-orange-500 hover:text-orange-600 text-xs font-bold border border-orange-100 hover:border-orange-200 px-3 py-1.5 rounded-lg transition-all"
                >
                  تعديل القسم
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6 text-sm">
                <div>
                  <span className="text-slate-400 text-xs block mb-1">الاسم الكامل</span>
                  <span className="font-bold text-slate-800">{personalInfo.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block mb-1">الجنسية</span>
                  <span className="font-bold text-slate-800">{personalInfo.nationality}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block mb-1">الجنس</span>
                  <span className="font-bold text-slate-800">{personalInfo.gender === 'male' ? 'ذكر' : 'أنثى'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block mb-1">تاريخ الميلاد</span>
                  <span className="font-bold text-slate-800">
                    {personalInfo.birthDate}
                    {personalInfo.birthDate && ` (العمر: ${Math.abs(new Date(Date.now() - new Date(personalInfo.birthDate).getTime()).getUTCFullYear() - 1970)} سنة)`}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block mb-1">المدينة</span>
                  <span className="font-bold text-slate-800">{personalInfo.city}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block mb-1">عنوان السكن التفصيلي</span>
                  <span className="font-bold text-slate-800">{personalInfo.residenceAddress}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block mb-1">رقم الجوال</span>
                  <span className="font-bold text-slate-800">{personalInfo.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block mb-1">البريد الإلكتروني</span>
                  <span className="font-bold text-slate-800">{personalInfo.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block mb-1">المؤهل الدراسي والتخصص</span>
                  <span className="font-bold text-slate-800">{personalInfo.qualification} - {personalInfo.major}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block mb-1">سنوات الخبرة (HSE)</span>
                  <span className="font-bold text-slate-800">{personalInfo.experienceYears} سنوات</span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block mb-1">الراتب المتوقع</span>
                  <span className="font-bold text-slate-800">{personalInfo.expectedSalary}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block mb-1">فترة الإشعار</span>
                  <span className="font-bold text-slate-800">{personalInfo.noticePeriod}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block mb-1">امتلاك سيارة</span>
                  <span className="font-bold text-slate-800">{personalInfo.ownsCar === 'yes' ? 'نعم' : 'لا'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block mb-1">مشاكل صحية</span>
                  <span className="font-bold text-slate-800">
                    {personalInfo.hasHealthIssues === 'yes' ? `نعم (${personalInfo.healthIssuesDetails})` : 'لا توجد'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block mb-1">مشكلة بموقع المصنع</span>
                  <span className="font-bold text-slate-800">{personalInfo.hasLocationIssue === 'yes' ? 'نعم (لديه مشكلة)' : 'لا (لا توجد مشكلة)'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block mb-1">ترخيص منصة كوادر</span>
                  <span className="font-bold text-slate-800">
                    {personalInfo.hasKawaderLicense === 'yes' ? `نعم (الملف: ${personalInfo.kawaderLicenseFileName || 'لم يرفع بعد'})` : 'لا'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block mb-1">السيرة الذاتية المرفقة</span>
                  <span className="font-bold text-emerald-600">{personalInfo.cvFileName || "لم يتم الرفع"}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block mb-1">الشهادات المهنية المرفقة</span>
                  <span className="font-bold text-emerald-600">{personalInfo.certsFileName || "لا يوجد"}</span>
                </div>
                <div className="col-span-2 md:col-span-4">
                  <span className="text-slate-400 text-xs block mb-1">المستندات الإضافية المرفقة</span>
                  {personalInfo.additionalDocuments && personalInfo.additionalDocuments.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {personalInfo.additionalDocuments.map((doc, idx) => (
                        <span key={doc.id || idx} className="text-xs bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg font-medium">
                          📎 {doc.fileName}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="font-bold text-slate-500 text-xs italic">لا توجد مستندات إضافية</span>
                  )}
                </div>
              </div>
            </div>

            {/* Industrial Experience Summary */}
            <div className="border border-slate-150 rounded-2xl p-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <h4 className="font-extrabold text-slate-900 flex items-center gap-2 text-base">
                  <Briefcase className="text-orange-500 w-5 h-5" />
                  ملخص الخبرات والشهادات المحددة
                </h4>
                <button 
                  onClick={() => setCurrentStep(2)}
                  className="text-orange-500 hover:text-orange-600 text-xs font-bold border border-orange-100 hover:border-orange-200 px-3 py-1.5 rounded-lg transition-all"
                >
                  تعديل القسم
                </button>
              </div>

              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-right">
                    <span className="text-slate-400 text-xs block mb-1">الخبرة بقطاع الدهانات</span>
                    <span className={`font-bold block ${industryExperience.workedInPaint ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {industryExperience.workedInPaint ? `نعم (${industryExperience.paintYears} سنوات في ${industryExperience.paintCompany})` : 'لا توجد'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-right">
                    <span className="text-slate-400 text-xs block mb-1">الخبرة بقطاع الكيماويات</span>
                    <span className={`font-bold block ${industryExperience.workedInChemical ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {industryExperience.workedInChemical ? `نعم (${industryExperience.chemicalYears} سنوات في ${industryExperience.chemicalCompany})` : 'لا توجد'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-right">
                    <span className="text-slate-400 text-xs block mb-1">الخبرة الصناعية العامة</span>
                    <span className={`font-bold block ${industryExperience.workedInIndustrial ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {industryExperience.workedInIndustrial ? `نعم (${industryExperience.industrialYears} سنوات في ${industryExperience.industrialCompany})` : 'لا توجد'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-xs block mb-2">الشهادات المهنية المؤكدة:</span>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(certificates)
                      .filter(([_, has]) => has)
                      .map(([key]) => (
                        <span key={key} className="bg-orange-50 text-orange-600 text-xs font-bold px-3 py-1.5 rounded-lg border border-orange-100/50 uppercase">
                          {key === 'nebosh' ? 'NEBOSH IGC' :
                           key === 'osha' ? 'OSHA 30-Hour' :
                           key === 'iosh' ? 'IOSH Managing Safely' :
                           key === 'iso45001' ? 'ISO 45001 Auditor' :
                           key === 'fireSafety' ? 'Industrial Fire Safety' :
                           key === 'firstAid' ? 'First Aid' :
                           key === 'hazop' ? 'HAZOP' :
                           key === 'hazmat' ? 'HAZMAT' :
                           key === 'permitToWork' ? 'Permit To Work' :
                           key === 'workingAtHeights' ? 'Working At Heights' :
                           key === 'confinedSpace' ? 'Confined Space' :
                           key === 'forkliftSafety' ? 'Forklift Safety' : key}
                        </span>
                      ))}
                    {Object.values(certificates).filter(Boolean).length === 0 && (
                      <span className="text-slate-400 text-xs font-semibold italic">لم يتم تحديد أي شهادة كبرى</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Exam Summary Header */}
            <div className="border border-slate-150 rounded-2xl p-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <h4 className="font-extrabold text-slate-900 flex items-center gap-2 text-base">
                  <FileQuestion className="text-orange-500 w-5 h-5" />
                  أجوبة الاختبار الفني والتقييم
                </h4>
                <button 
                  onClick={() => setCurrentStep(3)}
                  className="text-orange-500 hover:text-orange-600 text-xs font-bold border border-orange-100 hover:border-orange-200 px-3 py-1.5 rounded-lg transition-all"
                >
                  مراجعة وإكمال الأجوبة
                </button>
              </div>

              <div className="text-sm text-slate-700 leading-relaxed space-y-2">
                <p className="flex justify-between items-center">
                  <span>تم تعبئة وإكمال إجابات:</span>
                  <span className="font-bold text-orange-500">{answeredCount} من أصل 10 أسئلة فنية مقالية.</span>
                </p>
                <p className="text-xs text-slate-400">
                  عند النقر على "تأكيد وإرسال الطلب" سيقوم محرك الذكاء الاصطناعي الخاص بشركة مصنع جدة للدهانات والمعاجين بتحليل الإجابات مباشرة واستخراج نقاط قوتك وضعفك واقتراح أسئلة مخصصة للمقابلة معك. قد يستغرق الأمر ثواني معدودة.
                </p>
              </div>
            </div>

            {/* Final Consent & Submission Warning */}
            <div className="bg-orange-50/50 border border-orange-200 p-5 rounded-2xl flex gap-3.5">
              <ShieldCheck className="w-8 h-8 text-orange-500 shrink-0 mt-0.5" />
              <div className="text-sm text-slate-700 leading-relaxed">
                <h5 className="font-bold text-slate-900 mb-1">إرسال الطلب النهائي</h5>
                بمجرد النقر على الزر أدناه، سيتم تسجيل طلبك رسمياً في قاعدة البيانات وتفعيل رقم طلب مرجعي خاص بك. لا يمكن التعديل على الطلب بعد إرساله، لذا يرجى التأكد التام من صحة كافة تفاصيل ومرفقات سيرتك الذاتية المرفوعة.
              </div>
            </div>

          </div>

          {/* Action buttons */}
          <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-between items-center">
            <button
              onClick={handleBack}
              disabled={isSubmitting}
              className="bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-semibold px-6 py-3 rounded-xl flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" />
              العودة للاختبار
            </button>
            
            <button
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-10 py-4 rounded-xl shadow-xl shadow-orange-500/20 flex items-center gap-2.5 transition-all hover:-translate-y-0.5 active:scale-95 disabled:bg-orange-400 disabled:cursor-not-allowed"
              id="final-submit-btn"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جاري تحليل الإجابات بالذكاء الاصطناعي...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  تأكيد وإرسال الطلب المكتمل
                </>
              )}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
