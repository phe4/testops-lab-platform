# TestOps Lab Platform

TestOps Lab Platform is a portfolio project for simulating a hardware/software diagnostic test infrastructure workflow.

Phase 1 builds the backend skeleton with Flask, Flask-SQLAlchemy, MySQL, Docker, and Docker Compose.
Phase 2 adds Test Request APIs for creating, listing, viewing, and approving validation requests.
Phase 3 adds Test Suite APIs and scheduling an approved request into a test job.
Phase 4 adds fake test execution, logs, results, and report APIs.
Phase 5 adds a React frontend MVP for the full validation workflow.

## Phase 1: Backend Skeleton

### What is included

- Flask application factory
- SQLAlchemy configuration
- MySQL connection through environment variables
- Automatic table creation on backend startup
- Health check endpoint at `GET /api/health`
- Initial database models:
  - `TestRequest`
  - `TestSuite`
  - `TestJob`
  - `TestLog`
  - `TestResult`
- Dockerfile for the backend
- Docker Compose setup for backend and MySQL

### Run Phase 1

From the project root:

```bash
docker compose up --build
```

The backend will be available at:

```text
http://localhost:5000
```

The frontend will be available at:

```text
http://localhost:3000
```

### Verify the Health Endpoint

In another terminal, run:

```bash
curl http://localhost:5000/api/health
```

Expected response:

```json
{
  "service": "testops-backend",
  "status": "ok"
}
```

### Dashboard Summary

```bash
curl http://localhost:5000/api/dashboard/summary
```

### Dashboard Recent Failures

```bash
curl http://localhost:5000/api/dashboard/recent-failures
```

## Phase 2: Test Request APIs

### Create a Test Request

```bash
curl -X POST http://localhost:5000/api/test-requests \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Validate power delivery component",
    "requesterName": "hardware_engineer_1",
    "componentName": "Prototype GPU Board",
    "componentType": "GPU_BOARD",
    "targetSerial": "EVT-GPU-00023",
    "priority": "HIGH",
    "description": "Need validation after power component revision."
  }'
```

### List Test Requests

```bash
curl http://localhost:5000/api/test-requests
```

Optional filters:

```bash
curl "http://localhost:5000/api/test-requests?status=SUBMITTED&priority=HIGH"
curl "http://localhost:5000/api/test-requests?componentType=GPU_BOARD"
```

### Get Test Request Detail

```bash
curl http://localhost:5000/api/test-requests/1
```

### Approve a Test Request

```bash
curl -X POST http://localhost:5000/api/test-requests/1/approve
```

## Phase 3: Test Suite and Test Job APIs

### List Test Suites

```bash
curl http://localhost:5000/api/test-suites
```

Include inactive suites:

```bash
curl "http://localhost:5000/api/test-suites?includeInactive=true"
```

### Schedule an Approved Request

```bash
curl -X POST http://localhost:5000/api/test-requests/1/schedule ^
  -H "Content-Type: application/json" ^
  -d "{\"testSuiteId\":1,\"labStation\":\"LAB-STATION-03\",\"operatorName\":\"test_engineer_1\"}"
```

### Get Test Job Detail

```bash
curl http://localhost:5000/api/test-jobs/1
```

### List Test Jobs

```bash
curl http://localhost:5000/api/test-jobs
```

## Phase 4: Run Jobs, Logs, Results, and Reports

### Run a Test Job

```bash
curl -X POST http://localhost:5000/api/test-jobs/1/run
```

### Get Job Logs

```bash
curl http://localhost:5000/api/test-jobs/1/logs
```

### Get Job Result

```bash
curl http://localhost:5000/api/test-jobs/1/result
```

### Get Request Report

```bash
curl http://localhost:5000/api/reports/3
```

### Passing Validation Flow

Create a passing request:

```bash
curl -X POST http://localhost:5000/api/test-requests ^
  -H "Content-Type: application/json" ^
  -d "{\"title\":\"Passing diagnostic validation\",\"requesterName\":\"hardware_engineer_1\",\"componentName\":\"Prototype GPU Board\",\"componentType\":\"GPU_BOARD\",\"targetSerial\":\"EVT-GPU-00024\",\"priority\":\"HIGH\",\"description\":\"Passing Phase 4 validation request.\"}"
```

Approve it:

```bash
curl -X POST http://localhost:5000/api/test-requests/4/approve
```

Schedule it:

```bash
curl -X POST http://localhost:5000/api/test-requests/4/schedule ^
  -H "Content-Type: application/json" ^
  -d "{\"testSuiteId\":1,\"labStation\":\"LAB-STATION-03\",\"operatorName\":\"test_engineer_1\"}"
```

Run the job, then get logs, result, and report:

```bash
curl -X POST http://localhost:5000/api/test-jobs/2/run
curl http://localhost:5000/api/test-jobs/2/logs
curl http://localhost:5000/api/test-jobs/2/result
curl http://localhost:5000/api/reports/4
```

### Failure Validation Flow

Create a failing request by including `FAIL` in `targetSerial`:

```bash
curl -X POST http://localhost:5000/api/test-requests ^
  -H "Content-Type: application/json" ^
  -d "{\"title\":\"Failing diagnostic validation\",\"requesterName\":\"hardware_engineer_1\",\"componentName\":\"Prototype GPU Board\",\"componentType\":\"GPU_BOARD\",\"targetSerial\":\"EVT-GPU-FAIL-001\",\"priority\":\"HIGH\",\"description\":\"Failing Phase 4 validation request.\"}"
```

Approve, schedule, run, and inspect it:

```bash
curl -X POST http://localhost:5000/api/test-requests/5/approve
curl -X POST http://localhost:5000/api/test-requests/5/schedule ^
  -H "Content-Type: application/json" ^
  -d "{\"testSuiteId\":1,\"labStation\":\"LAB-STATION-03\",\"operatorName\":\"test_engineer_1\"}"
curl -X POST http://localhost:5000/api/test-jobs/3/run
curl http://localhost:5000/api/test-jobs/3/logs
curl http://localhost:5000/api/test-jobs/3/result
curl http://localhost:5000/api/reports/5
```

## Phase 5: Frontend MVP

### Run the Full Stack

From the project root:

```bash
docker compose up --build -d
```

Open the frontend:

```text
http://localhost:3000
```

Backend API:

```text
http://localhost:5000/api
```

The frontend reads its API base URL from:

```text
VITE_API_BASE_URL
```

Docker Compose sets it to:

```text
http://localhost:5000/api
```

### Manual Validation Flow

1. Open `http://localhost:3000`.
2. Confirm dashboard request and job metrics load.
3. Confirm recent requests and recent failed jobs sections load.
4. Go to Create Request.
5. Submit a validation request.
6. Open the request detail page.
7. Approve the request.
8. Schedule a job with a test suite, lab station, and operator.
9. Open the Test Jobs page or the scheduled job.
10. Run the job.
11. Review logs and result.
12. Open the report page.

### Frontend Local Commands

From the `frontend` folder:

```bash
npm install
npm run build
```

### Database Configuration

The backend reads these environment variables:

- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_DATABASE`
- `MYSQL_USER`
- `MYSQL_PASSWORD`

Docker Compose sets these automatically for local development.

### Known Limitations

- Tables are created with `db.create_all()` on startup for now.
- Database migrations are not configured yet.
- Default test suites are seeded automatically the first time `GET /api/test-suites` is called if the table is empty.
- Fake diagnostics are synchronous and deterministic. A target serial containing `FAIL` produces a failed result.
- The frontend is an MVP and does not include auth, charts, advanced state management, or live updates.
- No background jobs or real hardware test execution has been added yet.
