from flask import Blueprint, jsonify, request

from app.extensions import db
from app.models import TestJob, TestRequest, TestSuite


test_requests_bp = Blueprint("test_requests", __name__)

REQUIRED_FIELDS = {
    "title": "title",
    "requesterName": "requester_name",
    "componentName": "component_name",
    "componentType": "component_type",
    "targetSerial": "target_serial",
}


def clean_string(value):
    if value is None:
        return ""
    return str(value).strip()


def validation_error(message):
    return jsonify({"error": message}), 400


@test_requests_bp.post("/test-requests")
def create_test_request():
    data = request.get_json(silent=True)

    if data is None:
        return validation_error("Request body must be valid JSON.")

    missing_fields = [
        field for field in REQUIRED_FIELDS if not clean_string(data.get(field))
    ]
    if missing_fields:
        return validation_error(
            f"Missing required field(s): {', '.join(missing_fields)}."
        )

    priority = clean_string(data.get("priority")) or "MEDIUM"

    test_request = TestRequest(
        title=clean_string(data["title"]),
        requester_name=clean_string(data["requesterName"]),
        component_name=clean_string(data["componentName"]),
        component_type=clean_string(data["componentType"]),
        target_serial=clean_string(data["targetSerial"]),
        priority=priority or "MEDIUM",
        description=data.get("description"),
    )

    db.session.add(test_request)
    db.session.commit()

    return (
        jsonify(
            {
                "id": test_request.id,
                "status": test_request.status,
                "message": "Test request created successfully",
            }
        ),
        201,
    )


@test_requests_bp.get("/test-requests")
def list_test_requests():
    query = TestRequest.query

    status = request.args.get("status")
    priority = request.args.get("priority")
    component_type = request.args.get("componentType")

    if status:
        query = query.filter(TestRequest.status == status)
    if priority:
        query = query.filter(TestRequest.priority == priority)
    if component_type:
        query = query.filter(TestRequest.component_type == component_type)

    test_requests = query.order_by(TestRequest.created_at.desc()).all()

    return jsonify({"items": [item.to_dict() for item in test_requests]})


@test_requests_bp.get("/test-requests/<int:test_request_id>")
def get_test_request(test_request_id):
    test_request = db.session.get(TestRequest, test_request_id)

    if test_request is None:
        return jsonify({"error": "Test request not found."}), 404

    return jsonify(test_request.to_dict())


@test_requests_bp.post("/test-requests/<int:test_request_id>/approve")
def approve_test_request(test_request_id):
    test_request = db.session.get(TestRequest, test_request_id)

    if test_request is None:
        return jsonify({"error": "Test request not found."}), 404

    if test_request.status not in {"SUBMITTED", "UNDER_REVIEW"}:
        return validation_error(
            "Only SUBMITTED or UNDER_REVIEW test requests can be approved."
        )

    test_request.status = "APPROVED"
    db.session.commit()

    return jsonify(
        {
            "id": test_request.id,
            "status": test_request.status,
            "message": "Test request approved successfully",
        }
    )


@test_requests_bp.post("/test-requests/<int:test_request_id>/schedule")
def schedule_test_request(test_request_id):
    test_request = db.session.get(TestRequest, test_request_id)

    if test_request is None:
        return jsonify({"error": "Test request not found."}), 404

    if test_request.status != "APPROVED":
        return validation_error("Only APPROVED test requests can be scheduled.")

    data = request.get_json(silent=True)
    if data is None:
        return validation_error("Request body must be valid JSON.")

    required_fields = ["testSuiteId", "labStation", "operatorName"]
    missing_fields = [
        field for field in required_fields if not clean_string(data.get(field))
    ]
    if missing_fields:
        return validation_error(
            f"Missing required field(s): {', '.join(missing_fields)}."
        )

    try:
        test_suite_id = int(data["testSuiteId"])
    except (TypeError, ValueError):
        return validation_error("testSuiteId must be a valid integer.")

    test_suite = db.session.get(TestSuite, test_suite_id)
    if test_suite is None or not test_suite.is_active:
        return validation_error("Test suite does not exist or is inactive.")

    test_job = TestJob(
        request_id=test_request.id,
        test_suite_id=test_suite.id,
        lab_station=clean_string(data["labStation"]),
        operator_name=clean_string(data["operatorName"]),
        status="PENDING",
    )

    test_request.status = "SCHEDULED"
    db.session.add(test_job)
    db.session.commit()

    return (
        jsonify(
            {
                "id": test_job.id,
                "requestId": test_request.id,
                "status": test_job.status,
                "message": "Test job scheduled successfully",
            }
        ),
        201,
    )
