import React from 'react';
import { CheckCircle2, Shield, AlertCircle, RefreshCw, Award, ExternalLink, HelpCircle } from 'lucide-react';
import { AiEvaluation } from '../types';

interface SuccessScreenProps {
  applicationId: string;
  status: string;
  aiEvaluation?: AiEvaluation;
  applicantName: string;
  onGoHome: () => void;
}

export default function SuccessScreen({ applicationId, status, aiEvaluation, applicantName, onGoHome }: SuccessScreenProps) {
  // Translate recommendation to Arabic
  const getRecLabel = (rec?: string) => {
    if (rec === 'suitable') return 'مؤهل ومطابق لمعايير المصنع';
    if (rec === 'suitable_after_interview') return 'مؤهل للمقابلة الشخصية الفنية';
    return 'قيد الدراسة والمراجعة التفصيلية';
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-12 px-4 md:px-6" id="success-view">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Success Header banner */}
        <div className="bg-slate-900 text-white p-8 text-center relative overflow-hidden border-b border-slate-800">
          <div className="absolute inset-0 bg-radial-gradient from-blue-500/10 to-transparent opacity-50"></div>
          <div className="relative z-10">
            <div className="bg-blue-900 text-white p-4 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold mb-1">تم استلام طلبك بنجاح</h2>
            <p className="text-xs text-slate-400 font-medium">نشكرك على اهتمامك بالانضمام لشركة مصنع جدة للدهانات والمعاجين</p>
          </div>
        </div>

        {/* Application details block */}
        <div className="p-6 md:p-8 space-y-8">
          
          {/* Main Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-right">
              <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">رقم الطلب المرجعي</span>
              <span className="text-lg font-bold text-blue-900 font-mono tracking-wider">{applicationId}</span>
            </div>
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-right flex justify-between items-center">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">حالة الطلب الحالية</span>
                <span className="text-xs font-bold text-orange-600 bg-orange-50 border border-orange-100 px-3 py-1 rounded-full">بانتظار المراجعة</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
            </div>
          </div>

          {/* AI Immediate Assessment Report */}
          {aiEvaluation && (
            <div className="border border-slate-200 rounded-xl p-6 bg-white" id="ai-feedback-section">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
                <div className="bg-blue-50 p-2 rounded-lg text-blue-900">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-900 text-sm md:text-base">درجة التقييم الفني المبدئي</h3>
                  <p className="text-[10px] text-slate-400 font-medium">تحليل تلقائي لمطابقة الشهادات والخبرات المهنية مع متطلبات السلامة والصحة المهنية</p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Score Circle */}
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-full border-4 border-blue-100 flex items-center justify-center bg-blue-50 shrink-0">
                    <span className="text-xl font-bold text-blue-900 font-mono">{aiEvaluation.score}</span>
                    <span className="text-[9px] text-blue-400 absolute bottom-1.5 font-medium">/ 100</span>
                  </div>
                  <div className="text-right">
                    <h4 className="font-bold text-slate-800 text-xs md:text-sm">درجة المطابقة الفنية التقديرية</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      تم احتساب هذه النسبة بشكل تلقائي بناءً على مطابقة شهاداتك وخبرتك المهنية مع إجابات الاختبار الفني لسلامة عمليات الطلاء. سيقوم فريق الموارد البشرية واللجنة الفنية بمراجعة طلبك يدوياً.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Timeline Process Callout */}
          <div className="bg-slate-50 text-slate-600 p-5 rounded-xl border border-slate-200 flex gap-4">
            <AlertCircle className="w-5 h-5 text-blue-900 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold text-blue-900 block mb-1">ما هي الخطوة التالية؟</span>
              سيقوم فريق الموارد البشرية (HR) وفريق الهندسة الفنية بالمصنع بمراجعة وتدقيق المستندات المرفوعة وسيرتك الذاتية ومطابقتها مع التقييم الذكي. في حال كنت من المؤهلين سيتم التواصل معك عبر رقم الجوال أو البريد الإلكتروني لتنسيق المقابلة الفنية والميدانية المباشرة بمقر الشركة.
            </div>
          </div>

          {/* WhatsApp Direct Contact Section */}
          <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-xl text-center space-y-4" id="whatsapp-direct-contact-block">
            <div className="flex justify-center">
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                💡 خطوة هامة ومباشرة للمتابعة السريعة
              </span>
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm md:text-base">تواصل معنا فوراً بالواتساب لتأكيد طلبك</h3>
            <p className="text-slate-600 text-xs max-w-lg mx-auto leading-relaxed">
              يرجى النقر على زر الواتساب أدناه لإرسال رسالة آلية تحتوي على اسمك ورقم طلبك المرجعي <span className="font-bold font-mono text-emerald-800 bg-emerald-100/50 px-1.5 py-0.5 rounded">{applicationId}</span> مباشرةً إلى الرقم <span className="font-bold font-mono">966537375580</span> لبدء المتابعة السريعة والمباشرة مع مسؤولي التوظيف.
            </p>
            <div className="flex justify-center">
              <a
                href={`https://wa.me/966537375580?text=${encodeURIComponent(
                  `السلام عليكم ورحمة الله وبركاته،\nأنا ${applicantName || 'المتقدم'} عندي بعض الاستفسارات بخصوص وظيفة أخصائي صحة وسلامة وبيئة (HSE).\n\nرقم الطلب الخاص بي: *${applicationId}*\nتقييم المطابقة المبدئي: *${aiEvaluation?.score || 'قيد الدراسة'} / 100*`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-8 py-3.5 rounded-xl shadow-md transition-all active:scale-95"
                id="whatsapp-success-contact-btn"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.263 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.863-9.864.001-2.637-1.03-5.114-2.904-6.989-1.873-1.876-4.36-2.907-7.01-2.908-5.438 0-9.863 4.42-9.866 9.863-.001 1.702.451 3.361 1.307 4.8l-.364 1.332 1.353-.355zm10.743-7.553c-.279-.14-1.65-.814-1.906-.906-.256-.093-.442-.14-.628.14-.186.279-.72.906-.883 1.093-.163.186-.326.21-.605.07-.279-.14-1.18-.435-2.247-1.388-.83-.74-1.39-1.653-1.553-1.933-.163-.28-.018-.43.122-.569.126-.125.279-.326.418-.489.14-.163.186-.279.279-.465.093-.186.046-.349-.023-.489-.069-.14-.628-1.512-.86-2.07-.226-.544-.455-.47-.628-.478-.163-.008-.349-.01-.535-.01-.186 0-.489.07-.744.349-.256.279-.977.954-.977 2.329s1.001 2.701 1.14 2.887c.14.186 1.97 3.007 4.773 4.218.667.288 1.188.46 1.594.589.67.213 1.28.183 1.762.11.537-.081 1.65-.674 1.883-1.326.233-.652.233-1.21.163-1.325-.07-.115-.256-.185-.535-.326z"/>
                </svg>
                تواصل معنا فوراً عبر الواتساب
              </a>
            </div>
          </div>

        </div>

        {/* Action button in Footer */}
        <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-center">
          <button
            onClick={onGoHome}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-8 py-3 rounded-lg shadow-sm transition-all active:scale-95"
            id="go-back-home-btn"
          >
            العودة لصفحة الوظيفة الرئيسية
          </button>
        </div>

      </div>
    </div>
  );
}
