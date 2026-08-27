// Company Resume Types
export interface CompanyResumeBasic { type: 'company_basic'; id: string; userId: string; version: string; createdAt: string; updatedAt: string; contactInfo: any; personalInfo: any; keySkills: any[]; stats: any; quickAssessment: any; }
export interface CompanyResumeDetailed extends Omit<CompanyResumeBasic, 'type'> { type: 'company_detailed'; skills: any[]; assessmentHistory: any; codingPerformance: any; trustScore: any; detailedAssessment: any; aiUsage?: any; jobFit: any; }
export interface CompanyResumePro extends Omit<CompanyResumeDetailed, 'type'> { type: 'company_pro'; behaviorInsights: any; aiUsage: any; verification: any; riskAssessment: any; }
export type CompanyResume = CompanyResumeBasic | CompanyResumeDetailed | CompanyResumePro;