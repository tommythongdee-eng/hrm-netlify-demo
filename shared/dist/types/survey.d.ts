export declare const SurveyStatus: {
    readonly DRAFT: "DRAFT";
    readonly OPEN: "OPEN";
    readonly CLOSED: "CLOSED";
};
export type SurveyStatus = (typeof SurveyStatus)[keyof typeof SurveyStatus];
export declare const SurveyQuestionType: {
    readonly RATING_1_5: "RATING_1_5";
    readonly NPS_0_10: "NPS_0_10";
    readonly TEXT: "TEXT";
};
export type SurveyQuestionType = (typeof SurveyQuestionType)[keyof typeof SurveyQuestionType];
export interface SurveyQuestionDto {
    id: string;
    text: string;
    type: SurveyQuestionType;
    order: number;
}
export interface SurveyDto {
    id: string;
    title: string;
    description: string | null;
    status: SurveyStatus;
    questions: SurveyQuestionDto[];
    participantCount: number;
    totalEmployeeCount: number;
}
export interface CreateSurveyQuestionInput {
    text: string;
    type: SurveyQuestionType;
}
export interface CreateSurveyRequest {
    title: string;
    description?: string;
    questions: CreateSurveyQuestionInput[];
}
export interface SubmitSurveyAnswerInput {
    questionId: string;
    numericValue?: number;
    textValue?: string;
}
export interface SubmitSurveyResponseRequest {
    answers: SubmitSurveyAnswerInput[];
}
export interface SurveyQuestionResultDto {
    questionId: string;
    text: string;
    type: SurveyQuestionType;
    responseCount: number;
    averageValue: number | null;
    distribution: Record<string, number>;
    textAnswers: string[];
}
export interface SurveyResultsDto {
    surveyId: string;
    title: string;
    participantCount: number;
    totalEmployeeCount: number;
    questions: SurveyQuestionResultDto[];
}
