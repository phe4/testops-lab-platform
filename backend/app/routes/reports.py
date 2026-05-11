from flask import Blueprint, jsonify

from app.extensions import db
from app.models import TestLog, TestRequest


reports_bp = Blueprint("reports", __name__)


@reports_bp.get("/reports/<int:test_request_id>")
def get_report(test_request_id):
    test_request = db.session.get(TestRequest, test_request_id)

    if test_request is None:
        return jsonify({"error": "Test request not found."}), 404

    report_status = "READY" if test_request.status == "COMPLETED" else "IN_PROGRESS"
    jobs = []
    for job in test_request.jobs:
        logs = (
            TestLog.query.filter_by(job_id=job.id)
            .order_by(TestLog.created_at.asc())
            .all()
        )
        jobs.append(
            {
                "id": job.id,
                "status": job.status,
                "labStation": job.lab_station,
                "operatorName": job.operator_name,
                "startedAt": job.started_at.isoformat()
                if job.started_at
                else None,
                "finishedAt": job.finished_at.isoformat()
                if job.finished_at
                else None,
                "durationSeconds": job.duration_seconds,
                "testSuite": {
                    "id": job.test_suite.id,
                    "name": job.test_suite.name,
                }
                if job.test_suite
                else None,
                "logs": [log.to_dict() for log in logs],
                "result": job.result.to_dict() if job.result else None,
            }
        )

    return jsonify(
        {
            "request": {
                "id": test_request.id,
                "title": test_request.title,
                "componentName": test_request.component_name,
                "componentType": test_request.component_type,
                "targetSerial": test_request.target_serial,
                "priority": test_request.priority,
                "status": test_request.status,
            },
            "reportStatus": report_status,
            "jobs": jobs,
        }
    )
