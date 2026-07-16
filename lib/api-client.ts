import type {
  AddSuccessorCandidateRequest,
  AssignPlanRequest,
  AttendanceRecordDto,
  AuthResponse,
  AuthenticatedUser,
  BillingSummaryDto,
  CreateDepartmentRequest,
  CreateEmployeeRequest,
  CreateKeyPositionRequest,
  CreateLeaveRequestRequest,
  CreateReviewCycleRequest,
  CreateSurveyRequest,
  DepartmentDto,
  EmployeeDetail,
  EmployeeDocumentDto,
  EmployeeSummary,
  InviteEmployeeRequest,
  KeyPositionDto,
  LeaveBalanceDto,
  LeaveRequestDto,
  LeaveTypeDto,
  LogTrainingForEmployeeRequest,
  LogTrainingRequest,
  LoginRequest,
  ManualAttendanceRequest,
  NineBoxGridDto,
  OrganizationDetailDto,
  OrganizationSummaryDto,
  PayrollSettingsDto,
  PayrollRunDto,
  PayslipDto,
  PerformanceReviewDto,
  PlanDto,
  RegisterOrganizationRequest,
  ReviewCycleDto,
  RunPayrollRequest,
  SeveranceRecordDto,
  SubmitManagerReviewRequest,
  SubmitSelfReviewRequest,
  SubmitSurveyResponseRequest,
  SuperAdminAuthResponse,
  SuperAdminLoginRequest,
  SurveyDto,
  SurveyResultsDto,
  TaxBracketDto,
  TrainingRecordDto,
  UpdateEmployeeRequest,
  UpdatePayrollSettingsRequest,
  UpdateSuccessorCandidateRequest,
  UpdateTaxBracketRequest,
  UpsertTalentAssessmentRequest,
} from "@hrm/shared";

// Same-origin by default (Netlify redirects /api/* to the bundled function) — no CORS needed.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<TResponse>(
  path: string,
  options: { method?: string; body?: unknown; accessToken?: string } = {},
): Promise<TResponse> {
  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(payload.message ?? "Request failed", res.status);
  }

  if (res.status === HTTP_NO_CONTENT) {
    return undefined as TResponse;
  }
  return res.json() as Promise<TResponse>;
}

const HTTP_NO_CONTENT = 204;

export const api = {
  registerOrganization: (dto: RegisterOrganizationRequest) =>
    request<AuthResponse>("/auth/register-organization", { method: "POST", body: dto }),

  login: (dto: LoginRequest) => request<AuthResponse>("/auth/login", { method: "POST", body: dto }),

  me: (accessToken: string) => request<AuthenticatedUser>("/auth/me", { accessToken }),

  departments: {
    list: (accessToken: string) => request<DepartmentDto[]>("/departments", { accessToken }),
    create: (accessToken: string, dto: CreateDepartmentRequest) =>
      request<DepartmentDto>("/departments", { method: "POST", body: dto, accessToken }),
    remove: (accessToken: string, id: string) =>
      request<void>(`/departments/${id}`, { method: "DELETE", accessToken }),
  },

  employees: {
    list: (accessToken: string) => request<EmployeeSummary[]>("/employees", { accessToken }),
    get: (accessToken: string, id: string) => request<EmployeeDetail>(`/employees/${id}`, { accessToken }),
    create: (accessToken: string, dto: CreateEmployeeRequest) =>
      request<EmployeeDetail>("/employees", { method: "POST", body: dto, accessToken }),
    update: (accessToken: string, id: string, dto: UpdateEmployeeRequest) =>
      request<EmployeeDetail>(`/employees/${id}`, { method: "PATCH", body: dto, accessToken }),
    invite: (accessToken: string, id: string, dto: InviteEmployeeRequest) =>
      request<EmployeeDetail>(`/employees/${id}/invite`, { method: "POST", body: dto, accessToken }),
    getSeverance: (accessToken: string, id: string) =>
      request<SeveranceRecordDto | null>(`/employees/${id}/severance`, { accessToken }),
  },

  documents: {
    list: (accessToken: string, employeeId: string) =>
      request<EmployeeDocumentDto[]>(`/employees/${employeeId}/documents`, { accessToken }),
    upload: async (
      accessToken: string,
      employeeId: string,
      file: File,
      category: string,
    ): Promise<EmployeeDocumentDto> => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);
      const res = await fetch(`${API_URL}/employees/${employeeId}/documents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({ message: res.statusText }));
        throw new ApiError(payload.message ?? "Upload failed", res.status);
      }
      return res.json();
    },
    download: async (accessToken: string, employeeId: string, documentId: string): Promise<Blob> => {
      const res = await fetch(`${API_URL}/employees/${employeeId}/documents/${documentId}/download`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new ApiError("Download failed", res.status);
      return res.blob();
    },
    remove: (accessToken: string, employeeId: string, documentId: string) =>
      request<void>(`/employees/${employeeId}/documents/${documentId}`, { method: "DELETE", accessToken }),
  },

  attendance: {
    clockIn: (accessToken: string) =>
      request<AttendanceRecordDto>("/attendance/clock-in", { method: "POST", accessToken }),
    clockOut: (accessToken: string) =>
      request<AttendanceRecordDto>("/attendance/clock-out", { method: "POST", accessToken }),
    my: (accessToken: string) => request<AttendanceRecordDto[]>("/attendance/me", { accessToken }),
    all: (accessToken: string) => request<AttendanceRecordDto[]>("/attendance", { accessToken }),
    forEmployee: (accessToken: string, employeeId: string) =>
      request<AttendanceRecordDto[]>(`/attendance/employee/${employeeId}`, { accessToken }),
    manual: (accessToken: string, dto: ManualAttendanceRequest) =>
      request<AttendanceRecordDto>("/attendance/manual", { method: "POST", body: dto, accessToken }),
  },

  leaveTypes: {
    list: (accessToken: string) => request<LeaveTypeDto[]>("/leave-types", { accessToken }),
  },

  leaveRequests: {
    myBalances: (accessToken: string) =>
      request<LeaveBalanceDto[]>("/leave-requests/my-balances", { accessToken }),
    myRequests: (accessToken: string) =>
      request<LeaveRequestDto[]>("/leave-requests/my-requests", { accessToken }),
    pendingApprovals: (accessToken: string) =>
      request<LeaveRequestDto[]>("/leave-requests/pending-approvals", { accessToken }),
    create: (accessToken: string, dto: CreateLeaveRequestRequest) =>
      request<LeaveRequestDto>("/leave-requests", { method: "POST", body: dto, accessToken }),
    respond: (accessToken: string, id: string, decision: "APPROVED" | "REJECTED") =>
      request<LeaveRequestDto>(`/leave-requests/${id}/respond`, {
        method: "POST",
        body: { decision },
        accessToken,
      }),
    cancel: (accessToken: string, id: string) =>
      request<LeaveRequestDto>(`/leave-requests/${id}/cancel`, { method: "POST", accessToken }),
  },

  payroll: {
    getSettings: (accessToken: string) => request<PayrollSettingsDto>("/payroll/settings", { accessToken }),
    updateSettings: (accessToken: string, dto: UpdatePayrollSettingsRequest) =>
      request<PayrollSettingsDto>("/payroll/settings", { method: "PATCH", body: dto, accessToken }),
    getTaxBrackets: (accessToken: string) =>
      request<TaxBracketDto[]>("/payroll/settings/tax-brackets", { accessToken }),
    updateTaxBracket: (accessToken: string, id: string, dto: UpdateTaxBracketRequest) =>
      request<TaxBracketDto>(`/payroll/settings/tax-brackets/${id}`, {
        method: "PATCH",
        body: dto,
        accessToken,
      }),
    listRuns: (accessToken: string) => request<PayrollRunDto[]>("/payroll/runs", { accessToken }),
    createRun: (accessToken: string, dto: RunPayrollRequest) =>
      request<PayrollRunDto>("/payroll/runs", { method: "POST", body: dto, accessToken }),
    getPayslips: (accessToken: string, runId: string) =>
      request<PayslipDto[]>(`/payroll/runs/${runId}/payslips`, { accessToken }),
    myPayslips: (accessToken: string) => request<PayslipDto[]>("/payroll/runs/my-payslips", { accessToken }),
    downloadPayslipPdf: async (accessToken: string, payslipId: string): Promise<Blob> => {
      const res = await fetch(`${API_URL}/payroll/payslips/${payslipId}/pdf`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new ApiError("Download failed", res.status);
      return res.blob();
    },
  },

  performance: {
    listCycles: (accessToken: string) => request<ReviewCycleDto[]>("/performance/cycles", { accessToken }),
    createCycle: (accessToken: string, dto: CreateReviewCycleRequest) =>
      request<ReviewCycleDto>("/performance/cycles", { method: "POST", body: dto, accessToken }),
    activateCycle: (accessToken: string, id: string) =>
      request<ReviewCycleDto>(`/performance/cycles/${id}/activate`, { method: "POST", accessToken }),
    closeCycle: (accessToken: string, id: string) =>
      request<ReviewCycleDto>(`/performance/cycles/${id}/close`, { method: "POST", accessToken }),
    myReviews: (accessToken: string) =>
      request<PerformanceReviewDto[]>("/performance/reviews/my-reviews", { accessToken }),
    pending: (accessToken: string) =>
      request<PerformanceReviewDto[]>("/performance/reviews/pending", { accessToken }),
    forCycle: (accessToken: string, cycleId: string) =>
      request<PerformanceReviewDto[]>(`/performance/reviews?cycleId=${cycleId}`, { accessToken }),
    submitSelfReview: (accessToken: string, reviewId: string, dto: SubmitSelfReviewRequest) =>
      request<PerformanceReviewDto>(`/performance/reviews/${reviewId}/self-review`, {
        method: "POST",
        body: dto,
        accessToken,
      }),
    submitManagerReview: (accessToken: string, reviewId: string, dto: SubmitManagerReviewRequest) =>
      request<PerformanceReviewDto>(`/performance/reviews/${reviewId}/manager-review`, {
        method: "POST",
        body: dto,
        accessToken,
      }),
  },

  training: {
    my: (accessToken: string) => request<TrainingRecordDto[]>("/training/my-training", { accessToken }),
    logMine: (accessToken: string, dto: LogTrainingRequest) =>
      request<TrainingRecordDto>("/training/my-training", { method: "POST", body: dto, accessToken }),
    all: (accessToken: string) => request<TrainingRecordDto[]>("/training", { accessToken }),
    logForEmployee: (accessToken: string, dto: LogTrainingForEmployeeRequest) =>
      request<TrainingRecordDto>("/training", { method: "POST", body: dto, accessToken }),
  },

  surveys: {
    list: (accessToken: string) => request<SurveyDto[]>("/surveys", { accessToken }),
    create: (accessToken: string, dto: CreateSurveyRequest) =>
      request<SurveyDto>("/surveys", { method: "POST", body: dto, accessToken }),
    open: (accessToken: string, id: string) =>
      request<SurveyDto>(`/surveys/${id}/open`, { method: "POST", accessToken }),
    close: (accessToken: string, id: string) =>
      request<SurveyDto>(`/surveys/${id}/close`, { method: "POST", accessToken }),
    getResults: (accessToken: string, id: string) =>
      request<SurveyResultsDto>(`/surveys/${id}/results`, { accessToken }),
    listOpenForMe: (accessToken: string) => request<SurveyDto[]>("/survey-responses/open", { accessToken }),
    submit: (accessToken: string, surveyId: string, dto: SubmitSurveyResponseRequest) =>
      request<void>(`/survey-responses/${surveyId}`, { method: "POST", body: dto, accessToken }),
  },

  succession: {
    getGrid: (accessToken: string) =>
      request<NineBoxGridDto>("/succession/talent-assessments/grid", { accessToken }),
    upsertAssessment: (accessToken: string, employeeId: string, dto: UpsertTalentAssessmentRequest) =>
      request<void>(`/succession/talent-assessments/${employeeId}`, {
        method: "PUT",
        body: dto,
        accessToken,
      }),
    listKeyPositions: (accessToken: string) =>
      request<KeyPositionDto[]>("/succession/key-positions", { accessToken }),
    createKeyPosition: (accessToken: string, dto: CreateKeyPositionRequest) =>
      request<KeyPositionDto>("/succession/key-positions", { method: "POST", body: dto, accessToken }),
    removeKeyPosition: (accessToken: string, id: string) =>
      request<void>(`/succession/key-positions/${id}`, { method: "DELETE", accessToken }),
    addCandidate: (accessToken: string, positionId: string, dto: AddSuccessorCandidateRequest) =>
      request<KeyPositionDto>(`/succession/key-positions/${positionId}/candidates`, {
        method: "POST",
        body: dto,
        accessToken,
      }),
    updateCandidate: (
      accessToken: string,
      positionId: string,
      candidateId: string,
      dto: UpdateSuccessorCandidateRequest,
    ) =>
      request<KeyPositionDto>(`/succession/key-positions/${positionId}/candidates/${candidateId}`, {
        method: "PATCH",
        body: dto,
        accessToken,
      }),
    removeCandidate: (accessToken: string, positionId: string, candidateId: string) =>
      request<void>(`/succession/key-positions/${positionId}/candidates/${candidateId}`, {
        method: "DELETE",
        accessToken,
      }),
  },

  billing: {
    getSummary: (accessToken: string) => request<BillingSummaryDto>("/billing/plan", { accessToken }),
    listPlans: (accessToken: string) => request<PlanDto[]>("/billing/plans", { accessToken }),
  },

  superadmin: {
    login: (dto: SuperAdminLoginRequest) =>
      request<SuperAdminAuthResponse>("/auth/superadmin-login", { method: "POST", body: dto }),
    listOrganizations: (accessToken: string) =>
      request<OrganizationSummaryDto[]>("/superadmin/organizations", { accessToken }),
    getOrganization: (accessToken: string, id: string) =>
      request<OrganizationDetailDto>(`/superadmin/organizations/${id}`, { accessToken }),
    suspendOrganization: (accessToken: string, id: string) =>
      request<OrganizationSummaryDto>(`/superadmin/organizations/${id}/suspend`, {
        method: "POST",
        accessToken,
      }),
    reactivateOrganization: (accessToken: string, id: string) =>
      request<OrganizationSummaryDto>(`/superadmin/organizations/${id}/reactivate`, {
        method: "POST",
        accessToken,
      }),
    assignPlan: (accessToken: string, id: string, dto: AssignPlanRequest) =>
      request<OrganizationSummaryDto>(`/superadmin/organizations/${id}/plan`, {
        method: "POST",
        body: dto,
        accessToken,
      }),
    listPlans: (accessToken: string) => request<PlanDto[]>("/superadmin/plans", { accessToken }),
  },
};
