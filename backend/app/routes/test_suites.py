from flask import Blueprint, jsonify, request

from app.extensions import db
from app.models import TestSuite


test_suites_bp = Blueprint("test_suites", __name__)

DEFAULT_TEST_SUITES = [
    {
        "name": "Memory Diagnostic",
        "description": "Runs simulated memory validation checks.",
        "command": "python scripts/fake_memory_test.py",
        "estimated_duration_seconds": 300,
    },
    {
        "name": "Power Stability Test",
        "description": "Runs simulated power stability validation checks.",
        "command": "python scripts/fake_power_test.py",
        "estimated_duration_seconds": 420,
    },
    {
        "name": "Thermal Stress Test",
        "description": "Runs simulated thermal stress validation checks.",
        "command": "python scripts/fake_thermal_test.py",
        "estimated_duration_seconds": 600,
    },
    {
        "name": "Firmware Validation",
        "description": "Runs simulated firmware validation checks.",
        "command": "python scripts/fake_firmware_test.py",
        "estimated_duration_seconds": 240,
    },
    {
        "name": "Full Board Diagnostic",
        "description": "Runs a simulated full-board diagnostic sequence.",
        "command": "python scripts/fake_full_board_test.py",
        "estimated_duration_seconds": 900,
    },
]


def seed_default_test_suites():
    if TestSuite.query.count() > 0:
        return

    for suite_data in DEFAULT_TEST_SUITES:
        db.session.add(TestSuite(**suite_data))

    db.session.commit()


@test_suites_bp.get("/test-suites")
def list_test_suites():
    seed_default_test_suites()

    include_inactive = request.args.get("includeInactive", "").lower() == "true"
    query = TestSuite.query

    if not include_inactive:
        query = query.filter(TestSuite.is_active.is_(True))

    test_suites = query.order_by(TestSuite.id.asc()).all()

    return jsonify({"items": [suite.to_dict() for suite in test_suites]})
