export declare const EmploymentType: {
    readonly FULL_TIME: "FULL_TIME";
    readonly PART_TIME: "PART_TIME";
    readonly CONTRACT: "CONTRACT";
};
export type EmploymentType = (typeof EmploymentType)[keyof typeof EmploymentType];
export declare const EmployeeStatus: {
    readonly ACTIVE: "ACTIVE";
    readonly ON_LEAVE: "ON_LEAVE";
    readonly RESIGNED: "RESIGNED";
    readonly TERMINATED: "TERMINATED";
};
export type EmployeeStatus = (typeof EmployeeStatus)[keyof typeof EmployeeStatus];
export declare const DocumentCategory: {
    readonly CONTRACT: "CONTRACT";
    readonly ID_COPY: "ID_COPY";
    readonly CERTIFICATE: "CERTIFICATE";
    readonly OTHER: "OTHER";
};
export type DocumentCategory = (typeof DocumentCategory)[keyof typeof DocumentCategory];
export interface DepartmentDto {
    id: string;
    name: string;
}
export interface CreateDepartmentRequest {
    name: string;
}
export interface EmployeeSummary {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    position: string;
    employmentType: EmploymentType;
    status: EmployeeStatus;
    department: DepartmentDto | null;
    managerId: string | null;
    hasPortalAccess: boolean;
}
export interface EmployeeDetail extends EmployeeSummary {
    firstNameTh: string | null;
    lastNameTh: string | null;
    nationalId: string | null;
    dateOfBirth: string | null;
    gender: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    baseSalary: number;
    bankName: string | null;
    bankAccountNumber: string | null;
    startDate: string;
    endDate: string | null;
    providentFundOptIn: boolean;
    providentFundEmployeeRate: number | null;
}
export interface CreateEmployeeRequest {
    firstName: string;
    lastName: string;
    firstNameTh?: string;
    lastNameTh?: string;
    nationalId?: string;
    dateOfBirth?: string;
    gender?: string;
    email?: string;
    phone?: string;
    address?: string;
    departmentId?: string;
    position: string;
    employmentType: EmploymentType;
    managerId?: string;
    baseSalary: number;
    bankName?: string;
    bankAccountNumber?: string;
    startDate: string;
    providentFundOptIn?: boolean;
    providentFundEmployeeRate?: number;
}
export type UpdateEmployeeRequest = Partial<CreateEmployeeRequest> & {
    status?: EmployeeStatus;
};
export interface InviteEmployeeRequest {
    email: string;
    password: string;
}
export interface EmployeeDocumentDto {
    id: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    category: DocumentCategory;
    createdAt: string;
}
export interface SeveranceRecordDto {
    employeeId: string;
    yearsOfService: number;
    daysOfPay: number;
    dailyRate: number;
    amount: number;
    calculatedAt: string;
}
