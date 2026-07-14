import React, { useState, useEffect } from 'react';
import { safeStorage } from '../lib/safeStorage';
// GitHub Sync: Minor update to trigger re-push
import { 
  Lock, Shield, Users, FileText, CheckCircle, XCircle, Clock, Calendar, 
  Search, Filter, Eye, EyeOff, Edit3, Download, Printer, Trash2, ArrowLeft,
  ChevronDown, AlertCircle, Award, Star, ThumbsUp, Save, BarChart2,
  ListFilter, FileSpreadsheet, FileDown, Loader2, Briefcase, FileQuestion,
  Upload, ShieldCheck, Copy, Check, Share2, MessageSquare, Settings, Video
} from 'lucide-react';
import { Applicant, DashboardStats, HrEvaluation, ApplicationStatus } from '../types';
import CompanyLogo from './CompanyLogo';
import { googleSignIn, initAuth, createGoogleMeetSpace, logout as googleLogout } from '../lib/googleAuth';
import { User } from 'firebase/auth';

interface AdminPortalProps {
  onGoHome: () => void;
}

export default function AdminPortal({ onGoHome }: AdminPortalProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [portalRole, setPortalRole] = useState<"hse" | "marketing" | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Admin Management States
  const [showAdminManagement, setShowAdminManagement] = useState(false);
  const [adminsList, setAdminsList] = useState<{ id: string; email: string; createdAt: string }[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  
  // Change password form state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);
  const [changePasswordSuccess, setChangePasswordSuccess] = useState<string | null>(null);

  // Add admin form state
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [addAdminLoading, setAddAdminLoading] = useState(false);
  const [addAdminError, setAddAdminError] = useState<string | null>(null);
  const [addAdminSuccess, setAddAdminSuccess] = useState<string | null>(null);

  // Data states
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [experienceFilter, setExperienceFilter] = useState<string>('all');
  const [hrScoreFilter, setHrScoreFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('hr_score');
  const [sortOrder, setSortOrder] = useState<string>('desc');
  const [manualEvalFilter, setManualEvalFilter] = useState<string>('all');
  const [archivedDeptNote, setArchivedDeptNote] = useState<string>('');

  // Hybrid WhatsApp Interview Scheduling states
  const [activeSubTab, setActiveSubTab] = useState<'applicants' | 'schedules' | 'announcements' | 'templates'>('applicants');
  const [schedulingApplicant, setSchedulingApplicant] = useState<Applicant | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleName, setScheduleName] = useState('');
  const [scheduleType, setScheduleType] = useState('remote');
  const [scheduleMeetingLink, setScheduleMeetingLink] = useState('');

  // Google Meet and Automatic Scheduling states
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  
  const [autoFromDate, setAutoFromDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [autoToDate, setAutoToDate] = useState(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  });
  const [autoStartTime, setAutoStartTime] = useState('08:00');
  const [autoEndTime, setAutoEndTime] = useState('16:00');
  const [autoDuration, setAutoDuration] = useState(25);
  const [autoBreak, setAutoBreak] = useState(5);
  const [isSchedulingAuto, setIsSchedulingAuto] = useState(false);
  const [autoScheduleResults, setAutoScheduleResults] = useState<{
    successCount: number;
    failedCount: number;
    details: string[];
  } | null>(null);

  const [schedulingProgress, setSchedulingProgress] = useState<{
    total: number;
    current: number;
    currentName: string;
    logs: string[];
  } | null>(null);

  const [selectedSchedules, setSelectedSchedules] = useState<string[]>([]);
  const [isBulkCancelling, setIsBulkCancelling] = useState(false);

  // Selected Job for Settings
  const [settingsJobRole, setSettingsJobRole] = useState<'hse' | 'marketing'>('hse');

  // Helper to get storage key
  const getStorageKey = (baseKey: string, role: 'hse' | 'marketing') => {
    return role === 'hse' ? baseKey : `${baseKey}_${role}`;
  };

  const [defaultMeetingLink, setDefaultMeetingLink] = useState(() => {
    try {
      const saved = safeStorage.getItem('defaultMeetingLink');
      if (saved) return saved;
    } catch {}
    return 'https://meet.google.com/abc-defg-hij';
  });

  // WhatsApp announcement customization states
  const [announcementAppUrl, setAnnouncementAppUrl] = useState(() => {
    try {
      const saved = safeStorage.getItem('announcementAppUrl');
      if (saved) return saved;
      return window.location.origin;
    } catch {
      return 'https://jeddahpaints-careers.com';
    }
  });
  const [announcementCopied, setAnnouncementCopied] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  
  const [announcementTitle, setAnnouncementTitle] = useState(() => {
    try {
      return safeStorage.getItem('announcementTitle') || 'أخصائي صحة وسلامة وبيئة (HSE)';
    } catch {
      return 'أخصائي صحة وسلامة وبيئة (HSE)';
    }
  });
  
  const [announcementId, setAnnouncementId] = useState(() => {
    try {
      return safeStorage.getItem('announcementId') || '20260706023116938';
    } catch {
      return '20260706023116938';
    }
  });
  
  const [announcementDate, setAnnouncementDate] = useState(() => {
    try {
      return safeStorage.getItem('announcementDate') || '21/01/1448 هـ';
    } catch {
      return '21/01/1448 هـ';
    }
  });
  
  const [announcementSalary, setAnnouncementSalary] = useState(() => {
    try {
      return safeStorage.getItem('announcementSalary') || '4,500 ريال إلى 6,000 ريال';
    } catch {
      return '4,500 ريال إلى 6,000 ريال';
    }
  });
  
  const [announcementHours, setAnnouncementHours] = useState(() => {
    try {
      return safeStorage.getItem('announcementHours') || '9 ساعات يومياً (6 أيام)';
    } catch {
      return '9 ساعات يومياً (6 أيام)';
    }
  });
  
  const [announcementLocation, setAnnouncementLocation] = useState(() => {
    try {
      const saved = safeStorage.getItem('announcementLocation');
      return saved || 'حي الرحاب، جدة';
    } catch {
      return 'حي الرحاب، جدة';
    }
  });

  const compileAnnouncementText = () => {
    let text = announcementTemplate;
    text = text.replace(/{JOB}/g, announcementTitle);
    text = text.replace(/{ID}/g, announcementId);
    text = text.replace(/{DATE}/g, announcementDate);
    text = text.replace(/{LOCATION}/g, announcementLocation);
    text = text.replace(/{SALARY}/g, announcementSalary);
    text = text.replace(/{HOURS}/g, announcementHours);
    text = text.replace(/{LINK}/g, announcementAppUrl || window.location.origin);
    return text;
  };

  const [templatesSaved, setTemplatesSaved] = useState(false);

  const [interviewTemplate, setInterviewTemplate] = useState(() => {
    try {
      const saved = safeStorage.getItem('interviewTemplate');
      if (saved) return saved;
    } catch {}
    return `السلام عليكم ورحمة الله وبركاته، {TITLE} {NAME} المحترم.

نفيدكم من إدارة الموارد البشرية بشركة مصنع جدة للدهانات والمعاجين، بأنه يسعدنا تحديد موعد المقابلة الشخصية معكم للوظيفة التالية:
المسمى الوظيفي: {JOB}
رقم الطلب: {ID}

اليوم والتاريخ: {DATE}
الوقت المحدد: في تمام الساعة {TIME}
رابط المقابلة: {LINK}

نرجو التكرم بالتواجد قبل موعد المقابلة بـ 15 دقيقة للتأكد من استقرار الاتصال والشبكة.

نسأل الله لكم التوفيق والنجاح.
إدارة الموارد البشرية
شركة مصنع جدة للدهانات والمعاجين`;
  });

  const [rejectionTemplate, setRejectionTemplate] = useState(() => {
    try {
      const saved = safeStorage.getItem('rejectionTemplate');
      if (saved) return saved;
    } catch {}
    return `السلام عليكم ورحمة الله وبركاته، {TITLE} {NAME} المحترم.

نشكر لكم تقديمكم واهتمامكم بالانضمام إلى شركة مصنع جدة للدهانات والمعاجين لوظيفة {JOB} ورقم الطلب {ID}.

يؤسفنا إبلاغكم بأنه تم اختيار مرشحين آخرين تتناسب مؤهلاتهم بشكل وثيق مع متطلبات الوظيفة الحالية. سنحتفظ بملفكم في قاعدة بياناتنا للتواصل معكم في حال توفر شواغر مستقبلية تناسب خبراتكم المميزة.

نتمنى لكم كل التوفيق في مسيرتكم المهنية.
إدارة الموارد البشرية
شركة مصنع جدة للدهانات والمعاجين`;
  });

  const [announcementTemplate, setAnnouncementTemplate] = useState(() => {
    try {
      const saved = safeStorage.getItem('announcementTemplate');
      if (saved) return saved;
    } catch {}
    return `إعلان وظيفي لعامة الناس - شركة مصنع جدة للدهانات والمعاجين

يسر إدارة الموارد البشرية بشركة مصنع جدة للدهانات والمعاجين الإعلان عن توفر فرصة وظيفية شاغرة ومتاحة للتقديم المباشر لجميع المواطنين المؤهلين:

المسمى الوظيفي: {JOB}
رقم الإعلان الوظيفي: {ID}
تاريخ الإعلان: {DATE}

مقر العمل: {LOCATION}

الهدف الوظيفي:
الإشراف الشامل على صالات الإنتاج والمستودعات والتحكم في المخاطر الكيميائية وتطبيق نظام صارم للوقاية من الحريق وتأمين ممارسات العمل لضمان صفر حوادث وإصابات.

المؤهلات والشروط المطلوبة:
1. درجة البكالوريوس في الهندسة الكيميائية، هندسة السلامة، علوم البيئة، أو تخصص مماثل.
2. خبرة عملية لا تقل عن سنتين (2) في المصانع الكيميائية أو مصانع الطلاء والدهانات.
3. شهادة مهنية دولية معتمدة (مثل NEBOSH IGC أو OSHA 30-Hour المتقدمة).
4. معرفة قوية بمتطلبات السلامة العامة والحرائق الكيميائية وإدارة معايير ISO 45001.
5. مهارات تواصل ممتازة وكتابة التقارير باللغتين العربية والإنجليزية.
6. يفضل تقديم السيرة الذاتية باللغة العربية.
7. يفضل وجود ترخيص معتمد من منصة كوادر (سيطلب رفعه في نموذج التقديم إن وُجد).

المزايا وبيئة العمل الموفرة:
• الراتب شهرياً: {SALARY}
• ساعات العمل: {HOURS}
• إجازة سنوية مدفوعة الأجر طبقاً لنظام العمل السعودي (21 يوماً).

رابط التقديم المباشر وتعبئة الطلب:
{LINK}

للاستفسارات والتواصل المباشر عبر الواتساب:
https://wa.me/966537375580

نرحب بجميع الكفاءات الوطنية الطموحة للانضمام إلى فريق عملنا المتميز!`;
  });

  // Refresh settings when job role changes
  useEffect(() => {
    setAnnouncementTitle(safeStorage.getItem(getStorageKey('announcementTitle', settingsJobRole)) || (settingsJobRole === 'hse' ? 'أخصائي صحة وسلامة وبيئة (HSE)' : 'أخصائي تسويق (Marketing)'));
    setAnnouncementId(safeStorage.getItem(getStorageKey('announcementId', settingsJobRole)) || (settingsJobRole === 'hse' ? '20260706023116938' : 'MKT-2026-0010'));
    setAnnouncementDate(safeStorage.getItem(getStorageKey('announcementDate', settingsJobRole)) || '21/01/1448 هـ');
    setAnnouncementSalary(safeStorage.getItem(getStorageKey('announcementSalary', settingsJobRole)) || '4,500 ريال إلى 6,000 ريال');
    setAnnouncementHours(safeStorage.getItem(getStorageKey('announcementHours', settingsJobRole)) || '9 ساعات يومياً (6 أيام)');
    setAnnouncementLocation(safeStorage.getItem(getStorageKey('announcementLocation', settingsJobRole)) || (settingsJobRole === 'marketing' ? 'جدة حي الرحاب - https://maps.app.goo.gl/VpghMeUKVdNUF4YT7' : 'حي الرحاب، جدة'));
    
    setInterviewTemplate(safeStorage.getItem(getStorageKey('interviewTemplate', settingsJobRole)) || `السلام عليكم ورحمة الله وبركاته، {TITLE} {NAME} المحترم.

نفيدكم من إدارة الموارد البشرية بشركة مصنع جدة للدهانات والمعاجين، بأنه يسعدنا تحديد موعد المقابلة الشخصية معكم للوظيفة التالية:
المسمى الوظيفي: {JOB}
رقم الطلب: {ID}

اليوم والتاريخ: {DATE}
الوقت المحدد: في تمام الساعة {TIME}
رابط المقابلة: {LINK}

نرجو التكرم بالتواجد قبل موعد المقابلة بـ 15 دقيقة للتأكد من استقرار الاتصال والشبكة.

نسأل الله لكم التوفيق والنجاح.
إدارة الموارد البشرية
شركة مصنع جدة للدهانات والمعاجين`);

    setRejectionTemplate(safeStorage.getItem(getStorageKey('rejectionTemplate', settingsJobRole)) || `السلام عليكم ورحمة الله وبركاته، {TITLE} {NAME} المحترم.

نشكر لكم تقديمكم واهتمامكم بالانضمام إلى شركة مصنع جدة للدهانات والمعاجين لوظيفة {JOB} ورقم الطلب {ID}.

يؤسفنا إبلاغكم بأنه تم اختيار مرشحين آخرين تتناسب مؤهلاتهم بشكل وثيق مع متطلبات الوظيفة الحالية. سنحتفظ بملفكم في قاعدة بياناتنا للتواصل معكم في حال توفر شواغر مستقبلية تناسب خبراتكم المميزة.

نتمنى لكم كل التوفيق في مسيرتكم المهنية.
إدارة الموارد البشرية
شركة مصنع جدة للدهانات والمعاجين`);

    setAnnouncementTemplate(safeStorage.getItem(getStorageKey('announcementTemplate', settingsJobRole)) || (settingsJobRole === 'marketing' ? `إعلان وظيفي لعامة الناس - شركة مصنع جدة للدهانات والمعاجين

يسر إدارة الموارد البشرية بشركة مصنع جدة للدهانات والمعاجين الإعلان عن توفر فرصة وظيفية شاغرة ومتاحة للتقديم المباشر لجميع المواطنين المؤهلين:

المسمى الوظيفي: {JOB}
رقم الإعلان الوظيفي: {ID}
تاريخ الإعلان: {DATE}

مقر العمل: {LOCATION}

الهدف الوظيفي:
تطوير وتنفيذ خطط تسويقية مبتكرة لتعزيز العلامة التجارية للمصنع، وإدارة الحملات الإعلانية، وتحليل السوق لزيادة المبيعات والوصول للعملاء المستهدفين.

المؤهلات والشروط المطلوبة:
1. درجة البكالوريوس في التسويق، إدارة الأعمال، أو تخصص ذي صلة.
2. خبرة عملية لا تقل عن سنتين (2) في مجال التسويق والمبيعات.
3. إجادة استخدام أدوات التسويق الرقمي ومنصات التواصل الاجتماعي.
4. القدرة على تحليل بيانات السوق وتقديم تقارير دورية.
5. مهارات تواصل ممتازة وكتابة إبداعية باللغتين العربية والإنجليزية.
6. يفضل تقديم السيرة الذاتية باللغة العربية.

المزايا وبيئة العمل الموفرة:
• الراتب شهرياً: {SALARY}
• ساعات العمل: {HOURS}
• إجازة سنوية مدفوعة الأجر طبقاً لنظام العمل السعودي (21 يوماً).

رابط التقديم المباشر وتعبئة الطلب:
{LINK}

للاستفسارات والتواصل المباشر عبر الواتساب:
https://wa.me/966537375580

نرحب بجميع الكفاءات الوطنية الطموحة للانضمام إلى فريق عملنا المتميز!` : `إعلان وظيفي لعامة الناس - شركة مصنع جدة للدهانات والمعاجين

يسر إدارة الموارد البشرية بشركة مصنع جدة للدهانات والمعاجين الإعلان عن توفر فرصة وظيفية شاغرة ومتاحة للتقديم المباشر لجميع المواطنين المؤهلين:

المسمى الوظيفي: {JOB}
رقم الإعلان الوظيفي: {ID}
تاريخ الإعلان: {DATE}

مقر العمل: {LOCATION}

الهدف الوظيفي:
الإشراف الشامل على صالات الإنتاج والمستودعات والتحكم في المخاطر الكيميائية وتطبيق نظام صارم للوقاية من الحريق وتأمين ممارسات العمل لضمان صفر حوادث وإصابات.

المؤهلات والشروط المطلوبة:
1. درجة البكالوريوس في الهندسة الكيميائية، هندسة السلامة، علوم البيئة، أو تخصص مماثل.
2. خبرة عملية لا تقل عن سنتين (2) في المصانع الكيميائية أو مصانع الطلاء والدهانات.
3. شهادة مهنية دولية معتمدة (مثل NEBOSH IGC أو OSHA 30-Hour المتقدمة).
4. معرفة قوية بمتطلبات السلامة العامة والحرائق الكيميائية وإدارة معايير ISO 45001.
5. مهارات تواصل ممتازة وكتابة التقارير باللغتين العربية والإنجليزية.
6. يفضل تقديم السيرة الذاتية باللغة العربية.
7. يفضل وجود ترخيص معتمد من منصة كوادر (سيطلب رفعه في نموذج التقديم إن وُجد).

المزايا وبيئة العمل الموفرة:
• الراتب شهرياً: {SALARY}
• ساعات العمل: {HOURS}
• إجازة سنوية مدفوعة الأجر طبقاً لنظام العمل السعودي (21 يوماً).

رابط التقديم المباشر وتعبئة الطلب:
{LINK}

للاستفسارات والتواصل المباشر عبر الواتساب:
https://wa.me/966537375580

نرحب بجميع الكفاءات الوطنية الطموحة للانضمام إلى فريق عملنا المتميز!`));
  }, [settingsJobRole]);

  // Manual HR Evaluation form state
  const [hrEvalForm, setHrEvalForm] = useState<HrEvaluation>({
    experienceRating: 5,
    qualificationRating: 5,
    certificatesRating: 5,
    technicalRating: 5,
    writingRating: 5,
    languageRating: 5,
    personalityRating: 5,
    finalScore: 50,
    notes: '',
    reviewedBy: 'إدارة الموارد البشرية',
    reviewedAt: ''
  });
  const [reviewStatus, setReviewStatus] = useState<ApplicationStatus>('reviewing');
  const [isSavingReview, setIsSavingReview] = useState(false);
  const [logoStateTrigger, setLogoStateTrigger] = useState(0);

  // File Preview state
  const [previewFile, setPreviewFile] = useState<{ name: string; base64: string; fileName: string } | null>(null);

  // Admin Document Upload states
  const [newDocName, setNewDocName] = useState('');
  const [newDocFile, setNewDocFile] = useState<File | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("حجم ملف الشعار كبير جداً. يرجى اختيار ملف بحجم أقل من 2 ميجابايت.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        try {
          const res = await fetch('/api/logo', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ logo: base64 })
          });

          if (res.ok) {
            safeStorage.setItem('company_logo', base64);
            setLogoStateTrigger(prev => prev + 1);
            window.dispatchEvent(new Event('company_logo_updated'));
            alert("تم رفع وتحديث شعار المصنع وحفظه في قاعدة البيانات بنجاح!");
          } else {
            const err = await res.json();
            alert("فشل رفع الشعار إلى قاعدة البيانات: " + (err.error || "خطأ مجهول"));
          }
        } catch (err) {
          alert("تعذر الاتصال بالخادم لرفع الشعار.");
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogoReset = async () => {
    const confirmReset = window.confirm("هل أنت متأكد من رغبتك في إعادة تعيين الشعار واستعادة الشعار الافتراضي؟");
    if (!confirmReset) return;

    try {
      const res = await fetch('/api/logo', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ logo: "" })
      });

      if (res.ok) {
        safeStorage.removeItem('company_logo');
        setLogoStateTrigger(prev => prev + 1);
        window.dispatchEvent(new Event('company_logo_updated'));
        alert("تمت استعادة الشعار الافتراضي وحذفه من قاعدة البيانات بنجاح.");
      } else {
        alert("فشل حذف الشعار من قاعدة البيانات.");
      }
    } catch (err) {
      alert("تعذر الاتصال بالخادم لإعادة تعيين الشعار.");
    }
  };

  const adminToken = safeStorage.getItem('hse_admin_token');

  // Check existing token
  useEffect(() => {
    if (adminToken) {
      setIsAuthenticated(true);
    }
  }, [adminToken]);

  // Load Google Meet Auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Load applicants and statistics
  useEffect(() => {
    if (!isAuthenticated || !portalRole) return;

    const fetchAdminData = async () => {
      setLoading(true);
      try {
        const headers = { 'Authorization': `Bearer ${adminToken}` };
        
        // Fetch stats
        const statsRes = await fetch(`/api/admin/stats?jobRole=${portalRole}`, { headers });
        if (statsRes.status === 401 || statsRes.status === 403) {
          safeStorage.removeItem('hse_admin_token');
          setIsAuthenticated(false);
          return;
        }
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        // Fetch applicants
        const queryParams = new URLSearchParams({
          search: searchTerm,
          status: statusFilter,
          experience: experienceFilter !== 'all' ? experienceFilter : '',
          hrScore: hrScoreFilter !== 'all' ? hrScoreFilter : '',
          sortBy,
          sortOrder,
          manualEval: manualEvalFilter,
          jobRole: portalRole
        });

        const appRes = await fetch(`/api/admin/applicants?${queryParams}`, { headers });
        if (appRes.status === 401 || appRes.status === 403) {
          safeStorage.removeItem('hse_admin_token');
          setIsAuthenticated(false);
          return;
        }
        if (appRes.ok) {
          const appData = await appRes.json();
          setApplicants(appData);
        }
      } catch (err) {
        console.error("Error loading admin data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [isAuthenticated, searchTerm, statusFilter, experienceFilter, hrScoreFilter, sortBy, sortOrder, manualEvalFilter, refreshTrigger, portalRole]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "فشل تسجيل الدخول.");
      }

      safeStorage.setItem('hse_admin_token', data.token);
      setIsAuthenticated(true);
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  // Admin Operations: fetch list
  const fetchAdmins = async () => {
    setAdminsLoading(true);
    try {
      const res = await fetch('/api/admin/list', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (res.status === 401 || res.status === 403) {
        safeStorage.removeItem('hse_admin_token');
        setIsAuthenticated(false);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setAdminsList(data);
      }
    } catch (err) {
      console.error("Error loading admins list:", err);
    } finally {
      setAdminsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && showAdminManagement) {
      fetchAdmins();
    }
  }, [isAuthenticated, showAdminManagement]);

  // Admin Operations: change password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordLoading(true);
    setChangePasswordError(null);
    setChangePasswordSuccess(null);

    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "فشل تغيير كلمة المرور.");
      }

      setChangePasswordSuccess("تم تغيير كلمة المرور بنجاح.");
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      setChangePasswordError(err.message);
    } finally {
      setChangePasswordLoading(false);
    }
  };

  // Admin Operations: add admin
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddAdminLoading(true);
    setAddAdminError(null);
    setAddAdminSuccess(null);

    try {
      const res = await fetch('/api/admin/add-admin', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ email: newAdminEmail, password: newAdminPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "فشل إضافة المسؤول.");
      }

      setAddAdminSuccess("تمت إضافة المسؤول الجديد بنجاح.");
      setNewAdminEmail('');
      setNewAdminPassword('');
      fetchAdmins();
    } catch (err: any) {
      setAddAdminError(err.message);
    } finally {
      setAddAdminLoading(false);
    }
  };

  // Admin Operations: delete admin
  const handleDeleteAdmin = async (id: string, emailStr: string) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك في سحب صلاحيات المسؤول وحذف حساب "${emailStr}"؟`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/delete-admin/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "فشل حذف المسؤول.");
      }

      alert("تم حذف المسؤول بنجاح.");
      fetchAdmins();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    safeStorage.removeItem('hse_admin_token');
    setIsAuthenticated(false);
    setSelectedApplicant(null);
    setIsReviewMode(false);
    setShowAdminManagement(false);
  };

  // Helper to trigger direct downloads of Base64 attachments
  const handleDownloadAttachment = (base64Data?: string, fileName?: string) => {
    if (!base64Data || !fileName) {
      alert("لا يوجد مستند مرفق لتحميله.");
      return;
    }
    const link = document.createElement('a');
    link.href = base64Data;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Convert base64 data to Blob URL and open the previewer modal
  const handlePreviewAttachment = (base64Data?: string, fileName?: string) => {
    if (!base64Data || !fileName) {
      alert("لا يوجد مستند مرفق لاستعراضه.");
      return;
    }

    try {
      let mimeType = "application/octet-stream";
      let pureBase64 = base64Data;

      if (base64Data.startsWith('data:')) {
        const parts = base64Data.split(',');
        mimeType = parts[0].match(/:(.*?);/)?.[1] || "application/octet-stream";
        pureBase64 = parts[1];
      } else {
        // Fallback mime type based on file extension
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') mimeType = 'application/pdf';
        else if (ext === 'png') mimeType = 'image/png';
        else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
        else if (ext === 'webp') mimeType = 'image/webp';
        else if (ext === 'gif') mimeType = 'image/gif';
      }

      // Decode Base64 safely
      const byteCharacters = atob(pureBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);

      setPreviewFile({
        name: fileName,
        base64: blobUrl,
        fileName: fileName
      });
    } catch (err) {
      console.error("Error generating file preview URL:", err);
      // Fallback: use raw data URL if decoding fails
      setPreviewFile({
        name: fileName,
        base64: base64Data,
        fileName: fileName
      });
    }
  };

  // Handle delete applicant
  const handleDeleteApplicant = async (id: string, name: string) => {
    const confirmDelete = window.confirm(`هل أنت متأكد من رغبتك في حذف طلب المتقدم "${name}" نهائياً من قاعدة البيانات؟`);
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/admin/applicants/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (res.ok) {
        alert("تم حذف الطلب بنجاح.");
        if (selectedApplicant?.id === id) {
          setSelectedApplicant(null);
        }
        setRefreshTrigger(prev => prev + 1);
      } else {
        const err = await res.json();
        alert(err.error || "فشل حذف الطلب.");
      }
    } catch (e) {
      alert("حدث خطأ أثناء محاولة حذف الطلب.");
    }
  };

  // Load applicant details for review or view
  const handleSelectApplicant = async (applicant: Applicant, editMode = false) => {
    setSelectedApplicant(applicant);
    setIsReviewMode(editMode);
    
    if (applicant.hrEvaluation) {
      setHrEvalForm(applicant.hrEvaluation);
    } else {
      setHrEvalForm({
        experienceRating: 5,
        qualificationRating: 5,
        certificatesRating: 5,
        technicalRating: 5,
        writingRating: 5,
        languageRating: 5,
        personalityRating: 5,
        finalScore: 50,
        notes: '',
        reviewedBy: 'إدارة الموارد البشرية',
        reviewedAt: ''
      });
    }
    setReviewStatus(applicant.status);
    setArchivedDeptNote(applicant.archivedDeptNote || '');
  };

  // Save manual HR evaluation
  const handleSaveHrReview = async () => {
    if (!selectedApplicant) return;
    setIsSavingReview(true);

    try {
      const res = await fetch(`/api/admin/applicants/${selectedApplicant.id}/review`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          status: reviewStatus,
          hrEvaluation: hrEvalForm,
          archivedDeptNote: reviewStatus === 'archived' ? archivedDeptNote : ''
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "فشل حفظ التقييم الإداري.");
      }

      alert("تم حفظ قرار التقييم والملاحظات وتحديث حالة المتقدم بنجاح.");
      setSelectedApplicant(data.applicant);
      setIsReviewMode(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      alert(err.message || "حدث خطأ أثناء الحفظ.");
    } finally {
      setIsSavingReview(false);
    }
  };

  // Calculation of active score in HR review form
  useEffect(() => {
    const sum = 
      Number(hrEvalForm.experienceRating) +
      Number(hrEvalForm.qualificationRating) +
      Number(hrEvalForm.certificatesRating) +
      Number(hrEvalForm.technicalRating) +
      Number(hrEvalForm.writingRating) +
      Number(hrEvalForm.languageRating) +
      Number(hrEvalForm.personalityRating);
    const score = Math.round((sum / 70) * 100);
    setHrEvalForm(prev => ({ ...prev, finalScore: score }));
  }, [
    hrEvalForm.experienceRating, hrEvalForm.qualificationRating, 
    hrEvalForm.certificatesRating, hrEvalForm.technicalRating,
    hrEvalForm.writingRating, hrEvalForm.languageRating, 
    hrEvalForm.personalityRating
  ]);

  // Google Auth Connection and Disconnection
  const handleGoogleConnect = async () => {
    setIsConnectingGoogle(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);
        alert("تم ربط حساب Google الخاص بك بنجاح! بإمكانك الآن توليد روابط Google Meet حقيقية وموثوقة تلقائياً.");
      }
    } catch (err: any) {
      console.error(err);
      alert(`فشل ربط حساب Google: ${err.message || err}`);
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  const handleGoogleDisconnect = async () => {
    try {
      await googleLogout();
      setGoogleUser(null);
      setGoogleToken(null);
      alert("تم فصل حساب Google بنجاح.");
    } catch (err: any) {
      console.error(err);
      alert(`فشل فصل الحساب: ${err.message || err}`);
    }
  };

  // Automatic Scheduling logic
  const handleAutoSchedule = async () => {
    const unsched = applicants.filter(a => !a.interviewSchedule);
    if (unsched.length === 0) {
      alert("لا يوجد مرشحون بانتظار ترتيب مواعيدهم حالياً.");
      return;
    }

    if (!confirm(`هل أنت متأكد من رغبتك في جدولة مواعيد تلقائية لعدد (${unsched.length}) من المرشحين بناءً على الفترات المحددة؟`)) {
      return;
    }

    setIsSchedulingAuto(true);
    setAutoScheduleResults(null);
    setSchedulingProgress({
      total: unsched.length,
      current: 0,
      currentName: 'بدء تهيئة محرك الجدولة التلقائية...',
      logs: ['🚀 جاري تهيئة محرك الجدولة التلقائية الذكي...', `📋 تم العثور على عدد (${unsched.length}) مرشحين بانتظار الجدولة.`]
    });

    const details: string[] = [];
    let successCount = 0;
    let failedCount = 0;

    const addMinutes = (timeStr: string, mins: number): string => {
      const [h, m] = timeStr.split(':').map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      d.setMinutes(d.getMinutes() + mins);
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    };

    const compareTime = (t1: string, t2: string): number => {
      const [h1, m1] = t1.split(':').map(Number);
      const [h2, m2] = t2.split(':').map(Number);
      return (h1 * 60 + m1) - (h2 * 60 + m2);
    };

    try {
      const days: string[] = [];
      let currentDay = new Date(autoFromDate);
      const lastDay = new Date(autoToDate);
      
      let iterations = 0;
      while (currentDay <= lastDay && iterations < 90) {
        iterations++;
        days.push(currentDay.toISOString().split('T')[0]);
        currentDay.setDate(currentDay.getDate() + 1);
      }

      setSchedulingProgress(prev => prev ? {
        ...prev,
        logs: [...prev.logs, `📅 تم توليد نطاق التواريخ المتاحة: من ${autoFromDate} إلى ${autoToDate} (${days.length} أيام)`]
      } : null);

      let dayIndex = 0;
      let currentTime = autoStartTime;
      let candidateIndex = 0;

      while (candidateIndex < unsched.length && dayIndex < days.length) {
        const activeDay = days[dayIndex];
        const slotStart = currentTime;
        const slotEnd = addMinutes(slotStart, autoDuration);

        if (compareTime(slotEnd, autoEndTime) <= 0) {
          const applicant = unsched[candidateIndex];
          const currentStep = candidateIndex + 1;
          
          setSchedulingProgress(prev => prev ? {
            ...prev,
            current: currentStep,
            currentName: applicant.personalInfo.fullName,
            logs: [...prev.logs, `🔄 جاري معالجة المرشح (${currentStep}/${unsched.length}): ${applicant.personalInfo.fullName}...`]
          } : null);

          let meetLink = defaultMeetingLink;
          let linkGenerated = false;

          if (googleToken) {
            setSchedulingProgress(prev => prev ? {
              ...prev,
              logs: [...prev.logs, `📹 جاري توليد رابط Google Meet حقيقي عبر API...`]
            } : null);
            try {
              meetLink = await createGoogleMeetSpace(googleToken);
              linkGenerated = true;
            } catch (meetErr: any) {
              console.error(`Error generating Meet link for ${applicant.personalInfo.fullName}:`, meetErr);
              const errMsg = `⚠️ فشل توليد رابط Google Meet لـ ${applicant.personalInfo.fullName}: ${meetErr.message || meetErr}`;
              details.push(errMsg);
              setSchedulingProgress(prev => prev ? {
                ...prev,
                logs: [...prev.logs, errMsg]
              } : null);
            }
          }

          try {
            const res = await fetch(`/api/admin/applicants/${applicant.id}/review`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
              },
              body: JSON.stringify({
                status: 'interview',
                interviewSchedule: {
                  name: applicant.personalInfo.fullName,
                  date: activeDay,
                  time: slotStart,
                  type: 'remote',
                  meetingLink: meetLink,
                  whatsappSent: false
                }
              })
            });

            if (res.ok) {
              successCount++;
              const succMsg = `✅ تم بنجاح جدولة موعد ${applicant.personalInfo.fullName} في ${activeDay} الساعة ${slotStart}`;
              details.push(succMsg + (linkGenerated ? ' (مع رابط Meet حقيقي)' : ''));
              setSchedulingProgress(prev => prev ? {
                ...prev,
                logs: [...prev.logs, succMsg]
              } : null);
            } else {
              failedCount++;
              const failMsg = `❌ فشل حفظ الموعد في خادم قاعدة البيانات لـ ${applicant.personalInfo.fullName}`;
              details.push(failMsg);
              setSchedulingProgress(prev => prev ? {
                ...prev,
                logs: [...prev.logs, failMsg]
              } : null);
            }
          } catch (fetchErr: any) {
            failedCount++;
            const connMsg = `❌ خطأ في الاتصال بالخادم لـ ${applicant.personalInfo.fullName}`;
            details.push(connMsg);
            setSchedulingProgress(prev => prev ? {
              ...prev,
              logs: [...prev.logs, connMsg]
            } : null);
          }

          candidateIndex++;
          currentTime = addMinutes(slotEnd, autoBreak);
        } else {
          dayIndex++;
          currentTime = autoStartTime;
          setSchedulingProgress(prev => prev ? {
            ...prev,
            logs: [...prev.logs, `📆 انتقال إلى اليوم التالي: ${days[dayIndex] || 'انتهت الأيام المتاحة'}`]
          } : null);
        }
      }

      if (candidateIndex < unsched.length) {
        const warnMsg = `⚠️ لم يتسع الجدول لجميع المتقدمين! تم جدولة ${candidateIndex} من أصل ${unsched.length} مرشحين.`;
        details.push(warnMsg);
        setSchedulingProgress(prev => prev ? {
          ...prev,
          logs: [...prev.logs, warnMsg]
        } : null);
      }

      setAutoScheduleResults({
        successCount,
        failedCount,
        details
      });

      setSchedulingProgress(prev => prev ? {
        ...prev,
        current: unsched.length,
        currentName: 'تم اكتمال الجدولة التلقائية بنجاح! 🎉',
        logs: [...prev.logs, `🎉 اكتملت العملية بنجاح! تم جدولة ${successCount} مرشحين بنجاح، وفشل ${failedCount} مرشحين.`]
      } : null);

      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      console.error(err);
      const errMsg = `💥 حدث خطأ غير متوقع أثناء الجدولة التلقائية: ${err.message || err}`;
      alert(errMsg);
      setSchedulingProgress(prev => prev ? {
        ...prev,
        logs: [...prev.logs, errMsg]
      } : null);
    } finally {
      setIsSchedulingAuto(false);
    }
  };

  // Save Interview Schedule and auto-promote to 'interview' status
  const handleSaveSchedule = async (applicant: Applicant, name: string, date: string, time: string, type: string, meetingLink: string) => {
    try {
      const res = await fetch(`/api/admin/applicants/${applicant.id}/review`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          status: 'interview', // Automatically set status to interview
          interviewSchedule: {
            date,
            time,
            type,
            meetingLink,
            whatsappSent: true
          }
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert("تم حفظ وتحديث موعد المقابلة وتحديث حالة الطلب إلى (مقابلة شخصية) بنجاح!");
        setRefreshTrigger(prev => prev + 1);
        setSchedulingApplicant(null);
      } else {
        alert(data.error || "فشل حفظ الموعد.");
      }
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء الاتصال بالخادم لحفظ الموعد.");
    }
  };

  // Generate hybrid WhatsApp link and open it in a new window
  const handleSendWhatsApp = (applicant: Applicant, name: string, date: string, time: string, type: string, customMeetingLink?: string) => {
    const roleKey = applicant.id?.startsWith('MKT') ? 'marketing' : 'hse';
    const roleInterviewTemplate = safeStorage.getItem(getStorageKey('interviewTemplate', roleKey)) || interviewTemplate;
    const roleAnnouncementTitle = safeStorage.getItem(getStorageKey('announcementTitle', roleKey)) || (roleKey === 'marketing' ? 'أخصائي تسويق (Marketing)' : 'أخصائي صحة وسلامة وبيئة (HSE)');
    
    let text = roleInterviewTemplate;
    
    // Dynamic Title based on Gender
    const title = applicant.personalInfo?.gender === 'female' ? 'أستاذة' : 'أستاذ';
    text = text.replace(/{TITLE}/g, title);
    text = text.replace(/أستاذ\/أستاذة/g, title);
    
    text = text.replace(/{NAME}/g, name || '');
    text = text.replace(/{JOB}/g, roleAnnouncementTitle);
    text = text.replace(/{ID}/g, safeStorage.getItem(getStorageKey('announcementId', roleKey)) || (roleKey === 'marketing' ? 'MKT-2026-0010' : '20260706023116938'));
    
    const formattedDate = date 
      ? new Date(date).toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : '';
    text = text.replace(/{DATE}/g, formattedDate);
    text = text.replace(/{TIME}/g, time || '');
    text = text.replace(/{TYPE}/g, type === 'remote' ? 'عن بعد' : 'حضوري بمقر الشركة');
    
    const meetingLinkToUse = customMeetingLink || applicant.interviewSchedule?.meetingLink || safeStorage.getItem(getStorageKey('defaultMeetingLink', roleKey)) || defaultMeetingLink;
    const roleAppUrl = safeStorage.getItem(getStorageKey('announcementAppUrl', roleKey)) || announcementAppUrl;
    text = text.replace(/{LINK}/g, meetingLinkToUse || roleAppUrl || window.location.origin);

    const encodedMessage = encodeURIComponent(text);
    const cleanPhone = applicant.personalInfo.phone.replace(/[\s\-\+\(\)]/g, '');
    let formattedPhone = cleanPhone;
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '966' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('966') && formattedPhone.length === 9) {
      formattedPhone = '966' + formattedPhone;
    }
    
    const waUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
    window.open(waUrl, '_blank');
  };

  // Send customizable rejection / apology message
  const handleSendRejectionWhatsApp = (applicant: Applicant) => {
    const roleKey = applicant.id?.startsWith('MKT') ? 'marketing' : 'hse';
    const roleRejectionTemplate = safeStorage.getItem(getStorageKey('rejectionTemplate', roleKey)) || rejectionTemplate;
    const roleAnnouncementTitle = safeStorage.getItem(getStorageKey('announcementTitle', roleKey)) || (roleKey === 'marketing' ? 'أخصائي تسويق (Marketing)' : 'أخصائي صحة وسلامة وبيئة (HSE)');
    const roleAppUrl = safeStorage.getItem(getStorageKey('announcementAppUrl', roleKey)) || announcementAppUrl;

    let text = roleRejectionTemplate;
    
    // Dynamic Title based on Gender
    const title = applicant.personalInfo?.gender === 'female' ? 'أستاذة' : 'أستاذ';
    text = text.replace(/{TITLE}/g, title);
    text = text.replace(/أستاذ\/أستاذة/g, title);
    
    text = text.replace(/{NAME}/g, applicant.personalInfo.fullName || '');
    text = text.replace(/{JOB}/g, roleAnnouncementTitle);
    text = text.replace(/{ID}/g, safeStorage.getItem(getStorageKey('announcementId', roleKey)) || (roleKey === 'marketing' ? 'MKT-2026-0010' : '20260706023116938'));
    text = text.replace(/{LINK}/g, roleAppUrl || window.location.origin);

    const encodedMessage = encodeURIComponent(text);
    const cleanPhone = applicant.personalInfo.phone.replace(/[\s\-\+\(\)]/g, '');
    let formattedPhone = cleanPhone;
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '966' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('966') && formattedPhone.length === 9) {
      formattedPhone = '966' + formattedPhone;
    }
    
    const waUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
    window.open(waUrl, '_blank');
  };

  // Admin Upload Document on behalf of the applicant
  const handleAdminUploadDocument = async () => {
    if (!selectedApplicant) {
      alert("يرجى اختيار متقدم أولاً.");
      return;
    }
    if (!newDocName.trim()) {
      alert("يرجى إدخال اسم أو مسمى للمستند المرفق.");
      return;
    }
    if (!newDocFile) {
      alert("يرجى اختيار ملف لرفعه.");
      return;
    }

    if (newDocFile.size > 10 * 1024 * 1024) {
      alert("حجم الملف كبير جداً. الحد الأقصى المسموح به هو 10 ميجابايت.");
      return;
    }

    setIsUploadingDoc(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        if (!base64) {
          alert("حدث خطأ أثناء معالجة ملف المستند.");
          setIsUploadingDoc(false);
          return;
        }

        const newDoc = {
          id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
          name: newDocName.trim(),
          fileName: newDocFile.name,
          base64: base64,
          uploadedAt: new Date().toISOString()
        };

        const existingDocs = selectedApplicant.personalInfo.adminDocuments || [];
        const updatedDocs = [...existingDocs, newDoc];

        const res = await fetch(`/api/admin/applicants/${selectedApplicant.id}/review`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          },
          body: JSON.stringify({
            personalInfo: {
              adminDocuments: updatedDocs
            }
          })
        });

        const data = await res.json();
        if (res.ok) {
          alert("تم رفع وحفظ المستند الإضافي بنجاح!");
          // Update selectedApplicant locally
          const updatedApplicant = {
            ...selectedApplicant,
            personalInfo: {
              ...selectedApplicant.personalInfo,
              adminDocuments: updatedDocs
            }
          };
          setSelectedApplicant(updatedApplicant);
          
          // Reset fields
          setNewDocName('');
          setNewDocFile(null);
          // Reset file input value
          const fileInput = document.getElementById('admin-doc-file-input') as HTMLInputElement;
          if (fileInput) fileInput.value = '';

          setRefreshTrigger(prev => prev + 1);
        } else {
          alert(data.error || "فشل رفع المستند.");
        }
        setIsUploadingDoc(false);
      };
      reader.readAsDataURL(newDocFile);
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء الاتصال بالخادم لرفع المستند.");
      setIsUploadingDoc(false);
    }
  };

  // Delete Admin Uploaded Document
  const handleDeleteAdminDocument = async (docId: string) => {
    if (!selectedApplicant) return;
    if (!confirm("هل أنت متأكد من حذف هذا المستند المرفق نهائياً؟")) return;

    const existingDocs = selectedApplicant.personalInfo.adminDocuments || [];
    const updatedDocs = existingDocs.filter(d => d.id !== docId);

    try {
      const res = await fetch(`/api/admin/applicants/${selectedApplicant.id}/review`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          personalInfo: {
            adminDocuments: updatedDocs
          }
        })
      });

      if (res.ok) {
        alert("تم حذف المستند بنجاح.");
        const updatedApplicant = {
          ...selectedApplicant,
          personalInfo: {
            ...selectedApplicant.personalInfo,
            adminDocuments: updatedDocs
          }
        };
        setSelectedApplicant(updatedApplicant);
        setRefreshTrigger(prev => prev + 1);
      } else {
        alert("فشل حذف المستند.");
      }
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء حذف المستند.");
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (applicants.length === 0) {
      alert("لا توجد بيانات متاحة للتصدير حالياً.");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    // Header
    csvContent += "رقم الطلب,الاسم الكامل,رقم الجوال,البريد الإلكتروني,سنوات الخبرة,المدينة,الراتب المتوقع,درجة التقييم الذكي,الحالة,تاريخ التقديم\n";

    applicants.forEach(a => {
      const statusLabel = 
        a.status === 'pending' ? 'جديد' :
        a.status === 'reviewing' ? 'تحت المراجعة' :
        a.status === 'accepted' ? 'مقبول' :
        a.status === 'rejected' ? 'مرفوض' :
        a.status === 'interview' ? 'مقابلة شخصية' : 'قائمة انتظار';
      
      const row = [
        a.id,
        `"${a.personalInfo.fullName}"`,
        a.personalInfo.phone,
        a.personalInfo.email,
        a.personalInfo.experienceYears,
        a.personalInfo.city,
        a.personalInfo.expectedSalary,
        a.aiEvaluation?.score || 0,
        statusLabel,
        new Date(a.createdAt).toLocaleDateString('ar-SA')
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `HSE_Applicants_Export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Direct Print Layout Trigger
  const handlePrintProfile = () => {
    window.print();
  };

  // Translators for UI
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="bg-orange-50 text-orange-600 text-xs font-bold px-3 py-1.5 rounded-lg border border-orange-100">جديد</span>;
      case 'reviewing':
        return <span className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1.5 rounded-lg border border-blue-100">قيد المراجعة</span>;
      case 'accepted':
        return <span className="bg-emerald-50 text-emerald-600 text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-100">مقبول للعمل</span>;
      case 'rejected':
        return <span className="bg-rose-50 text-rose-600 text-xs font-bold px-3 py-1.5 rounded-lg border border-rose-100">مستبعد</span>;
      case 'interview':
        return <span className="bg-purple-50 text-purple-600 text-xs font-bold px-3 py-1.5 rounded-lg border border-purple-100">مقابلة شخصية</span>;
      case 'waitlist':
        return <span className="bg-amber-50 text-amber-600 text-xs font-bold px-3 py-1.5 rounded-lg border border-amber-100">قائمة الانتظار</span>;
      case 'archived':
        return <span className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200">الأرشيف</span>;
      default:
        return <span className="bg-slate-100 text-slate-500 text-xs font-bold px-3 py-1.5 rounded-lg">{status}</span>;
    }
  };

  const getRecBadge = (rec?: string) => {
    if (rec === 'suitable') return <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded">مناسب جداً</span>;
    if (rec === 'suitable_after_interview') return <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded">مناسب بعد مقابلة</span>;
    return <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded">غير مناسب</span>;
  };

  // Count active certificates
  const getCertCount = (certs: any) => {
    return Object.values(certs).filter(Boolean).length;
  };

  // --- PASSWORD LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50" id="admin-login-screen">
        
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden max-w-md w-full relative z-10">
          <div className="bg-white text-slate-800 p-8 text-center border-b border-slate-200">
            <div className="bg-blue-50 text-blue-900 p-4 rounded-xl w-12 h-12 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Lock className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h2 className="text-lg font-bold text-blue-900">تسجيل دخول المسؤولين</h2>
            <p className="text-[10px] text-slate-400 mt-1">بوابة التقييم وإدارة المتقدمين - شركة مصنع جدة للدهانات والمعاجين</p>
          </div>

          <form onSubmit={handleLogin} className="p-8 space-y-6">
            {loginError && (
              <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 text-xs font-bold flex gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{loginError}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 text-right">البريد الإلكتروني للمسؤول *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-900 focus:ring-1 focus:ring-blue-900/10 outline-none transition-all text-right text-sm"
                placeholder="example@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 text-right">كلمة المرور *</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-200 focus:border-blue-900 focus:ring-1 focus:ring-blue-900/10 outline-none transition-all text-center font-mono placeholder:font-sans text-sm"
                  placeholder="أدخل كلمة المرور الخاصة بك"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  title={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onGoHome}
                className="flex-1 bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-100 font-bold text-xs py-3 rounded-lg transition-all"
              >
                بوابة التقديم
              </button>
              <button
                type="submit"
                disabled={loginLoading}
                className="flex-[2] bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-3 rounded-lg shadow-sm transition-all flex justify-center items-center gap-2"
                id="submit-login-btn"
              >
                {loginLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    تحقق...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    دخول لوحة التحكم
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // --- JOB ROLE SELECTOR SCREEN ---
  if (isAuthenticated && !portalRole) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 relative overflow-hidden" id="admin-job-selector">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-100 rounded-full blur-3xl opacity-50 -z-10 translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50 -z-10 -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="text-center mb-10">
          <CompanyLogo className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-2xl font-extrabold text-slate-800">اختر مسار الوظيفة</h2>
          <p className="text-sm text-slate-500 mt-2">يرجى اختيار الوظيفة التي ترغب بإدارتها</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          {/* HSE Role */}
          <button 
            onClick={() => { setPortalRole('hse'); setSettingsJobRole('hse'); }}
            className="group bg-white hover:bg-orange-50 border-2 border-slate-200 hover:border-orange-500 rounded-2xl p-8 text-center transition-all shadow-sm hover:shadow-lg flex flex-col items-center gap-4"
          >
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Shield className="w-10 h-10 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">أخصائي صحة وسلامة وبيئة</h3>
              <p className="text-xs text-slate-500 font-medium">HSE Specialist</p>
            </div>
          </button>

          {/* Marketing Role */}
          <button 
            onClick={() => { setPortalRole('marketing'); setSettingsJobRole('marketing'); }}
            className="group bg-white hover:bg-blue-50 border-2 border-slate-200 hover:border-blue-500 rounded-2xl p-8 text-center transition-all shadow-sm hover:shadow-lg flex flex-col items-center gap-4"
          >
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Briefcase className="w-10 h-10 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">أخصائي تسويق</h3>
              <p className="text-xs text-slate-500 font-medium">Marketing Specialist</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-50 min-h-screen text-slate-800 font-sans" id="admin-dashboard-view">
      
      {/* Top Banner Administration Header */}
      <header className="bg-white text-slate-800 py-4 px-6 md:px-12 flex justify-between items-center border-b border-slate-200 print:hidden">
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 p-2 rounded-lg text-blue-900">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base text-blue-900">بوابة إدارة التقييم والتوظيف</h1>
              {stats && (
                stats.databaseType === "Supabase" ? (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    متصل بـ Supabase ({stats.supabaseUrl})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-200" title="يرجى إضافة متغيرات البيئة في منصة الاستضافة">
                    ⚠️ تخزين محلي مؤقت
                  </span>
                )
              )}
            </div>
            <p className="text-slate-450 text-[10px] font-medium">نظام الفحص الفني والمراجعة المدعوم بالذكاء الاصطناعي</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1">
            <Briefcase className="w-3.5 h-3.5" />
            <span>{portalRole === 'marketing' ? 'التسويق' : 'الصحة والسلامة'}</span>
          </div>
          <button
            onClick={() => { setPortalRole(null); setSelectedApplicant(null); }}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/50 text-xs font-bold px-4 py-2 rounded-lg transition-all flex items-center gap-1"
          >
            <ChevronDown className="w-3.5 h-3.5" />
            <span>تبديل الوظيفة</span>
          </button>
          <button
            onClick={() => setShowAdminManagement(true)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200/50 text-xs font-bold px-4 py-2 rounded-lg transition-all flex items-center gap-1"
          >
            <Users className="w-3.5 h-3.5" />
            <span>إدارة حسابات المشرفين</span>
          </button>
          <button
            onClick={onGoHome}
            className="text-slate-600 hover:text-slate-900 text-xs font-bold border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-lg transition-all"
          >
            بوابة المتقدمين
          </button>
          <button
            onClick={handleLogout}
            className="bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200/50 text-xs font-bold px-4 py-2 rounded-lg transition-all"
            id="admin-logout-btn"
          >
            تسجيل الخروج
          </button>
        </div>
      </header>

      {/* --- APPLICANT MAIN DETAIL SCREEN (IF SELECTED) --- */}
      {selectedApplicant ? (
        <div className="max-w-5xl mx-auto py-8 px-4 md:px-6">
          {/* Back button */}
          <div className="flex justify-between items-center mb-6 print:hidden">
            <button 
              onClick={() => setSelectedApplicant(null)}
              className="text-slate-500 hover:text-slate-800 font-bold text-sm flex items-center gap-1 transition-all"
              id="back-to-list-btn"
            >
              <ArrowLeft className="w-4 h-4 rotate-180" />
              العودة لقائمة المتقدمين
            </button>

            <div className="flex gap-2">
              <button 
                onClick={handlePrintProfile}
                className="bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-2 text-sm transition-all shadow-sm"
              >
                <Printer className="w-4 h-4" />
                طباعة الملف الكامل
              </button>
              
              {!isReviewMode ? (
                <button 
                  onClick={() => setIsReviewMode(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2 rounded-xl flex items-center gap-2 text-sm transition-all shadow-md shadow-orange-500/10"
                  id="open-review-panel-btn"
                >
                  <Edit3 className="w-4 h-4" />
                  تقييم الطلب يدوياً
                </button>
              ) : (
                <button 
                  onClick={() => setIsReviewMode(false)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-5 py-2 rounded-xl text-sm transition-all"
                >
                  إلغاء التعديل
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Candidate Left column card info */}
            <div className="lg:col-span-1 space-y-6 print:lg:col-span-1">
              
              {/* Core summary badge card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm text-center">
                <div className="bg-orange-500/10 text-orange-600 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 font-bold text-lg border border-orange-500/20">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="font-extrabold text-xl text-slate-900 mb-1">{selectedApplicant.personalInfo.fullName}</h3>
                <span className="text-slate-400 font-bold text-xs block mb-4 font-mono">{selectedApplicant.id}</span>
                
                <div className="flex flex-col items-center gap-3">
                  {getStatusBadge(selectedApplicant.status)}
                  {selectedApplicant.status === 'archived' && selectedApplicant.archivedDeptNote && (
                    <span className="bg-slate-100 text-slate-800 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200">
                      القسم المفترض: <strong className="text-slate-900">{selectedApplicant.archivedDeptNote}</strong>
                    </span>
                  )}
                  {selectedApplicant.aiEvaluation && getRecBadge(selectedApplicant.aiEvaluation.recommendation)}
                </div>

                <div className="border-t border-slate-100 mt-6 pt-5 grid grid-cols-2 gap-4 text-right">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">تاريخ التقديم</span>
                    <span className="text-xs font-bold text-slate-700">{new Date(selectedApplicant.createdAt).toLocaleDateString('ar-SA')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">سنوات الخبرة</span>
                    <span className="text-xs font-bold text-slate-700">{selectedApplicant.personalInfo.experienceYears} سنوات</span>
                  </div>
                </div>
              </div>
              
              {/* WhatsApp Communications Quick Actions Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 text-right print:hidden">
                <h4 className="font-extrabold text-slate-900 border-b border-slate-100 pb-3 mb-2 flex items-center gap-1.5 text-sm">
                  <MessageSquare className="text-orange-500 w-4 h-4" />
                  التواصل وإرسال إشعارات الواتساب الجاهزة 💬
                </h4>

                <div className="space-y-3">
                  {/* Template 1 Invitation Trigger */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 block">1. إرسال دعوة المقابلة الشخصية 🗓️</span>
                    {selectedApplicant.interviewSchedule ? (
                      <div className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-1.5 rounded-lg font-bold border border-emerald-100 mb-2">
                        ✓ تم جدولة موعد في {new Date(selectedApplicant.interviewSchedule.date).toLocaleDateString('ar-SA')} الساعة {selectedApplicant.interviewSchedule.time}
                      </div>
                    ) : (
                      <div className="text-[10px] text-orange-600 bg-orange-50 px-2 py-1.5 rounded-lg font-bold border border-orange-100 mb-2">
                        ⚠️ لم يتم جدولة موعد رسمي للمرشح بعد (يمكن الإرسال بدونه).
                      </div>
                    )}
                    <button
                      onClick={() => {
                        const sched = selectedApplicant.interviewSchedule;
                        handleSendWhatsApp(
                          selectedApplicant,
                          selectedApplicant.personalInfo.fullName,
                          sched?.date || '',
                          sched?.time || '',
                          sched?.type || 'remote'
                        );
                      }}
                      className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>إرسال دعوة المقابلة عبر الواتساب</span>
                    </button>
                  </div>

                  {/* Template 2 Rejection Trigger */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 block">2. إرسال رسالة الاعتذار والرفض ✉️</span>
                    <p className="text-[9px] text-slate-400 font-semibold leading-normal">
                      سيتم فتح محادثة واتساب مع المرشح تحتوي على رسالة الاعتذار الرسمية المناسبة لوظيفة {announcementTitle || 'أخصائي صحة وسلامة مهنية'}.
                    </p>
                    <button
                      onClick={() => handleSendRejectionWhatsApp(selectedApplicant)}
                      className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-200 hover:border-rose-500 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>إرسال رسالة الاعتذار عبر الواتساب</span>
                    </button>
                  </div>
                </div>

                <div className="text-center pt-1">
                  <button
                    onClick={() => {
                      setActiveSubTab('templates');
                      setSelectedApplicant(null);
                    }}
                    className="text-[10px] text-orange-500 hover:underline font-bold inline-flex items-center gap-1"
                  >
                    <span>تعديل وصياغة نصوص القوالب الافتراضية ⚙️</span>
                  </button>
                </div>
              </div>

              {/* Personal Details list card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h4 className="font-extrabold text-slate-900 border-b border-slate-100 pb-3 mb-2 flex items-center gap-1.5 text-sm">
                  <Users className="text-orange-500 w-4 h-4" />
                  المعلومات الشخصية والتعليم
                </h4>
                
                <div className="space-y-3.5 text-xs leading-relaxed text-right">
                  <div>
                    <span className="text-slate-400 block">الجنسية والجنس:</span>
                    <span className="font-bold text-slate-800">
                      {selectedApplicant.personalInfo.nationality} ({selectedApplicant.personalInfo.gender === 'female' ? 'أنثى' : 'ذكر'})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">تاريخ الميلاد:</span>
                    <span className="font-bold text-slate-800">
                      {selectedApplicant.personalInfo.birthDate}
                      {selectedApplicant.personalInfo.birthDate && ` (العمر: ${Math.abs(new Date(Date.now() - new Date(selectedApplicant.personalInfo.birthDate).getTime()).getUTCFullYear() - 1970)} سنة)`}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">المدينة وعنوان السكن:</span>
                    <span className="font-bold text-slate-800">
                      {selectedApplicant.personalInfo.city} - {selectedApplicant.personalInfo.residenceAddress || 'غير مدخل'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">رقم الجوال:</span>
                    <span className="font-bold text-slate-800 ltr block text-right">{selectedApplicant.personalInfo.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">البريد الإلكتروني:</span>
                    <span className="font-bold text-slate-800 block truncate">{selectedApplicant.personalInfo.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">المؤهل والتخصص الدقيق:</span>
                    <span className="font-bold text-slate-800">{selectedApplicant.personalInfo.qualification} في {selectedApplicant.personalInfo.major}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">الرواتب (الحالي / المتوقع):</span>
                    <span className="font-bold text-slate-800">{selectedApplicant.personalInfo.currentSalary || 'غير مدخل'} / {selectedApplicant.personalInfo.expectedSalary}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">فترة الإشعار للبدء:</span>
                    <span className="font-bold text-slate-800">{selectedApplicant.personalInfo.noticePeriod}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">امتلاك سيارة خاصة؟</span>
                    <span className="font-bold text-slate-800">
                      {selectedApplicant.personalInfo.ownsCar === 'no' ? 'لا' : 'نعم'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">مشاكل صحية أو طبية؟</span>
                    <span className="font-bold text-red-600">
                      {selectedApplicant.personalInfo.hasHealthIssues === 'yes' 
                        ? `نعم (${selectedApplicant.personalInfo.healthIssuesDetails || 'لم يحدد التفاصيل'})` 
                        : 'لا توجد (سليم ولله الحمد)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">مشكلة في موقع العمل (حي الرحاب بجدة)؟</span>
                    <span className="font-bold text-slate-800">
                      {selectedApplicant.personalInfo.hasLocationIssue === 'yes' ? 'نعم (لديه مشكلة)' : 'لا (لا توجد أي مشكلة)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">هل لديه ترخيص من منصة كوادر؟</span>
                    <span className="font-bold text-slate-800">
                      {selectedApplicant.personalInfo.hasKawaderLicense === 'yes' ? 'نعم (لديه ترخيص)' : 'لا'}
                    </span>
                  </div>
                  {selectedApplicant.personalInfo.linkedinUrl && (
                    <div>
                      <span className="text-slate-400 block">حساب LinkedIn:</span>
                      <a href={selectedApplicant.personalInfo.linkedinUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-orange-500 hover:underline inline-flex items-center gap-1">
                        تصفح الحساب الموثق
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Attachments Section */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 print:hidden">
                <div>
                  <h4 className="font-extrabold text-slate-900 border-b border-slate-100 pb-3 mb-3 flex items-center gap-1.5 text-sm">
                    <Eye className="text-orange-500 w-4 h-4" />
                    استعراض المستندات والمرفقات الرسمية للمرشح
                  </h4>
                  
                  <div className="space-y-3">
                    {/* CV Preview */}
                    {selectedApplicant.personalInfo.cvBase64 ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePreviewAttachment(selectedApplicant.personalInfo.cvBase64, selectedApplicant.personalInfo.cvFileName)}
                          className="flex-1 bg-orange-50 hover:bg-orange-100/80 text-orange-700 border border-orange-200/50 p-3 rounded-xl flex items-center justify-between text-right text-xs font-bold transition-all group"
                          title="انقر لاستعراض السيرة الذاتية مباشرة"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-orange-600" />
                            <span>استعراض السيرة الذاتية (PDF) 👁️</span>
                          </div>
                          <Eye className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
                        </button>
                        <button
                          onClick={() => handleDownloadAttachment(selectedApplicant.personalInfo.cvBase64, selectedApplicant.personalInfo.cvFileName)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-3 rounded-xl flex items-center justify-center transition-all border border-slate-200/40"
                          title="تحميل الملف كنسخة احتياطية"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic text-center p-2 border border-dashed rounded-lg">لم يتم توفير سيرة ذاتية PDF من المرشح</div>
                    )}

                    {/* Certs Preview */}
                    {selectedApplicant.personalInfo.certsBase64 ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePreviewAttachment(selectedApplicant.personalInfo.certsBase64, selectedApplicant.personalInfo.certsFileName)}
                          className="flex-1 bg-orange-50 hover:bg-orange-100/80 text-orange-700 border border-orange-200/50 p-3 rounded-xl flex items-center justify-between text-right text-xs font-bold transition-all group"
                          title="انقر لاستعراض الشهادات مباشرة"
                        >
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-orange-600" />
                            <span>استعراض الشهادات المهنية الملحقة 👁️</span>
                          </div>
                          <Eye className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
                        </button>
                        <button
                          onClick={() => handleDownloadAttachment(selectedApplicant.personalInfo.certsBase64, selectedApplicant.personalInfo.certsFileName)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-3 rounded-xl flex items-center justify-center transition-all border border-slate-200/40"
                          title="تحميل الملف كنسخة احتياطية"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic text-center p-2 border border-dashed rounded-lg">لم يتم توفير شهادات ورقية من المرشح</div>
                    )}

                    {/* Portfolio Preview */}
                    {selectedApplicant.personalInfo.portfolioBase64 && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePreviewAttachment(selectedApplicant.personalInfo.portfolioBase64, selectedApplicant.personalInfo.portfolioFileName)}
                          className="flex-1 bg-blue-50 hover:bg-blue-100/80 text-blue-700 border border-blue-200/50 p-3 rounded-xl flex items-center justify-between text-right text-xs font-bold transition-all group"
                          title="انقر لاستعراض ملف عينة الأعمال (البورتفوليو) مباشرة"
                        >
                          <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-blue-600" />
                            <span>استعراض عينة من الأعمال (بورتفوليو) 👁️</span>
                          </div>
                          <Eye className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
                        </button>
                        <button
                          onClick={() => handleDownloadAttachment(selectedApplicant.personalInfo.portfolioBase64, selectedApplicant.personalInfo.portfolioFileName)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-3 rounded-xl flex items-center justify-center transition-all border border-slate-200/40"
                          title="تحميل عينة الأعمال كنسخة احتياطية"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Kawader License Preview */}
                    {selectedApplicant.personalInfo.hasKawaderLicense === 'yes' && (
                      selectedApplicant.personalInfo.kawaderLicenseBase64 ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handlePreviewAttachment(selectedApplicant.personalInfo.kawaderLicenseBase64, selectedApplicant.personalInfo.kawaderLicenseFileName)}
                            className="flex-1 bg-orange-50 hover:bg-orange-100/80 text-orange-700 border border-orange-200/50 p-3 rounded-xl flex items-center justify-between text-right text-xs font-bold transition-all group"
                            title="انقر لاستعراض ترخيص منصة كوادر مباشرة"
                          >
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-orange-600" />
                              <span>استعراض ترخيص منصة كوادر 👁️</span>
                            </div>
                            <Eye className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
                          </button>
                          <button
                            onClick={() => handleDownloadAttachment(selectedApplicant.personalInfo.kawaderLicenseBase64, selectedApplicant.personalInfo.kawaderLicenseFileName)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-3 rounded-xl flex items-center justify-center transition-all border border-slate-200/40"
                            title="تحميل الترخيص كنسخة احتياطية"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 italic text-center p-2 border border-dashed rounded-lg">المرشح لديه ترخيص كوادر ولكن لم يتم رفع ملف الترخيص</div>
                      )
                    )}

                    {/* Additional Documents from Candidate */}
                    {selectedApplicant.personalInfo.additionalDocuments && selectedApplicant.personalInfo.additionalDocuments.length > 0 && (
                      <div className="border-t border-slate-100 pt-3 mt-3 space-y-2">
                        <p className="text-[11px] font-extrabold text-slate-700 mb-2">المستندات والملفات الإضافية المرفوعة من المرشح:</p>
                        {selectedApplicant.personalInfo.additionalDocuments.map((doc) => (
                          <div key={doc.id} className="flex gap-2">
                            <button
                              onClick={() => handlePreviewAttachment(doc.base64, doc.fileName)}
                              className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/50 p-2.5 rounded-xl flex items-center justify-between text-right text-xs font-semibold transition-all group"
                              title="انقر لاستعراض هذا المستند مباشرة"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="w-4 h-4 text-orange-500 shrink-0" />
                                <span className="truncate max-w-[200px] text-right" title={doc.fileName}>{doc.fileName}</span>
                              </div>
                              <Eye className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform shrink-0" />
                            </button>
                            <button
                              onClick={() => handleDownloadAttachment(doc.base64, doc.fileName)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2.5 rounded-xl flex items-center justify-center transition-all border border-slate-200/40 shrink-0"
                              title="تحميل الملف"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Administration Uploaded Documents */}
                <div className="border-t border-slate-100 pt-4">
                  <h4 className="font-extrabold text-slate-900 border-b border-slate-100 pb-3 mb-3 flex items-center gap-1.5 text-sm">
                    <Shield className="text-orange-500 w-4 h-4" />
                    المستندات والمسودات المرفقة من الإدارة ({selectedApplicant.personalInfo.adminDocuments?.length || 0})
                  </h4>

                  {(!selectedApplicant.personalInfo.adminDocuments || selectedApplicant.personalInfo.adminDocuments.length === 0) ? (
                    <div className="text-xs text-slate-400 italic text-center p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/30">
                      لا توجد مستندات إضافية مرفوعة من الإدارة لهذا المرشح حالياً.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                      {selectedApplicant.personalInfo.adminDocuments.map((doc) => (
                        <div key={doc.id} className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 flex items-center justify-between gap-2">
                          <div className="text-right min-w-0 flex-1">
                            <p className="font-bold text-slate-800 text-xs truncate" title={doc.name}>{doc.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono truncate">{doc.fileName}</p>
                          </div>
                          
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handlePreviewAttachment(doc.base64, doc.fileName)}
                              className="bg-orange-500/10 hover:bg-orange-500 hover:text-white text-orange-600 p-2 rounded-lg text-xs transition-all"
                              title="استعراض المستند"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDownloadAttachment(doc.base64, doc.fileName)}
                              className="bg-slate-200/50 hover:bg-slate-200 text-slate-700 p-2 rounded-lg text-xs transition-all"
                              title="تحميل المستند"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteAdminDocument(doc.id)}
                              className="bg-red-50 hover:bg-red-500 text-red-500 hover:text-white p-2 rounded-lg text-xs transition-all"
                              title="حذف المستند"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Upload on behalf form */}
                <div className="bg-slate-50/60 border border-slate-200 p-4 rounded-2xl space-y-3.5">
                  <h5 className="font-extrabold text-slate-800 text-xs flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5 text-orange-500" />
                    <span>إرفاق مستند جديد نيابةً عن المرشح:</span>
                  </h5>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold block">مسمى أو وصف المستند:</label>
                      <input
                        type="text"
                        value={newDocName}
                        onChange={(e) => setNewDocName(e.target.value)}
                        placeholder="مثال: الفحص الطبي، الهوية الوطنية، عقد سابق"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs outline-none focus:border-orange-500 transition-colors font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold block">الملف (PDF, صور):</label>
                      <input
                        type="file"
                        id="admin-doc-file-input"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setNewDocFile(file);
                        }}
                        accept=".pdf,image/*"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs outline-none file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-orange-500 file:text-white hover:file:bg-orange-600 cursor-pointer text-slate-500"
                      />
                    </div>

                    <button
                      onClick={handleAdminUploadDocument}
                      disabled={isUploadingDoc || !newDocName.trim() || !newDocFile}
                      className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    >
                      {isUploadingDoc ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>جاري رفع وحفظ الملف...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>إرفاق وحفظ المستند بالنظام 💾</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Candidate Right columns detail info */}
            <div className="lg:col-span-2 space-y-6 print:lg:col-span-2">
              
              {/* --- HR EVALUATION FORM / MANUAL REVIEW (IF ACTIVE) --- */}
              {isReviewMode && (
                <div className="bg-slate-900 text-white rounded-3xl border border-slate-800 p-6 md:p-8 shadow-xl animate-fade-in print:hidden" id="hr-manual-review-card">
                  <h4 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-slate-800 pb-3">
                    <Star className="text-orange-400 fill-orange-400 w-5 h-5" />
                    لوحة تقييم الموارد البشرية والمهندسين الفنيين
                  </h4>

                  <div className="space-y-6">
                    {/* Rating Scales */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { key: 'experienceRating', label: '1. ملاءمة الخبرة المهنية (0-10)' },
                        { key: 'qualificationRating', label: '2. المؤهلات الدراسية والشهادات (0-10)' },
                        { key: 'certificatesRating', label: '3. الشهادات المهنية (OSHA, NEBOSH) (0-10)' },
                        { key: 'technicalRating', label: '4. مستوى الإجابات الفنية في الاختبار (0-10)' },
                        { key: 'writingRating', label: '5. أسلوب الكتابة والتحليل المنظم (0-10)' },
                        { key: 'languageRating', label: '6. المهارة اللغوية والمصطلحات (0-10)' },
                        { key: 'personalityRating', label: '7. الانطباع الشخصي والمقابلة (0-10)' }
                      ].map((rate) => (
                        <div key={rate.key} className="space-y-2 text-right">
                          <label className="text-xs font-bold text-slate-300 block">{rate.label}</label>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="0"
                              max="10"
                              value={(hrEvalForm as any)[rate.key]}
                              onChange={(e) => setHrEvalForm(prev => ({ ...prev, [rate.key]: parseInt(e.target.value, 10) }))}
                              className="flex-1 accent-orange-500 cursor-pointer"
                            />
                            <span className="font-mono font-black text-sm text-orange-400 bg-slate-800 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-slate-700">
                              {(hrEvalForm as any)[rate.key]}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Score preview, Status, Notes */}
                    <div className="border-t border-slate-800 pt-5 grid grid-cols-1 sm:grid-cols-3 gap-6">
                      
                      {/* HR Score */}
                      <div className="text-center bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <span className="text-[10px] text-slate-400 block mb-1">الدرجة الإجمالية المحسوبة</span>
                        <span className="text-3xl font-black text-orange-400 font-mono">{hrEvalForm.finalScore} <span className="text-xs text-slate-400 font-medium">/ 100</span></span>
                      </div>

                      {/* Select Status */}
                      <div className="sm:col-span-2 text-right">
                        <label className="block text-xs font-bold text-slate-300 mb-2">تحديث حالة الطلب الإداري *</label>
                        <select
                          value={reviewStatus}
                          onChange={(e) => setReviewStatus(e.target.value as ApplicationStatus)}
                          className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-3 outline-none text-xs focus:border-orange-500"
                        >
                          <option value="pending">جديد (بانتظار المراجعة)</option>
                          <option value="reviewing">تحت المراجعة والتدقيق</option>
                          <option value="interview">دعوة للمقابلة الشخصية</option>
                          <option value="accepted">قبول مبدئي للتوظيف</option>
                          <option value="rejected">استبعاد ورفض الطلب</option>
                          <option value="waitlist">إرسال لقائمة الانتظار</option>
                          <option value="archived">نقل إلى الأرشيف</option>
                        </select>
                      </div>

                      {/* Archived Department Note */}
                      {reviewStatus === 'archived' && (
                        <div className="sm:col-span-3 text-right">
                          <label className="block text-xs font-bold text-slate-300 mb-2">القسم المقترح لهذا الموظف/المتقدم بالأرشيف *</label>
                          <input
                            type="text"
                            value={archivedDeptNote}
                            onChange={(e) => setArchivedDeptNote(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none text-xs focus:border-orange-500"
                            placeholder="مثال: قسم الأمن والسلامة، إدارة المشاريع، إدارة تقنية المعلومات..."
                            required
                          />
                        </div>
                      )}

                      {/* Reviewer Note */}
                      <div className="sm:col-span-3 text-right">
                        <label className="block text-xs font-bold text-slate-300 mb-2">ملاحظات الإدارة والتقرير الفني اليدوي *</label>
                        <textarea
                          rows={4}
                          value={hrEvalForm.notes}
                          onChange={(e) => setHrEvalForm(prev => ({ ...prev, notes: e.target.value }))}
                          className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none text-xs focus:border-orange-500 resize-none leading-relaxed"
                          placeholder="اكتب ملاحظاتك الفنية حول المتقدم، مبررات قرار القبول أو الرفض، وتفاصيل الأداء..."
                        />
                      </div>
                    </div>

                    {/* Saving actions */}
                    <div className="flex gap-3 justify-end pt-2">
                      <button
                        onClick={handleSaveHrReview}
                        disabled={isSavingReview}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3.5 rounded-xl text-sm transition-all shadow-lg flex items-center gap-2 active:scale-95 disabled:bg-orange-400"
                        id="save-hr-review-btn"
                      >
                        {isSavingReview ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            جاري الحفظ...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            حفظ واعتماد التقييم
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                </div>
              )}

              {/* Real-time AI Evaluation Analysis Section */}
              {selectedApplicant.aiEvaluation && (
                <div className="bg-slate-900 text-white rounded-3xl border border-slate-800 p-6 shadow-md" id="ai-report-details">
                  <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-4">
                    <div className="bg-orange-500 p-2.5 rounded-xl text-white">
                      <BarChart2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base">تحليل الفحص والتقييم بالذكاء الاصطناعي</h4>
                      <p className="text-slate-400 text-[10px]">تقرير ذكاء اصطناعي فوري للمطابقة الوظيفية</p>
                    </div>
                  </div>

                  <div className="space-y-6 text-sm">
                    {/* Score and level */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800 text-right">
                        <span className="text-slate-400 text-[10px] block mb-1">الدرجة الفنية للذكاء الاصطناعي</span>
                        <span className="text-3xl font-black text-orange-400 font-mono">{selectedApplicant.aiEvaluation.score} <span className="text-xs text-slate-400 font-medium">/ 100</span></span>
                      </div>
                      <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800 text-right">
                        <span className="text-slate-400 text-[10px] block mb-1">الخبرة بقطاع الدهانات/الكيماويات</span>
                        <span className="text-base font-bold text-white block mt-1">
                          {selectedApplicant.aiEvaluation.paintChemicalExpLevel === 'high' ? 'خبرة عميقة وتخصصية' :
                           selectedApplicant.aiEvaluation.paintChemicalExpLevel === 'medium' ? 'خبرة جيدة ومطابقة' :
                           selectedApplicant.aiEvaluation.paintChemicalExpLevel === 'low' ? 'خبرة عامة ومحدودة' : 'لا تتوفر خبرة تخصصية'}
                        </span>
                      </div>
                    </div>

                    {/* Recommendation Reason */}
                    <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 text-right">
                      <span className="text-slate-400 text-[10px] block mb-1">تبرير ومبررات التوصية:</span>
                      <p className="text-xs text-slate-300 leading-relaxed font-medium">{selectedApplicant.aiEvaluation.recommendationReason}</p>
                    </div>

                    {/* Strengths & Weaknesses */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-slate-800 pt-4 text-right">
                      <div>
                        <span className="text-emerald-400 font-bold text-xs block mb-2">أهم نقاط القوة الفنية:</span>
                        <ul className="space-y-2">
                          {Array.isArray(selectedApplicant.aiEvaluation.strengths) ? (
                            selectedApplicant.aiEvaluation.strengths.map((s, idx) => (
                              <li key={idx} className="flex gap-2 text-xs text-slate-300 items-start leading-relaxed">
                                <span className="text-emerald-500 font-bold">•</span>
                                <span>{s}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-xs text-slate-400 italic">لا توجد نقاط قوة مسجلة</li>
                          )}
                        </ul>
                      </div>
                      <div>
                        <span className="text-red-400 font-bold text-xs block mb-2">جوانب النقص والمخاطر:</span>
                        <ul className="space-y-2">
                          {Array.isArray(selectedApplicant.aiEvaluation.weaknesses) ? (
                            selectedApplicant.aiEvaluation.weaknesses.map((w, idx) => (
                              <li key={idx} className="flex gap-2 text-xs text-slate-300 items-start leading-relaxed">
                                <span className="text-red-500 font-bold">•</span>
                                <span>{w}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-xs text-slate-400 italic">لا توجد جوانب نقص مسجلة</li>
                          )}
                        </ul>
                      </div>
                    </div>

                    {/* Custom Suggested Interview Questions */}
                    <div className="border-t border-slate-800 pt-4 text-right">
                      <span className="text-orange-400 font-bold text-xs block mb-2">أسئلة مقترحة وموجهة للمقابلة الشخصية:</span>
                      <ul className="space-y-3">
                        {Array.isArray(selectedApplicant.aiEvaluation.suggestedQuestions) ? (
                          selectedApplicant.aiEvaluation.suggestedQuestions.map((q, idx) => (
                            <li key={idx} className="bg-slate-800 p-3 rounded-lg border border-slate-750 text-xs text-slate-200 leading-relaxed">
                              <span className="font-bold text-orange-400 font-mono block mb-0.5">سؤال مقابلة مقترح {idx + 1}:</span>
                              {q}
                            </li>
                          ))
                        ) : (
                          <li className="text-xs text-slate-400 italic">لا توجد أسئلة مقابلة مقترحة</li>
                        )}
                      </ul>
                    </div>

                  </div>
                </div>
              )}

              {/* Experiences detail card */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
                <h4 className="font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-1.5 text-base">
                  <Briefcase className="text-orange-500 w-5 h-5" />
                  تفاصيل الخبرات والقطاعات المهنية المحددة
                </h4>

                <div className="space-y-6 text-sm text-right">
                  {/* Paint Experience */}
                  <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                    <span className="text-xs font-bold block mb-1 text-slate-400">الخبرة بقطاع الدهانات والطلاء:</span>
                    {selectedApplicant.industryExperience.workedInPaint ? (
                      <div className="space-y-2 leading-relaxed">
                        <p className="font-bold text-slate-800">لقد عمل في {selectedApplicant.industryExperience.paintCompany} لمدة {selectedApplicant.industryExperience.paintYears} سنوات بدور ({selectedApplicant.industryExperience.paintRole})</p>
                        <p className="text-xs text-slate-600 font-medium bg-white p-2.5 rounded-lg border border-slate-150">{selectedApplicant.industryExperience.paintTasks || 'لم يتم تفصيل المهام'}</p>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-xs">لا توجد خبرة محددة بقطاع الدهانات</span>
                    )}
                  </div>

                  {/* Chemical Experience */}
                  <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                    <span className="text-xs font-bold block mb-1 text-slate-400">الخبرة بمصانع المواد الكيميائية:</span>
                    {selectedApplicant.industryExperience.workedInChemical ? (
                      <div className="space-y-2 leading-relaxed">
                        <p className="font-bold text-slate-800">لقد عمل في {selectedApplicant.industryExperience.chemicalCompany} لمدة {selectedApplicant.industryExperience.chemicalYears} سنوات بدور ({selectedApplicant.industryExperience.chemicalRole})</p>
                        <p className="text-xs text-slate-600 font-medium bg-white p-2.5 rounded-lg border border-slate-150">{selectedApplicant.industryExperience.chemicalTasks || 'لم يتم تفصيل المهام'}</p>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-xs">لا توجد خبرة محددة بقطاع الكيماويات</span>
                    )}
                  </div>

                  {/* Industrial Experience */}
                  <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                    <span className="text-xs font-bold block mb-1 text-slate-400">الخبرات الصناعية العامة الأخرى:</span>
                    {selectedApplicant.industryExperience.workedInIndustrial ? (
                      <div className="space-y-2 leading-relaxed">
                        <p className="font-bold text-slate-800">لقد عمل في {selectedApplicant.industryExperience.industrialCompany} لمدة {selectedApplicant.industryExperience.industrialYears} سنوات بدور ({selectedApplicant.industryExperience.industrialRole})</p>
                        <p className="text-xs text-slate-600 font-medium bg-white p-2.5 rounded-lg border border-slate-150">{selectedApplicant.industryExperience.industrialTasks || 'لم يتم تفصيل المهام'}</p>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-xs">لا توجد خبرات عامة مسجلة</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Technical test answers detail card */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
                <h4 className="font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-1.5 text-base">
                  <FileQuestion className="text-orange-500 w-5 h-5" />
                  أجوبة اختبار الجدارة الفنية (HSE) بالتفصيل
                </h4>

                <div className="space-y-6 text-right">
                  {[
                    { id: 'q1_paint_risks', q: '1- ما أهم المخاطر داخل مصانع الدهانات؟' },
                    { id: 'q2_hazard_vs_risk', q: '2- ما الفرق بين الخطر والمخاطرة؟' },
                    { id: 'q3_incident_investigation', q: '3- كيف تحقق في حادث عمل؟' },
                    { id: 'q4_risk_assessment', q: '4- كيف تقوم بإعداد تقييم مخاطر؟' },
                    { id: 'q5_ppe_chemical', q: '5- ما معدات الوقاية الشخصية المطلوبة عند التعامل مع المواد الكيميائية؟' },
                    { id: 'q6_sds_msds', q: '6- ما هي SDS أو MSDS وما أهميتها؟' },
                    { id: 'q7_flammable_spill', q: '7- ماذا ستفعل عند حدوث انسكاب لمادة كيميائية قابلة للاشتعال؟' },
                    { id: 'q8_ppe_refusal', q: '8- كيف تتعامل مع موظف يرفض ارتداء معدات الوقاية الشخصية؟' },
                    { id: 'q9_daily_inspection', q: '9- ما أهم النقاط التي يجب فحصها أثناء الجولة التفتيشية اليومية؟' },
                    { id: 'q10_safety_project', q: '10- اذكر مشروعًا أو تحسينًا في السلامة سبق أن شاركت فيه.' }
                  ].map((item, idx) => {
                    const ans = (selectedApplicant.examAnswers as any)[item.id] || '';
                    return (
                      <div key={item.id} className="border-b border-slate-100 pb-5 last:border-none last:pb-0">
                        <span className="font-bold text-slate-900 text-sm block mb-2">{item.q}</span>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed font-medium">
                          {ans.trim() ? ans : <span className="text-slate-400 italic">لم تتم الإجابة على هذا السؤال في الطلب المقدم.</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Manual HR Review Results if submitted */}
              {selectedApplicant.hrEvaluation && (
                <div className="bg-slate-950 text-white rounded-3xl border border-slate-800 p-6 shadow-md">
                  <h4 className="font-extrabold border-b border-slate-800 pb-3 mb-4 flex items-center gap-1.5 text-base">
                    <Star className="text-orange-400 fill-orange-400 w-5 h-5" />
                    قرار وسجل تقييم الموارد البشرية
                  </h4>

                  <div className="space-y-4 text-xs leading-relaxed text-right">
                    <div className="grid grid-cols-2 gap-4 bg-slate-900 p-4 rounded-xl">
                      <div>
                        <span className="text-slate-400 block mb-0.5">درجة التقييم اليدوي الإجمالية</span>
                        <span className="text-2xl font-black text-orange-400 font-mono">{selectedApplicant.hrEvaluation.finalScore} / 100</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">المُقيّم</span>
                        <span className="text-sm font-bold text-white block mt-1">{selectedApplicant.hrEvaluation.reviewedBy || 'إدارة الموارد البشرية'}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-1">التقرير والملاحظات الإدارية المسجلة:</span>
                      <p className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-slate-200 leading-relaxed">{selectedApplicant.hrEvaluation.notes}</p>
                    </div>

                    <div className="text-[10px] text-slate-500 text-left">
                      تم الاعتماد والتعديل في: {new Date(selectedApplicant.hrEvaluation.reviewedAt).toLocaleString('ar-SA')}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      ) : (
        /* --- ADMIN DASHBOARD LIST & TABLE VIEW --- */
        <main className="max-w-7xl mx-auto py-8 px-4 md:px-6 space-y-8 print:hidden" id="admin-main-list-view">
          
          {/* Supabase Disconnected Banner Warning */}
          {stats && stats.databaseType !== "Supabase" && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-right flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="font-extrabold text-amber-900 flex items-center gap-2 text-sm">
                  <span>⚠️</span>
                  <span>تنبيه هام: خادم المنصة يعمل بوضع التخزين المؤقت (Supabase غير متصل)</span>
                </h4>
                <p className="text-amber-700 text-xs leading-relaxed">
                  لم يتم العثور على متغيرات البيئة لـ Supabase في بيئة التشغيل الحالية لـ Vercel. أي طلبات تقديم جديدة سيتم حفظها مؤقتاً في ذاكرة الخادم فقط ولن تظهر في لوحة تحكم Supabase، وقد تختفي في أي وقت عند إعادة تشغيل الحاوية.
                </p>
              </div>
              <div className="shrink-0 bg-white px-3 py-1.5 rounded-xl border border-amber-200 text-amber-800 text-xs font-bold font-mono">
                مطلوب: إضافة SUPABASE_URL و SUPABASE_SECRET_KEY في Vercel
              </div>
            </div>
          )}

          {/* Dashboard Stats Panel Cards */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-4">
              
              {/* Card 1 */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-right">
                <span className="text-slate-400 text-[10px] font-bold block mb-1">إجمالي المتقدمين</span>
                <span className="text-2xl font-black text-slate-800 font-mono">{stats.total}</span>
              </div>

              {/* Card 2 */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-right">
                <span className="text-slate-400 text-[10px] font-bold block mb-1">طلبات جديدة</span>
                <span className="text-2xl font-black text-orange-500 font-mono">{stats.pending}</span>
              </div>

              {/* Card 3 */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-right">
                <span className="text-slate-400 text-[10px] font-bold block mb-1">تحت المراجعة</span>
                <span className="text-2xl font-black text-blue-500 font-mono">{stats.reviewing}</span>
              </div>

              {/* Card 4 */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-right">
                <span className="text-slate-400 text-[10px] font-bold block mb-1">المقابلة الفنية</span>
                <span className="text-2xl font-black text-purple-500 font-mono">{stats.interview}</span>
              </div>

              {/* Card 5 */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-right">
                <span className="text-slate-400 text-[10px] font-bold block mb-1">المقبولين</span>
                <span className="text-2xl font-black text-emerald-500 font-mono">{stats.accepted}</span>
              </div>

              {/* Card 6 */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-right">
                <span className="text-slate-400 text-[10px] font-bold block mb-1">المستبعدين</span>
                <span className="text-2xl font-black text-rose-500 font-mono">{stats.rejected}</span>
              </div>

              {/* Card 7 */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-right">
                <span className="text-slate-400 text-[10px] font-bold block mb-1">قائمة الانتظار</span>
                <span className="text-2xl font-black text-amber-500 font-mono">{stats.waitlist}</span>
              </div>

              {/* Card 8 */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-right">
                <span className="text-slate-400 text-[10px] font-bold block mb-1">الأرشيف</span>
                <span className="text-2xl font-black text-slate-500 font-mono">{stats.archived || 0}</span>
              </div>

              {/* Card 9 */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-right">
                <span className="text-slate-400 text-[10px] font-bold block mb-1">متوسط درجة الذكاء</span>
                <span className="text-2xl font-black text-orange-600 font-mono">{stats.averageAiScore} <span className="text-xs text-slate-400">/ 100</span></span>
              </div>

            </div>
          )}

          {/* Logo Settings Panel */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="text-right md:col-span-2">
              <h3 className="font-extrabold text-slate-900 flex items-center gap-2 text-base mb-1">
                <Shield className="text-orange-500 w-5 h-5" />
                تخصيص شعار المصنع (الهوية البصرية)
              </h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                بإمكانك رفع الشعار الخاص بمصنعكم هنا بصيغة صورة (PNG, JPG). سيتم استبدال الشعار المولد في جميع صفحات الموقع (بما فيها بوابة المتقدمين ولوحة الإدارة والشهادات المطبوعة) تلقائياً لحفظ ملامح شعاركم الرسمية.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-end gap-4 md:col-span-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="bg-white p-2 rounded-xl border border-slate-200 w-24 h-16 flex items-center justify-center overflow-hidden shrink-0">
                <CompanyLogo className="max-h-full max-w-full object-contain" />
              </div>
              <div className="flex flex-col gap-2 w-full">
                <label className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-2 px-3 rounded-lg text-center cursor-pointer shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  <span>رفع شعار جديد</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </label>
                {safeStorage.getItem('company_logo') && (
                  <button
                    onClick={handleLogoReset}
                    className="bg-white hover:bg-rose-50 text-rose-600 border border-rose-100 hover:border-rose-200 font-bold text-[10px] py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>إعادة تعيين الشعار الافتراضي</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sub-Tab Bar Selection */}
          <div className="flex border-b border-slate-200 gap-6 pb-0 mb-4 shrink-0" id="admin-sub-tabs">
            <button
              onClick={() => setActiveSubTab('applicants')}
              className={`pb-4 text-xs sm:text-sm font-extrabold transition-all border-b-2 flex items-center gap-2 ${
                activeSubTab === 'applicants'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>ملفات ومراجعة المتقدمين ({applicants.length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('schedules')}
              className={`pb-4 text-xs sm:text-sm font-extrabold transition-all border-b-2 flex items-center gap-2 ${
                activeSubTab === 'schedules'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>ترتيب مواعيد المقابلات عن بعد ({applicants.filter(a => a.interviewSchedule).length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('announcements')}
              className={`pb-4 text-xs sm:text-sm font-extrabold transition-all border-b-2 flex items-center gap-2 ${
                activeSubTab === 'announcements'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>إعلان الوظيفة للواتساب</span>
            </button>
            <button
              onClick={() => setActiveSubTab('templates')}
              className={`pb-4 text-xs sm:text-sm font-extrabold transition-all border-b-2 flex items-center gap-2 ${
                activeSubTab === 'templates'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <span>قوالب الرسائل الجاهزة 💬</span>
            </button>
          </div>

          {activeSubTab === 'applicants' && (
            <>
              {/* Search, Filter, Export Panel Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <h3 className="font-extrabold text-slate-900 flex items-center gap-2 text-base">
                <ListFilter className="text-orange-500 w-5 h-5" />
                خيارات البحث، الفرز، وتصدير البيانات
              </h3>
              <button
                onClick={handleExportCSV}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 text-xs rounded-xl flex items-center gap-2 transition-all shadow-md shadow-emerald-600/10 self-start md:self-auto"
                id="export-csv-btn"
              >
                <FileSpreadsheet className="w-4 h-4" />
                تصدير البيانات لملف Excel (CSV)
              </button>
            </div>

            {/* Grid of inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              
              {/* Search text */}
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-orange-500 outline-none text-xs"
                  placeholder="ابحث بالاسم، الجوال، رقم الطلب..."
                />
                <Search className="w-4 h-4 text-slate-400 absolute top-1/2 right-3.5 -translate-y-1/2" />
              </div>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none text-xs bg-white"
              >
                <option value="all">كل حالات الطلب</option>
                <option value="pending">جديد</option>
                <option value="reviewing">تحت المراجعة</option>
                <option value="interview">مقابلة شخصية</option>
                <option value="accepted">مقبول</option>
                <option value="rejected">مرفوض</option>
                <option value="waitlist">قائمة الانتظار</option>
                <option value="archived">الأرشيف</option>
              </select>

              {/* Experience filter */}
              <select
                value={experienceFilter}
                onChange={(e) => setExperienceFilter(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none text-xs bg-white"
              >
                <option value="all">كل فترات الخبرة</option>
                <option value="fresh">حديث تخرج (0-2 سنة)</option>
                <option value="mid">خبرة متوسطة (2-5 سنة)</option>
                <option value="senior">خبرة متقدمة (أكثر من 5 سنوات)</option>
              </select>

              {/* Manual Score Range Filter */}
              <select
                value={hrScoreFilter}
                onChange={(e) => setHrScoreFilter(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none text-xs bg-white font-semibold"
              >
                <option value="all">درجة التقييم اليدوي: الكل</option>
                <option value="90-100">ممتاز (90 فأعلى)</option>
                <option value="80-89">جيد جداً (80 - 89)</option>
                <option value="70-79">جيد (70 - 79)</option>
                <option value="60-69">مقبول (60 - 69)</option>
                <option value="under-60">ضعيف (أقل من 60)</option>
              </select>

              {/* Manual HR Evaluation filter */}
              <select
                value={manualEvalFilter}
                onChange={(e) => setManualEvalFilter(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none text-xs bg-white font-semibold"
              >
                <option value="all">كل المراجعات اليدوية</option>
                <option value="evaluated">تم تقييمها يدوياً</option>
                <option value="pending_evaluation">بانتظار التقييم اليدوي</option>
              </select>

              {/* Sort selector */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none text-xs bg-white font-semibold"
              >
                <option value="date">ترتيب حسب: تاريخ التقديم</option>
                <option value="experience">ترتيب حسب: سنوات الخبرة</option>
                <option value="score">ترتيب حسب: التقييم الفني الذكي</option>
                <option value="hr_score">ترتيب حسب: التقييم اليدوي</option>
              </select>

            </div>
          </div>

          {/* Table list panel card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden" id="applicants-table-card">
            {loading ? (
              <div className="p-20 text-center flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
                <span className="text-slate-500 text-sm font-semibold">جاري جلب وفهرسة الطلبات وقرارات المراجعة...</span>
              </div>
            ) : applicants.length === 0 ? (
              <div className="p-20 text-center flex flex-col items-center justify-center gap-3 text-slate-400">
                <AlertCircle className="w-12 h-12 text-slate-300" />
                <span className="text-sm font-bold">لا يوجد أي طلبات متقدمين تطابق معايير البحث والتصفية المحددة حالياً.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs md:text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold border-b border-slate-800">
                      <th className="p-4">رقم الطلب</th>
                      <th className="p-4">اسم المتقدم</th>
                      <th className="p-4">الجوال</th>
                      <th className="p-4 text-center">الخبرة (سنة)</th>
                      <th className="p-4 text-center">التقييم اليدوي</th>
                      <th className="p-4 text-center">الدرجة الذكية</th>
                      <th className="p-4 text-center">التوصية التلقائية</th>
                      <th className="p-4 text-center">الحالة</th>
                      <th className="p-4">تاريخ التقديم</th>
                      <th className="p-4 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {applicants.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-bold font-mono text-slate-500">{a.id}</td>
                        <td className="p-4 font-bold text-slate-950">{a.personalInfo.fullName}</td>
                        <td className="p-4 font-mono ltr text-right">{a.personalInfo.phone}</td>
                        <td className="p-4 text-center font-bold text-slate-700">{a.personalInfo.experienceYears}</td>
                        <td className="p-4 text-center">
                          {a.hrEvaluation ? (
                            <span className={`font-mono font-black text-sm px-2.5 py-1 rounded-lg ${
                              a.hrEvaluation.finalScore >= 90 ? 'text-emerald-600 bg-emerald-50 border border-emerald-100' :
                              a.hrEvaluation.finalScore >= 80 ? 'text-teal-600 bg-teal-50 border border-teal-100' :
                              a.hrEvaluation.finalScore >= 70 ? 'text-orange-600 bg-orange-50 border border-orange-100' :
                              'text-rose-600 bg-rose-50 border border-rose-100'
                            }`}>
                              {a.hrEvaluation.finalScore} / 100
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs font-semibold">غير مقيم ⏳</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`font-mono font-black text-sm px-2.5 py-1 rounded-lg ${
                            (a.aiEvaluation?.score || 0) >= 80 ? 'text-emerald-600 bg-emerald-50' :
                            (a.aiEvaluation?.score || 0) >= 60 ? 'text-orange-600 bg-orange-50' :
                            'text-rose-600 bg-rose-50'
                          }`}>
                            {a.aiEvaluation?.score || '-'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {a.aiEvaluation ? getRecBadge(a.aiEvaluation.recommendation) : '-'}
                        </td>
                        <td className="p-4 text-center">
                          {getStatusBadge(a.status)}
                        </td>
                        <td className="p-4 text-slate-500 font-semibold">{new Date(a.createdAt).toLocaleDateString('ar-SA')}</td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1.5">
                            
                            {/* View btn */}
                            <button
                              onClick={() => handleSelectApplicant(a, false)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-lg transition-all"
                              title="عرض التفاصيل الكاملة"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Edit btn */}
                            <button
                              onClick={() => handleSelectApplicant(a, true)}
                              className="bg-orange-500/10 hover:bg-orange-500 text-orange-600 hover:text-white p-2 rounded-lg transition-all"
                              title="مراجعة وتقييم وتعديل الحالة"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Delete btn */}
                            <button
                              onClick={() => handleDeleteApplicant(a.id, a.personalInfo.fullName)}
                              className="bg-red-50 hover:bg-red-500 text-red-500 hover:text-white p-2 rounded-lg transition-all"
                              title="حذف هذا الطلب نهائياً"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
            </>
          )}

          {activeSubTab === 'schedules' && (
            <div className="space-y-8 animate-fade-in" id="schedules-view-tab">
              {/* Smart Automatic Scheduling and Google Meet Integration Card */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white p-6 md:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                  <div className="text-right">
                    <h3 className="font-extrabold text-lg flex items-center gap-2 text-indigo-400 justify-start md:justify-start">
                      <Settings className="w-6 h-6 text-indigo-400" />
                      <span>نظام الجدولة الذكية وأتمتة المقابلات (Google Meet API)</span>
                    </h3>
                    <p className="text-slate-400 text-xs mt-1">
                      قم بجدولة المقابلات وتوليد روابط Google Meet حقيقية وموثوقة لجميع المرشحين المؤهلين تلقائياً بضغطة زر واحدة.
                    </p>
                  </div>
                  
                  {/* Google Connection Status */}
                  <div className="flex items-center gap-3 bg-slate-800/40 p-3 rounded-2xl border border-slate-800/50 self-start md:self-auto">
                    {googleUser ? (
                      <div className="flex items-center gap-3 text-right">
                        {googleUser.photoURL ? (
                          <img src={googleUser.photoURL} alt={googleUser.displayName || ''} className="w-8 h-8 rounded-full border border-indigo-400" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-xs">
                            {googleUser.displayName?.charAt(0) || 'G'}
                          </div>
                        )}
                        <div>
                          <span className="text-[10px] text-emerald-400 font-bold block">✓ متصل بـ Google</span>
                          <span className="text-xs font-bold text-slate-200 block max-w-[150px] truncate">{googleUser.displayName || googleUser.email}</span>
                        </div>
                        <button
                          onClick={handleGoogleDisconnect}
                          className="text-[10px] font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1.5 rounded-lg transition-all border border-rose-500/20 cursor-pointer"
                        >
                          قطع الاتصال
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <span className="text-xs font-semibold text-slate-300 text-center sm:text-right">حساب Google غير مرتبط حالياً:</span>
                        <button
                          onClick={handleGoogleConnect}
                          disabled={isConnectingGoogle}
                          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer border border-indigo-500"
                        >
                          {isConnectingGoogle ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>جاري الاتصال...</span>
                            </>
                          ) : (
                            <>
                              <Video className="w-3.5 h-3.5" />
                              <span>ربط حساب Google (Meet)</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Configuration Parameters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-right">
                  {/* From Date */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 block">من تاريخ:</label>
                    <input
                      type="date"
                      value={autoFromDate}
                      onChange={(e) => setAutoFromDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 font-bold outline-none focus:border-indigo-500 transition-all font-mono"
                    />
                  </div>

                  {/* To Date */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 block">إلى تاريخ:</label>
                    <input
                      type="date"
                      value={autoToDate}
                      onChange={(e) => setAutoToDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 font-bold outline-none focus:border-indigo-500 transition-all font-mono"
                    />
                  </div>

                  {/* Start Time */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 block">بداية الدوام اليومي:</label>
                    <input
                      type="time"
                      value={autoStartTime}
                      onChange={(e) => setAutoStartTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 font-bold outline-none focus:border-indigo-500 transition-all font-mono"
                    />
                  </div>

                  {/* End Time */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 block">نهاية الدوام اليومي:</label>
                    <input
                      type="time"
                      value={autoEndTime}
                      onChange={(e) => setAutoEndTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 font-bold outline-none focus:border-indigo-500 transition-all font-mono"
                    />
                  </div>

                  {/* Interview Duration */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 block">مدة المقابلة (بالدقائق):</label>
                    <input
                      type="number"
                      value={autoDuration}
                      onChange={(e) => setAutoDuration(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 font-bold outline-none focus:border-indigo-500 transition-all font-mono"
                      min="5"
                      max="120"
                    />
                  </div>

                  {/* Break Duration */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 block">فترة الاستراحة (بالدقائق):</label>
                    <input
                      type="number"
                      value={autoBreak}
                      onChange={(e) => setAutoBreak(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 font-bold outline-none focus:border-indigo-500 transition-all font-mono"
                      min="0"
                      max="60"
                    />
                  </div>
                </div>

                {/* Trigger and Status */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-slate-800">
                  <div className="text-right text-xs text-slate-400">
                    <span>عدد المرشحين بانتظار الترتيب تلقائياً: </span>
                    <span className="text-orange-400 font-black font-mono">
                      {applicants.filter(a => !a.interviewSchedule).length} مرشحاً
                    </span>
                  </div>

                  <button
                    onClick={handleAutoSchedule}
                    disabled={isSchedulingAuto || applicants.filter(a => !a.interviewSchedule).length === 0}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs px-6 py-3.5 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-950/20 self-end cursor-pointer"
                  >
                    {isSchedulingAuto ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>جاري ترتيب الجدولة وتوليد الغرف تلقائياً...</span>
                      </>
                    ) : (
                      <>
                        <Settings className="w-4 h-4" />
                        <span>تشغيل المحرك والجدولة التلقائية الآن 🚀</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Results Log Display */}
                {autoScheduleResults && (
                  <div className="bg-slate-950/80 rounded-2xl border border-slate-800/80 p-5 space-y-3 max-h-[300px] overflow-y-auto text-right">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <button
                        onClick={() => setAutoScheduleResults(null)}
                        className="text-[10px] font-bold text-slate-400 hover:text-slate-200"
                      >
                        إغلاق السجل
                      </button>
                      <h4 className="font-extrabold text-sm text-indigo-400">📊 نتائج الجدولة التلقائية الذكية:</h4>
                    </div>
                    <div className="text-xs text-slate-300 font-semibold flex items-center gap-4">
                      <span>الجدولة الناجحة: <span className="text-emerald-400 font-black">{autoScheduleResults.successCount}</span></span>
                      <span>العمليات الفاشلة: <span className="text-rose-400 font-black">{autoScheduleResults.failedCount}</span></span>
                    </div>
                    <div className="space-y-1.5 font-mono text-[10px] divide-y divide-slate-900 pt-2 text-slate-400">
                      {autoScheduleResults.details.map((log, i) => (
                        <div key={i} className="py-1">{log}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Scheduling Form and Info Box Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Info and stats column */}
                <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="font-extrabold text-base flex items-center gap-2 text-orange-400 text-right">
                      <Calendar className="w-5 h-5 text-orange-400" />
                      <span>ترتيب المواعيد والمقابلات</span>
                    </h3>
                    <p className="text-slate-300 text-xs leading-relaxed text-right">
                      تتيح لك هذه الصفحة المبتكرة ترتيب وتنظيم مواعيد المقابلات الشخصية للمرشحين وإرسال دعوات رسمية واحترافية عبر واتساب مباشرة بنقرة زر واحدة.
                    </p>
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800 space-y-1 text-xs text-right">
                      <p className="text-slate-400 font-bold">💡 آلية الجدولة السهلة:</p>
                      <ul className="list-disc list-inside space-y-1.5 text-slate-300 pr-2">
                        <li>اختر المتقدم من القائمة المنسدلة.</li>
                        <li>حدد اليوم، التاريخ، والوقت المناسب للمقابلة.</li>
                        <li>اضغط "حفظ الموعد" لاعتماده وحفظه بالنظام.</li>
                        <li>اضغط "إرسال الدعوة عبر واتساب" للتواصل التلقائي.</li>
                      </ul>
                    </div>
                  </div>

                  {/* Interview statistics */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/80">
                    <div className="bg-slate-800/40 p-3 rounded-2xl text-right">
                      <span className="text-slate-400 text-[10px] font-bold block mb-1">المقابلات المرتبة</span>
                      <span className="text-xl font-black text-emerald-400 font-mono">
                        {applicants.filter(a => a.interviewSchedule).length}
                      </span>
                    </div>
                    <div className="bg-slate-800/40 p-3 rounded-2xl text-right">
                      <span className="text-slate-400 text-[10px] font-bold block mb-1">بانتظار الترتيب</span>
                      <span className="text-xl font-black text-orange-400 font-mono">
                        {applicants.filter(a => !a.interviewSchedule).length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Scheduling Engine Form */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
                  <h3 className="font-extrabold text-slate-900 flex items-center gap-2 text-base text-right">
                    <Edit3 className="text-orange-500 w-5 h-5" />
                    <span>تحديد موعد جديد أو تعديل موعد قائم</span>
                  </h3>

                  <div className="space-y-4">
                    {/* Dropdown to pick applicant */}
                    <div className="space-y-1 text-right">
                      <label className="text-slate-700 text-xs font-bold block">1. اختر المتقدم لترتيب موعده:</label>
                      <select
                        value={schedulingApplicant?.id || ''}
                        onChange={(e) => {
                          const app = applicants.find(a => a.id === e.target.value);
                          if (app) {
                            setSchedulingApplicant(app);
                            setScheduleName(app.personalInfo.fullName);
                            setScheduleDate(app.interviewSchedule?.date || '');
                            setScheduleTime(app.interviewSchedule?.time || '');
                            setScheduleType(app.interviewSchedule?.type || 'remote');
                            setScheduleMeetingLink(app.interviewSchedule?.meetingLink || defaultMeetingLink);
                          } else {
                            setSchedulingApplicant(null);
                            setScheduleName('');
                            setScheduleDate('');
                            setScheduleTime('');
                            setScheduleType('remote');
                            setScheduleMeetingLink('');
                          }
                        }}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none text-xs bg-white font-semibold"
                      >
                        <option value="">-- اضغط هنا لاختيار المتقدم --</option>
                        {applicants
                          .filter(a => !a.interviewSchedule || a.id === schedulingApplicant?.id)
                          .map(a => (
                            <option key={a.id} value={a.id}>
                              {a.personalInfo.fullName} (رقم الطلب: {a.id} {a.interviewSchedule ? ' - مجدول مسبقاً 🗓️' : ''})
                            </option>
                          ))}
                      </select>
                    </div>

                    {schedulingApplicant && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                          {/* Name Input */}
                          <div className="space-y-1 text-right">
                            <label className="text-slate-700 text-xs font-bold block">اسم المتقدم للمقابلة:</label>
                            <input
                              type="text"
                              value={scheduleName}
                              onChange={(e) => setScheduleName(e.target.value)}
                              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none text-xs font-semibold"
                              placeholder="الاسم الكامل"
                            />
                          </div>

                          {/* Date Input */}
                          <div className="space-y-1 text-right">
                            <label className="text-slate-700 text-xs font-bold block">تاريخ المقابلة:</label>
                            <input
                              type="date"
                              value={scheduleDate}
                              onChange={(e) => setScheduleDate(e.target.value)}
                              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none text-xs font-semibold"
                            />
                          </div>

                          {/* Time Input */}
                          <div className="space-y-1 text-right">
                            <label className="text-slate-700 text-xs font-bold block">وقت المقابلة:</label>
                            <input
                              type="time"
                              value={scheduleTime}
                              onChange={(e) => setScheduleTime(e.target.value)}
                              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none text-xs font-semibold"
                            />
                          </div>
                        </div>

                        {/* Meeting Link Input */}
                        <div className="space-y-1 text-right">
                          <label className="text-slate-700 text-xs font-bold block flex items-center gap-1.5 justify-end">
                            <span>رابط القاعة الافتراضية لهذه المقابلة (أو استخدم الرابط المشترك):</span>
                            <Video className="w-3.5 h-3.5 text-orange-500" />
                          </label>
                          <input
                            type="url"
                            value={scheduleMeetingLink}
                            onChange={(e) => setScheduleMeetingLink(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none text-xs font-semibold font-mono text-left bg-slate-50 focus:bg-white focus:border-orange-500 transition-all"
                            placeholder="https://meet.google.com/... or Zoom link"
                          />
                          <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                            💡 يتم تعبئة هذا الحقل تلقائياً برابط القاعة الافتراضي المشترك، وبإمكانك تعديله أو تخصيصه لهذا المرشح على حدة إذا لزم الأمر.
                          </p>
                        </div>
                      </div>
                    )}

                    {schedulingApplicant && (
                      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            setSchedulingApplicant(null);
                            setScheduleName('');
                            setScheduleDate('');
                            setScheduleTime('');
                            setScheduleMeetingLink('');
                          }}
                          className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 text-xs rounded-xl transition-all"
                        >
                          إلغاء التحديد
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => handleSaveSchedule(schedulingApplicant, scheduleName, scheduleDate, scheduleTime, scheduleType, scheduleMeetingLink)}
                          disabled={!scheduleDate || !scheduleTime || !scheduleName}
                          className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-5 py-2.5 text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md"
                        >
                          <Save className="w-4 h-4" />
                          <span>حفظ الموعد بالنظام 💾</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSendWhatsApp(schedulingApplicant, scheduleName, scheduleDate, scheduleTime, scheduleType, scheduleMeetingLink)}
                          disabled={!scheduleDate || !scheduleTime || !scheduleName}
                          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-5 py-2.5 text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/10"
                        >
                          💬 إرسال رابط واتساب الهجين
                        </button>
                      </div>
                    )}

                    {!schedulingApplicant && (
                      <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2">
                        <Calendar className="w-8 h-8 text-slate-300" />
                        <span>يرجى اختيار أحد المتقدمين من القائمة المنسدلة أعلاه لبدء جدولة موعد المقابلة وإصدار دعوة الواتساب.</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Scheduled List Table */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-right">
                    <h3 className="font-extrabold text-slate-900 text-base mb-1">جدول المقابلات المرتبة والمواعيد القائمة</h3>
                    <p className="text-slate-500 text-xs font-semibold">قائمة بجميع المرشحين الذين تم جدولة مواعيد مقابلاتهم الشخصية عن بعد، مرتبة من الأقرب إلى الأبعد.</p>
                  </div>
                </div>

                {/* Bulk Actions Banner */}
                {selectedSchedules.length > 0 && (
                  <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-200/60 rounded-2xl p-4 mb-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in text-right animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="bg-orange-500 text-white p-2.5 rounded-2xl shadow-md shadow-orange-500/10">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-sm">تم تحديد ({selectedSchedules.length}) من مواعيد المقابلات</h4>
                        <p className="text-slate-500 text-[10px] font-bold">بإمكانك إلغاء هذه المواعيد دفعة واحدة لإعادتها فوراً إلى قائمة الانتظار والجدولة التلقائية.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm(`هل أنت متأكد من إلغاء وحذف مواعيد المقابلات لعدد (${selectedSchedules.length}) من المتقدمين المحددين وإعادتهم للجدولة؟`)) {
                            setIsBulkCancelling(true);
                            try {
                              let successCount = 0;
                              for (const id of selectedSchedules) {
                                const res = await fetch(`/api/admin/applicants/${id}/review`, {
                                  method: 'PATCH',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${adminToken}`
                                  },
                                  body: JSON.stringify({
                                    status: 'reviewing',
                                    interviewSchedule: null
                                  })
                                });
                                if (res.ok) successCount++;
                              }
                              alert(`تم إلغاء عدد (${successCount}) من المواعيد المحددة بنجاح وإعادتها لقائمة الجدولة.`);
                              setSelectedSchedules([]);
                              setRefreshTrigger(prev => prev + 1);
                            } catch (err) {
                              console.error(err);
                              alert("حدث خطأ أثناء إلغاء المواعيد.");
                            } finally {
                              setIsBulkCancelling(false);
                            }
                          }
                        }}
                        disabled={isBulkCancelling}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-red-600/15 transition-all cursor-pointer w-full sm:w-auto justify-center"
                      >
                        {isBulkCancelling ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            <span>جاري إلغاء المواعيد...</span>
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 text-white" />
                            <span>إلغاء المواعيد المحددة وإعادة جدولة 🔄</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedSchedules([])}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer whitespace-nowrap"
                      >
                        إلغاء التحديد
                      </button>
                    </div>
                  </div>
                )}

                {applicants.filter(a => a.interviewSchedule).length === 0 ? (
                  <div className="p-20 text-center flex flex-col items-center justify-center gap-3 text-slate-400">
                    <AlertCircle className="w-12 h-12 text-slate-300" />
                    <span className="text-sm font-bold">لم يتم ترتيب أو جدولة أي مقابلة شخصية حتى الآن.</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs md:text-sm border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-white font-bold border-b border-slate-800">
                          <th className="p-4 text-center w-12">
                            <input
                              type="checkbox"
                              checked={
                                applicants.filter(a => a.interviewSchedule).length > 0 &&
                                applicants.filter(a => a.interviewSchedule).every(a => selectedSchedules.includes(a.id))
                              }
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSchedules(applicants.filter(a => a.interviewSchedule).map(a => a.id));
                                } else {
                                  setSelectedSchedules([]);
                                }
                              }}
                              className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                            />
                          </th>
                          <th className="p-4">اسم المتقدم</th>
                          <th className="p-4">رقم الطلب</th>
                          <th className="p-4">تاريخ المقابلة</th>
                          <th className="p-4 text-center">الوقت المحدد</th>
                          <th className="p-4 text-center">نوع المقابلة</th>
                          <th className="p-4">الجوال</th>
                          <th className="p-4 text-center">رابط واتساب الهجين</th>
                          <th className="p-4 text-center">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {applicants
                          .filter(a => a.interviewSchedule)
                          .sort((a, b) => {
                            const dateA = new Date(`${a.interviewSchedule!.date}T${a.interviewSchedule!.time || '00:00'}`);
                            const dateB = new Date(`${b.interviewSchedule!.date}T${b.interviewSchedule!.time || '00:00'}`);
                            return dateA.getTime() - dateB.getTime(); // Nearest/upcoming first
                          })
                          .map((a) => {
                            const sched = a.interviewSchedule!;
                            const arabDate = new Date(sched.date).toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                            return (
                              <tr key={a.id} className={`hover:bg-slate-50/80 transition-colors ${selectedSchedules.includes(a.id) ? 'bg-orange-50/30' : ''}`}>
                                <td className="p-4 text-center">
                                  <input
                                    type="checkbox"
                                    checked={selectedSchedules.includes(a.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedSchedules(prev => [...prev, a.id]);
                                      } else {
                                        setSelectedSchedules(prev => prev.filter(id => id !== a.id));
                                      }
                                    }}
                                    className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                                  />
                                </td>
                                <td className="p-4 font-bold text-slate-950">{a.personalInfo.fullName}</td>
                                <td className="p-4 font-bold font-mono text-slate-500">{a.id}</td>
                                <td className="p-4 text-slate-700 font-bold">{arabDate}</td>
                                <td className="p-4 text-center text-slate-900 font-black font-mono bg-orange-500/5">{sched.time}</td>
                                <td className="p-4 text-center">
                                  <div className="flex flex-col items-center justify-center gap-1">
                                    <span className="bg-indigo-50 text-indigo-700 text-[10px] px-2.5 py-1 rounded-full font-bold">
                                      مقابلة عن بعد 💻
                                    </span>
                                    {sched.meetingLink ? (
                                      <a
                                        href={sched.meetingLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`text-emerald-600 hover:text-emerald-700 hover:underline text-[10px] font-bold flex items-center gap-0.5 font-mono ${sched.meetingLink.includes('abc-') ? 'text-amber-600 hover:text-amber-700' : ''}`}
                                        title={sched.meetingLink}
                                      >
                                        <Video className={`w-3 h-3 inline ${sched.meetingLink.includes('abc-') ? 'text-amber-500 animate-pulse' : 'text-emerald-500'}`} />
                                        <span>{sched.meetingLink.includes('abc-') ? 'رابط مؤقت (abc-)' : 'رابط القاعة 📹'}</span>
                                      </a>
                                    ) : (
                                      <span className="text-slate-400 text-[10px]">لا يوجد رابط</span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-4 font-mono ltr text-right text-slate-600">{a.personalInfo.phone}</td>
                                <td className="p-4 text-center">
                                  <button
                                    onClick={() => handleSendWhatsApp(a, a.personalInfo.fullName, sched.date, sched.time, sched.type)}
                                    className="bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white font-bold px-3 py-1.5 rounded-lg text-[10px] inline-flex items-center gap-1.5 transition-all shadow-sm"
                                    title="افتح محادثة واتساب مع دعوة المقابلة الجاهزة"
                                  >
                                    <span>💬 فتح واتساب</span>
                                  </button>
                                </td>
                                <td className="p-4 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      onClick={() => {
                                        setSchedulingApplicant(a);
                                        setScheduleName(a.personalInfo.fullName);
                                        setScheduleDate(sched.date);
                                        setScheduleTime(sched.time);
                                        setScheduleType(sched.type || 'remote');
                                        setScheduleMeetingLink(sched.meetingLink || defaultMeetingLink);
                                        // Scroll smoothly to form
                                        window.scrollTo({ top: 400, behavior: 'smooth' });
                                      }}
                                      className="bg-orange-50 hover:bg-orange-500 text-orange-600 hover:text-white p-2 rounded-lg transition-all"
                                      title="تعديل تفاصيل الموعد"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={async () => {
                                        if (confirm("هل أنت متأكد من إلغاء وحذف موعد المقابلة لهذا المتقدم من الجدول؟")) {
                                          try {
                                            const res = await fetch(`/api/admin/applicants/${a.id}/review`, {
                                              method: 'PATCH',
                                              headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${adminToken}`
                                              },
                                              body: JSON.stringify({
                                                status: 'reviewing',
                                                interviewSchedule: null
                                              })
                                            });
                                            if (res.ok) {
                                              alert("تم إلغاء الموعد بنجاح.");
                                              setRefreshTrigger(prev => prev + 1);
                                              if (schedulingApplicant?.id === a.id) {
                                                setSchedulingApplicant(null);
                                              }
                                            }
                                          } catch (err) {
                                            console.error(err);
                                          }
                                        }
                                      }}
                                      className="bg-red-50 hover:bg-red-500 text-red-500 hover:text-white p-2 rounded-lg transition-all"
                                      title="إلغاء الموعد"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSubTab === 'announcements' && (
            <div className="space-y-8 animate-fade-in text-right" id="announcements-view-tab">
              {/* Settings Job Role Selector */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <Settings className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm">إعدادات الإعلان والقوالب</h4>
                    <p className="text-[10px] text-slate-500">اختر الوظيفة التي تريد تعديل إعداداتها</p>
                  </div>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setSettingsJobRole('hse')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      settingsJobRole === 'hse'
                        ? 'bg-white text-orange-600 shadow-sm border border-slate-200'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    أخصائي صحة وسلامة وبيئة (HSE)
                  </button>
                  <button
                    onClick={() => setSettingsJobRole('marketing')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      settingsJobRole === 'marketing'
                        ? 'bg-white text-orange-600 shadow-sm border border-slate-200'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    أخصائي تسويق (Marketing)
                  </button>
                </div>
              </div>

              {/* Top Banner */}
              <div className="bg-gradient-to-l from-slate-900 via-slate-850 to-slate-900 text-white p-6 md:p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -z-10"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -z-10"></div>
                
                <div className="max-w-3xl space-y-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    نشر عام لجميع المجموعات والمنصات (مخصصة بالكامل)
                  </span>
                  <h3 className="text-xl md:text-2xl font-black text-white">تعديل ونشر الإعلان الوظيفي لعامة الناس</h3>
                  <p className="text-slate-300 text-xs md:text-sm leading-relaxed font-light">
                    هنا يمكنك صياغة وتعديل الإعلان الموجه لعامة الناس للتقديم على الوظيفة. قمنا بتنسيق الإعلان بشكل احترافي للغاية ليتناسب مع النشر المباشر عبر مجموعات الواتساب ومواقع التواصل، ويمكنك الآن تعديل المسمى الوظيفي، الراتب، الساعات، الرقم المعتمد، وتاريخ الإعلان ليعكس أي تحديثات فوراً في النص المنسق والجاهز للمشاركة.
                  </p>
                </div>
              </div>

              {/* Layout Content */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Side: Customization & Actions (5 cols) */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                    <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 pb-3 border-b border-slate-100">
                      <Edit3 className="text-orange-500 w-4.5 h-4.5" />
                      <span>تخصيص روابط ومحتوى الإعلان</span>
                    </h4>

                    {/* App URL Input */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">رابط بوابة التقديم المباشر (سيتم تضمينه بالإعلان):</label>
                      <input
                        type="url"
                        value={announcementAppUrl}
                        onChange={(e) => setAnnouncementAppUrl(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none text-xs font-semibold font-mono text-left bg-slate-50 focus:bg-white focus:border-orange-500 transition-all"
                        placeholder="https://..."
                      />
                      <span className="text-[10px] text-slate-400 block mt-1 font-medium leading-relaxed">
                        * قمنا بربط البوابة بشكل تلقائي ليتجه المتقدم فوراً إلى نموذج التعبئة الذكي ورفع رخصة كوادر وسيرته الذاتية.
                      </span>
                    </div>

                    {/* Custom Editable Fields Form */}
                    <div className="space-y-4 border-t border-slate-100 pt-4">
                      <p className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-orange-600" />
                        <span>تعديل بيانات الإعلان الوظيفي المضمنة:</span>
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-right">
                        {/* Title */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 block">المسمى الوظيفي:</label>
                          <input
                            type="text"
                            value={announcementTitle}
                            onChange={(e) => setAnnouncementTitle(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-2.5 py-2 outline-none text-xs bg-slate-50 focus:bg-white focus:border-orange-500 font-bold text-slate-800"
                          />
                        </div>

                        {/* ID */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 block">رقم الإعلان الوظيفي:</label>
                          <input
                            type="text"
                            value={announcementId}
                            onChange={(e) => setAnnouncementId(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-2.5 py-2 outline-none text-xs bg-slate-50 focus:bg-white focus:border-orange-500 font-mono font-bold text-slate-800 text-left"
                          />
                        </div>

                        {/* Date */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 block">تاريخ الإعلان:</label>
                          <input
                            type="text"
                            value={announcementDate}
                            onChange={(e) => setAnnouncementDate(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-2.5 py-2 outline-none text-xs bg-slate-50 focus:bg-white focus:border-orange-500 font-semibold text-slate-800"
                          />
                        </div>

                        {/* Salary */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 block">الراتب شهرياً:</label>
                          <input
                            type="text"
                            value={announcementSalary}
                            onChange={(e) => setAnnouncementSalary(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-2.5 py-2 outline-none text-xs bg-slate-50 focus:bg-white focus:border-orange-500 font-semibold text-slate-800"
                          />
                        </div>

                        {/* Hours */}
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[11px] font-bold text-slate-600 block">ساعات العمل والأيام:</label>
                          <input
                            type="text"
                            value={announcementHours}
                            onChange={(e) => setAnnouncementHours(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-2.5 py-2 outline-none text-xs bg-slate-50 focus:bg-white focus:border-orange-500 font-semibold text-slate-800"
                          />
                        </div>

                        {/* Location */}
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[11px] font-bold text-slate-600 block">الموقع الجغرافي للعمل:</label>
                          <input
                            type="text"
                            value={announcementLocation}
                            onChange={(e) => setAnnouncementLocation(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-2.5 py-2 outline-none text-xs bg-slate-50 focus:bg-white focus:border-orange-500 font-semibold text-slate-800"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Save Settings Button */}
                    <div className="pt-3 border-t border-slate-100">
                      <button
                        onClick={() => {
                          try {
                            safeStorage.setItem(getStorageKey('announcementAppUrl', settingsJobRole), announcementAppUrl);
                            safeStorage.setItem(getStorageKey('announcementTitle', settingsJobRole), announcementTitle);
                            safeStorage.setItem(getStorageKey('announcementId', settingsJobRole), announcementId);
                            safeStorage.setItem(getStorageKey('announcementDate', settingsJobRole), announcementDate);
                            safeStorage.setItem(getStorageKey('announcementSalary', settingsJobRole), announcementSalary);
                            safeStorage.setItem(getStorageKey('announcementHours', settingsJobRole), announcementHours);
                            safeStorage.setItem(getStorageKey('announcementLocation', settingsJobRole), announcementLocation);
                            setSettingsSaved(true);
                            setTimeout(() => setSettingsSaved(false), 3000);
                          } catch (e) {
                            console.error('Failed to save announcement settings:', e);
                          }
                        }}
                        className={`w-full py-2.5 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98] border ${
                          settingsSaved
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-orange-500 hover:bg-orange-600 text-white border-transparent'
                        }`}
                      >
                        {settingsSaved ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-600 animate-bounce" />
                            <span>تم حفظ إعدادات الإعلان بنجاح! ✓</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 text-white animate-pulse" />
                            <span>حفظ إعدادات الإعلان الحالية 💾</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Actions Buttons */}
                    <div className="space-y-2.5 pt-2">
                      <button
                        onClick={() => {
                          const text = compileAnnouncementText();
                          navigator.clipboard.writeText(text);
                          setAnnouncementCopied(true);
                          setTimeout(() => setAnnouncementCopied(false), 3000);
                        }}
                        className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] ${
                          announcementCopied
                            ? 'bg-emerald-600 text-white shadow-emerald-600/10'
                            : 'bg-slate-900 hover:bg-slate-850 text-white shadow-slate-900/10'
                        }`}
                      >
                        {announcementCopied ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-300 animate-bounce" />
                            <span>تم نسخ الإعلان بنجاح! جاهز للصق الآن ✓</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 text-slate-300" />
                            <span>نسخ نص الإعلان المنسق للواتساب 📋</span>
                          </>
                        )}
                      </button>

                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(compileAnnouncementText())}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/10 active:scale-[0.98]"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>مشاركة الإعلان مباشرة عبر الواتساب 💬</span>
                      </a>
                    </div>
                  </div>

                  {/* Pro Tips Box */}
                  <div className="bg-amber-50 border-r-4 border-amber-500 p-4 rounded-2xl text-xs space-y-1.5 text-amber-950">
                    <p className="font-bold flex items-center gap-1">
                      <span>💡 نصائح ذهبية لنشر فعال:</span>
                    </p>
                    <ul className="list-disc list-inside space-y-1 pr-1 font-semibold text-right">
                      <li>انشر الرابط في مجموعات واتساب المخصصة لمهندسي السلامة والـ HSE في السعودية.</li>
                      <li>يمكنك نسخ النص ونشره عبر منصة LinkedIn المهنية للوصول إلى كوادر ذات خبرة سنتين أو أكثر.</li>
                      <li>تأكد من بقاء رقم الإعلان ثابتاً ليتم مطابقته لاحقاً بنظام جدارات ومنصات الموارد البشرية.</li>
                    </ul>
                  </div>
                </div>

                {/* Right Side: Mockup WhatsApp Preview (7 cols) */}
                <div className="lg:col-span-7">
                  <div className="bg-[#efeae2] rounded-3xl border border-slate-250 shadow-lg overflow-hidden flex flex-col h-[580px]">
                    {/* WhatsApp Mockup Header */}
                    <div className="bg-[#075e54] text-white p-3 px-4 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-[#075e54] font-bold text-xs shadow-sm">
                          HSE
                        </div>
                        <div className="text-right">
                          <h5 className="text-xs font-bold text-white">مصنع جدة للدهانات - التوظيف</h5>
                          <span className="text-[10px] text-emerald-100 block">نشط الآن</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-slate-100">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded-full">معاينة البث</span>
                      </div>
                    </div>

                    {/* WhatsApp Messages Content */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat bg-center">
                      
                      {/* WhatsApp Speech Bubble */}
                      <div className="max-w-[85%] bg-[#dcf8c6] rounded-2xl rounded-tr-none p-3.5 shadow-sm text-slate-800 space-y-2 text-[11px] leading-relaxed mr-auto relative text-right">
                        <div className="whitespace-pre-wrap">
                          {compileAnnouncementText()}
                        </div>

                        <div className="text-[9px] text-slate-400 text-left font-mono mt-1">
                          {new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })} ✓✓
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'templates' && (
            <div className="space-y-8 animate-fade-in text-right" id="templates-view-tab">
              {/* Settings Job Role Selector */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <Settings className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm">إعدادات الإعلان والقوالب</h4>
                    <p className="text-[10px] text-slate-500">اختر الوظيفة التي تريد تعديل إعداداتها</p>
                  </div>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setSettingsJobRole('hse')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      settingsJobRole === 'hse'
                        ? 'bg-white text-orange-600 shadow-sm border border-slate-200'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    أخصائي صحة وسلامة وبيئة (HSE)
                  </button>
                  <button
                    onClick={() => setSettingsJobRole('marketing')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      settingsJobRole === 'marketing'
                        ? 'bg-white text-orange-600 shadow-sm border border-slate-200'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    أخصائي تسويق (Marketing)
                  </button>
                </div>
              </div>

              {/* Top Banner */}
              <div className="bg-gradient-to-l from-slate-900 via-slate-850 to-slate-900 text-white p-6 md:p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -z-10"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -z-10"></div>
                
                <div className="max-w-3xl space-y-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Settings className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                    التحكم الكامل والربط التلقائي عبر الواتساب
                  </span>
                  <h3 className="text-xl md:text-2xl font-black text-white">صياغة وتعديل قوالب رسائل الواتساب الذكية 💬</h3>
                  <p className="text-slate-300 text-xs md:text-sm leading-relaxed font-light">
                    بإمكانك هنا صياغة القوالب الموحدة التي تظهر تلقائياً عند النقر على خيارات إرسال الواتساب للمرشحين. استخدم الرموز البرمجية (الأكواد المحجوزة) مثل <code className="bg-slate-800 text-orange-400 px-1 py-0.5 rounded font-mono text-xs font-bold">{`{NAME}`}</code> أو <code className="bg-slate-800 text-orange-400 px-1 py-0.5 rounded font-mono text-xs font-bold">{`{DATE}`}</code> ليقوم النظام تلقائياً باستبدالها بالبيانات الفعلية لكل مرشح عند إنشاء رابط محادثة الواتساب.
                  </p>
                </div>
              </div>

              {/* Layout Content */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Inputs Columns */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                    <h4 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
                      <Settings className="w-4 h-4 text-orange-500" />
                      تخصيص قوالب الرسائل الجاهزة
                    </h4>

                    {/* Placeholder Helper tags block */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                      <span className="text-xs font-bold text-slate-700 block">الرموز التلقائية المتاحة للاستخدام في النص:</span>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {[
                          { tag: '{TITLE}', label: 'اللقب (أستاذ/أستاذة)' },
                          { tag: '{NAME}', label: 'اسم المرشح' },
                          { tag: '{JOB}', label: 'المسمى الوظيفي' },
                          { tag: '{ID}', label: 'رقم طلب التقديم' },
                          { tag: '{DATE}', label: 'تاريخ المقابلة' },
                          { tag: '{TIME}', label: 'وقت المقابلة' },
                          { tag: '{TYPE}', label: 'نوع المقابلة' },
                          { tag: '{LINK}', label: 'رابط البوابة الإلكترونية' }
                        ].map((t) => (
                          <button
                            key={t.tag}
                            onClick={() => {
                              navigator.clipboard.writeText(t.tag);
                              alert(`تم نسخ الرمز ${t.tag} للحافظة! يمكنك لصقه الآن في أي مكان بالنص.`);
                            }}
                            type="button"
                            className="bg-white hover:bg-orange-50 text-slate-700 hover:text-orange-600 border border-slate-200 hover:border-orange-200 px-2.5 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all flex items-center gap-1 shadow-sm"
                            title="انقر لنسخ الرمز واستخدامه في القالب"
                          >
                            <span className="text-orange-500 font-extrabold">{t.tag}</span>
                            <span className="text-slate-400">({t.label})</span>
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold pt-1">💡 انقر على أي رمز أعلاه لنسخه مباشرة ثم الصقه داخل الحقول أدناه.</p>
                    </div>

                    {/* Default Virtual Meeting Link Configuration */}
                    <div className="bg-orange-50/40 p-5 rounded-2xl border border-orange-100/80 space-y-2">
                      <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 justify-end">
                        <span>رابط قاعة المقابلات الافتراضية الموحد (المشترك):</span>
                        <Video className="w-4 h-4 text-orange-500" />
                      </label>
                      <input
                        type="url"
                        value={defaultMeetingLink}
                        onChange={(e) => {
                          setDefaultMeetingLink(e.target.value);
                          try {
                            safeStorage.setItem('defaultMeetingLink', e.target.value);
                          } catch {}
                        }}
                        className="w-full border border-orange-200/60 rounded-xl px-3 py-2.5 outline-none text-xs font-semibold font-mono text-left bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all shadow-sm"
                        placeholder="https://meet.google.com/abc-defg-hij"
                      />
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed text-right">
                        💡 هذا الرابط سيتم تعبئته تلقائياً كخيار افتراضي عند جدولة أي موعد مقابلة جديد، ليحل محل الرمز <span className="font-mono text-orange-600 font-bold">{'{LINK}'}</span> في نص رسالة الواتساب، مع بقاء الإمكانية لتغييره أو تخصيصه لكل مرشح بشكل منفصل أثناء الجدولة.
                      </p>
                    </div>

                    {/* Job Variable Parameters & ID Configuration */}
                    <div className="bg-indigo-50/40 p-5 rounded-3xl border border-indigo-100/70 space-y-4">
                      <div className="flex items-center justify-between border-b border-indigo-150 pb-2">
                        <span className="text-[10px] text-indigo-500 bg-indigo-100/70 px-2.5 py-0.5 rounded-full font-bold">تحديث فوري للمتغيرات النشطة</span>
                        <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                          <span>التحكم في قيم المتغيرات الوظيفية النشطة:</span>
                          <span className="text-indigo-500 font-bold">#</span>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-right">
                        {/* Title */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 block">المسمى الوظيفي {"{JOB}"}:</label>
                          <input
                            type="text"
                            value={announcementTitle}
                            onChange={(e) => {
                              setAnnouncementTitle(e.target.value);
                              try {
                                safeStorage.setItem(getStorageKey('announcementTitle', settingsJobRole), e.target.value);
                              } catch {}
                            }}
                            className="w-full border border-slate-200 rounded-xl px-2.5 py-2 outline-none text-xs bg-white focus:border-indigo-500 font-bold text-slate-850 shadow-sm"
                          />
                        </div>

                        {/* ID */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 block">رقم الإعلان الوظيفي {"{ID}"}:</label>
                          <input
                            type="text"
                            value={announcementId}
                            onChange={(e) => {
                              setAnnouncementId(e.target.value);
                              try {
                                safeStorage.setItem(getStorageKey('announcementId', settingsJobRole), e.target.value);
                              } catch {}
                            }}
                            className="w-full border border-slate-200 rounded-xl px-2.5 py-2 outline-none text-xs bg-white focus:border-indigo-500 font-mono font-bold text-slate-850 text-left shadow-sm"
                          />
                        </div>

                        {/* Date */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 block">تاريخ الإعلان {"{DATE}"}:</label>
                          <input
                            type="text"
                            value={announcementDate}
                            onChange={(e) => {
                              setAnnouncementDate(e.target.value);
                              try {
                                safeStorage.setItem(getStorageKey('announcementDate', settingsJobRole), e.target.value);
                              } catch {}
                            }}
                            className="w-full border border-slate-200 rounded-xl px-2.5 py-2 outline-none text-xs bg-white focus:border-indigo-500 font-semibold text-slate-850 shadow-sm"
                          />
                        </div>

                        {/* Location */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 block">مقر العمل {"{LOCATION}"}:</label>
                          <input
                            type="text"
                            value={announcementLocation}
                            onChange={(e) => {
                              setAnnouncementLocation(e.target.value);
                              try {
                                safeStorage.setItem(getStorageKey('announcementLocation', settingsJobRole), e.target.value);
                              } catch {}
                            }}
                            className="w-full border border-slate-200 rounded-xl px-2.5 py-2 outline-none text-xs bg-white focus:border-indigo-500 font-semibold text-slate-850 shadow-sm"
                          />
                        </div>

                        {/* Salary */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 block">الراتب شهرياً {"{SALARY}"}:</label>
                          <input
                            type="text"
                            value={announcementSalary}
                            onChange={(e) => {
                              setAnnouncementSalary(e.target.value);
                              try {
                                safeStorage.setItem(getStorageKey('announcementSalary', settingsJobRole), e.target.value);
                              } catch {}
                            }}
                            className="w-full border border-slate-200 rounded-xl px-2.5 py-2 outline-none text-xs bg-white focus:border-indigo-500 font-semibold text-slate-850 shadow-sm"
                          />
                        </div>

                        {/* Hours */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 block">ساعات العمل والأيام {"{HOURS}"}:</label>
                          <input
                            type="text"
                            value={announcementHours}
                            onChange={(e) => {
                              setAnnouncementHours(e.target.value);
                              try {
                                safeStorage.setItem(getStorageKey('announcementHours', settingsJobRole), e.target.value);
                              } catch {}
                            }}
                            className="w-full border border-slate-200 rounded-xl px-2.5 py-2 outline-none text-xs bg-white focus:border-indigo-500 font-semibold text-slate-850 shadow-sm"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed text-right pt-1">
                        💡 سيتم استبدال هذه المتغيرات فوراً في قوالب رسائل دعوة المقابلة والرفض والإعلان العام لتسريع عملية التواصل والتنسيق مع المرشحين.
                      </p>
                    </div>

                    {/* Template 1: Interview Invitation */}
                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-slate-800 flex items-center gap-2 justify-between">
                        <span>1. قالب رسالة دعوة المقابلة الشخصية (موحدة):</span>
                        <span className="text-[10px] text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">تحديث فوري لجميع المرشحين</span>
                      </label>
                      <textarea
                        value={interviewTemplate}
                        onChange={(e) => setInterviewTemplate(e.target.value)}
                        rows={10}
                        className="w-full border border-slate-200 rounded-2xl p-4 text-xs font-semibold focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none leading-relaxed text-slate-700 bg-slate-50/20"
                        placeholder="اكتب قالب رسالة دعوة المقابلة هنا..."
                      />
                    </div>

                    {/* Template 2: Rejection / Apology */}
                    <div className="space-y-2 pt-2">
                      <label className="text-xs font-extrabold text-slate-800 flex items-center gap-2 justify-between">
                        <span>2. قالب رسالة الاعتذار ورفض الطلب (موحدة):</span>
                        <span className="text-[10px] text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">للمرشحين غير المناسبين</span>
                      </label>
                      <textarea
                        value={rejectionTemplate}
                        onChange={(e) => setRejectionTemplate(e.target.value)}
                        rows={10}
                        className="w-full border border-slate-200 rounded-2xl p-4 text-xs font-semibold focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none leading-relaxed text-slate-700 bg-slate-50/20"
                        placeholder="اكتب قالب رسالة الاعتذار والرفض هنا..."
                      />
                    </div>

                    {/* Template 3: General Job Announcement */}
                    <div className="space-y-2 pt-2">
                      <label className="text-xs font-extrabold text-slate-800 flex items-center gap-2 justify-between">
                        <span>3. قالب الإعلان الوظيفي العام للواتساب:</span>
                        <span className="text-[10px] text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">للنشر العام والمجموعات</span>
                      </label>
                      <textarea
                        value={announcementTemplate}
                        onChange={(e) => setAnnouncementTemplate(e.target.value)}
                        rows={12}
                        className="w-full border border-slate-200 rounded-2xl p-4 text-xs font-semibold focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none leading-relaxed text-slate-700 bg-slate-50/20 font-mono"
                        placeholder="اكتب قالب الإعلان الوظيفي هنا..."
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => {
                          try {
                            safeStorage.setItem(getStorageKey('interviewTemplate', settingsJobRole), interviewTemplate);
                            safeStorage.setItem(getStorageKey('rejectionTemplate', settingsJobRole), rejectionTemplate);
                            safeStorage.setItem(getStorageKey('announcementTemplate', settingsJobRole), announcementTemplate);
                            safeStorage.setItem(getStorageKey('defaultMeetingLink', settingsJobRole), defaultMeetingLink);
                            safeStorage.setItem(getStorageKey('announcementTitle', settingsJobRole), announcementTitle);
                            safeStorage.setItem(getStorageKey('announcementId', settingsJobRole), announcementId);
                            safeStorage.setItem(getStorageKey('announcementDate', settingsJobRole), announcementDate);
                            safeStorage.setItem(getStorageKey('announcementSalary', settingsJobRole), announcementSalary);
                            safeStorage.setItem(getStorageKey('announcementHours', settingsJobRole), announcementHours);
                            safeStorage.setItem(getStorageKey('announcementLocation', settingsJobRole), announcementLocation);
                            setTemplatesSaved(true);
                            setTimeout(() => setTemplatesSaved(false), 3000);
                          } catch (e) {
                            console.error(e);
                            alert('فشل حفظ القوالب، يرجى المحاولة لاحقاً.');
                          }
                        }}
                        className={`flex-1 py-3 px-6 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 border ${
                          templatesSaved
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-orange-500 hover:bg-orange-600 text-white border-transparent shadow-orange-500/10'
                        }`}
                      >
                        {templatesSaved ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-600 animate-bounce" />
                            <span>تم حفظ وتثبيت القوالب بنجاح! ✓</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 text-white" />
                            <span>حفظ قوالب رسائل الواتساب وتعميمها 💾</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('هل أنت متأكد من رغبتك في إعادة تعيين القوالب إلى الصيغة الرسمية الافتراضية؟')) {
                            safeStorage.removeItem(getStorageKey('interviewTemplate', settingsJobRole));
                            safeStorage.removeItem(getStorageKey('rejectionTemplate', settingsJobRole));
                            safeStorage.removeItem(getStorageKey('announcementTemplate', settingsJobRole));
                            setInterviewTemplate(`السلام عليكم ورحمة الله وبركاته، {TITLE} {NAME} المحترم.

نفيدكم من إدارة الموارد البشرية بشركة مصنع جدة للدهانات والمعاجين، بأنه يسعدنا تحديد موعد المقابلة الشخصية معكم للوظيفة التالية:
المسمى الوظيفي: {JOB}
رقم الطلب: {ID}

اليوم والتاريخ: {DATE}
الوقت المحدد: في تمام الساعة {TIME}
رابط المقابلة: {LINK}

نرجو التكرم بالتواجد قبل موعد المقابلة بـ 15 دقيقة للتأكد من استقرار الاتصال والشبكة.

نسأل الله لكم التوفيق والنجاح.
إدارة الموارد البشرية
شركة مصنع جدة للدهانات والمعاجين`);
                            setRejectionTemplate(`السلام عليكم ورحمة الله وبركاته، {TITLE} {NAME} المحترم.

نشكر لكم تقديمكم واهتمامكم بالانضمام إلى شركة مصنع جدة للدهانات والمعاجين لوظيفة {JOB} ورقم الطلب {ID}.

يؤسفنا إبلاغكم بأنه تم اختيار مرشحين آخرين تتناسب مؤهلاتهم بشكل وثيق مع متطلبات الوظيفة الحالية. سنحتفظ بملفكم في قاعدة بياناتنا للتواصل معكم في حال توفر شواغر مستقبلية تناسب خبراتكم المميزة.

نتمنى لكم كل التوفيق في مسيرتكم المهنية.
إدارة الموارد البشرية
شركة مصنع جدة للدهانات والمعاجين`);
                            setAnnouncementTemplate(settingsJobRole === 'marketing' ? `إعلان وظيفي لعامة الناس - شركة مصنع جدة للدهانات والمعاجين

يسر إدارة الموارد البشرية بشركة مصنع جدة للدهانات والمعاجين الإعلان عن توفر فرصة وظيفية شاغرة ومتاحة للتقديم المباشر لجميع المواطنين المؤهلين:

المسمى الوظيفي: {JOB}
رقم الإعلان الوظيفي: {ID}
تاريخ الإعلان: {DATE}

مقر العمل: {LOCATION}

الهدف الوظيفي:
تطوير وتنفيذ خطط تسويقية مبتكرة لتعزيز العلامة التجارية للمصنع، وإدارة الحملات الإعلانية، وتحليل السوق لزيادة المبيعات والوصول للعملاء المستهدفين.

المؤهلات والشروط المطلوبة:
1. درجة البكالوريوس في التسويق، إدارة الأعمال، أو تخصص ذي صلة.
2. خبرة عملية لا تقل عن سنتين (2) في مجال التسويق والمبيعات.
3. إجادة استخدام أدوات التسويق الرقمي ومنصات التواصل الاجتماعي.
4. القدرة على تحليل بيانات السوق وتقديم تقارير دورية.
5. مهارات تواصل ممتازة وكتابة إبداعية باللغتين العربية والإنجليزية.
6. يفضل تقديم السيرة الذاتية باللغة العربية.

المزايا وبيئة العمل الموفرة:
• الراتب شهرياً: {SALARY}
• ساعات العمل: {HOURS}
• إجازة سنوية مدفوعة الأجر طبقاً لنظام العمل السعودي (21 يوماً).

رابط التقديم المباشر وتعبئة الطلب:
{LINK}

للاستفسارات والتواصل المباشر عبر الواتساب:
https://wa.me/966537375580

نرحب بجميع الكفاءات الوطنية الطموحة للانضمام إلى فريق عملنا المتميز!` : `إعلان وظيفي لعامة الناس - شركة مصنع جدة للدهانات والمعاجين

يسر إدارة الموارد البشرية بشركة مصنع جدة للدهانات والمعاجين الإعلان عن توفر فرصة وظيفية شاغرة ومتاحة للتقديم المباشر لجميع المواطنين المؤهلين:

المسمى الوظيفي: {JOB}
رقم الإعلان الوظيفي: {ID}
تاريخ الإعلان: {DATE}

مقر العمل: {LOCATION}

الهدف الوظيفي:
الإشراف الشامل على صالات الإنتاج والمستودعات والتحكم في المخاطر الكيميائية وتطبيق نظام صارم للوقاية من الحريق وتأمين ممارسات العمل لضمان صفر حوادث وإصابات.

المؤهلات والشروط المطلوبة:
1. درجة البكالوريوس في الهندسة الكيميائية، هندسة السلامة، علوم البيئة، أو تخصص مماثل.
2. خبرة عملية لا تقل عن سنتين (2) في المصانع الكيميائية أو مصانع الطلاء والدهانات.
3. شهادة مهنية دولية معتمدة (مثل NEBOSH IGC أو OSHA 30-Hour المتقدمة).
4. معرفة قوية بمتطلبات السلامة العامة والحرائق الكيميائية وإدارة معايير ISO 45001.
5. مهارات تواصل ممتازة وكتابة التقارير باللغتين العربية والإنجليزية.
6. يفضل تقديم السيرة الذاتية باللغة العربية.
7. يفضل وجود ترخيص معتمد من منصة كوادر (سيطلب رفعه في نموذج التقديم إن وُجد).

المزايا وبيئة العمل الموفرة:
• الراتب شهرياً: {SALARY}
• ساعات العمل: {HOURS}
• إجازة سنوية مدفوعة الأجر طبقاً لنظام العمل السعودي (21 يوماً).

رابط التقديم المباشر وتعبئة الطلب:
{LINK}

للاستفسارات والتواصل المباشر عبر الواتساب:
https://wa.me/966537375580

نرحب بجميع الكفاءات الوطنية الطموحة للانضمام إلى فريق عملنا المتميز!`);
                          }
                        }}
                        type="button"
                        className="py-3 px-4 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-xl font-bold text-xs transition-all"
                      >
                        إعادة تعيين الافتراضي 🔄
                      </button>
                    </div>

                  </div>
                </div>

                {/* Live Preview column */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                    <h4 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
                      <Eye className="w-4 h-4 text-emerald-500" />
                      معاينة حية وتفاعلية للرسالة
                    </h4>
                    <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                      هذا العرض يوضح شكل الرسالة الفعلية التي ستنتج عند إرسالها لمرشح تجريبي يدعى (عبدالرحمن سالم باشنيني) ببيانات افتراضية.
                    </p>

                    {/* Interview Message Preview Box */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-500 block">معاينة: رسالة دعوة المقابلة الذكية 🗓️</span>
                      <div className="bg-[#e5ddd5] p-4 rounded-2xl relative overflow-hidden min-h-[150px] border border-slate-200 flex flex-col justify-end">
                        <div className="absolute inset-0 bg-[radial-gradient(#dfdcd6_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
                        <div className="max-w-[90%] bg-white rounded-2xl rounded-tr-none p-4 shadow-sm text-slate-850 space-y-2 text-[11px] leading-relaxed mr-auto relative text-right font-medium">
                          <div className="whitespace-pre-wrap">
                            {(() => {
                              const demoApplicant: any = {
                                id: '20260712001',
                                personalInfo: {
                                  fullName: 'عبدالرحمن سالم باشنيني',
                                  phone: '0599222345'
                                }
                              };
                              let text = interviewTemplate;
                              text = text.replace(/{NAME}/g, demoApplicant.personalInfo.fullName);
                              text = text.replace(/{JOB}/g, announcementTitle || 'أخصائي صحة وسلامة وبيئة (HSE)');
                              text = text.replace(/{ID}/g, demoApplicant.id);
                              
                              const formattedDate = new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                              text = text.replace(/{DATE}/g, formattedDate);
                              text = text.replace(/{TIME}/g, '10:30 ص');
                              text = text.replace(/{TYPE}/g, 'عن بعد (عبر منصة Zoom)');
                              text = text.replace(/{LINK}/g, announcementAppUrl || window.location.origin);
                              return text;
                            })()}
                          </div>
                          <div className="text-[9px] text-slate-400 text-left font-mono mt-1.5">
                            {new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })} ✓✓
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Rejection Message Preview Box */}
                    <div className="space-y-2 pt-2">
                      <span className="text-[11px] font-bold text-slate-500 block">معاينة: رسالة الاعتذار والرفض الجاهزة ✉️</span>
                      <div className="bg-[#e5ddd5] p-4 rounded-2xl relative overflow-hidden min-h-[150px] border border-slate-200 flex flex-col justify-end">
                        <div className="absolute inset-0 bg-[radial-gradient(#dfdcd6_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
                        <div className="max-w-[90%] bg-white rounded-2xl rounded-tr-none p-4 shadow-sm text-slate-850 space-y-2 text-[11px] leading-relaxed mr-auto relative text-right font-medium">
                          <div className="whitespace-pre-wrap">
                            {(() => {
                              const demoApplicant: any = {
                                id: '20260712001',
                                personalInfo: {
                                  fullName: 'عبدالرحمن سالم باشنيني',
                                  phone: '0599222345'
                                }
                              };
                              let text = rejectionTemplate;
                              text = text.replace(/{NAME}/g, demoApplicant.personalInfo.fullName);
                              text = text.replace(/{JOB}/g, announcementTitle || 'أخصائي صحة وسلامة وبيئة (HSE)');
                              text = text.replace(/{ID}/g, demoApplicant.id);
                              text = text.replace(/{LINK}/g, announcementAppUrl || window.location.origin);
                              return text;
                            })()}
                          </div>
                          <div className="text-[9px] text-slate-400 text-left font-mono mt-1.5">
                            {new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })} ✓✓
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* General Job Announcement Preview Box */}
                    <div className="space-y-2 pt-2">
                      <span className="text-[11px] font-bold text-slate-500 block">معاينة: نص الإعلان الوظيفي العام للواتساب</span>
                      <div className="bg-[#e5ddd5] p-4 rounded-2xl relative overflow-hidden min-h-[250px] border border-slate-200 flex flex-col justify-end">
                        <div className="absolute inset-0 bg-[radial-gradient(#dfdcd6_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
                        <div className="max-w-[95%] bg-[#dcf8c6] rounded-2xl rounded-tr-none p-4 shadow-sm text-slate-850 space-y-2 text-[11px] leading-relaxed mr-auto relative text-right font-medium">
                          <div className="whitespace-pre-wrap">
                            {(() => {
                              let text = announcementTemplate;
                              text = text.replace(/{JOB}/g, announcementTitle || 'أخصائي صحة وسلامة وبيئة (HSE)');
                              text = text.replace(/{ID}/g, announcementId || '2026-HSE-01');
                              text = text.replace(/{DATE}/g, announcementDate || '12 يوليو 2026');
                              text = text.replace(/{LOCATION}/g, announcementLocation || 'جدة - المدينة الصناعية الثانية');
                              text = text.replace(/{SALARY}/g, announcementSalary || 'تحدد حسب المقابلة والخبرة');
                              text = text.replace(/{HOURS}/g, announcementHours || '8 ساعات يومياً / 6 أيام عمل بالاسبوع');
                              text = text.replace(/{LINK}/g, announcementAppUrl || window.location.origin);
                              return text;
                            })()}
                          </div>
                          <div className="text-[9px] text-emerald-700 text-left font-mono mt-1.5">
                            {new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })} ✓✓
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      )}

      {/* Corporate footer */}
      <footer className="bg-slate-950 text-slate-500 text-center py-6 text-xs mt-20 print:hidden">
        <p>بوابة إدارة الموارد البشرية • شركة مصنع جدة للدهانات والمعاجين</p>
        <p className="text-[10px] text-slate-700 mt-1">تم تصميم الموقع بواسطة عبدالرحمن سالم باشنيني • 0599222345</p>
      </footer>

      {/* Admin Management Modal */}
      {showAdminManagement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm" id="admin-management-modal">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-6 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-orange-500 p-2 rounded-xl text-white">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <h3 className="font-extrabold text-base">إدارة حسابات الإدارة والمشرفين</h3>
                  <p className="text-slate-400 text-[10px] font-medium">إضافة وحذف المسؤولين، وتحديث كلمات المرور للحسابات النشطة</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowAdminManagement(false);
                  setChangePasswordError(null);
                  setChangePasswordSuccess(null);
                  setAddAdminError(null);
                  setAddAdminSuccess(null);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white p-2 rounded-lg transition-all"
              >
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-right">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Right Side: Change Password Form */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="font-extrabold text-slate-900 border-b border-slate-200 pb-2 text-sm flex items-center gap-1.5 justify-end">
                    <span>تغيير كلمة المرور الخاصة بك</span>
                    <Lock className="text-orange-500 w-4 h-4" />
                  </h4>

                  {changePasswordError && (
                    <div className="bg-rose-50 text-rose-700 p-3 rounded-lg border border-rose-100 text-xs font-bold text-right">
                      {changePasswordError}
                    </div>
                  )}

                  {changePasswordSuccess && (
                    <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg border border-emerald-100 text-xs font-bold text-right">
                      {changePasswordSuccess}
                    </div>
                  )}

                  <form onSubmit={handleChangePassword} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 text-right">كلمة المرور الحالية *</label>
                      <input 
                        type="password"
                        required
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-blue-900 focus:ring-1 focus:ring-blue-900/10 outline-none text-center font-mono text-xs"
                        placeholder="••••••••"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 text-right">كلمة المرور الجديدة *</label>
                      <input 
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-blue-900 focus:ring-1 focus:ring-blue-900/10 outline-none text-center font-mono text-xs"
                        placeholder="أدخل كلمة المرور الجديدة"
                      />
                      <p className="text-[9px] text-slate-400 mt-1 text-right">يجب ألا تقل عن 6 خانات وتكون آمنة.</p>
                    </div>

                    <button 
                      type="submit"
                      disabled={changePasswordLoading}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      {changePasswordLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          جاري التحديث...
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          تحديث كلمة المرور
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Left Side: Create New Admin */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="font-extrabold text-slate-900 border-b border-slate-200 pb-2 text-sm flex items-center gap-1.5 justify-end">
                    <span>إضافة مسؤول (Admin) جديد للنظام</span>
                    <Users className="text-orange-500 w-4 h-4" />
                  </h4>

                  {addAdminError && (
                    <div className="bg-rose-50 text-rose-700 p-3 rounded-lg border border-rose-100 text-xs font-bold text-right">
                      {addAdminError}
                    </div>
                  )}

                  {addAdminSuccess && (
                    <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg border border-emerald-100 text-xs font-bold text-right">
                      {addAdminSuccess}
                    </div>
                  )}

                  <form onSubmit={handleAddAdmin} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 text-right">البريد الإلكتروني للمسؤول الجديد *</label>
                      <input 
                        type="email"
                        required
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-blue-900 focus:ring-1 focus:ring-blue-900/10 outline-none text-left text-xs font-mono"
                        placeholder="example@gmail.com"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 text-right">كلمة المرور الابتدائية *</label>
                      <input 
                        type="password"
                        required
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-blue-900 focus:ring-1 focus:ring-blue-900/10 outline-none text-center font-mono text-xs"
                        placeholder="••••••••"
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={addAdminLoading}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      {addAdminLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          جاري الحفظ...
                        </>
                      ) : (
                        <>
                          <Users className="w-3.5 h-3.5" />
                          تسجيل وإضافة المسؤول
                        </>
                      )}
                    </button>
                  </form>
                </div>

              </div>

              {/* Lower Section: Active Admins List */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                  <span className="text-slate-450 text-xs font-black font-mono">COUNT: {adminsList.length}</span>
                  <h4 className="font-extrabold text-slate-900 text-sm">المسؤولين النشطين المصرح لهم بالدخول</h4>
                </div>

                {adminsLoading ? (
                  <div className="p-10 text-center flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                    <span className="text-slate-400 text-xs">جاري تحميل المشرفين...</span>
                  </div>
                ) : adminsList.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 text-xs">
                    لا تتوفر حسابات مسؤولين مسجلة.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {adminsList.map((admin) => (
                      <div key={admin.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div>
                          <button
                            onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                            className="bg-red-50 hover:bg-red-500 text-red-500 hover:text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
                            title="سحب صلاحيات المشرف وحذف الحساب"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>سحب الصلاحية</span>
                          </button>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-900 font-bold text-xs block font-mono">{admin.email}</span>
                          <span className="text-[9px] text-slate-400 mt-0.5 block">تاريخ الإضافة: {new Date(admin.createdAt).toLocaleDateString('ar-SA')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => {
                  setShowAdminManagement(false);
                  setChangePasswordError(null);
                  setChangePasswordSuccess(null);
                  setAddAdminError(null);
                  setAddAdminSuccess(null);
                }}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs py-2 px-5 rounded-xl transition-all"
              >
                إغلاق النافذة
              </button>
            </div>

          </div>
        </div>
      )}

      {/* File Preview Overlay Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md" id="file-preview-overlay-modal">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-5xl w-full h-[85vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleDownloadAttachment(previewFile.base64, previewFile.fileName)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                  title="تحميل الملف"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل الملف</span>
                </button>
              </div>
              
              <div className="text-right flex items-center gap-2">
                <div className="text-right">
                  <h3 className="font-extrabold text-sm truncate max-w-[300px] md:max-w-md">{previewFile.name}</h3>
                  <p className="text-slate-400 text-[10px] font-medium font-mono truncate max-w-[300px]">{previewFile.fileName}</p>
                </div>
                <div className="bg-orange-500 p-2 rounded-xl text-white">
                  <Eye className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Modal Body (Preview Stage) */}
            <div className="flex-1 bg-slate-100 p-4 flex items-center justify-center overflow-auto relative">
              {(() => {
                const lowerFileName = previewFile.fileName.toLowerCase();
                const isPdf = lowerFileName.endsWith('.pdf') || previewFile.base64.startsWith('data:application/pdf');
                const isImage = lowerFileName.endsWith('.png') || 
                                lowerFileName.endsWith('.jpg') || 
                                lowerFileName.endsWith('.jpeg') || 
                                lowerFileName.endsWith('.webp') || 
                                lowerFileName.endsWith('.gif') || 
                                previewFile.base64.startsWith('data:image/');

                if (isPdf) {
                  return (
                    <iframe
                      src={previewFile.base64}
                      className="w-full h-full rounded-2xl border-0 shadow-sm bg-white"
                      title={previewFile.name}
                    />
                  );
                } else if (isImage) {
                  return (
                    <img
                      src={previewFile.base64}
                      alt={previewFile.name}
                      referrerPolicy="no-referrer"
                      className="max-w-full max-h-full object-contain rounded-xl shadow-lg border border-slate-200"
                    />
                  );
                } else {
                  return (
                    <div className="text-center p-8 bg-white border rounded-2xl shadow-sm max-w-sm space-y-4">
                      <p className="text-xs font-bold text-slate-700">
                        معاينة هذا المرفق مباشرة في المتصفح غير مدعومة حالياً.
                      </p>
                      <button
                        onClick={() => handleDownloadAttachment(previewFile.base64, previewFile.fileName)}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-xl text-xs inline-flex items-center gap-2 transition-all"
                      >
                        <Download className="w-4 h-4" />
                        <span>تحميل الملف للاستعراض 📥</span>
                      </button>
                    </div>
                  );
                }
              })()}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-between items-center shrink-0">
              <span className="text-[10px] text-slate-400 font-medium">بوابة المعاينة المباشرة والفرز الذكي لمصنع دهانات جدة</span>
              <button 
                onClick={() => setPreviewFile(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 px-6 rounded-xl transition-all shadow-sm"
              >
                إغلاق المعاينة
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Scheduling Progress Overlay Modal */}
      {schedulingProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md" id="scheduling-progress-modal">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl shadow-2xl max-w-xl w-full p-6 space-y-6 animate-fade-in text-right">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              {isSchedulingAuto ? (
                <span className="bg-amber-500/10 text-amber-400 text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                  <span>جاري الجدولة الآن...</span>
                </span>
              ) : (
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2.5 py-1 rounded-full font-bold">
                  ✓ اكتملت العملية
                </span>
              )}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <h3 className="font-black text-sm text-slate-100">محرك الجدولة التلقائية الذكي</h3>
                  <p className="text-slate-400 text-[10px] font-medium">مزامنة المواعيد وتوليد غرف المقابلات الافتراضية</p>
                </div>
                <div className="bg-orange-500 p-2 rounded-2xl text-white">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            {/* Progress Bar & Status */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-300">
                <span className="font-mono text-orange-400">
                  {Math.round((schedulingProgress.current / schedulingProgress.total) * 100)}%
                </span>
                <span>
                  معالجة {schedulingProgress.current} من أصل {schedulingProgress.total} مرشحين
                </span>
              </div>
              
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div 
                  className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full transition-all duration-300 shadow-md"
                  style={{ width: `${Math.round((schedulingProgress.current / schedulingProgress.total) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Current Step Name */}
            <div className="bg-slate-950/40 border border-slate-800/60 p-4 rounded-2xl flex items-center justify-between">
              {isSchedulingAuto ? (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">يرجى عدم إغلاق هذه الصفحة...</span>
                  <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <span className="text-emerald-400 text-xs font-bold">✓ تم الانتهاء بنجاح!</span>
              )}
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">العملية الحالية:</span>
                <span className="text-xs font-black text-slate-200">{schedulingProgress.currentName}</span>
              </div>
            </div>

            {/* Scrolling Logs Console */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block pr-1">سجل الأحداث والعمليات (Real-time logs):</span>
              <div 
                className="bg-black/40 p-4 rounded-2xl h-44 overflow-y-auto font-mono text-[10px] text-right border border-slate-800/80 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800"
                ref={(el) => {
                  if (el) {
                    el.scrollTop = el.scrollHeight;
                  }
                }}
              >
                {schedulingProgress.logs.map((log, i) => {
                  let colorClass = 'text-slate-300';
                  if (log.startsWith('✅')) colorClass = 'text-emerald-400 font-bold';
                  if (log.startsWith('❌')) colorClass = 'text-rose-400 font-bold';
                  if (log.startsWith('⚠️')) colorClass = 'text-amber-400';
                  if (log.startsWith('🚀')) colorClass = 'text-orange-400 font-extrabold';
                  if (log.startsWith('📅')) colorClass = 'text-indigo-400';
                  return (
                    <div key={i} className={`${colorClass} leading-relaxed py-0.5 border-b border-slate-800/20 last:border-0`}>
                      {log}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer / Actions */}
            <div className="border-t border-slate-800 pt-4 flex justify-between items-center">
              <span className="text-[10px] text-slate-500 font-medium font-mono">Powered by Google Meet API & JPF DB</span>
              <button
                onClick={() => setSchedulingProgress(null)}
                disabled={isSchedulingAuto}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs transition-all ${
                  isSchedulingAuto 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                    : 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-950/20 cursor-pointer'
                }`}
              >
                {isSchedulingAuto ? 'جاري العمل... ⏳' : 'إغلاق ومتابعة النتائج 📥'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
