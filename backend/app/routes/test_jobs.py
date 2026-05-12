from datetime import datetime

from flask import Blueprint, jsonify, request

from app.extensions import db
from app.models import TestJob, TestLog, TestResult
from app.services.test_runner import run_fake_diagnostic


test_jobs_bp = Blueprint("test_jobs", __name__)


@test_jobs_bp.get("/test-jobs")
def list_test_jobs():
    query = TestJob.query

    status = request.args.get("status")
    request_id = request.args.get("requestId")
    test_suite_id = request.args.get("testSuiteId")
    lab_station = request.args.get("labStation")
    operator_name = request.args.get("operatorName")

    if status:
        query = query.filter(TestJob.status == status)
    if request_id:
        query = query.filter(TestJob.request_id == request_id)
    if test_suite_id:
        query = query.filter(TestJob.test_suite_id == test_suite_id)
    if lab_station:
        query = query.filter(TestJob.lab_station == lab_station)
    if operator_name:
        query = query.filter(TestJob.operator_name == operator_name)

    test_jobs = query.order_by(TestJob.created_at.desc()).all()

    return jsonify({"items": [job.to_dict() for job in test_jobs]})


@test_jobs_bp.get("/test-jobs/<int:test_job_id>")
def get_test_job(test_job_id):
    test_job = db.session.get(TestJob, test_job_id)

    if test_job is None:
        return jsonify({"error": "Test job not found."}), 404

    return jsonify(test_job.to_dict())


@test_jobs_bp.post("/test-jobs/<int:test_job_id>/run")
def run_test_job(test_job_id):
    test_job = db.session.get(TestJob, test_job_id)

    if test_job is None:
        return jsonify({"error": "Test job not found."}), 404

    if test_job.status != "PENDING":
        return (
            jsonify({"error": "Only PENDING test jobs can be run."}),
            400,
        )

    if test_job.logs or test_job.result:
        message = "Test job already has logs or a result. It cannot be run safely."
        return (
            jsonify({"error": message}),
            400,
        )

    test_job.status = "RUNNING"
    test_job.started_at = datetime.utcnow()
    db.session.commit()

    diagnostic_output = run_fake_diagnostic(test_job)

    for log_data in diagnostic_output["logs"]:
        db.session.add(
            TestLog(
                job_id=test_job.id,
                log_level=log_data["level"],
                message=log_data["message"],
            )
        )

    result_data = diagnostic_output["result"]
    db.session.add(
        TestResult(
            job_id=test_job.id,
            result_status=result_data["result_status"],
            summary=result_data["summary"],
            failed_step=result_data["failed_step"],
            error_code=result_data["error_code"],
            recommendation=result_data["recommendation"],
        )
    )

    finished_at = datetime.utcnow()
    test_job.status = diagnostic_output["final_status"]
    test_job.finished_at = finished_at
    test_job.duration_seconds = int((finished_at - test_job.started_at).total_seconds())
    test_job.request.status = "COMPLETED"
    db.session.commit()

    response = test_job.to_dict(include_details=True)
    response["message"] = "Test job executed successfully"

    return jsonify(response)


@test_jobs_bp.get("/test-jobs/<int:test_job_id>/logs")
def get_test_job_logs(test_job_id):
    test_job = db.session.get(TestJob, test_job_id)

    if test_job is None:
        return jsonify({"error": "Test job not found."}), 404

    logs = (
        TestLog.query.filter_by(job_id=test_job.id)
        .order_by(TestLog.created_at.asc())
        .all()
    )

    return jsonify({"items": [log.to_dict() for log in logs]})


@test_jobs_bp.get("/test-jobs/<int:test_job_id>/result")
def get_test_job_result(test_job_id):
    test_job = db.session.get(TestJob, test_job_id)

    if test_job is None:
        return jsonify({"error": "Test job not found."}), 404

    if test_job.result is None:
        return jsonify({"error": "Result not available for this job."}), 404

    return jsonify(test_job.result.to_dict())
