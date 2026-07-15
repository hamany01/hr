const fs = require('fs');
let server = fs.readFileSync('api/server.ts', 'utf8');

server = server.replace(
  'await syncApplicantToSupabase(applicants[index]);\n  res.json({ success: true, applicant: applicants[index] });\n});',
  'await syncApplicantToSupabase(applicants[index]);\n  writeLog("تحديث طلب", `تم تحديث التقييم أو حالة الطلب (الحالة الجديدة: ${status || "بدون تغيير"})`, req.params.id, (req as any).adminEmail);\n  res.json({ success: true, applicant: applicants[index] });\n});'
);

fs.writeFileSync('api/server.ts', server);
