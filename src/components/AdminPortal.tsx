import React, { useState, useEffect } from 'react';
import { 
  Lock, Shield, Users, FileText, CheckCircle, XCircle, Clock, Calendar, 
  Search, Filter, Eye, EyeOff, Edit3, Download, Printer, Trash2, ArrowLeft,
  ChevronDown, AlertCircle, Award, Star, ThumbsUp, Save, BarChart2,
  ListFilter, FileSpreadsheet, FileDown, Loader2, Briefcase, FileQuestion,
  Upload, ShieldCheck, Copy, Check, Share2, MessageSquare
} from 'lucide-react';
import { Applicant, DashboardStats, HrEvaluation, ApplicationStatus } from '../types';
import CompanyLogo from './CompanyLogo';

interface AdminPortalProps {
  onGoHome: () => void;
}

export default function AdminPortal({ onGoHome }: AdminPortalProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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
  const [certFilter, setCertFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<string>('desc');
  const [manualEvalFilter, setManualEvalFilter] = useState<string>('all');

  // Hybrid WhatsApp Interview Scheduling states
  const [activeSubTab, setActiveSubTab] = useState<'applicants' | 'schedules' | 'announcements'>('applicants');
  const [schedulingApplicant, setSchedulingApplicant] = useState<Applicant | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleName, setScheduleName] = useState('');
  const [scheduleType, setScheduleType] = useState('remote');

  // WhatsApp announcement customization states
  const [announcementAppUrl, setAnnouncementAppUrl] = useState(() => {
    try {
      return window.location.origin;
    } catch {
      return 'https://jeddahpaints-careers.com';
    }
  });
  const [announcementCopied, setAnnouncementCopied] = useState(false);

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
            localStorage.setItem('company_logo', base64);
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
        localStorage.removeItem('company_logo');
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

  const adminToken = localStorage.getItem('hse_admin_token');

  // Check existing token
  useEffect(() => {
    if (adminToken) {
      setIsAuthenticated(true);
    }
  }, [adminToken]);

  // Load applicants and statistics
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchAdminData = async () => {
      setLoading(true);
      try {
        const headers = { 'Authorization': `Bearer ${adminToken}` };
        
        // Fetch stats
        const statsRes = await fetch('/api/admin/stats', { headers });
        if (statsRes.status === 401 || statsRes.status === 403) {
          localStorage.removeItem('hse_admin_token');
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
          hasCert: certFilter !== 'all' ? certFilter : '',
          sortBy,
          sortOrder,
          manualEval: manualEvalFilter
        });

        const appRes = await fetch(`/api/admin/applicants?${queryParams}`, { headers });
        if (appRes.status === 401 || appRes.status === 403) {
          localStorage.removeItem('hse_admin_token');
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
  }, [isAuthenticated, searchTerm, statusFilter, experienceFilter, certFilter, sortBy, sortOrder, manualEvalFilter, refreshTrigger]);

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

      localStorage.setItem('hse_admin_token', data.token);
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
        localStorage.removeItem('hse_admin_token');
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
    localStorage.removeItem('hse_admin_token');
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
          hrEvaluation: hrEvalForm
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

  // Save Interview Schedule and auto-promote to 'interview' status
  const handleSaveSchedule = async (applicant: Applicant, name: string, date: string, time: string, type: string) => {
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
  const handleSendWhatsApp = (applicant: Applicant, name: string, date: string, time: string, type: string) => {
    // Generate the professional message
    const formattedDate = new Date(date).toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const formattedTime = time; // e.g., "14:30"
    
    const message = `السلام عليكم ورحمة الله وبركاته، أستاذ/أستاذة ${name} المحترم.

نفيدكم من إدارة الموارد البشرية بشركة مصنع جدة للدهانات والمعاجين، بأنه تم استقبال تقديمكم الموقر عبر موقع جدارات للوظيفة التالية:
📌 المسمى الوظيفي: مشرف صحة وسلامة مهنية
رقم الإعلان الوظيفي: 20260706023116938
تاريخ الإعلان: 21/01/1448

ويسعدنا تحديد موعد المقابلة الشخصية معكم (عن بعد):
📅 اليوم والتاريخ: ${formattedDate}
⏰ الوقت المحدد: في تمام الساعة ${formattedTime}

⚠️ نرجو التكرم بالتواجد قبل موعد المقابلة بـ 15 دقيقة للتأكد من استقرار الاتصال والشبكة.

نسأل الله لكم التوفيق والنجاح.
إدارة الموارد البشرية
شركة مصنع جدة للدهانات والمعاجين`;

    const encodedMessage = encodeURIComponent(message);
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
                    <span className="font-bold text-slate-800">{selectedApplicant.personalInfo.birthDate}</span>
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
                        </select>
                      </div>

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
                          {selectedApplicant.aiEvaluation.strengths.map((s, idx) => (
                            <li key={idx} className="flex gap-2 text-xs text-slate-300 items-start leading-relaxed">
                              <span className="text-emerald-500 font-bold">•</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="text-red-400 font-bold text-xs block mb-2">جوانب النقص والمخاطر:</span>
                        <ul className="space-y-2">
                          {selectedApplicant.aiEvaluation.weaknesses.map((w, idx) => (
                            <li key={idx} className="flex gap-2 text-xs text-slate-300 items-start leading-relaxed">
                              <span className="text-red-500 font-bold">•</span>
                              <span>{w}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Custom Suggested Interview Questions */}
                    <div className="border-t border-slate-800 pt-4 text-right">
                      <span className="text-orange-400 font-bold text-xs block mb-2">أسئلة مقترحة وموجهة للمقابلة الشخصية:</span>
                      <ul className="space-y-3">
                        {selectedApplicant.aiEvaluation.suggestedQuestions.map((q, idx) => (
                          <li key={idx} className="bg-slate-800 p-3 rounded-lg border border-slate-750 text-xs text-slate-200 leading-relaxed">
                            <span className="font-bold text-orange-400 font-mono block mb-0.5">سؤال مقابلة مقترح {idx + 1}:</span>
                            {q}
                          </li>
                        ))}
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
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              
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
                {localStorage.getItem('company_logo') && (
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
              <span>إعلان الوظيفة للواتساب 📣</span>
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

              {/* Certificates Filter */}
              <select
                value={certFilter}
                onChange={(e) => setCertFilter(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none text-xs bg-white"
              >
                <option value="all">تصفية حسب الشهادة الفنية</option>
                <option value="nebosh">حاصل على NEBOSH IGC</option>
                <option value="osha">حاصل على OSHA</option>
                <option value="iso45001">حاصل على ISO 45001</option>
                <option value="hazop">حاصل على HAZOP</option>
                <option value="hazmat">حاصل على HAZMAT</option>
                <option value="confinedSpace">حاصل على Confined Space</option>
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
                      <th className="p-4 text-center">الشهادات</th>
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
                        <td className="p-4 text-center font-bold text-slate-500 font-mono">
                          {getCertCount(a.certificates)} / 12
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
                        {applicants.filter(a => !a.interviewSchedule && a.status === 'interview').length}
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
                          } else {
                            setSchedulingApplicant(null);
                            setScheduleName('');
                            setScheduleDate('');
                            setScheduleTime('');
                            setScheduleType('remote');
                          }
                        }}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none text-xs bg-white font-semibold"
                      >
                        <option value="">-- اضغط هنا لاختيار المتقدم --</option>
                        {applicants.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.personalInfo.fullName} (رقم الطلب: {a.id} {a.interviewSchedule ? ' - مجدول مسبقاً 🗓️' : ''})
                          </option>
                        ))}
                      </select>
                    </div>

                    {schedulingApplicant && (
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
                          }}
                          className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 text-xs rounded-xl transition-all"
                        >
                          إلغاء التحديد
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => handleSaveSchedule(schedulingApplicant, scheduleName, scheduleDate, scheduleTime, scheduleType)}
                          disabled={!scheduleDate || !scheduleTime || !scheduleName}
                          className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-5 py-2.5 text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md"
                        >
                          <Save className="w-4 h-4" />
                          <span>حفظ الموعد بالنظام 💾</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSendWhatsApp(schedulingApplicant, scheduleName, scheduleDate, scheduleTime, scheduleType)}
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
                              <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="p-4 font-bold text-slate-950">{a.personalInfo.fullName}</td>
                                <td className="p-4 font-bold font-mono text-slate-500">{a.id}</td>
                                <td className="p-4 text-slate-700 font-bold">{arabDate}</td>
                                <td className="p-4 text-center text-slate-900 font-black font-mono bg-orange-500/5">{sched.time}</td>
                                <td className="p-4 text-center">
                                  <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full font-bold">
                                    مقابلة عن بعد (15 دقيقة قبل)
                                  </span>
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
              {/* Top Banner */}
              <div className="bg-gradient-to-l from-slate-900 via-slate-850 to-slate-900 text-white p-6 md:p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -z-10"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -z-10"></div>
                
                <div className="max-w-3xl space-y-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    نشر عام لجميع المجموعات والمنصات
                  </span>
                  <h3 className="text-xl md:text-2xl font-black text-white">إطلاق ونشر الإعلان الوظيفي لعامة الناس 📣</h3>
                  <p className="text-slate-300 text-xs md:text-sm leading-relaxed font-light">
                    هنا يمكنك صياغة الإعلان الموجه لعامة الناس للتقديم على وظيفة <strong className="text-orange-400">أخصائي صحة وسلامة وبيئة (HSE)</strong>. قمنا بتنسيق الإعلان بشكل احترافي للغاية ليتناسب مع النشر المباشر عبر مجموعات الواتساب، القنوات المهنية، منصات التوظيف ومواقع التواصل الاجتماعي، متضمناً كافة الشروط كشغلك لمتطلبات "منصة كوادر"، السيرة الذاتية ورقم الإعلان المعتمد.
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

                    {/* Quick Stats Summary */}
                    <div className="bg-orange-50/50 rounded-2xl p-4 border border-orange-100/40 text-xs space-y-2 text-slate-700">
                      <p className="font-bold text-orange-950 flex items-center gap-1.5 mb-1">
                        <Award className="w-4 h-4 text-orange-600" />
                        <span>بيانات الإعلان الوظيفي المضمنة:</span>
                      </p>
                      <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 pr-1 font-semibold text-[11px]">
                        <div>• المسمى: <span className="text-slate-900 font-bold">أخصائي صحة وسلامة HSE</span></div>
                        <div>• رقم الإعلان: <span className="text-slate-900 font-mono">20260706023116938</span></div>
                        <div>• التاريخ: <span className="text-slate-900 font-mono">21/01/1448 هـ</span></div>
                        <div>• الراتب: <span className="text-slate-900">4,500 - 6,000 ريال</span></div>
                        <div>• ساعات العمل: <span className="text-slate-900">9 ساعات (6 أيام)</span></div>
                        <div>• الموقع: <span className="text-slate-900">حي الرحاب، جدة</span></div>
                      </div>
                    </div>

                    {/* Actions Buttons */}
                    <div className="space-y-2.5 pt-2">
                      <button
                        onClick={() => {
                          const text = `📣 *إعلان وظيفي لعامة الناس - شركة مصنع جدة للدهانات والمعاجين* 🇸🇦

يسر إدارة الموارد البشرية بشركة مصنع جدة للدهانات والمعاجين الإعلان عن توفر فرصة وظيفية شاغرة ومتاحة للتقديم المباشر لجميع المواطنين المؤهلين:

💼 *المسمى الوظيفي:* أخصائي صحة وسلامة وبيئة (HSE)
🔢 *رقم الإعلان الوظيفي:* 20260706023116938
📅 *تاريخ الإعلان:* 21/01/1448 هـ

📍 *مقر العمل:* جدة - حي الرحاب

🎯 *الهدف الوظيفي:*
الإشراف الشامل على صالات الإنتاج والمستودعات والتحكم في المخاطر الكيميائية وتطبيق نظام صارم للوقاية من الحريق وتأمين ممارسات العمل لضمان صفر حوادث وإصابات.

🛠️ *المؤهلات والشروط المطلوبة:*
1️⃣ درجة البكالوريوس في الهندسة الكيميائية، هندسة السلامة، علوم البيئة، أو تخصص مماثل.
2️⃣ خبرة عملية لا تقل عن سنتين (2) في المصانع الكيميائية أو مصانع الطلاء والدهانات.
3️⃣ شهادة مهنية دولية معتمدة (مثل NEBOSH IGC أو OSHA 30-Hour المتقدمة).
4️⃣ معرفة قوية بمتطلبات السلامة العامة والحرائق الكيميائية وإدارة معايير ISO 45001.
5️⃣ مهارات تواصل ممتازة وكتابة التقارير باللغتين العربية والإنجليزية.
6️⃣ *يفضل تقديم السيرة الذاتية باللغة العربية.* 📄
7️⃣ *يفضل وجود ترخيص معتمد من منصة كوادر (سيطلب رفعه في نموذج التقديم إن وُجد).* 🛡️

💰 *المزايا وبيئة العمل الموفرة:*
• الراتب شهرياً: 4,500 ريال إلى 6,000 ريال (حسب المؤهل والخبرة).
• أيام العمل: 6 أيام أسبوعياً (الجمعة يوم الراحة الأسبوعية).
• ساعات العمل: 9 ساعات يومياً (تتضمن ساعة راحة وبريك).
• إجازة سنوية مدفوعة الأجر طبقاً لنظام العمل السعودي (21 يوماً).

🔗 *رابط التقديم المباشر وتعبئة الطلب:*
${announcementAppUrl}

📞 *للاستفسارات والتواصل المباشر عبر الواتساب:*
https://wa.me/966537375580

✨ *نرحب بجميع الكفاءات الوطنية الطموحة للانضمام إلى فريق عملنا المتميز!*`;
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
                            <CheckCircle className="w-4 h-4 text-emerald-300 animate-bounce" />
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
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`📣 *إعلان وظيفي لعامة الناس - شركة مصنع جدة للدهانات والمعاجين* 🇸🇦

يسر إدارة الموارد البشرية بشركة مصنع جدة للدهانات والمعاجين الإعلان عن توفر فرصة وظيفية شاغرة ومتاحة للتقديم المباشر لجميع المواطنين المؤهلين:

💼 *المسمى الوظيفي:* أخصائي صحة وسلامة وبيئة (HSE)
🔢 *رقم الإعلان الوظيفي:* 20260706023116938
📅 *تاريخ الإعلان:* 21/01/1448 هـ

📍 *مقر العمل:* جدة - حي الرحاب

🎯 *الهدف الوظيفي:*
الإشراف الشامل على صالات الإنتاج والمستودعات والتحكم في المخاطر الكيميائية وتطبيق نظام صارم للوقاية من الحريق وتأمين ممارسات العمل لضمان صفر حوادث وإصابات.

🛠️ *المؤهلات والشروط المطلوبة:*
1️⃣ درجة البكالوريوس في الهندسة الكيميائية، هندسة السلامة، علوم البيئة، أو تخصص مماثل.
2️⃣ خبرة عملية لا تقل عن سنتين (2) في المصانع الكيميائية أو مصانع الطلاء والدهانات.
3️⃣ شهادة مهنية دولية معتمدة (مثل NEBOSH IGC أو OSHA 30-Hour المتقدمة).
4️⃣ معرفة قوية بمتطلبات السلامة العامة والحرائق الكيميائية وإدارة معايير ISO 45001.
5️⃣ مهارات تواصل ممتازة وكتابة التقارير باللغتين العربية والإنجليزية.
6️⃣ *يفضل تقديم السيرة الذاتية باللغة العربية.* 📄
7️⃣ *يفضل وجود ترخيص معتمد من منصة كوادر (سيطلب رفعه في نموذج التقديم إن وُجد).* 🛡️

💰 *المزايا وبيئة العمل الموفرة:*
• الراتب شهرياً: 4,500 ريال إلى 6,000 ريال (حسب المؤهل والخبرة).
• أيام العمل: 6 أيام أسبوعياً (الجمعة يوم الراحة الأسبوعية).
• ساعات العمل: 9 ساعات يومياً (تتضمن ساعة راحة وبريك).
• إجازة سنوية مدفوعة الأجر طبقاً لنظام العمل السعودي (21 يوماً).

🔗 *رابط التقديم المباشر وتعبئة الطلب:*
${announcementAppUrl}

📞 *للاستفسارات والتواصل المباشر عبر الواتساب:*
https://wa.me/966537375580

✨ *نرحب بجميع الكفاءات الوطنية الطموحة للانضمام إلى فريق عملنا المتميز!*`)}`}
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
                      <li>تأكد من بقاء رقم الإعلان (20260706023116938) ثابتاً ليتم مطابقته لاحقاً بنظام جدارات ومنصات الموارد البشرية.</li>
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
                        <div className="font-extrabold text-[#128c7e] text-xs pb-1 border-b border-emerald-100 mb-1">
                          📣 شركة مصنع جدة للدهانات والمعاجين 🇸🇦
                        </div>
                        
                        <p>يسر إدارة الموارد البشرية بشركة مصنع جدة للدهانات والمعاجين الإعلان عن توفر فرصة وظيفية شاغرة ومتاحة للتقديم المباشر لجميع المواطنين المؤهلين:</p>
                        
                        <p>💼 <strong>المسمى الوظيفي:</strong> أخصائي صحة وسلامة وبيئة (HSE)<br />
                        🔢 <strong>رقم الإعلان الوظيفي:</strong> 20260706023116938<br />
                        📅 <strong>تاريخ الإعلان:</strong> 21/01/1448 هـ</p>

                        <p>📍 <strong>مقر العمل:</strong> جدة - حي الرحاب</p>

                        <p>🎯 <strong>الهدف الوظيفي:</strong><br />
                        الإشراف الشامل على صالات الإنتاج والمستودعات والتحكم في المخاطر الكيميائية وتطبيق نظام صارم للوقاية من الحريق وتأمين ممارسات العمل لضمان صفر حوادث وإصابات.</p>

                        <p>🛠️ <strong>المؤهلات والشروط المطلوبة:</strong><br />
                        1️⃣ درجة البكالوريوس في الهندسة الكيميائية، هندسة السلامة، علوم البيئة، أو تخصص مماثل.<br />
                        2️⃣ خبرة عملية لا تقل عن سنتين (2) في المصانع الكيميائية أو مصانع الطلاء والدهانات.<br />
                        3️⃣ شهادة مهنية دولية معتمدة (مثل NEBOSH IGC أو OSHA 30-Hour المتقدمة).<br />
                        4️⃣ معرفة قوية بمتطلبات السلامة العامة والحرائق الكيميائية وإدارة معايير ISO 45001.<br />
                        5️⃣ مهارات تواصل ممتازة وكتابة التقارير باللغتين العربية والإنجليزية.<br />
                        6️⃣ <em>يفضل تقديم السيرة الذاتية باللغة العربية.</em> 📄<br />
                        7️⃣ <em>يفضل وجود ترخيص معتمد من منصة كوادر (سيطلب رفعه في نموذج التقديم إن وُجد).</em> 🛡️</p>

                        <p>💰 <strong>المزايا وبيئة العمل الموفرة:</strong><br />
                        • الراتب شهرياً: 4,500 ريال إلى 6,000 ريال (حسب المؤهل والخبرة).<br />
                        • أيام العمل: 6 أيام أسبوعياً (الجمعة يوم الراحة الأسبوعية).<br />
                        • ساعات العمل: 9 ساعات يومياً (تتضمن ساعة راحة وبريك).<br />
                        • إجازة سنوية مدفوعة الأجر طبقاً لنظام العمل السعودي (21 يوماً).</p>

                        <p>🔗 <strong>رابط التقديم المباشر وتعبئة الطلب:</strong><br />
                        <span className="text-blue-600 hover:underline break-all font-bold">
                          {announcementAppUrl}
                        </span></p>

                        <p>📞 <strong>للاستفسارات والتواصل المباشر عبر الواتساب:</strong><br />
                        <span className="text-blue-600 hover:underline font-bold">
                          https://wa.me/966537375580
                        </span></p>

                        <p className="font-bold text-[#128c7e] text-center pt-2">✨ نرحب بجميع الكفاءات الوطنية الطموحة للانضمام إلى فريق عملنا المتميز!</p>

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

    </div>
  );
}
