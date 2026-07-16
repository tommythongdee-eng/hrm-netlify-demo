export declare const TrainingCategory: {
    readonly INTERNAL: "INTERNAL";
    readonly EXTERNAL: "EXTERNAL";
    readonly CERTIFICATION: "CERTIFICATION";
    readonly OTHER: "OTHER";
};
export type TrainingCategory = (typeof TrainingCategory)[keyof typeof TrainingCategory];
export interface TrainingRecordDto {
    id: string;
    employeeId: string;
    employeeName: string;
    title: string;
    provider: string | null;
    category: TrainingCategory;
    completionDate: string;
    expiryDate: string | null;
    hours: number | null;
    notes: string | null;
}
export interface LogTrainingRequest {
    title: string;
    provider?: string;
    category: TrainingCategory;
    completionDate: string;
    expiryDate?: string;
    hours?: number;
    notes?: string;
}
export interface LogTrainingForEmployeeRequest extends LogTrainingRequest {
    employeeId: string;
}
