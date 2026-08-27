// Resume System Configuration
export interface ResumeSystemConfig { user: any; company: any; global: any; database: any; api: any; }
export const DEFAULT_RESUME_CONFIG = {
  user: { basic: { enabled: true, includes: ['skills', 'stats', 'activity', 'summary'], maxSkills: 10, maxActivityItems: 10 },
          detailed: { enabled: true, includes: ['skills', 'assessments', 'performance', 'trust', 'growth', 'activity', 'summary'], maxSkills: 50, maxActivityItems: 20, maxTimelineEntries: 20 },
          pro: { enabled: true, includes: ['all'], maxSkills: 100, maxActivityItems: 50, maxTimelineEntries: 100, includesBehaviorInsights: true, includesAIUsage: true, includesPeerComparison: true } },
  company: { basic: { enabled: true, includes: ['skills', 'stats', 'quick_assessment'], maxSkills: 10, showContactInfo: true, showAIUsage: false },
             detailed: { enabled: true, includes: ['skills', 'assessments', 'performance', 'trust', 'detailed_assessment', 'ai_usage', 'job_fit'], maxSkills: 50, showContactInfo: true, showAIUsage: true, showBehaviorInsights: false },
             pro: { enabled: true, includes: ['all'], maxSkills: 100, showAllInfo: true, showAIUsage: true, showBehaviorInsights: true, showVerification: true, showRiskAssessment: true } },
  global: { defaultVersion: 'basic', enableVersionSelection: true, enableCustomVersions: true, storeInDatabase: true, cacheDuration: 3600, defaultPrivacy: 'private', allowPublicProfiles: true, maxCacheSize: 100, preloadResumes: false },
  database: { tableName: 'user_resumes', enableIndexing: true, enableFullTextSearch: true },
  api: { enableRestApi: true, rateLimit: 100, requireAuthentication: true }
};
