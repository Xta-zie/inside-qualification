// ============================================================================
// Role types
// ============================================================================

export type UserRole = "admin" | "manager" | "user";

export type TargetRole = "sysadmin" | "architect" | "ops";

export const TARGET_ROLE_LABELS: Record<TargetRole, string> = {
  sysadmin: "Administrateur Systeme",
  architect: "Architecte Cloud",
  ops: "Operateur Cloud",
};

// ============================================================================
// Question types
// ============================================================================

export interface QuestionLevel {
  level: number;
  description: string;
}

export interface QuestionData {
  id: number;
  key: string;
  category: string;
  levels: string[];
  sortOrder: number;
  isActive: boolean;
}

// ============================================================================
// Assessment types
// ============================================================================

export type AnswerMap = Record<string, number>;

export interface AssessmentData {
  id: string;
  userId: string | null;
  candidateName: string;
  candidateEmail: string;
  targetRole: TargetRole;
  answers: AnswerMap;
  overallScore: number | null;
  avgPrereq: number | null;
  avgOpenstack: number | null;
  createdAt: Date | null;
  completedAt: Date | null;
}

export interface AssessmentFormValues {
  candidateName: string;
  candidateEmail: string;
  targetRole: TargetRole;
}

// ============================================================================
// Baseline types
// ============================================================================

export type BaselineTargets = Record<string, number>;

export interface BaselineData {
  id: number;
  roleKey: string;
  label: string;
  description: string | null;
  targets: BaselineTargets;
}

// ============================================================================
// Training module types
// ============================================================================

export interface TrainingProvider {
  name: string;
  type: string;
  detail: string;
}

export interface TrainingModuleData {
  id: number;
  moduleKey: string;
  title: string;
  content: string | null;
  linkedQuestionKeys: string[];
  providers: TrainingProvider[];
}

// ============================================================================
// Scoring types
// ============================================================================

export interface CategoryScore {
  category: string;
  score: number;
  target: number;
  gap: number;
  questionCount: number;
}

export interface ScoreReport {
  overallScore: number;
  avgPrereq: number;
  avgOpenstack: number;
  categories: CategoryScore[];
  recommendations: TrainingModuleData[];
}

// ============================================================================
// Chart types
// ============================================================================

export interface RadarDataPoint {
  category: string;
  score: number;
  target: number;
}

export interface GapDataPoint {
  category: string;
  gap: number;
  fill: string;
}

// ============================================================================
// API response types
// ============================================================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
