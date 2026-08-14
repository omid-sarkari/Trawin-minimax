// User Resume Types
export interface UserResumeBasic { type: 'user_basic'; id: string; userId: string; version: string; createdAt: string; updatedAt: string; contactInfo: any; personalInfo: any; summary: string; topSkills: any[]; stats: any; recentActivity: any[]; }
export interface UserResumeDetailed extends UserResumeBasic { type: 'user_detailed'; skills: any[]; assessmentHistory: any; codingPerformance: any; trustScore: any; growthTimeline: any[]; recommendations: string[]; }
export interface UserResumePro extends UserResumeDetailed { type: 'user_pro'; behaviorInsights: any; aiUsage: any; peerComparison: any; }
export type UserResume = UserResumeBasic | UserResumeDetailed | UserResumePro;