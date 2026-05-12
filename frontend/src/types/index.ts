export interface TestRequest {
  id: number;
  title: string;
  requesterName: string;
  componentName: string;
  componentType: string;
  targetSerial: string;
  priority: string;
  status: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TestSuite {
  id: number;
  name: string;
  description: string | null;
  command: string;
  estimatedDurationSeconds: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TestLog {
  id: number;
  jobId: number;
  logLevel: string;
  message: string;
  createdAt: string;
}

export interface TestResult {
  id: number;
  jobId: number;
  resultStatus: string;
  summary: string | null;
  failedStep: string | null;
  errorCode: string | null;
  recommendation: string | null;
  createdAt: string;
}

export interface TestJob {
  id: number;
  requestId: number;
  testSuiteId: number;
  labStation: string | null;
  operatorName: string | null;
  status: string;
  startedAt: string | null;
  finishedAt: string | null;
  durationSeconds: number | null;
  createdAt: string;
  updatedAt: string;
  testSuite?: {
    id: number;
    name: string;
    version?: string | null;
  } | null;
  request?: {
    id: number;
    title: string;
    status: string;
  } | null;
  logs?: TestLog[];
  result?: TestResult | null;
}

export interface ReportResponse {
  request: {
    id: number;
    title: string;
    componentName: string;
    componentType: string;
    targetSerial: string;
    priority: string;
    status: string;
  };
  reportStatus: string;
  jobs: Array<{
    id: number;
    status: string;
    labStation: string | null;
    operatorName: string | null;
    startedAt: string | null;
    finishedAt: string | null;
    durationSeconds: number | null;
    testSuite: {
      id: number;
      name: string;
    } | null;
    logs: TestLog[];
    result: TestResult | null;
  }>;
}
