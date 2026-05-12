from flask import Blueprint, jsonify, request
from sqlalchemy import func

from app.models import TestJob, TestRequest


dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.get("/dashboard/summary")
def get_dashboard_summary():
    total_requests = TestRequest.query.count()
    submitted_requests = TestRequest.query.filter_by(status="SUBMITTED").count()
    approved_requests = TestRequest.query.filter_by(status="APPROVED").count()
    scheduled_requests = TestRequest.query.filter_by(status="SCHEDULED").count()
    completed_requests = TestRequest.query.filter_by(status="COMPLETED").count()

    total_jobs = TestJob.query.count()
    pending_jobs = TestJob.query.filter_by(status="PENDING").count()
    running_jobs = TestJob.query.filter_by(status="RUNNING").count()
    passed_jobs = TestJob.query.filter_by(status="PASSED").count()
    failed_jobs = TestJob.query.filter_by(status="FAILED").count()

    completed_job_count = passed_jobs + failed_jobs
    pass_rate = (
        round((passed_jobs / completed_job_count) * 100, 2)
        if completed_job_count
        else 0
    )

    average_duration = (
        TestJob.query.with_entities(func.avg(TestJob.duration_seconds))
        .filter(TestJob.duration_seconds.isnot(None))
        .scalar()
    )
    average_duration_seconds = round(average_duration or 0)

    return jsonify(
        {
            "totalRequests": total_requests,
            "submittedRequests": submitted_requests,
            "approvedRequests": approved_requests,
            "scheduledRequests": scheduled_requests,
            "completedRequests": completed_requests,
            "totalJobs": total_jobs,
            "pendingJobs": pending_jobs,
            "runningJobs": running_jobs,
            "passedJobs": passed_jobs,
            "failedJobs": failed_jobs,
            "passRate": pass_rate,
            "averageDurationSeconds": average_duration_seconds,
        }
    )


@dashboard_bp.get("/dashboard/recent-failures")
def get_recent_failures():
    limit = request.args.get("limit", default=5, type=int) or 5

    failed_jobs = (
        TestJob.query.filter_by(status="FAILED")
        .order_by(TestJob.finished_at.desc(), TestJob.created_at.desc())
        .limit(limit)
        .all()
    )

    return jsonify(
        {"items": [job.to_dict(include_result=True) for job in failed_jobs]}
    )
