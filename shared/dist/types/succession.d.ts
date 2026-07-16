export declare const RatingLevel: {
    readonly LOW: "LOW";
    readonly MEDIUM: "MEDIUM";
    readonly HIGH: "HIGH";
};
export type RatingLevel = (typeof RatingLevel)[keyof typeof RatingLevel];
export declare const ReadinessLevel: {
    readonly READY_NOW: "READY_NOW";
    readonly READY_1_2_YEARS: "READY_1_2_YEARS";
    readonly READY_3_5_YEARS: "READY_3_5_YEARS";
};
export type ReadinessLevel = (typeof ReadinessLevel)[keyof typeof ReadinessLevel];
export declare const PositionCriticality: {
    readonly MEDIUM: "MEDIUM";
    readonly HIGH: "HIGH";
};
export type PositionCriticality = (typeof PositionCriticality)[keyof typeof PositionCriticality];
export interface TalentAssessmentDto {
    employeeId: string;
    employeeName: string;
    performanceRating: RatingLevel;
    potentialRating: RatingLevel;
    notes: string | null;
    assessedAt: string;
}
export interface UpsertTalentAssessmentRequest {
    performanceRating: RatingLevel;
    potentialRating: RatingLevel;
    notes?: string;
}
export interface NineBoxCellDto {
    performanceRating: RatingLevel;
    potentialRating: RatingLevel;
    employees: {
        employeeId: string;
        employeeName: string;
    }[];
}
export interface NineBoxGridDto {
    cells: NineBoxCellDto[];
    unassessedEmployees: {
        employeeId: string;
        employeeName: string;
    }[];
}
export interface KeyPositionDto {
    id: string;
    title: string;
    criticality: PositionCriticality | null;
    notes: string | null;
    currentHolderId: string | null;
    currentHolderName: string | null;
    candidates: SuccessorCandidateDto[];
}
export interface CreateKeyPositionRequest {
    title: string;
    criticality?: PositionCriticality;
    notes?: string;
    currentHolderId?: string;
}
export interface SuccessorCandidateDto {
    id: string;
    employeeId: string;
    employeeName: string;
    readiness: ReadinessLevel;
    notes: string | null;
}
export interface AddSuccessorCandidateRequest {
    employeeId: string;
    readiness: ReadinessLevel;
    notes?: string;
}
export interface UpdateSuccessorCandidateRequest {
    readiness?: ReadinessLevel;
    notes?: string;
}
