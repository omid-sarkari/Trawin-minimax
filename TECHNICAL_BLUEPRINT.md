# TECHNICAL_BLUEPRINT.md — مشخصات فنی تفصیلی سطح پایین (LLD)

> **قرارداد این سند:** هر برنامه‌نویس یا AI ای که فازی از ROADMAP_PHASES.md را می‌گیرد، به بخش همان فاز در این سند می‌رود و بدون هیچ سوالی کد را می‌نویسد: مسیر دقیق فایل، امضای کامل کلاس/متد، نوع داده‌ها، DDL دیتابیس، قرارداد API، منطق و تست‌ها — همه اینجاست. هیچ چیز پیش‌فرض گرفته نمی‌شود.
> زبان پیام‌های کاربر: فارسی · زبان کد/شناسه‌ها: انگلیسی · کامنت فقط برای قراردادها.
> نسخه ۱.۰ — ۲۰۲۶-۰۸-۲۶

---

# §1 — قراردادهای سراسری (برای همه فازها الزامی)

## 1.1 پشته و نسخه‌ها
- Next.js ^16.3.1 (App Router, Turbopack) · React ^19 · TypeScript ^5.9 strict
- @supabase/ssr ^0.12 + @supabase/supabase-js ^2.112 · Tailwind CSS ^4 · jest/ts-jest ^29 · @monaco-editor/react

## 1.2 هویت — قرارداد غیرقابل نقض
```ts
// شناسه کانونیکال اپ = public.users.id (uuid). auth.uid فقط پل است.
const { data } = await supabase.rpc('get_my_user_id') // → users.id | null
// استثناهای عمدی (FK به auth.users): question_selection_events.user_id ، user_skill_states.user_id
```

## 1.3 کلاینت‌های Supabase (موجود — استفاده مجدد، بازنویسی ممنوع)
| مسیر | امضا |
|---|---|
| `src/lib/supabase/server.ts` | `createClient(): Promise<SupabaseClient<Database>>` (anon-key + cookies؛ فقط احراز هویت/RPC) |
| `src/lib/admin/service-client.ts` | `createServiceClient(): SupabaseClient<Database>` (SERVICE_ROLE؛ singleton؛ فقط سرور) |

## 1.4 الگوی خطا
```ts
// src/lib/assessment/errors.ts — موجود
class AssessmentError extends Error {
  code: 'AUTHENTICATION_ERROR'|'AUTHORIZATION_ERROR'|'SESSION_NOT_FOUND'|'SESSION_EXPIRED'
      | 'SESSION_ALREADY_SUBMITTED'|'QUESTION_NOT_IN_SESSION'|'INVALID_ANSWER'|'VALIDATION_ERROR'
      | 'JUDGE0_UNAVAILABLE'|'JUDGE0_TIMEOUT'|'JUDGE0_RATE_LIMITED'|'EXECUTION_ERROR'
      | 'EVALUATION_ERROR'|'INTERNAL_ERROR';
  status: number; // نگاشت ثابت در HTTP_STATUS
}
toAssessmentError(e: unknown): AssessmentError
```
شکل پاسخ خطا: `{ "error": string, "code": AssessmentErrorCode }`. هیچ stack/پیام DB خام به کلاینت نمی‌رود.

## 1.5 الگوی Route Handler (Next 16)
```ts
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response>
```
- گاردها: `authenticate()` (assessment) / `assertAdmin()`+`withAdmin()` (admin) / `assertCompanyAccess()` (فاز P6 — §7.2)
- ⚠️ داخل `withAdmin` **هرگز** `Response.json` برنگردانید؛ object ساده برگردانید (باگ e503 قبلی).
- JSON body خواندن: `readJsonBody(request): Promise<Record<string, unknown>>` (throw VALIDATION_ERROR روی فرمت بد).

## 1.6 الگوی Service Layer
- کلاس با ctor تزریق‌شده:
```ts
export class XService { constructor(private db: SupabaseClient<Database>) {} }
```
- متدها object برمی‌گردانند یا AssessmentError می‌اندازند؛ ownership همیشه از session نه body.

## 1.7 Migration
- مسیر: `supabase/migrations/YYYYMMDDHHMMSS_name.sql`
- الزاماً idempotent (IF NOT EXISTS / WHERE NOT EXISTS / DO$$ برای constraint)
- اعمال: Management API query → سپس ثبت در `supabase_migrations.schema_migrations(version, statements, name, created_by)`
- پس از هر تغییر schema: `supabase gen types typescript --linked > src/types/database.ts` و `npx tsc --noEmit`

## 1.8 UI
- تم دارک پریمیوم RTL: توکن‌های `signal-*` (سبز)، `flag-*` (کهربایی)، zinc؛ کارت: `rounded-2xl border border-white/10 bg-white/[0.03] p-6`
- اجزای مشترک ادمین: `src/components/admin/ui.tsx` — `Btn{variant:'primary'|'ghost'|'danger'|'soft'}`, `Card`, `Field`, `Badge{tone}`, `EmptyState`, `Pager`, `fetchJson<T>(url,init):Promise<T>` (خطا→Error با message فارسی), `inputClass`, `StatCard`, `Alert`, `useFlash()`, `cx()`
- شل مشترک: `src/components/dashboard/DashboardShell.tsx` — props: `{title:string; navItems:NavItem[]; userLabel:string; subtitle?:string; avatarUrl?:string|null; planBadge?:string|null; children}` ; `NavItem={href,label,icon}`
- حالت‌های الزامی هر ویژگی: loading(skeleton) / empty(dashed) / error(rose box با متن فارسی) / success

## 1.9 تست
- واحد: `*.test.ts` کنار ماژول در `__tests__/`؛ jest roots=src؛ mock fetch با `global.fetch=jest.fn`
- Live acceptance: نام `live-*.test.ts`؛ گارد `const d = process.env.SUPABASE_SERVICE_ROLE_KEY ? describe : describe.skip`؛ cleanup کامل در afterAll (کاربر تستی: `db.auth.admin.createUser` + حذف دوطرفه public.users و auth.users)
- CI (`.github/workflows/ci.yml`): Node 24 → `npm run build` → `npm run test` (live ها skip می‌شوند)

## 1.10 Env (سرور-فقط مگر NEXT_PUBLIC_)
```
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
NEXT_PUBLIC_ADMIN_EMAILS, JUDGE0_URL, JUDGE0_AUTH_TOKEN,
LIVEKIT_API_KEY/SECRET/NEXT_PUBLIC_LIVEKIT_URL, AI_EVAL_KERNEL_URL/TOKEN,
(future) JPLAG_URL, JPLAG_TOKEN
```

---

# §2 — هویت و Auth (P1 — موجود، مرجع)

## 2.1 جریان ثبت‌نام
`auth.users INSERT → trigger handle_new_user() [SECDEF] → profiles(id=auth_id, role_id از metadata) + users(auth_user_id, role, status='active')`

## 2.2 AuthService — `src/services/auth.service.ts` (کلاینت‌ساید)
```ts
class AuthService {
  signUp(email,password,fullName,opts:{role?:'developer'|'company';companyName?:string}): Promise<AuthData>
  signIn(email,password): Promise<AuthData>
  resolveRole(email?): Promise<'developer'|'company'|'admin'>   // allowlist→metadata→DB→developer
  getAppUserId(): Promise<string>                                // rpc get_my_user_id
  resetPassword(email) / updatePassword(pwd) / signOut()
}
resolveDashboardPath(role?, email?): '/admin'|'/company'|'/dashboard'
```

## 2.3 محافظت روت
`proxy.ts` → `updateSession(request)` از `src/lib/supabase/session.ts`؛ matcher های `/dashboard/:path*`,`/company/:path*`,`/admin/:path*`؛ گارد نهایی صفحات سروری: `getUser()+getMyAppUserId()+role redirect`.

---

# §3 — موتور محتوا و ادمین (P2 — موجود، مرجع)

## 3.1 قرارداد محتوای سؤال — `src/lib/admin/question-contracts.ts`
```ts
QUESTION_TYPES=['multiple_choice','fill_blank','coding','open_ended','debugging'] as const
type QuestionType=typeof QUESTION_TYPES[number]
interface McqContent{question:string;options:{id:string;text:string;is_correct:boolean}[];explanation?:string} // دقیقاً یک is_correct=true
interface FillBlankContent{question_with_blank:string /*شامل ___*/;accepted_answers:string[];explanation?:string}
interface OpenEndedContent{prompt:string;guidance?:string}
interface CodingContent{problem_statement:string;starter_code?:string;constraints?:string[];examples?:{input,output}[]}
interface DebuggingContent extends CodingContent{buggy_code:string}
validateContentByType(type,content):string|null   // پیام فارسی یا null
```
⚠️ seed های legacy: fill_blank متن را در `question` دارد و جواب را در `answer` — delivery باید fallback بدهد و `answer/accepted_answers/is_correct` هرگز به کلاینت نروند (`question-delivery.service.ts::sanitizeQuestionForClient`).

## 3.2 API ادمین (الگوی پاسخ: object ساده داخل withAdmin)
| Route | متد | ورودی/خروجی |
|---|---|---|
| `/api/admin/bootstrap` | GET | `{technologies,skills,tags}` (+`?include_inactive=1`) |
| `/api/admin/questions` | GET q/type/difficulty/status/skill_id/technology_id/page | `{items,total,page,pageSize}` item شامل title/latest_version/skill_ids |
| `/api/admin/questions` | POST/PATCH | create کامل (question+version+skills+tags) / تغییر status-duplicate |
| `/api/admin/questions/bulk` | POST preview\|commit | RPC `admin_bulk_import_questions(batch)` اتمی |
| `/api/admin/exams` | GET/POST | لیست با tracks / ایجاد (slug خودکار) |
| `/api/admin/exams/[examId]` | PATCH | `{status?}` (انتشار نیازمند ≥۱ سؤال) و/یا `{selection_mode,target_question_count}` upsert config |
| `/api/admin/exams/[examId]/questions` | GET/POST/DELETE | rows با latest version / attach upsert(order= max+1 پیش‌فرض) / detach |

## 3.3 وضعیت‌های مجاز (CHECK دیتابیس)
exams: draft/published/archived/closed · questions: draft/published/archived · type: ۵گانه · difficulty: 1..5

---

# §4 — Runtime آزمون (P3 — موجود، مرجع دقیق)

## 4.1 سرویس جلسه — `src/services/assessment/exam-session.service.ts`
```ts
startExam(db, ids:{appUserId,authUserId}, examIdOrSlug:string|number): Promise<ClientSessionState>
getSessionState(db, ids, sessionId): Promise<{state?:ClientSessionState; result?:ClientResult}>
submitExam(db, appUserId, sessionId): Promise<ClientResult>
remainingSeconds(startedAt,durationMinutes): number|null
```
- start: exam.status==='published' لازم؛ recover سشن فعال (status in started/submitted/evaluating) وگرنه insert جدید؛ سپس selection+persistEvents قبل از serve.
- finalize یکتا برای manual/auto-expiry: `claimForEvaluation` = UPDATE شرطی started→submitted→evaluating؛ سپس `runEvaluationAndComplete`: evaluateSession → UPDATE …eq(status,'evaluating') set completed,score. شکست ارزیابی ⇒ ماندن در evaluating + retry در poll بعدی (stale>2min).

## 4.2 انتخاب سؤال — `question-selection.service.ts`
```ts
interface QuestionSelectionStrategy{ mode:'fixed'|'adaptive';
  select(db, ctx:{examId,targetCount:number|null,config:Record<string,unknown>}):Promise<SelectedQuestion[]> }
interface SelectedQuestion{questionId:number;versionId:number;order:number;weight:number;mode:'fixed'|'adaptive'}
persistSelectionEvents(db,authUserId,sessionId,examId,selected[]):void // selection_reason={strategy,question_version_id,order,weight}
loadPinnedSelection(db,sessionId):Promise<SelectedQuestion[]> // منبع حقیقت سؤالات سشن
```
Fixed: exam_questions join questions(published) → sort(order,questionId) → slice(target). Adaptive-MVP: published order by difficulty asc,id asc limit target.

## 4.3 پاسخ — `answer.service.ts`
```ts
saveAnswer(db,{sessionId,appUserId,questionId,answerData,timeSpentSeconds}):Promise<void>
normalizeAnswerPayload(type,raw):Record<string,unknown>
// mcq→{selected_option_id upper}; fill_blank/open_ended→{value≤10k}; coding→{submission_id,language,value(code)}
```
Upsert onConflict session+question؛ stamp `question_version_id`؛ ممنوع اگر session.status!=='started'.

## 4.4 اجرای کد — `code-execution.service.ts`
```ts
submitCode(db,{appUserId},sessionId,questionId,{source_code,language}):Promise<CodeSubmissionResult>
CodeSubmissionResult.public={status:'success'|'failed'|'provider_error',verdict,compileOutput,
  tests:{name,passed,input,expectedOutput|null,actualOutput|null,stderr}[]/*hidden: input='',expected=null*/}
```
Rate guard 20/min/user · test_cases مخفی فقط سرور · provider failure ⇒ throw JUDGE0_* (هرگز «غلط» نشمردن) + submission status='error'. Judge0 client: `judge0Provider.runOnce({sourceCode,language,stdin,expectedOutput,cpuTimeLimitSec,memoryLimitKb}):NormalizedExecutionResult{stdout,stderr,compileOutput,timeMs,memoryKb,outcome:{kind:'user',verdict}|{kind:'provider',reason,retryable}}`.

## 4.5 API دولوپر (همه با authenticate())
| Route | متد | توضیح |
|---|---|---|
| `/api/assessment/exams` | GET | published exams + count/mode |
| `/api/assessment/exams/[examId]/start` | POST | idempotent start/recover → ClientSessionState |
| `/api/assessment/sessions/[sessionId]` | GET | state یا result؛ expiry lazy |
| `…/answers` | PUT | `{question_id,answer_data,time_spent_seconds}` |
| `…/submit` | POST | finalize → ClientResult |
| `…/questions/[qid]/code` | POST | `{source_code,language}` → public result |
| `…/result` | GET | ClientResult |

## 4.6 UI Runner — `src/components/assessment/ExamRunner.tsx`
State machine کلاینت: boot(start API) → render question(current index) → autosave debounce 700ms PUT answers → countdown نمایشی sync از remainingSeconds سرور → صفر ⇒ auto submit → ResultView. CodeView: صورت/مثال‌ها بالای `MonacoCodeEditor`(value,onChange,language,height=320؛ CDN jsdelivr@0.52.2 pin؛ theme trawin-dark در beforeMount؛ quickSuggestions on).

## 4.7 ارزیابی — `evaluation.service.ts` / مهارت — `skill-scoring.service.ts`
```ts
evaluateSession(db,sessionId):Promise<{score:number|null}>
// mcq: mcqIsCorrect(content,selected) · fill_blank: normalizeText(fa/ar digits)×accepted_answers
// open_ended→pending_review (خارج از نمره) · coding/debugging→از answer_evaluations موجود (بدون اجرای مجدد)
// overall=Σ(weight×earned)/Σ(weight)×100 روی gradable؛ level: ≥85 expert,≥70 senior,≥50 mid,else junior
// confidence=graded/total؛ evaluations delete+insert per session (idempotent) با engine_version_id فعال
updateSkillStates(db,appUserId,graded):void // Elo-lite K=clamp(32×unc/350,8,64); expected از 800+diff*200
```

---

# §5 — آنبردینگ + پروفایل + Pro (P4 — موجود، مرجع)

## 5.1 ProfileService — `src/services/profile.service.ts`
```ts
class ProfileService{
 constructor(db)
 getOnboardingState(appUserId):Promise<{completed,data:Record<string,unknown>,profile}>
 saveOnboardingStep(appUserId,stepKey,payload:Partial<OnboardingPayload>,finalize:boolean):Promise<void>
 checkUsernameAvailable(input):Promise<{available,reason?}>     // validateUsername + ilike
 claimUsername(appUserId,input):Promise<string /*normalized*/>   // 23505→«لحظاتی پیش گرفته شد»
 updateProfile(appUserId,patch):Promise<void>                    // clamp ها: bio≤2000, headline≤100, years 0..60, avatar https
}
interface OnboardingPayload{intents:string[]≤8; primaryTechnologyId:number|null; targetRole:string|null≤60;
 experienceLevel:'beginner'|'junior'|'mid'|'senior'|'expert'|null; workPreference:string[]≤6}
```
WORK_PREFS مجاز: remote,onsite,hybrid,freelance,full_time,part_time,internship. ذخیره: structured→ستون‌ها؛ بقیه→onboarding_data JSONB با `step_<key>` marker.

## 5.2 API
`POST/GET /api/profile/onboarding` ({step,intents,primary_technology_id,target_role,experience_level,work_preference,finalize}) · `PUT /api/profile` · `GET ?u= / POST /api/profile/username` · `POST /api/profile/avatar` (multipart field=`file`; jpg/png/webp; ≤2MB; path=`{appUserId}/avatar-{ts}.{ext}` bucket `avatars` public; آپدیت profiles.avatar_url)

## 5.3 Entitlements — `src/lib/profile/entitlements.ts`
```ts
type Entitlement='advanced_analytics'|'rich_sections'|'advanced_insights'
class EntitlementService{constructor(db); getPlan(appUserId):Promise<{plan:'free'|'pro',expiresAt}>; has(e,appUserId):Promise<boolean>;
 setPlan(userId,'free'|'pro',grantedBy|null)} // free=delete row؛ pro=upsert؛ ends_at گذشته⇒free مؤثر
```

## 5.4 رزومه — `src/services/resume/living-resume.service.ts`
```ts
class LivingResumeService{
 build(targetAppUserId,view:'developer'|'company'|'pro',opts:{includeHiddenSections?}):Promise<DeveloperResume>
 loadVerificationPolicy():Promise<Policy&{version:number}>
 private collectEvidence(uid):Map<skillId|(-1 projects),{gradedQuestions,correctCount,completedExams,projectCount?}>
 private buildInsights(skills):SkillInsights // فقط plan=pro && view=developer
}
interface VerifiedSkill{skillId,name,score|null,confidence,evidenceCount,level:SkillVerificationLevel,levelLabel,verified,evidence:{gradedQuestions,correctRate,completedExams,projects}}
computeVerificationLevel(score,gradedQs,exams,projects,policy):'none'|'emerging'|'verified'|'expert' // pure
```
Company view: completeness=undefined، workPreference=[], sections فقط isVisible (اگر rule اجازه)، recentEvaluations gated. PRIVACY_FLOORS: contact_info/company=false، private_analytics=false، behavior_signals=false (همیشگی).

Completeness (`completeness.ts`): ۱۰ قانون وزنی (avatar10,headline12,bio12(≥40char),username8,primaryTech10,workPref6,expYears6,customSection12,firstAssessment16,verifiedSkill8) → percent=earned/totalWeight.

Recommendation (`recommendation.ts`): قوانین قطعی ۱→۳ (track تکنولوژی اصلی → ضعیف‌ترین skill_score<70 → fallback newest) خروجی `{examId,title,reason,rule}`.

## 5.5 بخش‌های سفارشی
API `/api/resume/sections` (POST/PATCH?id/DELETE?id) — KINDS: project,experience,education,achievement,competition,certification,link,custom؛ ownership .eq(user_id,appUserId) در همه؛ admin معادل `/api/admin/resumes/[userId]/sections` با managed_by='admin'.
UI: `SectionManager` (placeholders per-kind از KIND_COPY؛ expandable rows؛ toggle/remove فقط developer-owned) داخل `ResumeView` (hero+ring completeness+verified list با evidence+PRO insights+stats+recent).

---

# §6 — موتور تأیید مهارت (P5 — موجود، مرجع)

DDL (اعمال شده): `evaluation_rules(name UNIQUE)` + `rule_versions(rule_id,version UNIQUE,conditions jsonb,actions jsonb)`
Seed: rule `skill_verification` active؛ v1 conditions:
```json
{"verified":{"min_graded_questions":200,"min_completed_exams":5,"min_projects":3,"min_score":70},
 "emerging":{"min_graded_questions":30,"min_completed_exams":1,"min_score":50}}
```
- خواندن: `loadVerificationPolicy()` آخرین version فعال؛ fallback DEFAULT_POLICY در قطعی شبکه.
- PATCH `/api/admin/resume-config` با `{policy:{verified{},emerging{}}}` ⇒ clamp سرور (1..10000 / 0..1000 / 0..100 / 0..100) + قید verified≥emerging ⇒ INSERT نسخه جدید (تاریخچه حفظ).
- evidence: join `question_skills→answers(exam_sessions.user_id)` یک کوئری؛ completedExams=distinct session با status='completed'؛ projects=count(visible kind in project,competition).
- تست مرجع: `src/services/resume/__tests__/verification-policy.test.ts` («نمره ۱۰۰ با ۲ سؤال ⇒ هرگز verified»).

---

# §7 — P6: پلتفرم شرکت 🆕

## 7.1 داده (Migration `20260826130000_company_platform.sql`)
جدول‌های companies/company_members/jobs/applications/interviews موجودند. فقط افزوده‌ها:
```sql
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_applications_job ON public.applications(job_id,status);
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS province text;          -- مقیاس استانی
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS notes text;
-- requirements JSONB contract (jobs.requirements):
-- {"skills":[{"skill_id":number,"min_score":number}],"min_experience_years":number,
--  "provinces":["tehran"],"employment_types":["remote","full_time"]}
```

## 7.2 گارد دسترسی — `src/lib/company/guard.ts` (جدید)
```ts
export class CompanyError extends Error{constructor(public status:number,message:string)}
export async function assertCompanyMember(requiredRoles:Array<'owner'|'admin'|'recruiter'|'member'>):
 Promise<{appUserId:string; companyId:string; memberRole:string}>
// جریان: authenticate-level getUser → rpc get_my_user_id → company_members.eq(user_id) → role∈requiredRoles
// چند عضویت: اولین رکورد (order created_at) — مدل فعلی تک‌شرکتی است.
export async function withCompany<T>(fn:()=>Promise<T>):Promise<Response> // مثل withAdmin
```

## 7.3 سرویس — `src/services/company/company.service.ts` (جدید)
```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export interface CandidateFilters{ q?:string; skillIds?:number[]; minScore?:number; minVerifiedLevel?:'emerging'|'verified'|'expert';
 province?:string; minExperienceYears?:number; page:number; pageSize:number /*default 20,max 50*/ }
export interface CandidateSummary{ userId:string; username:string|null; fullName:string|null; headline:string|null;
 avatarUrl:string|null; province:string|null; experienceYears:number|null; plan:'free'|'pro';
 skills:Array<{skillId:number;name:string;score:number|null;level:string;verified:boolean}>;
 stats:{totalAssessments:number;averageScore:number} }

export class CompanyService{
 constructor(private db:SupabaseClient<Database>, private companyId:string){}

 searchCandidates(f:CandidateFilters):Promise<{items:CandidateSummary[]; total:number}>
 // پیاده‌سازی: پایه=users(role='developer',status='active') join profiles(left)
 //  + فیلتر مهارت: subquery skill_scores→evaluations.user_id where score>=f.minScore and skill_id in f.skillIds
 //  + verified-only: join developer-side policy via LivingResumeService.loadVerificationPolicy() در JS post-filter
 //  ⚠️ N+1 ممنوع: skill aggregation یک کوئری group-by روی skill_scores(join evaluations.user_id in page-user-ids)

 getCandidateResume(candidateUserId:string, viewerAppUserId:string):Promise<CompanyCandidateProfile>
 // 1) application/interview یا invite فعال لازم نیست — دید عمومی شرکت طبق visibility rules
 // 2) LivingResumeService.build(candidate,'company') → عین payload سرور؛ هیچ فیلد خصوصی اضافه نمی‌شود

 listMyJobs(status?:'open'|'paused'|'closed'):Promise<JobRow[]>
 createJob(input:{title:string;description:string;requirements:unknown;province?:string|null}):Promise<JobRow>
 // validation requirements: parse + assert هر skill_id∈skills && 0≤min_score≤100
 updateJobStatus(jobId:'open'|'paused'|'closed'):Promise<void>

 listApplications(jobId:string):Promise<ApplicationRow[]>        // join users+profiles+resumes(title)
 decideApplication(applicationId:string, next:ApplicationDecision):Promise<void>
 // ApplicationDecision='reviewing'|'shortlisted'|'rejected'|'accepted' (withdraw فقط توسط کاندیددر route خودش)
 // گذار مجاز (enforce در کد): submitted→reviewing→shortlisted→accepted/rejected؛ rejected terminal؛ accepted از shortlisted فقط

 scheduleInterview(applicationId:string,input:{scheduledAt:Date;provider:'livekit'}):Promise<InterviewRow>
 // LiveKit room: livekit.ts موجود — roomName=`ivw-${applicationId.slice(0,8)}-${Date.now().toString(36)}`
}
```

## 7.4 API Routes (جدید — همه با withCompany)
| Route | متد | بدنه/کوئری → پاسخ |
|---|---|---|
| `/api/company/me` | GET | `{companyId,name,memberRole}` |
| `/api/company/candidates` | GET | query: q,skill_ids(comma),min_score,min_level,province,min_exp,page → CandidateSearchResponse |
| `/api/company/candidates/[userId]` | GET | CompanyCandidateProfile (server-filtered) |
| `/api/company/jobs` | GET/POST | list/create |
| `/api/company/jobs/[jobId]` | PATCH | `{status}` |
| `/api/company/jobs/[jobId]/applications` | GET | لیست درخواست‌ها |
| `/api/company/applications/[applicationId]` | PATCH | `{decision}` گذار قانونمند |
| `/api/company/interviews` | POST | `{applicationId,scheduledAt}` → InterviewRow (+room) |

خطاهای اختصاصی: 403 COMPANY_MEMBER_REQUIRED · 400 REQUIREMENTS_INVALID · 409 APPLICATION_INVALID_TRANSITION

## 7.5 UI (RTL دارک)
- `src/app/company/layout.tsx` (بازنویسی placeholder فعلی): DashboardShell nav=[نمای کلی,Candidates,Jobs,Pipeline,Interviews]
- `src/app/company/page.tsx`: StatCards (open jobs/new applications/this-month interviews)
- `src/app/company/candidates/page.tsx` + `components/company/CandidateSearch.tsx` (فیلترها + کارت نامزد با badge verified و لینک پروفایل) + `[userId]/page.tsx` (رندر CompanyCandidateProfile با کامپوننت مشترک `components/resume/ResumeSectionsView.tsx`)
- `src/app/company/jobs/page.tsx` (فرم ساخت با ویرایشگر requirements: انتخاب مهارت+min_score chips) + `[jobId]/page.tsx` (pipeline ستون‌ها به تفکیک status با drag-free دکمه‌های گذار)
- `src/app/company/interviews/page.tsx` + `components/video/LiveKitRoom.tsx` (موجود) برای join
- کاندید-ساید: `src/app/dashboard/jobs/page.tsx` (لیست jobs open + apply با انتخاب resume snapshot → POST `/api/applications` جدید دولوپری) + `src/app/dashboard/applications/page.tsx` (وضعیت‌ها + withdraw)

## 7.6 تست پذیرش
Live: ایجاد شرکت+عضو recruiter → job با requirement React≥70 → candidate search شامل کاربر seed دارای score و مستثنیِ دیگری → apply → reviewing→shortlisted→accepted → interview schedule. Cleanup دوطرفه.

---

# §8 — P7: مسابقات تیمی و فردی استانی 🆕

## 8.1 Migration `20260826140000_competitions.sql` (idempotent)
```sql
CREATE TABLE IF NOT EXISTS public.competitions(
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  mode text NOT NULL CHECK(mode IN('individual','team')),
  scope text NOT NULL DEFAULT 'provincial' CHECK(scope IN('internal','city','provincial','national')),
  province text,                                   -- الزام وقتی scope='provincial' (app-enforced)
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  registration_deadline timestamptz,
  status text NOT NULL DEFAULT 'draft'
    CHECK(status IN('draft','registration_open','running','grading','completed','cancelled')),
  exam_id bigint REFERENCES public.exams(id) ON DELETE SET NULL, -- چالش=آزمون موجود
  min_team_size int, max_team_size int,            -- فقط mode='team'
  scoring_config jsonb NOT NULL DEFAULT '{}',      -- {"perQuestionWeight":true,"timeTiebreak":"earliest_finish"}
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK(starts_at < ends_at),
  CHECK(mode<>'team' OR (min_team_size IS NOT NULL AND max_team_size IS NOT NULL AND min_team_size<=max_team_size))
);
CREATE INDEX IF NOT EXISTS idx_competitions_status ON public.competitions(status,starts_at);

CREATE TABLE IF NOT EXISTS public.competition_teams(
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id bigint NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  name text NOT NULL,
  captain_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  province text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(competition_id,name)
);

CREATE TABLE IF NOT EXISTS public.competition_team_members(
  team_id uuid NOT NULL REFERENCES public.competition_teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(team_id,user_id)
);
-- محدودیت عضویت واحد per competition (app-enforced via join check):
CREATE INDEX IF NOT EXISTS idx_ctm_user ON public.competition_team_members(user_id);

CREATE TABLE IF NOT EXISTS public.competition_registrations(
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  competition_id bigint NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,   -- individual
  team_id uuid REFERENCES public.competition_teams(id) ON DELETE CASCADE, -- team
  status text NOT NULL DEFAULT 'approved' CHECK(status IN('pending','approved','rejected','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK((user_id IS NULL)::int <> (team_id IS NULL)::int)       -- دقیقاً یکی
);
CREATE INDEX IF NOT EXISTS idx_comp_reg_comp ON public.competition_registrations(competition_id,status);

CREATE TABLE IF NOT EXISTS public.competition_results(
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  competition_id bigint NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.competition_teams(id) ON DELETE CASCADE,
  rank int NOT NULL CHECK(rank>0),
  score numeric NOT NULL DEFAULT 0,
  verified boolean NOT NULL DEFAULT false,        -- فقط grading تمام‌شده true
  metadata jsonb NOT NULL DEFAULT '{}',           -- {solvedCount,timeMs,province,...}
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK((user_id IS NULL)::int <> (team_id IS NULL)::int)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_comp_result_user ON public.competition_results(competition_id,user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_comp_result_team ON public.competition_results(competition_id,team_id) WHERE team_id IS NOT NULL;

-- RLS deny-by-default (الگوی پروژه؛ نوشتن فقط service-role):
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_results ENABLE ROW LEVEL SECURITY;
-- SELECT عمومی برای competitions منتشرشده:
CREATE POLICY competitions_public_read ON public.competitions FOR SELECT
  USING(status IN('registration_open','running','grading','completed'));
```

## 8.2 سرویس — `src/services/competitions/competition.service.ts` (جدید)
```ts
export interface CreateCompetitionInput{title:string; slug?:string; description?:string; mode:'individual'|'team';
 scope:'internal'|'city'|'provincial'|'national'; province?:string|null; startsAt:Date; endsAt:Date;
 registrationDeadline?:Date|null; examId?:number|null; minTeamSize?:number|null; maxTeamSize?:number|null}

export class CompetitionService{
 constructor(private db:SupabaseClient<Database>){}
 adminCreate(input:CreateCompetitionInput):Promise<{id:number;slug:string}>          // assertAdmin در route
 adminSetStatus(id:number,next:CompStatus):Promise<void>
 // گذار مجاز: draft→registration_open→running→grading→completed ؛ هر مرحله→cancelled (به‌جز completed)
 // registration_open نیاز: registrationDeadline>=now OR null؛ running نیاز: exam_id NOT NULL

 listPublic(filter:{scope?:'provincial'|...;mode?;status?='registration_open'|'running';page}):Promise<{items:CompetitionRow[];total:number}>
 getBySlug(slug:string):Promise<CompetitionDetail> // + myRegistration (اگر لاگین) + leaderboard preview

 registerIndividual(db,authCtx:{appUserId},competitionSlug:string):Promise<void>
 // checks: status='registration_open'; now<deadline; scope provincial⇒profiles.country/استان تطبیق (پذیرش آزاد اگر استان ثبت نشده)
 // upsert registration (unique via manual check + retry 23505→«قبلاً ثبت‌نام کرده‌اید»)

 createTeam(captainAppUserId,competitionSlug:string,name:string,province?:string):Promise<{teamId:string}>
 joinTeam(appUserId,teamId:string):Promise<void>  // checks: captain≠joiner duplicate؛ team size<max؛ همه اعضا registered فردی نباشند
 leaveTeam(appUserId,teamId:string):Promise<void> // کاپیتان آخرین عضو نمی‌تواند leave کند (باید transfer یا dissolve)
 dissolveTeam(captainAppUserId,teamId):Promise<void>

 submitScore(adminCtx,competitionId,input:{userId?|teamId?,score:number,solvedCount?:number,timeMs?:number}):Promise<void>
 // درج/به‌روزرسانی results (rank هنوز null تا finalize) — ورودی از داوری ادمین یا auto-grader

 finalize(db,competitionId:number):Promise<FinalizeReport>
 // 1) rank assignment: ORDER BY score DESC, timeMs ASC NULLS LAST, created_at ASC → row_number
 // 2) results.verified=true
 // 3) 🧠 موتور تصمیم: برای هر participant(top N طبق policy.actions.competitionResumeRule || top3)
 //    INSERT INTO developer_resume_sections(kind='competition',managed_by='admin',
 //      title=`مسابقه ${c.title}`, subtitle=`رتبه ${rank} · ${scopeFa} ${province??''}`,
 //      content={competition_id,rank,score,mode,team_name?,date:ends_at,is_verified:true})
 //    idempotent: قبلاً وجود competition_id در content ⇒ skip
 // 4) notifications insert برای برنده‌ها (P12 مصرف می‌کند)
}
```

## 8.3 اجرای مسابقه (اتصال به Runtime موجود)
- running ⇒ participants همان `/api/assessment/exams/{examId}/start` را صدا می‌زنند (هیچ runtime جدیدی ساخته نمی‌شود — §58 Master Context).
- گیت ورود: middleware سبک در startExam نیست؛ به‌جای آن `CompetitionAccessService.assertCanStart(appUserId,examId)` در route جدید `/api/competitions/[slug]/session/start` که wrapper است: بررسی registration approved + status='running' → سپس فراخوانی startExam همان امضا.
- تابلو امتیاز: `GET /api/competitions/[slug]/leaderboard` → aggregate از execution_results+answers (score لحظه‌ای solvedCount) — فقط وقتی running/completed.

## 8.4 API Routes
| Route | متد | دسترسی | توضیح |
|---|---|---|---|
| `/api/competitions` | GET | عمومی | لیست با filter scope/mode/status |
| `/api/competitions/[slug]` | GET | عمومی | detail+myRegistration |
| `/api/competitions/[slug]/register` | POST | دولوپر | individual register |
| `/api/competitions/[slug]/teams` | POST | دولوپر | {name,province?} create team (کاپیتان=caller) |
| `/api/competitions/teams/[teamId]/join` | POST | دولوپر | join |
| `/api/competitions/teams/[teamId]/leave` | POST/DELETE | عضو/کاپیتان | leave/dissolve |
| `/api/competitions/[slug]/session/start` | POST | registered | wrapper startExam |
| `/api/competitions/[slug]/leaderboard` | GET | عمومی | ranking زنده |
| `/api/admin/competitions` | GET/POST | ادمین | list/create |
| `/api/admin/competitions/[id]` | PATCH | ادمین | {status} یا edit فیلدها در draft |
| `/api/admin/competitions/[id]/results` | POST | ادمین | submitScore batch |
| `/api/admin/competitions/[id]/finalize` | POST | ادمین | finalize + resume evidence |

## 8.5 UI
- دولوپر: `/dashboard/competitions` (کارت‌ها با badge استانی/تیمی + CTA ثبت‌نام)، `/competitions/[slug]` (detail + تشکیل تیم modal + leaderboard table + دکمه ورود به چالش وقتی running)
- ادمین: `/admin/competitions` (list/create wizard: basic→schedule→challenge link→rules) + `[id]/page.tsx` (کنترل وضعیت، ثبت نتایج batch CSV-like textarea `user_or_team,rank,score,timeMs`, دکمه Finalize با confirm)
- Team UI: مدیریت اعضا (invite via username — lookup users.username؛ accept در همان صفحه)

## 8.6 تست
واحد: rank assignment tie-breaks · team size limits · finalize idempotency. Live: مسابقه تیمی ۲ نفره end-to-end (create→register team→running→submit scores→finalize→بررسی developer_resume_sections هر دو عضو + cleanup کامل).

---

# §9 — P8: موتور هوش رفتاری v1 🆕

## 9.1 قرارداد متریک (metric_type های استاندارد — code_metrics.metric_value numeric)
```
paste_ratio              0..1      clipboard_markers.count(paste) / coding_events.count(edit_batch)
run_after_paste_ms       ms median فاصله paste→next execution_run (coding_events.event_type='execution_run')
edit_after_paste_chars   char delta بین snapshot قبل/بعد paste (coding_snapshots source_hash diff حجم)
ai_assist_ratio          0..1      avg(ai_detection_results.probability) per session
active_minutes           min       فاصله first..last event
```

## 9.2 سرویس — `src/services/assessment/behavior-evidence.service.ts` (جدید)
```ts
export interface SessionBehaviorEvidence{
 pasteRatio:number; runAfterPasteMs:number|null; editAfterPasteChars:number;
 aiAssistRatio:number|null; activeMinutes:number; trustHint:'high'|'medium'|'low'|'unknown' }

export class BehaviorEvidenceService{
 constructor(private db:SupabaseClient<Database>){}
 async computeForSession(codingSessionId:string):Promise<SessionBehaviorEvidence>
 // منابع: coding_events(event_type,source,metadata.created_at), clipboard_markers(marker_type,created_at),
 //        ai_detection_results(probability), coding_snapshots(content size)
 async persistMetrics(sessionId,ev):Promise<void>
 // INSERT code_metrics ×۵ (metric_type enum بالا) — re-run: delete prior same types اول
 static trustHintOf(ev):'high'|'medium'|'low' // low: pasteRatio>0.6 && runAfterPasteMs<3000 ; high: pasteRatio<0.15
}
```
## 9.3 اتصال
- hook در `code-execution.service.submitCode` بعد از success/fail: اگر coding_session مرتبط (via exam_session) بود → compute+persist؛ جمع‌بندی `{trustHint,aiAssistRatio}` در `answer_evaluations.result.behavior` (privacy-safe؛ اعداد خام نه).
- Resume: `LivingResumeService.build` برای developer+plan=pro: aggregate sessions → بخش «شواهد کدنویسی» (میانگین‌ها + تفسیر فارسی). نمای شرکت: فقط با rule behavior_signals (floor=false ⇒ عملاً هرگز).

## 9.4 تست
واحد: `trustHintOf` جدول تصمیم؛ محاسبه paste_ratio با fixtures. Live: session واقعی با رویداد seed ⇒ metrics ردیف‌ها.

---

# §10 — P9: JPlag Pipeline 🆕

## 10.1 جریان
```
POST submit (موجود) ──► processing_jobs(job_type='similarity_check',status='pending')
worker (cron/手动) ──► fetch pending batch ──► call JPlag REST(env JPLAG_URL,JPLAG_TOKEN)
   ├─ score≥0.8 ⇒ code_submissions.status='plagiarized' + notifications(admins,type='plagiarism_alert')
   └─ ذخیره code_similarity_reports(submission_id,compared_submission_id,similarity_score,report_data)
```
## 10.2 فایل‌ها (جدید)
```ts
// src/services/plagiarism/plagiarism.service.ts
export class PlagiarismService{
 constructor(private db:SupabaseClient<Database>){}
 enqueueForSubmission(submissionId:string):Promise<void>          // processing_jobs insert
 processPending(limit=10):Promise<{processed:number; flagged:number}> // worker entrypoint
 private compareViaJPlag(a:{source:string;language:string},b:same):Promise<number> // 0..1 normalize
 private flagPlagiarism(submissionId,report):Promise<void>         // status + notify admins
}
// src/app/api/admin/plagiarism/process/route.ts  POST (assertAdmin) → processPending()
// src/app/api/check-plagiarism/route.ts         بازنویسی stub فعلی: enqueue for caller's latest submission
```
قواعد: مقایسه فقط submissions هم‌زبان و هم‌سؤال و اخیر (۷ روز)؛ هرگز execution را block نمی‌کند؛ plagiarized ⇒ evaluation آن سؤال outcome='not_graded' (منصفانه تا رسیدگی ادمین).

## 10.3 تست
واحد: threshold mapping؛ normalize score. Live: دو submission identical ⇒ report+flag.

---

# §11 — P10: Adaptive v2 🆕

## 11.1 استراتژی جدید — `AdaptiveEloStrategy implements QuestionSelectionStrategy` (فایل: question-selection.service.ts، ثبت در getSelectionStrategy برای mode='adaptive' پس از rollout flag در exam_selection_configs.config.useElo=true)
```ts
select(db,ctx){
 1) ratings=SELECT skill_id,rating FROM user_skill_states WHERE user_id=:u
 2) targetDifficulty=mapRatingToDifficulty(avg(ratings)||1000): rating<900→1,<1100→2,<1300→3,<1500→4,else 5
 3) pool=SELECT q.id,q.difficulty,q_skills.skill_id FROM questions(published)
        JOIN question_skills — filter difficulty BETWEEN target-1 AND target+1 (clamp 1..5)
 4) prefer skills با rating کمتر (ORDER BY CASE weak-skill-first) — deterministic tiebreak id
 5) map→SelectedQuestion{mode:'adaptive'} با candidate_score=(100-|difficulty-target|*25)+(weakBonus 10)
 6) slice(targetCount)
}
persistSelectionEvents: candidate_score الان پر می‌شود؛ selection_reason.strategy='elo-adaptive-v2'
```
## 11.2 تست
واحد: mapRatingToDifficulty جدول کامل؛ deterministic ordering با fake db (الگوی thenable موجود).

---

# §12 — P11: پروفایل عمومی + Snapshot 🆕

## 12.1 Snapshot
```ts
// src/services/resume/snapshot.service.ts (جدید)
export class SnapshotService{
 constructor(private db:SupabaseClient<Database>){}
 async captureCurrent(appUserId,title?:string):Promise<{resumeId:string;version:number}>
 // ResumeBuilderService.buildUserResume(uid,'detailed') → ResumeStorageService.storeUserResume(uid,data,{title})
 async listSnapshots(appUserId):Promise<Array<{resumeId,version,createdAt}>>
}
// API: POST /api/resume/snapshot → capture (owner) ; GET /api/resume/snapshot → list
```

## 12.2 صفحه عمومی — شرط انتشار
- فقط اگر: users.status='active' ∧ profile visibility允许 (rule جدید seed: ('public','profile',enabled=false default) — migration افزودن view_type 'public' به CHECK و seed ۴ قانون: profile/verified_skills/assessments_summary/projects)
- `src/app/developers/[username]/page.tsx` (server): lookup users.username ilike exact → generateMetadata({title:`${fullName} — تراوین`,description:headline,openGraph:{images:[avatarUrl?]}}) → LivingResumeService.build(uid,'company') + sections visible → رندر read-only با `components/resume/PublicResumeView.tsx` (بدون completeness/analytics)
- robots: اگر disabled ⇒ notFound()

## 12.3 تست
Live: snapshot capture version increment؛ public page 200 وقتی enabled و 404 وقتی disabled.

---

# §13 — P12: نوتیفیکیشن + Worker 🆕

```ts
// src/services/notifications/notification.service.ts (جدید)
export class NotificationService{
 constructor(private db:SupabaseClient<Database>){}
 push(appUserId,input:{type:'competition_result'|'application_update'|'plan_granted'|'plagiarism_alert'|'system',
   title:string,message:string,data?:Record<string,unknown>}):Promise<void>
 listMine(page:number):Promise<{items:NotificationRow[];unread:number}>
 markRead(ids:number[]):Promise<void>
}
// API: GET/PATCH /api/notifications
// UI: bell در DashboardShell header (badge unread) + /dashboard/notifications
// Worker entrypoints (cron-friendly, assertAdmin or CRON_SECRET header):
//  POST /api/workers/similarity-process  → PlagiarismService.processPending()
//  POST /api/workers/competitions-finalize → finalize هر competition که ended && status='grading'
```

---

# §14 — P13: Scale راهنما
- Redis cache فقط: technologies/skills lists (TTL 1h) و leaderboard hot reads
- Retention: editor_events/coding_events raw >90d حذف cron (Master Context §45)؛ metrics/results/permanent می‌مانند
- Queue: processing_jobs همان جدول مانده‌است؛ worker جدا (node script) روی VPS در Stage 2
- Index review پیش از launch هر feature بزرگ (EXPLAIN ANALYZE اجباری روی search candidates و leaderboard)

---

## پیوست A — نقشه فایل‌های فعلی (مرجع سریع)
```
src/lib/assessment/{errors,types,route-helpers,code-execution/provider}.ts
src/lib/services/judge0.ts · jplag.ts(empty→P9) · livekit.ts · openproctor.ts
src/lib/admin/{guard,service-client,question-contracts}.ts
src/lib/profile/{username-policy,entitlements,completeness,recommendation,visibility,onboarding-options}.ts
src/services/auth.service.ts · dashboard.service.ts · profile.service.ts
src/services/assessment/{exam-session,question-selection,answer,evaluation,skill-scoring,code-execution,question-delivery}.service.ts
src/services/resume/{living-resume,resume-builder,resume-storage}.service.ts
src/app/api/assessment/** · api/profile/** · api/resume/** · api/admin/**
src/components/assessment/{ExamRunner,QuestionView,MonacoCodeEditor}.tsx
src/components/profile/{OnboardingWizard,ProfileEditor,ResumeView,SectionManager}.tsx
supabase/migrations/*.sql (۶ مهاجرت پروژه تا امروز)
tests: src/**/*.test.ts (unit) + live-acceptance/live-p3-acceptance (env-gated)
```
## پیوست B — چک‌لیست پایان هر تسک
[ ] tsc --noEmit=0 · [ ] jest سبز · [ ] next build ✅ · [ ] RLS جدول‌های جدید deny-by-default · [ ] هیچ secret در کد/لاگ · [ ] hidden data به کلاینت نرفت · [ ] memory-don.md به‌روز · [ ] mythink1.md در صورت تغییر فلسفه به‌روز
