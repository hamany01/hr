export type ApplicationStatus = 'pending' | 'reviewing' | 'accepted' | 'rejected' | 'interview' | 'waitlist';

export interface PersonalInfo {
  fullName: string;
  nationality: string;
  birthDate: string;
  gender: string; // 'male' | 'female'
  city: string;
  residenceAddress: string; // Residential Address
  phone: string;
  email: string;
  qualification: string;
  major: string;
  experienceYears: number;
  currentCompany: string;
  currentRole: string;
  currentSalary: string;
  expectedSalary: string;
  noticePeriod: string;
  linkedinUrl?: string;
  ownsCar: string; // 'yes' | 'no'
  hasHealthIssues: string; // 'yes' | 'no'
  healthIssuesDetails?: string;
  hasLocationIssue: string; // 'yes' | 'no'
  hasKawaderLicense?: string; // 'yes' | 'no'
  kawaderLicenseBase64?: string;
  kawaderLicenseFileName?: string;
  cvBase64?: string;
  cvFileName?: string;
  certsBase64?: string;
  certsFileName?: string;
  adminDocuments?: AdminDocument[];
  additionalDocuments?: AdminDocument[];
}

export interface AdminDocument {
  id: string;
  name: string;
  fileName: string;
  base64: string;
  uploadedAt: string;
}

export interface IndustryExperience {
  workedInPaint: boolean;
  paintCompany?: string;
  paintYears?: number;
  paintRole?: string;
  paintTasks?: string;
  
  workedInChemical: boolean;
  chemicalCompany?: string;
  chemicalYears?: number;
  chemicalRole?: string;
  chemicalTasks?: string;

  workedInIndustrial: boolean;
  industrialCompany?: string;
  industrialYears?: number;
  industrialRole?: string;
  industrialTasks?: string;
}

export interface ProfessionalCertificates {
  nebosh: boolean;
  osha: boolean;
  iosh: boolean;
  iso45001: boolean;
  fireSafety: boolean;
  firstAid: boolean;
  hazop: boolean;
  hazmat: boolean;
  permitToWork: boolean;
  workingAtHeights: boolean;
  confinedSpace: boolean;
  forkliftSafety: boolean;
}

export interface ExamAnswers {
  q1_paint_risks: string;
  q2_hazard_vs_risk: string;
  q3_incident_investigation: string;
  q4_risk_assessment: string;
  q5_ppe_chemical: string;
  q6_sds_msds: string;
  q7_flammable_spill: string;
  q8_ppe_refusal: string;
  q9_daily_inspection: string;
  q10_safety_project: string;
}

export interface AiEvaluation {
  score: number;
  paintChemicalExpLevel: string; // 'high' | 'medium' | 'low' | 'none'
  strengths: string[];
  weaknesses: string[];
  suggestedQuestions: string[];
  recommendation: 'suitable' | 'suitable_after_interview' | 'unsuitable';
  recommendationReason: string;
  evaluatedAt: string;
}

export interface HrEvaluation {
  experienceRating: number;      // 0-10
  qualificationRating: number;   // 0-10
  certificatesRating: number;    // 0-10
  technicalRating: number;       // 0-10
  writingRating: number;         // 0-10
  languageRating: number;        // 0-10
  personalityRating: number;     // 0-10
  finalScore: number;            // 0-100 (calculated)
  notes: string;
  reviewedBy: string;
  reviewedAt: string;
}

export interface InterviewSchedule {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  type: string; // 'remote' or 'in_person'
  whatsappSent?: boolean;
}

export interface Applicant {
  id: string; // Application Number (e.g., HSE-2026-001)
  status: ApplicationStatus;
  createdAt: string;
  personalInfo: PersonalInfo;
  industryExperience: IndustryExperience;
  certificates: ProfessionalCertificates;
  examAnswers: ExamAnswers;
  aiEvaluation?: AiEvaluation;
  hrEvaluation?: HrEvaluation;
  interviewSchedule?: InterviewSchedule;
}

export interface DashboardStats {
  total: number;
  pending: number;
  reviewing: number;
  accepted: number;
  rejected: number;
  interview: number;
  waitlist: number;
  averageAiScore: number;
  databaseType?: "Supabase" | "Local";
  isSupabaseConnected?: boolean;
  supabaseUrl?: string;
}

export interface Admin {
  id: string;
  email: string;
  passwordHash: string; // sha256 hash of the password
  createdAt: string;
}
