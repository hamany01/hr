const fs = require('fs');

let server = fs.readFileSync('api/server.ts', 'utf8');

// In /api/submit
server = server.replace(
  'await syncApplicantToSupabase(newApplicant);',
  'await syncApplicantToSupabase(newApplicant);\n    writeLog("تقديم طلب", `تقديم طلب توظيف جديد للمرشح: ${finalPersonalInfo.fullName}`, newId);'
);

// In /api/applicants/:id/schedule (candidate scheduling)
server = server.replace(
  'await syncApplicantToSupabase(applicants[index]);\n  res.json({ success: true, applicant: applicants[index] });\n});',
  'await syncApplicantToSupabase(applicants[index]);\n  writeLog("حجز موعد", `قام المرشح بحجز/تعديل موعد المقابلة إلى ${date} ${time}`, req.params.id);\n  res.json({ success: true, applicant: applicants[index] });\n});'
);

// In /api/admin/applicants/:id/status
server = server.replace(
  'await syncApplicantToSupabase(applicants[index]);\n  res.json({ success: true, applicant: applicants[index] });\n});',
  'await syncApplicantToSupabase(applicants[index]);\n  writeLog("تحديث حالة", `تم تحديث حالة المرشح إلى ${status}`, req.params.id, (req as any).adminEmail);\n  res.json({ success: true, applicant: applicants[index] });\n});'
);

// In /api/admin/applicants/:id DELETE
server = server.replace(
  'await deleteApplicantFromSupabase(req.params.id);\n\n  res.json({ success: true, message: "تم حذف طلب المتقدم بنجاح." });',
  'await deleteApplicantFromSupabase(req.params.id);\n  writeLog("حذف طلب", `تم حذف طلب التوظيف نهائياً`, req.params.id, (req as any).adminEmail);\n  res.json({ success: true, message: "تم حذف طلب المتقدم بنجاح." });'
);

fs.writeFileSync('api/server.ts', server);

