# Product Requirements Document (PRD) - Smart AI Recruitment Platform

## 1. Project Overview
A comprehensive, professional recruitment platform designed for companies to manage hiring and filter candidates using Artificial Intelligence (AI). The platform features a scalable infrastructure (Supabase) and a strict **Arabic-only User Interface (RTL)**. It heavily focuses on reducing operational costs (API Tokens) by utilizing local AI solutions alongside cloud integrations.

---

## 2. User Roles & Permissions

### 1. Candidate
* Apply for available jobs.
* Upload Resumes/CVs (PDF, Word, Images).
* Answer customized job-specific questions (Up to 20 questions).
* Track application status and receive notifications.

### 2. Department Manager
* View candidates strictly applying for roles within their specific department.
* Review the automated AI evaluation (Scores & Rankings).
* Submit recommendations (Shortlist, Request Interview, Reject).

### 3. HR Manager
* Full CRUD operations for job postings.
* Import pre-generated question files (JSON/MD).
* Manage the candidate pipeline and WhatsApp notifications.
* Make final hiring decisions.

### 4. System Admin
* Manage system configurations.
* Manage roles and permissions for internal staff.

---

## 3. Job Management & Dynamic Question Import (Cost-Optimized)

To save on AI API costs within the platform, a hybrid job creation mechanism is utilized:
1. **Basic Data Entry:** HR enters standard data (Title, Description, Requirements, Salary, etc.) via the dashboard.
2. **External Question Generation:** The system provides a "Prompt Engineering Manual". HR copies this prompt into an external AI (like ChatGPT/Claude). The AI interacts with HR and outputs a `JSON` or `MD` file containing the interview questions.
3. **Question Import:** HR uploads this file to the platform. The platform parses the questions, saves them securely into the **Database (Supabase)**, and immediately deletes the uploaded file. This allows HR to seamlessly edit/delete questions via the standard UI moving forward.

---

## 4. AI Capabilities & Integration

### 1. CV Parsing (Local AI Worker) - Zero Token Cost
* To prevent massive cloud token consumption, a decoupled **Python Script (Local Agent)** will be developed to run on the company's local machines or a low-cost VPS.
* The script fetches uploaded CVs from the platform's storage, parses them using a local open-source LLM (e.g., Ollama).
* It returns the structured data via a secure webhook/API in `JSON` format directly to the platform's database.

### 2. Automated Smart Evaluation & Fallback Strategy (AI Routing)
* **Smart API Key Management:** The database contains a secure table storing an array of free or paid Cloud AI API Keys.
* **Sequential Fallback Mechanism:** When evaluating a candidate, the system sequentially tries the available keys. If a key hits a rate limit or fails (e.g., Error 429 or 401), it automatically catches the error and falls back to the next key in the list.
* **Local Server Fallback:** If all cloud API keys are exhausted or fail, the system automatically routes the evaluation task to the Local AI Worker (Python/Ollama) to ensure zero downtime.
* **Multi-Persona Prompting:** Used to ensure unbiased outputs (acting as HR Expert, Technical Lead, and Behavioral Analyst).
* **Restricted Output:** The AI will only output: A final Score, Candidate Ranking, Strengths, and Weaknesses.

---

## 5. Candidate Journey & WhatsApp Notifications

The platform will initially use dynamic direct WhatsApp links (`wa.me`) pre-filled with templates. This is architected to be easily upgradeable to the Meta WhatsApp Business API in the future.
The notification pipeline includes:
1. **Application Received:** Thank you for applying to [Job Title].
2. **Interview Invitation:** Details, date, and time of the interview.
3. **Interview Check-in:** Reminder when entering/starting the interview.
4. **Post-Interview:** Thank you for attending. Notifies the candidate that the screening process will take (5 to 9 business days).
5. **Final Decision:** Professional rejection message OR conditional acceptance/request for hiring documents.

---

## 6. Proposed Tech Stack

* **UI/UX Design:** 100% Arabic (RTL) - Professional, modular dashboard design.
* **Frontend:** React.js (Vite) + Tailwind CSS.
* **Backend / Database / Auth:** Supabase (PostgreSQL, Authentication, Storage).
* **Local AI Worker:** Python, FastAPI, Local LLMs (Ollama).
* **Cloud AI Engine:** OpenAI API or Gemini API (strictly for answer evaluation).
