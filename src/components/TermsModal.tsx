import React, { useState } from 'react';
import { ShieldAlert, Check, X, ArrowRight } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  jobRole?: 'hse' | 'marketing';
}

export default function TermsModal({ isOpen, onClose, onAccept, jobRole = 'hse' }: TermsModalProps) {
  const [certifyCorrect, setCertifyCorrect] = useState(false);
  const [consentToUse, setConsentToUse] = useState(false);

  if (!isOpen) return null;

  const handleProceed = () => {
    if (certifyCorrect && consentToUse) {
      onAccept();
    }
  };

  const isMkt = jobRole === 'marketing';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" id="terms-modal-overlay">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-white p-6 flex justify-between items-center border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isMkt ? 'bg-blue-50 text-blue-900' : 'bg-orange-50 text-orange-950'}`}>
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`font-bold text-base md:text-lg ${isMkt ? 'text-blue-900' : 'text-slate-900'}`}>الشروط والأحكام وإقرار صحة البيانات</h3>
              <p className="text-[10px] text-slate-400 font-medium">
                {isMkt ? 'بوابة التقديم على وظيفة أخصائي تسويق وصناعة محتوى' : 'بوابة التقديم على وظيفة أخصائي الصحة والسلامة (HSE)'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-lg transition-all"
            id="close-terms-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-6">
          <div className="space-y-4 text-slate-600 text-xs md:text-sm leading-relaxed">
            <p className="font-bold text-slate-800 text-sm md:text-base">عزيزي المتقدم، يرجى قراءة الشروط والتعليمات التالية بعناية قبل البدء بتعبئة طلب التقديم:</p>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex gap-2">
                <span className={`font-bold ${isMkt ? 'text-blue-600' : 'text-orange-500'}`}>•</span>
                <p>
                  {isMkt 
                    ? 'يتطلب هذا الطلب إجابة اختبار جدارة تسويقية يتكون من 10 أسئلة تخصصية وتفصيلية في الحملات الرقمية وإدارة الهوية والاعتمادات الرسمية والمنصات الحكومية.' 
                    : 'يتطلب هذا الطلب إجابة اختبار فني مقالي يتكون من 10 أسئلة تخصصية في سلامة مصانع الكيماويات والدهانات، يرجى تعبئتها بوعي ودقة تامة.'}
                </p>
              </div>
              <div className="flex gap-2">
                <span className={`font-bold ${isMkt ? 'text-blue-600' : 'text-orange-500'}`}>•</span>
                <p>سيقوم نظام ذكاء اصطناعي فني بتحليل وفحص إجاباتك الفنية فورياً وإصدار توصية تقييمية ومطابقتها مع متطلبات المصنع، وتعتبر هذه النتيجة مكملاً للمراجعة البشرية.</p>
              </div>
              <div className="flex gap-2">
                <span className={`font-bold ${isMkt ? 'text-blue-600' : 'text-orange-500'}`}>•</span>
                <p>يجب رفع ملف سيرة ذاتية PDF محدث وملفات الشهادات والخبرات المهنية الخاصة بك لتثبيت الطلب الإداري.</p>
              </div>
              <div className="flex gap-2">
                <span className={`font-bold ${isMkt ? 'text-blue-600' : 'text-orange-500'}`}>•</span>
                <p>أي كشط أو تزوير أو معلومات غير صحيحة يتم إدخالها في هذا الطلب ستؤدي إلى استبعاد طلبك فوراً ودون أي إشعار مسبق وحرمانك من التقديم مستقبلاً.</p>
              </div>
            </div>

            <p className="font-semibold text-slate-800">حقوق البيانات والخصوصية:</p>
            <p className="text-[10px] md:text-xs text-slate-400 leading-relaxed">
              تلتزم شركة مصنع جدة للدهانات والمعاجين بالحفاظ التام على خصوصية بيانات المتقدمين وأمنها الرقمي. لن يتم استخدام أو معالجة أي من هذه البيانات والملفات إلا لأغراض تقييم التوظيف ومقارنتها بالاحتياجات الفنية للشركة، ووفقاً للأنظمة واللوائح المعمول بها في المملكة العربية السعودية.
            </p>
          </div>

          {/* Validation Checkboxes */}
          <div className="border-t border-slate-100 pt-6 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer group" id="checkbox-certify-label">
              <div className="relative flex items-center justify-center mt-0.5">
                <input
                  type="checkbox"
                  checked={certifyCorrect}
                  onChange={(e) => setCertifyCorrect(e.target.checked)}
                  className="sr-only"
                  id="checkbox-certify"
                />
                <div className={`w-5 h-5 rounded-lg border transition-all flex items-center justify-center ${
                  certifyCorrect 
                    ? isMkt ? 'bg-blue-600 border-blue-600 shadow-sm' : 'bg-orange-500 border-orange-500 shadow-sm' 
                    : 'border-slate-300 group-hover:border-slate-400 bg-white'
                }`}>
                  {certifyCorrect && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                </div>
              </div>
              <span className="text-xs md:text-sm font-medium text-slate-600 select-none group-hover:text-slate-900">
                أقر وأتعهد بأن جميع البيانات والمعلومات والمرفقات المدخلة في هذا النموذج صحيحة ومطابقة للواقع ومسؤوليتي كاملة عنها.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group" id="checkbox-consent-label">
              <div className="relative flex items-center justify-center mt-0.5">
                <input
                  type="checkbox"
                  checked={consentToUse}
                  onChange={(e) => setConsentToUse(e.target.checked)}
                  className="sr-only"
                  id="checkbox-consent"
                />
                <div className={`w-5 h-5 rounded-lg border transition-all flex items-center justify-center ${
                  consentToUse 
                    ? isMkt ? 'bg-blue-600 border-blue-600 shadow-sm' : 'bg-orange-500 border-orange-500 shadow-sm' 
                    : 'border-slate-300 group-hover:border-slate-400 bg-white'
                }`}>
                  {consentToUse && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                </div>
              </div>
              <span className="text-xs md:text-sm font-medium text-slate-600 select-none group-hover:text-slate-900">
                أوافق على معالجة واستخدام بياناتي الشخصية والمهنية وإجابات هذا التقييم لأغراض التوظيف والمراجعة والمطابقة لدى الشركة.
              </span>
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-6 border-t border-slate-200 flex flex-col sm:flex-row-reverse gap-3">
          <button
            onClick={handleProceed}
            disabled={!certifyCorrect || !consentToUse}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 font-bold text-xs px-6 py-3 rounded-lg transition-all shadow-sm ${
              certifyCorrect && consentToUse
                ? isMkt ? 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95' : 'bg-orange-500 hover:bg-orange-600 text-white active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            id="proceed-to-form-btn"
          >
            المتابعة وبدء التقديم
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={onClose}
            className="sm:flex-initial bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold text-xs px-5 py-3 rounded-lg transition-all active:scale-95"
            id="cancel-terms-btn"
          >
            إلغاء التقديم
          </button>
        </div>

      </div>
    </div>
  );
}
