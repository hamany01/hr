const fs = require('fs');

let file = fs.readFileSync('src/components/ApplicationForm.tsx', 'utf8');

const combinedQuestions = `
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
`;

const separateQuestions = `
                      {/* Is Jeddah Resident */}
                      <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-150">
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
                              onChange={() => setPersonalInfo(prev => ({ ...prev, isJeddahResident: 'no' }))}
                              className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                            />
                            <span className="text-xs font-semibold text-slate-800">لا</span>
                          </label>
                        </div>
                      </div>

                      {/* Has Car and License */}
                      <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-150">
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
`;

if (file.includes('هل أنت من سكان مدينة جدة')) {
  // Normalize whitespace to match
  const fileMin = file.replace(/\s+/g, ' ');
  const combinedMin = combinedQuestions.replace(/\s+/g, ' ');
  if (fileMin.includes(combinedMin)) {
     // use string replace but be careful about whitespace
     // instead let's just do a regex replace
     file = file.replace(/\{\/\* Is Jeddah Resident \*\/\}[\s\S]*?\}\)[\s\S]*?<\/div>\s*\{\/\* Location Issue \(Admin Office map link for marketing\) \*\/\}/, separateQuestions + '\n                      {/* Location Issue (Admin Office map link for marketing) */}');
  }
}

// Update the setErrors(newErrors); if(Object.keys(newErrors).length > 0) ... to use setTimeout for the alert
// This gives React time to render the red error texts
file = file.replace(
  'setErrors(newErrors);\n    \n    if (Object.keys(newErrors).length > 0) {\n      alert("يرجى ملء كافة الحقول الإلزامية وتصحيح الأخطاء الموضحة باللون الأحمر للمتابعة.");\n      return false;\n    }',
  'setErrors(newErrors);\n    \n    if (Object.keys(newErrors).length > 0) {\n      setTimeout(() => {\n        alert("يرجى ملء كافة الحقول الإلزامية وتصحيح الأخطاء الموضحة باللون الأحمر للمتابعة.");\n      }, 100);\n      return false;\n    }'
);

file = file.replace(
  'setErrors(newErrors);\n    if (Object.keys(newErrors).length > 0) {\n      alert("يرجى ملء كافة الحقول الإلزامية وتصحيح الأخطاء الموضحة باللون الأحمر للمتابعة.");\n      return false;\n    }',
  'setErrors(newErrors);\n    if (Object.keys(newErrors).length > 0) {\n      setTimeout(() => {\n        alert("يرجى ملء كافة الحقول الإلزامية وتصحيح الأخطاء الموضحة باللون الأحمر للمتابعة.");\n      }, 100);\n      return false;\n    }'
);

// We must also fix validation logic to always check hasCarAndLicense for marketing
file = file.replace(
  "if (personalInfo.isJeddahResident === 'yes' && !personalInfo.hasCarAndLicense) {\n        newErrors.hasCarAndLicense = 'يرجى الإجابة على هذا السؤال';\n      }",
  "if (!personalInfo.hasCarAndLicense) {\n        newErrors.hasCarAndLicense = 'يرجى الإجابة على هذا السؤال';\n      }"
);

fs.writeFileSync('src/components/ApplicationForm.tsx', file);
