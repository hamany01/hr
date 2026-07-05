import React from 'react';
import { Shield, FileText, Calendar, MapPin, Award, CheckCircle, Clock, Star, Flame, Droplet, Zap, MessageCircle } from 'lucide-react';

interface HomeProps {
  onStartApply: () => void;
  onGoToAdmin: () => void;
}

export default function Home({ onStartApply, onGoToAdmin }: HomeProps) {
  return (
    <div className="w-full bg-slate-50" id="home-view">
      {/* Redundant header removed because global sticky header is already present in App.tsx */}

      {/* Hero Banner Section with Custom CSS Graphic Vibe */}
      <section className="relative overflow-hidden bg-slate-900 text-white py-16 px-6 md:px-12 md:py-20 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent opacity-60"></div>
        
        {/* Subtle decorative grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35"></div>

        <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 text-center md:text-right">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 mb-6 border border-blue-500/20 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              وظيفة شاغرة تخصصية
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-6">
              مرحباً بك في بوابة التقديم على وظيفة
              <span className="block text-transparent bg-clip-text bg-gradient-to-l from-orange-400 to-amber-500 mt-2">
                أخصائي صحة وسلامة وبيئة (HSE)
              </span>
            </h2>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-8 max-w-2xl font-light">
              نحن في شركة مصنع جدة للدهانات والمعاجين نقدر العقول الواعية التي تسعى لتأمين بيئة عمل خالية من الحوادث. انضم إلينا لقيادة منظومة الأمان والسلامة الصناعية في أحد أعرق مصانع الدهانات والطلاء في المنطقة بجدة.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <button
                onClick={onStartApply}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-base px-8 py-3 rounded-lg shadow-md transition-all active:scale-95"
                id="hero-start-apply-btn"
              >
                ابدأ التقديم المباشر
              </button>
              <a
                href={`https://wa.me/966537375580?text=${encodeURIComponent('السلام عليكم، عندي استفسار بخصوص وظيفة أخصائي صحة وسلامة وبيئة (HSE)')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base px-6 py-3 rounded-lg shadow-md transition-all active:scale-95"
              >
                <MessageCircle className="w-5 h-5" />
                تواصل معنا عبر الواتساب
              </a>
              <a
                href="#job-details"
                className="bg-slate-850 hover:bg-slate-800 text-slate-200 hover:text-white font-semibold text-base px-6 py-3 rounded-lg border border-slate-700 transition-all"
              >
                تفاصيل الوظيفة
              </a>
            </div>
          </div>

          {/* Graphical Safety badge side */}
          <div className="w-full md:w-80 flex justify-center">
            <div className="relative bg-slate-800/40 p-8 rounded-2xl border border-slate-700/60 shadow-xl backdrop-blur-sm flex flex-col items-center text-center max-w-sm">
              <div className="absolute -top-6 bg-blue-900 p-4 rounded-xl shadow-lg text-white">
                <Shield className="w-8 h-8" />
              </div>
              <div className="mt-8 mb-4">
                <span className="text-xs text-blue-400 font-bold uppercase tracking-widest block mb-1">SAFETY FIRST</span>
                <h3 className="text-lg font-bold text-white">السلامة أولاً ودائماً</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-6 font-light">
                شعارنا الدائم في المصنع ونسعى لتوظيف من يتمتع برؤية صارمة ومبتكرة لحماية الأرواح والمنشآت.
              </p>
              <div className="w-full grid grid-cols-3 gap-2 border-t border-slate-700 pt-5">
                <div className="flex flex-col items-center">
                  <Flame className="w-5 h-5 text-red-400 mb-1" />
                  <span className="text-[10px] text-slate-400">منع الحريق</span>
                </div>
                <div className="flex flex-col items-center border-x border-slate-700 px-1">
                  <Droplet className="w-5 h-5 text-blue-400 mb-1" />
                  <span className="text-[10px] text-slate-400">أمان كيميائي</span>
                </div>
                <div className="flex flex-col items-center">
                  <Zap className="w-5 h-5 text-yellow-400 mb-1" />
                  <span className="text-[10px] text-slate-400">منع الانفجار</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <main className="max-w-6xl mx-auto py-12 px-4 md:px-6" id="job-details">
        {/* Company and Position Intro */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Company Brief Card */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-blue-900 border-b border-slate-100 pb-4 mb-4 flex items-center gap-2">
              <Award className="text-blue-900 w-5 h-5" />
              نبذة عن الشركة
            </h3>
            <p className="text-slate-600 text-xs leading-relaxed mb-4">
              مصنع جدة للدهانات شركة سعودية بالكامل، تأسس منذ أكثر من 40 عاماً ويقع في حي الرحاب بجدة. يمتد المصنع على مساحة تزيد عن 20,000 متر مربع، ويجمع بين أحدث تقنيات التوزيع الألمانية والمواد الخام عالية الجودة لإنتاج دهانات تتحمل الظروف المناخية القاسية في منطقة الخليج.
            </p>
            <p className="text-slate-600 text-xs leading-relaxed">
              نحن لا نكتفي بخلط الدهانات، بل نصنع الحماية. من الأبراج التجارية الشاهقة في الرياض إلى المستودعات الصناعية في الدمام، صُممت طلاءاتنا لتوفير المتانة والتغطية الكاملة وسهولة الاستخدام.
            </p>
          </div>

          {/* Job Objective Card */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-blue-900 border-b border-slate-100 pb-4 mb-4 flex items-center gap-2">
              <FileText className="text-blue-900 w-5 h-5" />
              الهدف الوظيفي والرسالة
            </h3>
            <div className="bg-orange-50 border-r-4 border-orange-500 p-4 rounded-xl mb-4">
              <p className="text-orange-950 text-xs leading-relaxed font-medium">
                "الإشراف الشامل على صالات الإنتاج والمستودعات والتحكم في المخاطر الكيميائية والفيزيائية والفيزيوميكانيكية، وتطبيق نظام صارم للوقاية من الحريق وتأمين ممارسات العمل لضمان صفر حوادث وإصابات وبيئة تشغيل مستدامة تطبق معايير الجودة والصحة والسلامة والبيئة."
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 mt-6">
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
        </div>

        {/* Detailed Job Duties and Qualifications */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Duties Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-blue-900 border-b border-slate-100 pb-4 mb-6 flex items-center gap-2">
              <Shield className="text-blue-900 w-5 h-5" />
              المهام والمسؤوليات الوظيفية
            </h3>
            <ul className="space-y-4">
              {[
                "التفتيش والرقابة الدورية اليومية على صالات خلط الدهانات ومستودعات الكيماويات للتأكد من عدم وجود تسريبات أو انبعاثات ضارة.",
                "مراقبة والتحقق من سلامة توصيلات التأريض الأرضي (Grounding) لمنع تراكم الكهرباء الساكنة المسببة للشرر والحرائق الكيميائية.",
                "مراجعة وتحديث صحائف بيانات السلامة للمواد (SDS) بشكل مستمر وتثبيتها بجانب صالات التخزين والإنتاج وتدريب العمال عليها.",
                "الإشراف والرقابة الكاملة على تصاريح العمل (Permit to Work) بمختلف أنواعها (أعمال ساخنة، أماكن مغلقة، مرتفعات، عزل طاقة).",
                "التحقيق والتقصي الفني في الحوادث وشبه الحوادث (Near Misses) وتحديد الأسباب الجذرية ورفع تقارير CAPA للإدارة.",
                "إعداد ومتابعة خطط مكافحة الانسكاب الكيميائي وتدريب فرق الاستجابة السريعة وتوفير Spill Kits في مواقع العمل الحرجة."
              ].map((duty, index) => (
                <li key={index} className="flex gap-3 text-slate-600 text-xs leading-relaxed">
                  <span className="flex items-center justify-center bg-slate-150 text-slate-700 rounded-full w-5 h-5 shrink-0 font-bold text-[10px] mt-0.5">
                    {index + 1}
                  </span>
                  <span>{duty}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Qualifications & Benefits Card */}
          <div className="flex flex-col gap-8">
            {/* Qualifications */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex-1">
              <h3 className="text-base font-bold text-blue-900 border-b border-slate-100 pb-4 mb-6 flex items-center gap-2">
                <Award className="text-blue-900 w-5 h-5" />
                المؤهلات والشروط المطلوبة
              </h3>
              <ul className="space-y-3.5">
                {[
                  "درجة البكالوريوس في الهندسة الكيميائية، هندسة السلامة، علوم البيئة، أو تخصص علمي مماثل.",
                  "خبرة عملية لا تقل عن سنتين (2) في المصانع الكيميائية، تكرير النفط، أو مصانع الطلاء والدهانات.",
                  "شهادة مهنية دولية معتمدة مثل NEBOSH IGC أو شهادة OSHA 30-Hour المتقدمة.",
                  "معرفة قوية بمتطلبات السلامة العامة والحرائق الكيميائية وإدارة معايير ISO 45001.",
                  "مهارات ممتازة في الاتصال وحل المشكلات والقدرة على التدريب وكتابة التقارير باللغتين العربية والإنجليزية."
                ].map((req, index) => (
                  <li key={index} className="flex items-start gap-3 text-slate-600 text-xs leading-relaxed">
                    <CheckCircle className="text-blue-600 w-4 h-4 mt-0.5 shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Work Environment & Benefits Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-base font-bold text-blue-900 border-b border-slate-100 pb-4 mb-6 flex items-center gap-2">
                <Clock className="text-blue-900 w-5 h-5" />
                تفاصيل وبيئة العمل الموفرة
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-slate-600 text-xs leading-relaxed">
                  <CheckCircle className="text-blue-600 w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 block mb-0.5">الراتب التقريبي والمزايا المالية:</span>
                    <span className="text-slate-600">من 4500 ريال إلى 6000 ريال شهرياً.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3 text-slate-600 text-xs leading-relaxed">
                  <CheckCircle className="text-blue-600 w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 block mb-0.5">أيام العمل في الأسبوع:</span>
                    <span className="text-slate-600">6 أيام عمل في الأسبوع (يوم الإجازة الأسبوعية هو الجمعة).</span>
                  </div>
                </li>
                <li className="flex items-start gap-3 text-slate-600 text-xs leading-relaxed">
                  <CheckCircle className="text-blue-600 w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 block mb-0.5">ساعات العمل اليومية:</span>
                    <span className="text-slate-600">9 ساعات عمل في اليوم تتضمن ساعة كاملة للراحة والبريك.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3 text-slate-600 text-xs leading-relaxed">
                  <CheckCircle className="text-blue-600 w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 block mb-0.5">الإجازة السنوية:</span>
                    <span className="text-slate-600">21 يوم إجازة سنوية مدفوعة الأجر طبقاً لنظام العمل السعودي.</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Start Apply Section Button Callout */}
        <div className="bg-white p-8 md:p-12 rounded-2xl border border-slate-200 shadow-sm text-center max-w-4xl mx-auto">
          <Shield className="w-12 h-12 text-blue-900 mx-auto mb-6" />
          <h3 className="text-xl md:text-2xl font-bold text-blue-900 mb-4">هل أنت جاهز لتأمين وتطوير منظومة السلامة معنا؟</h3>
          <p className="text-slate-500 text-xs max-w-2xl mx-auto mb-8 leading-relaxed font-light">
            بوابة التقديم تتطلب تعبئة بياناتك الشخصية والخبرات والشهادات بدقة، تليها أسئلة اختبار فني ومقالي لقياس فهمك لمخاطر مصانع الدهانات. سيتم تحليل طلبك فورياً عبر محرك الذكاء الاصطناعي وتقديمه للمراجعة البشرية.
          </p>
          <button
            onClick={onStartApply}
            className="inline-flex items-center gap-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-10 py-4 rounded-lg shadow-md transition-all active:scale-95"
            id="bottom-apply-btn"
          >
            ابدأ تعبئة طلب التقديم الآن
          </button>
        </div>
      </main>

      {/* Corporate Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800 text-center text-[10px]">
        <p className="mb-2 font-bold text-slate-300">جميع الحقوق محفوظة © 2026 شركة مصنع جدة للدهانات والمعاجين</p>
        <p className="text-slate-500 mb-2">تم تصميم الموقع بواسطة عبدالرحمن سالم باشنيني • 0599222345</p>
        <p className="text-slate-600">نظام إدارة السلامة والصحة المهنية والبيئية المتكامل • بوابة التوظيف الإلكترونية</p>
      </footer>

      {/* Floating WhatsApp Button */}
      <a
        href={`https://wa.me/966537375580?text=${encodeURIComponent('السلام عليكم، عندي استفسار بخصوص وظيفة أخصائي صحة وسلامة وبيئة (HSE)')}`}
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
