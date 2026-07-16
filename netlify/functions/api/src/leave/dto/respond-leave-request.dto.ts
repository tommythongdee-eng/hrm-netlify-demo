import { IsIn } from "class-validator";
import { LeaveRequestStatus } from "@hrm/shared";

const RESPOND_STATUSES = [LeaveRequestStatus.APPROVED, LeaveRequestStatus.REJECTED] as const;

export class RespondLeaveRequestDto {
  @IsIn(RESPOND_STATUSES)
  decision!: (typeof RESPOND_STATUSES)[number];
}
