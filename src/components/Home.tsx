import React, { useState } from 'react';
// GitHub Sync: Minor update to trigger re-push
import { 
  Shield, FileText, MapPin, Award, CheckCircle, Clock, 
  Flame, Droplet, Zap, MessageCircle, Megaphone, Target, Users, Share2, Sparkles, Send
} from 'lucide-react';

interface HomeProps {
  onStartApply: (role: 'hse' | 'marketing') => void;
  onGoToAdmin: () => void;
}

export default function Home({ onStartApply, onGoToAdmin }: HomeProps) {
  const [activeTab, setActiveTab] = useState<'hse' | 'marketing'>('hse');

  return (
    <div className="w-full bg-slate-50" id="home-view">
      
      {/* Dynamic Hero Section based on selected job */}
      <section className="relative overflow-hidden bg-slate-900 text-white py-16 px-6 md:px-12 md:py-20 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent opacity-60"></div>
        
        {/* Subtle decorative grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35"></div>

        <div className="max-w-6xl mx-auto relative z-10">
          
          {/* Job Selection Tabs */}
          <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-10 max-w-2xl mx-auto bg-slate-800/60 p-1.5 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
            <button
              onClick={() => setActiveTab('hse')}
              className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-5 rounded-xl font-bold text-xs md:text-sm transition-all ${
                activeTab === 'hse'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
              id="tab-select-hse"
            >
              <Shield className="w-4 h-4 shrink-0" />
              أخصائي صحة وسلامة وبيئة (HSE)
            </button>
            <button
              onClick={() => setActiveTab('marketing')}
              className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-5 rounded-xl font-bold text-xs md:text-sm transition-all ${
                activeTab === 'marketing'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
              id="tab-select-marketing"
            >
              <Megaphone className="w-4 h-4 shrink-0" />
              أخصائي تسويق (Marketing)
            </button>
          </div>

          {activeTab === 'hse' ? (
            <div className="flex flex-col lg:flex-row items-center gap-10">
              <div className="flex-1 text-center lg:text-right">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-orange-500/15 text-orange-400 mb-6 border border-orange-500/20 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                  وظيفة شاغرة تخصصية • إدارة الصحة والسلامة
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-6">
                  مرحباً بك في بوابة التقديم على وظيفة
                  <span className="block text-transparent bg-clip-text bg-gradient-to-l from-orange-400 to-amber-500 mt-2 font-black">
                    أخصائي صحة وسلامة وبيئة (HSE)
                  </span>
                </h2>
                <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-8 max-w-2xl font-light">
                  نحن في شركة مصنع جدة للدهانات والمعاجين نقدر العقول الواعية التي تسعى لتأمين بيئة عمل خالية من الحوادث. انضم إلينا لقيادة منظومة الأمان والسلامة الصناعية في أحد أعرق مصانع الدهانات والطلاء في المنطقة بجدة.
                </p>
                <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                  <button
                    onClick={() => onStartApply('hse')}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm md:text-base px-8 py-3.5 rounded-xl shadow-md transition-all active:scale-95"
                    id="hero-start-apply-hse-btn"
                  >
                    ابدأ التقديم المباشر
                  </button>
                  <a
                    href={`https://wa.me/966537375580?text=${encodeURIComponent('السلام عليكم، عندي استفسار بخصوص وظيفة أخصائي صحة وسلامة وبيئة (HSE)')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm md:text-base px-6 py-3.5 rounded-xl shadow-md transition-all active:scale-95"
                  >
                    <MessageCircle className="w-5 h-5" />
                    تواصل معنا عبر الواتساب
                  </a>
                </div>
              </div>

              {/* Graphical Safety badge side */}
              <div className="w-full lg:w-80 flex justify-center">
                <div className="relative bg-slate-800/40 p-8 rounded-2xl border border-slate-700/60 shadow-xl backdrop-blur-sm flex flex-col items-center text-center max-w-sm">
                  <div className="absolute -top-6 bg-orange-600 p-4 rounded-xl shadow-lg text-white">
                    <Shield className="w-8 h-8" />
                  </div>
                  <div className="mt-8 mb-4">
                    <span className="text-xs text-orange-400 font-bold uppercase tracking-widest block mb-1">SAFETY FIRST</span>
                    <h3 className="text-lg font-bold text-white">السلامة أولاً ودائماً</h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed mb-6 font-light">
                    شعارنا الدائم في المصنع ونسعى لتوظيف من يتمتع برؤية صارمة ومبتكرة لحماية الأرواح والمنشآت.
                  </p>
                  <div className="w-full grid grid-cols-3 gap-2 border-t border-slate-700 pt-5">
                    <div className="flex flex-col items-center">
                      <Flame className="w-5 h-5 text-red-400 mb-1" />
                      <span className="text-[10px] text-slate-400 font-bold">منع الحريق</span>
                    </div>
                    <div className="flex flex-col items-center border-x border-slate-700 px-1">
                      <Droplet className="w-5 h-5 text-blue-400 mb-1" />
                      <span className="text-[10px] text-slate-400 font-bold">أمان كيميائي</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <Zap className="w-5 h-5 text-yellow-400 mb-1" />
                      <span className="text-[10px] text-slate-400 font-bold">منع الانفجار</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row items-center gap-10">
              <div className="flex-1 text-center lg:text-right">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 mb-6 border border-blue-500/20 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  وظيفة شاغرة تخصصية • إدارة التسويق
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-6">
                  مرحباً بك في بوابة التقديم على وظيفة
                  <span className="block text-transparent bg-clip-text bg-gradient-to-l from-blue-400 to-indigo-400 mt-2 font-black">
                    أخصائي تسويق (Marketing Specialist)
                  </span>
                </h2>
                <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-8 max-w-2xl font-light">
                  نبحث في إدارة التسويق بمصنع جدة للدهانات والمعاجين عن كفاءة تسويقية مبدعة لتخطيط وتنفيذ الحملات وإدارة الهوية الرقمية، ومتابعة تسجيل واعتمادات الشركة لدى منصات الموردين والجهات الحكومية والخاصة.
                </p>
                <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                  <button
                    onClick={() => onStartApply('marketing')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm md:text-base px-8 py-3.5 rounded-xl shadow-md transition-all active:scale-95"
                    id="hero-start-apply-mkt-btn"
                  >
                    ابدأ التقديم المباشر
                  </button>
                  <a
                    href={`https://wa.me/966537375580?text=${encodeURIComponent('السلام عليكم، عندي استفسار بخصوص وظيفة أخصائي تسويق')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm md:text-base px-6 py-3.5 rounded-xl shadow-md transition-all active:scale-95"
                  >
                    <MessageCircle className="w-5 h-5" />
                    تواصل معنا عبر الواتساب
                  </a>
                </div>
              </div>

              {/* Graphical Marketing badge side */}
              <div className="w-full lg:w-80 flex justify-center">
                <div className="relative bg-slate-800/40 p-8 rounded-2xl border border-slate-700/60 shadow-xl backdrop-blur-sm flex flex-col items-center text-center max-w-sm">
                  <div className="absolute -top-6 bg-blue-600 p-4 rounded-xl shadow-lg text-white">
                    <Megaphone className="w-8 h-8" />
                  </div>
                  <div className="mt-8 mb-4">
                    <span className="text-xs text-blue-400 font-bold uppercase tracking-widest block mb-1">MARKETING & GROWTH</span>
                    <h3 className="text-lg font-bold text-white">تعزيز حضور العلامة التجارية</h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed mb-6 font-light">
                    نصنع الحماية بجودة دهاناتنا، ونسعى لتوظيف من يروي قصة تميزنا ويرسخ مكانتنا الريادية في الأسواق.
                  </p>
                  <div className="w-full grid grid-cols-3 gap-2 border-t border-slate-700 pt-5">
                    <div className="flex flex-col items-center">
                      <Sparkles className="w-5 h-5 text-indigo-400 mb-1" />
                      <span className="text-[10px] text-slate-400 font-bold">صناعة المحتوى</span>
                    </div>
                    <div className="flex flex-col items-center border-x border-slate-700 px-1">
                      <Target className="w-5 h-5 text-yellow-400 mb-1" />
                      <span className="text-[10px] text-slate-400 font-bold">حملات رقمية</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <Award className="w-5 h-5 text-emerald-400 mb-1" />
                      <span className="text-[10px] text-slate-400 font-bold">تسجيل واعتمادات</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Content Layout */}
      <main className="max-w-6xl mx-auto py-12 px-4 md:px-6" id="job-details">
        
        {/* Company Brief Card & Objective */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Company Brief Card */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-blue-900 border-b border-slate-100 pb-4 mb-4 flex items-center gap-2">
                <Award className="text-blue-900 w-5 h-5 shrink-0" />
                نبذة عن الشركة
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed mb-4 font-light">
                مصنع جدة للدهانات شركة سعودية بالكامل، تأسس منذ أكثر من 40 عاماً ويقع في حي الرحاب بجدة. يمتد المصنع على مساحة تزيد عن 20,000 متر مربع، ويجمع بين أحدث تقنيات التوزيع الألمانية والمواد الخام عالية الجودة لإنتاج دهانات تتحمل الظروف المناخية القاسية في منطقة الخليج.
              </p>
              <p className="text-slate-600 text-xs leading-relaxed font-light">
                نحن لا نكتفي بخلط الدهانات، بل نصنع الحماية. من الأبراج التجارية الشاهقة في الرياض إلى المستودعات الصناعية في الدمام، صُممت طلاءاتنا لتوفير المتانة والتغطية الكاملة وسهولة الاستخدام.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="flex items-start gap-2.5">
                <MapPin className="text-slate-400 w-5 h-5 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase">عنوان وموقع المصنع</h4>
                  <p className="text-xs font-semibold">
                    <a
                      href="https://maps.app.goo.gl/1htzCJMahE5mh2AJA"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-500 hover:underline hover:text-orange-600 font-bold flex items-center gap-1"
                    >
                      حي الرحاب، جدة (انقر لفتح الخريطة 🗺️)
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Job Objective Card */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-blue-900 border-b border-slate-100 pb-4 mb-4 flex items-center gap-2">
                <FileText className="text-blue-900 w-5 h-5 shrink-0" />
                {activeTab === 'hse' ? 'الهدف الوظيفي والرسالة (HSE)' : 'الهدف الوظيفي والرسالة (التسويق)'}
              </h3>
              
              {activeTab === 'hse' ? (
                <div className="bg-orange-50 border-r-4 border-orange-500 p-5 rounded-xl mb-4">
                  <p className="text-orange-950 text-xs md:text-sm leading-relaxed font-semibold">
                    "الإشراف الشامل على صالات الإنتاج والمستودعات والتحكم في المخاطر الكيميائية والفيزيائية والفيزيوميكانيكية، وتطبيق نظام صارم للوقاية من الحريق وتأمين ممارسات العمل لضمان صفر حوادث وإصابات وبيئة تشغيل مستدامة تطبق معايير الجودة والصحة والسلامة والبيئة."
                  </p>
                </div>
              ) : (
                <div className="bg-blue-50 border-r-4 border-blue-600 p-5 rounded-xl mb-4">
                  <p className="text-blue-950 text-xs md:text-sm leading-relaxed font-semibold">
                    "تخطيط وتنفيذ الأنشطة والحملات التسويقية بما يعزز حضور الشركة في السوق، ويدعم تحقيق أهداف المبيعات، وإدارة قنوات التواصل الرقمي، والمحافظة على الهوية المؤسسية، بالإضافة إلى متابعة تسجيل الشركة وتحديث بياناتها في منصات الاعتمادات والجهات ذات العلاقة."
                  </p>
                </div>
              )}

              <div className="mt-6">
                <h4 className="text-xs font-bold text-slate-800 mb-3">تفاصيل سريعة عن الفرصة:</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150 flex items-center gap-3">
                    <Clock className="w-5 h-5 text-slate-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">طبيعة الدوام</span>
                      <span className="text-xs font-bold text-slate-700">كامل (حضوري بمقر الشركة بجدة)</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150 flex items-center gap-3">
                    <Award className="w-5 h-5 text-slate-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">القسم</span>
                      <span className="text-xs font-bold text-slate-700">{activeTab === 'hse' ? 'إدارة الصحة والسلامة' : 'إدارة التسويق'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between gap-4 mt-6">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-slate-800 rounded-lg text-yellow-400">💰</span>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">الراتب الأساسي التقريبي</span>
                  <span className="text-sm font-black">{activeTab === 'hse' ? 'من 4500 إلى 6000 ريال' : '5500 ريال'}</span>
                </div>
              </div>
              <button
                onClick={() => onStartApply(activeTab)}
                className={`text-white font-bold text-xs py-2 px-5 rounded-lg transition-all ${
                  activeTab === 'hse' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                قدّم الآن
              </button>
            </div>
          </div>
        </div>

        {/* Detailed Job Duties and Qualifications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          
          {/* Duties Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-blue-900 border-b border-slate-100 pb-4 mb-6 flex items-center gap-2">
              {activeTab === 'hse' ? (
                <>
                  <Shield className="text-blue-900 w-5 h-5 shrink-0" />
                  المهام والمسؤوليات الوظيفية (HSE)
                </>
              ) : (
                <>
                  <Megaphone className="text-blue-900 w-5 h-5 shrink-0" />
                  المهام والمسؤوليات الوظيفية (أخصائي تسويق)
                </>
              )}
            </h3>
            
            <ul className="space-y-3.5 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {activeTab === 'hse' ? (
                [
                  "التفتيش والرقابة الدورية اليومية على صالات خلط الدهانات ومستودعات الكيماويات للتأكد من عدم وجود تسريبات أو انبعاثات ضارة.",
                  "مراقبة والتحقق من سلامة توصيلات التأريض الأرضي (Grounding) لمنع تراكم الكهرباء الساكنة المسببة للشرر والحرائق الكيميائية.",
                  "مراجعة وتحديث صحائف بيانات السلامة للمواد (SDS) بشكل مستمر وتثبيتها بجانب صالات التخزين والإنتاج وتدريب العمال عليها.",
                  "الإشراف والرقابة الكاملة على تصاريح العمل (Permit to Work) بمختلف أنواعها (أعمال ساخنة، أماكن مغلقة، مرتفعات، عزل طاقة).",
                  "التحقيق والتقصي الفني في الحوادث وشبه الحوادث (Near Misses) وتحديد الأسباب الجذرية ورفع تقارير CAPA للإدارة.",
                  "إعداد ومتابعة خطط مكافحة الانسكاب الكيميائي وتدريب فرق الاستجابة السريعة وتوفير Spill Kits في مواقع العمل الحرجة."
                ].map((duty, index) => (
                  <li key={index} className="flex gap-3 text-slate-600 text-xs leading-relaxed font-light">
                    <span className="flex items-center justify-center bg-slate-150 text-slate-700 rounded-full w-5 h-5 shrink-0 font-bold text-[10px] mt-0.5">
                      {index + 1}
                    </span>
                    <span>{duty}</span>
                  </li>
                ))
              ) : (
                [
                  "إعداد وتنفيذ الخطة التسويقية السنوية بالتنسيق مع الإدارة العليا للمصنع.",
                  "إدارة حسابات الشركة على جميع منصات التواصل الاجتماعي (LinkedIn، X، Instagram، Facebook، TikTok وغيرها).",
                  "إعداد ونشر المحتوى التسويقي وفق خطة نشر دورية معتمدة.",
                  "كتابة المحتوى التسويقي والإعلاني المبتكر بما يتوافق مع هوية الشركة وقوتها في السوق.",
                  "التنسيق مع المصممين والمصورين لإنتاج المواد التسويقية المتميزة والمحتوى البصري الجذاب.",
                  "إدارة الحملات الإعلانية الرقمية الممولة ومتابعة نتائجها وتحسين أدائها باستمرار لتوليد عملاء جدد.",
                  "متابعة مؤشرات الأداء (KPIs) للحملات التسويقية وإعداد التقارير الدورية التحليلية للإدارة.",
                  "الرد على استفسارات العملاء الواردة عبر منصات التواصل الاجتماعي أو تحويلها للإدارة المختصة.",
                  "متابعة التقييمات والتعليقات والعمل على تحسين صورة الشركة الرقمية والذهنية.",
                  "تحديث الموقع الإلكتروني للمصنع بمحتوى المنتجات والأخبار والإعلانات والكتالوجات.",
                  "متابعة تسجيل الشركة وتحديث بياناتها في منصات الاعتمادات الحكومية والخاصة ومنصات الموردين (مثل بلدي، سابر، سدايا، اعتماد وغيرها).",
                  "متابعة مواعيد تجديد الاعتمادات والشهادات الفنية والوثائق الخاصة بالشركة والمصنع.",
                  "التنسيق مع الإدارات الداخلية (المبيعات، الإنتاج، الجودة) لتوفير المستندات المطلوبة للاعتمادات والتسجيل.",
                  "إعداد العروض التقديمية والكتيبات والبروشورات والمواد التسويقية المتكاملة.",
                  "إجراء دراسات مبسطة للسوق وتحليل المنافسين في قطاع الدهانات والطلاء واقتراح فرص تطوير.",
                  "المساهمة الفعالة في إطلاق المنتجات الجديدة ووضع خطط تسويقية وإعلانية فريدة لها."
                ].map((duty, index) => (
                  <li key={index} className="flex gap-3 text-slate-600 text-xs leading-relaxed font-light">
                    <span className="flex items-center justify-center bg-blue-100 text-blue-800 rounded-full w-5 h-5 shrink-0 font-bold text-[10px] mt-0.5">
                      {index + 1}
                    </span>
                    <span>{duty}</span>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Qualifications & Benefits Card */}
          <div className="flex flex-col gap-8">
            
            {/* Qualifications */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex-1">
              <h3 className="text-base font-bold text-blue-900 border-b border-slate-100 pb-4 mb-6 flex items-center gap-2">
                <Award className="text-blue-900 w-5 h-5 shrink-0" />
                المؤهلات والشروط المطلوبة
              </h3>
              <ul className="space-y-3">
                {activeTab === 'hse' ? (
                  [
                    "درجة البكالوريوس في الهندسة الكيميائية، هندسة السلامة، علوم البيئة، أو تخصص علمي مماثل.",
                    "خبرة عملية لا تقل عن سنتين (2) في المصانع الكيميائية، تكرير النفط، أو مصانع الطلاء والدهانات.",
                    "شهادة مهنية دولية معتمدة مثل NEBOSH IGC أو شهادة OSHA 30-Hour المتقدمة.",
                    "معرفة قوية بمتطلبات السلامة العامة والحرائق الكيميائية وإدارة معايير ISO 45001.",
                    "مهارات ممتازة في الاتصال وحل المشكلات والقدرة على التدريب وكتابة التقارير باللغتين العربية والإنجليزية."
                  ].map((req, index) => (
                    <li key={index} className="flex items-start gap-3 text-slate-600 text-xs leading-relaxed font-light">
                      <CheckCircle className="text-orange-500 w-4 h-4 mt-0.5 shrink-0 animate-pulse" />
                      <span>{req}</span>
                    </li>
                  ))
                ) : (
                  [
                    "درجة البكالوريوس في التسويق أو إدارة الأعمال أو الإعلام أو أي تخصص ذي صلة.",
                    "خبرة عملية لا تقل عن سنتين (2) في مجال التسويق وإدارة قنوات الاتصال الرقمي.",
                    "خبرة قوية ومثبتة في إدارة حسابات التواصل الاجتماعي الاحترافية وصناعة المحتوى.",
                    "معرفة عميقة بأدوات التسويق الرقمي الحديثة وإدارة وتحسين الحملات الإعلانية الممولة.",
                    "يفضل بشكل كبير الإلمام بمنصات الاعتمادات ومنصات الموردين الحكومية والخاصة والمناقصات.",
                    "إجادة تامة لاستخدام برامج Microsoft Office والتعامل مع التقارير البيانية وتحليل البيانات.",
                    "الإلمام الجيد ببرامج التصميم السريعة مثل Canva أو Adobe Photoshop لإنتاج مواد تسويقية سريعة.",
                    "ملم بمهارات ممتازة في التواصل الفعال، إدارة الوقت والتعاون البناء مع الإدارات والمصممين."
                  ].map((req, index) => (
                    <li key={index} className="flex items-start gap-3 text-slate-600 text-xs leading-relaxed font-light">
                      <CheckCircle className="text-blue-600 w-4 h-4 mt-0.5 shrink-0 animate-pulse" />
                      <span>{req}</span>
                    </li>
                  ))
                )}
              </ul>
              
              {/* Marketing Skills Badge Panel */}
              {activeTab === 'marketing' && (
                <div className="mt-6 pt-5 border-t border-slate-100">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-3">المهارات والقدرات المطلوبة:</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {["التخطيط والتنظيم", "الإبداع والابتكار", "كتابة المحتوى التسويقي", "تحليل الحملات والـ KPIs", "منصات الاعتمادات", "إدارة السوشيال ميديا", "مهارات التنسيق", "العمل تحت الضغط"].map((skill, index) => (
                      <span key={index} className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-slate-200">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Work Environment & Benefits Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-base font-bold text-blue-900 border-b border-slate-100 pb-4 mb-6 flex items-center gap-2">
                <Clock className="text-blue-900 w-5 h-5 shrink-0" />
                تفاصيل وبيئة العمل الموفرة طبقاً لنظام العمل السعودي
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-slate-600 text-xs leading-relaxed">
                  <CheckCircle className={`w-4 h-4 mt-0.5 shrink-0 ${activeTab === 'hse' ? 'text-orange-500' : 'text-blue-600'}`} />
                  <div>
                    <span className="font-bold text-slate-800 block mb-0.5">الراتب التقريبي والمزايا المالية:</span>
                    <span className="text-slate-600 font-light">
                      {activeTab === 'hse' ? 'من 4500 ريال إلى 6000 ريال شهرياً كراتب أساسي ومحفزات.' : '5500 ريال راتب أساسي متكامل.'}
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3 text-slate-600 text-xs leading-relaxed">
                  <CheckCircle className={`w-4 h-4 mt-0.5 shrink-0 ${activeTab === 'hse' ? 'text-orange-500' : 'text-blue-600'}`} />
                  <div>
                    <span className="font-bold text-slate-800 block mb-0.5">أيام العمل في الأسبوع:</span>
                    <span className="text-slate-600 font-light">6 أيام عمل في الأسبوع (يوم الإجازة الأسبوعية المعتمد هو الجمعة).</span>
                  </div>
                </li>
                <li className="flex items-start gap-3 text-slate-600 text-xs leading-relaxed">
                  <CheckCircle className={`w-4 h-4 mt-0.5 shrink-0 ${activeTab === 'hse' ? 'text-orange-500' : 'text-blue-600'}`} />
                  <div>
                    <span className="font-bold text-slate-800 block mb-0.5">ساعات العمل اليومية:</span>
                    <span className="text-slate-600 font-light">9 ساعات عمل في اليوم تتضمن ساعة كاملة للراحة والبريك والصلوات.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3 text-slate-600 text-xs leading-relaxed">
                  <CheckCircle className={`w-4 h-4 mt-0.5 shrink-0 ${activeTab === 'hse' ? 'text-orange-500' : 'text-blue-600'}`} />
                  <div>
                    <span className="font-bold text-slate-800 block mb-0.5">الإجازة السنوية:</span>
                    <span className="text-slate-600 font-light font-semibold">21 يوم إجازة سنوية مدفوعة الأجر بالكامل طبقاً لنظام العمل السعودي.</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Start Apply Section Button Callout */}
        <div className="bg-white p-8 md:p-12 rounded-2xl border border-slate-200 shadow-sm text-center max-w-4xl mx-auto">
          {activeTab === 'hse' ? (
            <>
              <Shield className="w-12 h-12 text-orange-500 mx-auto mb-6" />
              <h3 className="text-xl md:text-2xl font-bold text-blue-900 mb-4">هل أنت جاهز لتأمين وتطوير منظومة السلامة معنا؟</h3>
              <p className="text-slate-500 text-xs max-w-2xl mx-auto mb-8 leading-relaxed font-light">
                بوابة التقديم تتطلب تعبئة بياناتك الشخصية والخبرات والشهادات بدقة، تليها أسئلة اختبار فني ومقالي لقياس فهمك لمخاطر مصانع الدهانات. سيتم تحليل طلبك فورياً عبر محرك الذكاء الاصطناعي وتقديمه للمراجعة البشرية.
              </p>
              <button
                onClick={() => onStartApply('hse')}
                className="inline-flex items-center gap-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-10 py-4 rounded-xl shadow-md transition-all active:scale-95"
                id="bottom-apply-hse-btn"
              >
                ابدأ تعبئة طلب التقديم (HSE) الآن
                <Send className="w-4 h-4 rotate-180" />
              </button>
            </>
          ) : (
            <>
              <Megaphone className="w-12 h-12 text-blue-600 mx-auto mb-6 animate-bounce" />
              <h3 className="text-xl md:text-2xl font-bold text-blue-900 mb-4">هل تمتلك مهارة تسويقية فريدة قادرة على قيادة الهوية الرقمية للمصنع؟</h3>
              <p className="text-slate-500 text-xs max-w-2xl mx-auto mb-8 leading-relaxed font-light">
                يتطلب نموذج التقديم لطلب وظيفة أخصائي تسويق إدخال تفاصيل خبرتك في السوشيال ميديا والحملات الرقمية، يليه اختبار فني ومقالي مكون من 10 أسئلة مخصصة لمهام المحتوى والتسويق والاعتمادات الرسمية لدى الجهات.
              </p>
              <button
                onClick={() => onStartApply('marketing')}
                className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-10 py-4 rounded-xl shadow-md transition-all active:scale-95"
                id="bottom-apply-mkt-btn"
              >
                ابدأ تعبئة طلب التقديم (أخصائي تسويق) الآن
                <Send className="w-4 h-4 rotate-180" />
              </button>
            </>
          )}
        </div>
      </main>

      {/* Corporate Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800 text-center text-[10px]">
        <p className="mb-2 font-bold text-slate-300">جميع الحقوق محفوظة © {new Date().getFullYear()} شركة مصنع جدة للدهانات والمعاجين</p>
        <p className="text-slate-500 mb-2 font-light">تم تصميم وتطوير الموقع بواسطة عبدالرحمن سالم باشنيني • 0599222345</p>
        <p className="text-slate-600 font-light">نظام التوظيف والتقييم الإلكتروني المتكامل بالذكاء الاصطناعي • بوابة التوظيف الرقمية</p>
      </footer>

      {/* Floating WhatsApp Button */}
      <a
        href={`https://wa.me/966537375580?text=${encodeURIComponent(
          activeTab === 'hse' 
            ? 'السلام عليكم، عندي استفسار بخصوص وظيفة أخصائي صحة وسلامة وبيئة (HSE)'
            : 'السلام عليكم، عندي استفسار بخصوص وظيفة أخصائي تسويق'
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-50 bg-emerald-500 hover:bg-emerald-600 text-white p-3.5 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 group"
        title="تواصل معنا عبر الواتساب"
      >
        <MessageCircle className="w-6 h-6 animate-pulse" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:mr-2 transition-all duration-300 ease-out whitespace-nowrap text-xs font-bold">
          تواصل معنا بالواتساب
        </span>
      </a>
    </div>
  );
}
