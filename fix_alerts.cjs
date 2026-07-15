const fs = require('fs');

let file = fs.readFileSync('src/components/ApplicationForm.tsx', 'utf8');

file = file.replace(
  'setErrors(newErrors);\n    if (Object.keys(newErrors).length > 0) {\n      alert("يرجى إكمال تفاصيل الخبرات المهنية التي قمت بتفعيلها أولاً.");',
  'setErrors(newErrors);\n    if (Object.keys(newErrors).length > 0) {\n      setTimeout(() => {\n        alert("يرجى إكمال تفاصيل الخبرات المهنية التي قمت بتفعيلها أولاً.");\n      }, 100);'
);

file = file.replace(
  'setErrors(newErrors);\n    if (Object.keys(newErrors).length > 0) {\n      alert("يرجى الإجابة على جميع أسئلة الاختبار الفني بوضوح وبما لا يقل عن 15 حرفاً لكل سؤال لتفعيل التقييم الذكي التلقائي.");',
  'setErrors(newErrors);\n    if (Object.keys(newErrors).length > 0) {\n      setTimeout(() => {\n        alert("يرجى الإجابة على جميع أسئلة الاختبار الفني بوضوح وبما لا يقل عن 15 حرفاً لكل سؤال لتفعيل التقييم الذكي التلقائي.");\n      }, 100);'
);

fs.writeFileSync('src/components/ApplicationForm.tsx', file);
