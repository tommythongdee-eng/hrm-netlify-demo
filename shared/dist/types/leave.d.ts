export declare const LeaveRequestStatus: {
    readonly PENDING: "PENDING";
    readonly APPROVED: "APPROVED";
    readonly REJECTED: "REJECTED";
    readonly CANCELLED: "CANCELLED";
};
export type LeaveRequestStatus = (typeof LeaveRequestStatus)[keyof typeof LeaveRequestStatus];
export interface LeaveTypeDto {
    id: string;
    name: string;
    code: string;
    defaultDaysPerYear: number;
    requiresApproval: boolean;
    isPaid: boolean;
}
export interface LeaveBalanceDto {
    leaveTypeId: string;
    leaveTypeName: string;
    year: number;
    allocatedDays: number;
    usedDays: number;
    remainingDays: number;
}
export interface LeaveRequestDto {
    id: string;
    employeeId: string;
    employeeName: string;
    leaveTypeId: string;
    leaveTypeName: string;
    startDate: string;
    endDate: string;
    daysCount: number;
    reason: string | null;
    status: LeaveRequestStatus;
    createdAt: string;
}
export interface CreateLeaveRequestRequest {
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    reason?: string;
}
