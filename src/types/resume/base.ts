// Resume System - Base Types
export interface BaseProfile { id: string; userId: string; createdAt: string; updatedAt: string; version: string; }
export interface ContactInfo { email?: string; phone?: string; website?: string; github?: string; linkedin?: string; twitter?: string; location?: string; }
export interface PersonalInfo { firstName?: string; lastName?: string; fullName?: string; bio?: string; avatarUrl?: string; country?: string; experienceYears?: number; }
export interface SkillWithEvidence { id: string; name: string; category: string; proficiency: number; evidence: any[]; lastAssessedAt?: string; verified: boolean; }
export interface SkillEvidence { type: 'assessment' | 'coding_challenge' | 'project' | 'interview' | 'certification'; id: string; name: string; score: number; completedAt: string; weight: number; }
export interface AssessmentHistory { totalAssessments: number; averageScore: number; bestScore: number; recentScores: number[]; lastAssessmentAt?: string; }
export interface LanguageStats { proficiency: number; challengesCompleted: number; avgScore: number; lastUsedAt?: string; }
export interface CodingPerformance { totalChallenges: number; successRate: number; avgTimePerChallenge: number; avgCodeQuality: number; languages: Record<string, LanguageStats>; }
export interface TrustScoreFactor { name: string; score: number; weight: number; description: string; }
export interface TrustScore { overallScore: number; confidence: number; level: 'beginner' | 'intermediate' | 'advanced' | 'expert'; factors: TrustScoreFactor[]; lastUpdatedAt: string; }
export interface AIUsageTransparency { aiAssistedCodePercentage: number; fullyGeneratedCodePercentage: number; humanWrittenCodePercentage: number; lastDetectedAt?: string; }
export interface BehaviorInsights { codingPattern: 'focused' | 'scattered' | 'balanced'; problemSolvingApproach: 'methodical' | 'trial_and_error' | 'mixed'; codeQualityTrend: 'improving' | 'stable' | 'declining'; }
export interface GrowthTimelineEntry { date: string; skill: string; previousScore: number; currentScore: number; improvement: number; source: string; }