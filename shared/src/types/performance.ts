export const ReviewCycleStatus = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  CLOSED: "CLOSED",
} as const;
export type ReviewCycleStatus = (typeof ReviewCycleStatus)[keyof typeof ReviewCycleStatus];

export const ReviewStatus = {
  NOT_STARTED: "NOT_STARTED",
  SELF_SUBMITTED: "SELF_SUBMITTED",
  COMPLETED: "COMPLETED",
} as const;
export type ReviewStatus = (typeof ReviewStatus)[keyof typeof ReviewStatus];

export interface ReviewCycleDto {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: ReviewCycleStatus;
}

export interface CreateReviewCycleRequest {
  name: string;
  startDate: string;
  endDate: string;
}

export interface PerformanceReviewDto {
  id: string;
  cycleId: string;
  cycleName: string;
  employeeId: string;
  employeeName: string;
  selfRating: number | null;
  selfComments: string | null;
  managerRating: number | null;
  managerComments: string | null;
  status: ReviewStatus;
}

export interface SubmitSelfReviewRequest {
  selfRating: number;
  selfComments?: string;
}

export interface SubmitManagerReviewRequest {
  managerRating: number;
  managerComments?: string;
}
