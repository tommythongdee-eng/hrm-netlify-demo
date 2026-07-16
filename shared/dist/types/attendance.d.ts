export declare const AttendanceSource: {
    readonly SELF_SERVICE: "SELF_SERVICE";
    readonly MANUAL: "MANUAL";
};
export type AttendanceSource = (typeof AttendanceSource)[keyof typeof AttendanceSource];
export interface AttendanceRecordDto {
    id: string;
    employeeId: string;
    employeeName: string;
    date: string;
    clockIn: string | null;
    clockOut: string | null;
    source: AttendanceSource;
    note: string | null;
}
export interface ManualAttendanceRequest {
    employeeId: string;
    date: string;
    clockIn?: string;
    clockOut?: string;
    note?: string;
}
