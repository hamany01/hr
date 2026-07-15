# Architectural & Technical Design Document - Local AI Python Worker

This document provides the full technical specifications for designing and implementing the **Local Python Worker** as a core component of the Smart Recruitment Platform (ATS). This worker is built to slash cloud API costs and guarantee continuous system availability by serving as an on-premise fallback mechanism in the event of cloud network issues or API token exhaustion.

---

## 1. System Architecture & Source of Truth

The platform strictly operates under the principle that the **database (PostgreSQL/Supabase) is the single source of truth**. The Local Python Worker does not store jobs in its own volatile memory; instead, it monitors, processes, and updates tasks stored in a dedicated database table named `jobs`.

### Database-backed Job Queue Pattern
Whenever a candidate uploads a resume or the system needs to evaluate essay answers, a new row is created in the `jobs` table with its initial status set to `pending`.

---

## 2. Proposed Database Schema

To implement this architecture, the development company must provision the following tables within Supabase:

### A. Jobs Table (`public.jobs`)
This table acts as the unified processing queue for CV extractions and fallback evaluations.

```sql
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('cv_extraction', 'evaluation')),
  status text not null default 'pending' check (status in ('pending', 'processing', 'done', 'failed', 'retry')),
  priority int not null default 5, -- Job priority (e.g., 10 for urgent evaluations, 5 for routine CV parsing)
  payload jsonb not null, -- The job input (e.g., resume storage path, candidate answers)
  result jsonb, -- The structured output object
  attempts int not null default 0, -- Current attempt counter
  max_attempts int not null default 5, -- Max retries before marking as permanently failed
  locked_by text, -- Identifier of the processing worker
  locked_at timestamptz, -- Locking timestamp to prevent double-processing
  next_retry_at timestamptz, -- Scheduled time for next retry in case of transient failures
  idempotency_key text unique, -- Safeguard against duplicate job creation
  error_message text, -- Detailed exception log if failed
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### B. Worker Heartbeats Table (`public.worker_heartbeats`)
Used to monitor the operational status of all active local processing nodes.

```sql
create table public.worker_heartbeats (
  worker_id text primary key,
  hostname text,
  last_seen_at timestamptz not null default now(),
  status text not null default 'healthy',
  meta jsonb
);
```

---

## 3. Highly Concurrent Job Claiming Logic

When running multiple Local Workers concurrently, it is crucial to guarantee that no two workers pull and process the same task. This is achieved using PostgreSQL's `FOR UPDATE SKIP LOCKED` feature:

```sql
select *
from public.jobs
where status in ('pending', 'retry')
  and (next_retry_at is null or next_retry_at <= now())
order by priority desc, created_at asc
limit 1
for update skip locked;
```

**How it works:** This query atomically fetches pending tasks, locks the specific record (`FOR UPDATE`), and immediately bypasses any records that are already locked by another worker (`SKIP LOCKED`), avoiding bottlenecks or wait states.

---

## 4. Ingestion Channels: Event-driven & Safety Polling

The worker uses a hybrid model to receive notifications, ensuring real-time reaction speeds alongside total structural reliability:

1. **When running on a Public Server (VPS):**
   * **Supabase Database Webhooks** are enabled. When a new job is inserted, Supabase fires a webhook to a **FastAPI** endpoint running inside the worker.
2. **When running inside a corporate local network (Behind NAT):**
   * **Supabase Realtime** is used via the Python async client (`acreate_client()`) to listen directly to database updates over WebSockets.
3. **The Universal Safety Net (Periodic Polling):**
   * Regardless of the active notification channel, the worker executes a periodic polling query (every 30-60 seconds). This ensures any jobs that slipped through due to temporary network blips or disconnected WebSocket sessions are eventually picked up and processed.

---

## 5. Job Execution Pipelines

### I. Resume Parsing Pipeline (CV Extraction)
1. Candidate uploads a CV -> Saved in Supabase Storage -> A `cv_extraction` job is created in `jobs`.
2. The Local Worker claims the job and downloads the document temporarily to a secure directory.
3. The worker parses the file type (Native PDF, scanned PDF, DOCX, or images).
4. Text is extracted using dedicated Python libraries, with an OCR pipeline triggered *only* when dealing with images or scanned files.
5. The raw text is fed to a local LLM (e.g., **Ollama / Llama 3**) with a structured JSON schema template.
6. **Pydantic** validates the model's output schema to ensure complete data integrity.
7. The structured JSON result is written back to Supabase and the job status is set to `done`.
8. **Secure Purging:** The temporary file is immediately and securely purged from the local host.

### II. Smart Fallback Evaluation Pipeline
1. The platform's primary cloud backend attempts to score candidate answers using the prioritized cloud API keys.
2. If all cloud API keys fail (e.g., rate-limited, expired, or payment failed), the platform creates an `evaluation` job with high priority (`priority = 10`) in the `jobs` table.
3. The Local Worker claims this high-priority evaluation job immediately.
4. The local LLM processes the candidate's answers against a loaded scoring rubric, outputting the score, strengths, weaknesses, and interview questions in fluent Arabic.
5. The structured score is saved in Supabase with the tag `processed_by = local_fallback`.

---

## 6. Recommended Python Tech Stack

| Category | Tool / Library | Reason for Selection |
|---|---|---|
| **Web / API Engine** | `FastAPI + Uvicorn` | Extremely lightweight and fast. Perfect for receiving webhooks and exposing `/health` endpoints. |
| **Supabase SDK** | `supabase-py` | Official library for asynchronous interaction with Supabase Database, Storage, and Realtime. |
| **PDF Extraction** | `PyMuPDF + pdfplumber` | High-accuracy text extraction from standard PDF files. |
| **Word Processing** | `python-docx` | Fast and straightforward reading of DOCX files. |
| **OCR (Scanned Files)**| `pytesseract + pdf2image + Pillow` | Robust optical character recognition for scanned files and images. |
| **Local LLM Engine** | `Ollama` | Standardized runner for open-source models (Llama 3, Mistral) with built-in structured JSON output support. |
| **Data Validation** | `Pydantic` | Enforces exact typing and structures before data is written back to the cloud. |
| **Resilience & Retries**| `tenacity` | Simplifies exponential backoff policies for temporary network or rate-limit issues. |

---

## 7. Resilience, Security, and Production Hardening

1. **Automatic Self-Healing:** The worker should run as a standard Linux `systemd` service or a `Docker Compose` container with `restart: always` to ensure instant recovery from power cuts, OS reboots, or crashes.
2. **Heartbeat Monitoring:** The worker updates its `last_seen_at` field in `worker_heartbeats` every 30-60 seconds. The main dashboard alerts administrators if a local node goes offline.
3. **Data Security & Privacy:**
   * The Supabase `service_role` master key must never be exposed to clients; it is strictly restricted to the server/worker environments.
   * Hard local copies of resumes are immediately shredded after parsing.
   * Webhook endpoints are secured via token checks and header signature verifications.
