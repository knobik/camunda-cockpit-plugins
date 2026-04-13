export interface API {
  adminApi: string;
  baseApi: string;
  engineApi: string;
  engine: string;
  tasklistApi: string;
  CSRFToken: string;
}

export interface RoutePluginParams {
  api: API;
}

export interface DefinitionPluginParams {
  root: Element;
  api: API;
  processDefinitionId: string;
}

export interface InstancePluginParams {
  api: API;
  processInstanceId: string;
}

export interface TaskListPluginParams {
  api: API;
  taskId: string;
}

// Migration types

export interface MigrationInstructionDto {
  sourceActivityIds: string[];
  targetActivityIds: string[];
  updateEventTrigger?: boolean;
}

export interface MigrationPlanDto {
  sourceProcessDefinitionId: string;
  targetProcessDefinitionId: string;
  instructions: MigrationInstructionDto[];
  variables?: Record<string, VariableValueDto>;
}

export interface MigrationPlanGenerationDto {
  sourceProcessDefinitionId: string;
  targetProcessDefinitionId: string;
  updateEventTriggers?: boolean;
  variables?: Record<string, VariableValueDto>;
}

export interface MigrationExecutionDto {
  migrationPlan: MigrationPlanDto;
  processInstanceIds?: string[];
  processInstanceQuery?: Record<string, any>;
  skipCustomListeners?: boolean;
  skipIoMappings?: boolean;
}

export interface MigrationInstructionValidationReportDto {
  instruction: MigrationInstructionDto;
  failures: string[];
}

export interface MigrationVariableValidationReportDto {
  type: string;
  value: any;
  failures: string[];
}

export interface MigrationPlanReportDto {
  instructionReports: MigrationInstructionValidationReportDto[];
  variableReports: Record<string, MigrationVariableValidationReportDto>;
}

export interface VariableValueDto {
  type: string;
  value: any;
  valueInfo?: Record<string, any>;
}

export interface ProcessDefinitionDto {
  id: string;
  key: string;
  name: string;
  version: number;
  resource: string;
  deploymentId: string;
  suspended: boolean;
}

export interface BatchDto {
  id: string;
  type: string;
  totalJobs: number;
  jobsCreated: number;
  batchJobsPerSeed: number;
  invocationsPerBatchJob: number;
  seedJobDefinitionId: string;
  monitorJobDefinitionId: string;
  batchJobDefinitionId: string;
  suspended: boolean;
  tenantId: string | null;
  createUserId: string;
}
