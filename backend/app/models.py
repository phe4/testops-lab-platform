from datetime import datetime

from app.extensions import db


class TimestampMixin:
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )


class TestRequest(TimestampMixin, db.Model):
    __tablename__ = "test_requests"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    requester_name = db.Column(db.String(120), nullable=False)
    component_name = db.Column(db.String(120), nullable=False)
    component_type = db.Column(db.String(120), nullable=False)
    target_serial = db.Column(db.String(120), nullable=False)
    priority = db.Column(db.String(50), default="MEDIUM", nullable=False)
    status = db.Column(db.String(50), default="SUBMITTED", nullable=False)
    description = db.Column(db.Text, nullable=True)

    jobs = db.relationship(
        "TestJob",
        back_populates="request",
        cascade="all, delete-orphan",
    )

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "requesterName": self.requester_name,
            "componentName": self.component_name,
            "componentType": self.component_type,
            "targetSerial": self.target_serial,
            "priority": self.priority,
            "status": self.status,
            "description": self.description,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }


class TestSuite(TimestampMixin, db.Model):
    __tablename__ = "test_suites"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    command = db.Column(db.String(255), nullable=False)
    estimated_duration_seconds = db.Column(db.Integer, nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    jobs = db.relationship("TestJob", back_populates="test_suite")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "command": self.command,
            "estimatedDurationSeconds": self.estimated_duration_seconds,
            "isActive": self.is_active,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }


class TestJob(TimestampMixin, db.Model):
    __tablename__ = "test_jobs"

    id = db.Column(db.Integer, primary_key=True)
    request_id = db.Column(db.Integer, db.ForeignKey("test_requests.id"), nullable=False)
    test_suite_id = db.Column(db.Integer, db.ForeignKey("test_suites.id"), nullable=False)
    lab_station = db.Column(db.String(120), nullable=True)
    operator_name = db.Column(db.String(120), nullable=True)
    status = db.Column(db.String(50), default="PENDING", nullable=False)
    started_at = db.Column(db.DateTime, nullable=True)
    finished_at = db.Column(db.DateTime, nullable=True)
    duration_seconds = db.Column(db.Integer, nullable=True)

    request = db.relationship("TestRequest", back_populates="jobs")
    test_suite = db.relationship("TestSuite", back_populates="jobs")
    logs = db.relationship(
        "TestLog",
        back_populates="job",
        cascade="all, delete-orphan",
        order_by="TestLog.created_at",
    )
    result = db.relationship(
        "TestResult",
        back_populates="job",
        cascade="all, delete-orphan",
        uselist=False,
    )

    def to_dict(self, include_details=False):
        data = {
            "id": self.id,
            "requestId": self.request_id,
            "testSuiteId": self.test_suite_id,
            "labStation": self.lab_station,
            "operatorName": self.operator_name,
            "status": self.status,
            "startedAt": self.started_at.isoformat() if self.started_at else None,
            "finishedAt": self.finished_at.isoformat() if self.finished_at else None,
            "durationSeconds": self.duration_seconds,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
            "testSuite": {
                "id": self.test_suite.id,
                "name": self.test_suite.name,
                "version": None,
            }
            if self.test_suite
            else None,
            "request": {
                "id": self.request.id,
                "title": self.request.title,
                "status": self.request.status,
            }
            if self.request
            else None,
        }

        if include_details:
            data["logs"] = [log.to_dict() for log in self.logs]
            data["result"] = self.result.to_dict() if self.result else None

        return data


class TestLog(db.Model):
    __tablename__ = "test_logs"

    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.Integer, db.ForeignKey("test_jobs.id"), nullable=False)
    log_level = db.Column(db.String(50), default="INFO", nullable=False)
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    job = db.relationship("TestJob", back_populates="logs")

    def to_dict(self):
        return {
            "id": self.id,
            "jobId": self.job_id,
            "logLevel": self.log_level,
            "message": self.message,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }


class TestResult(db.Model):
    __tablename__ = "test_results"

    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(
        db.Integer,
        db.ForeignKey("test_jobs.id"),
        nullable=False,
        unique=True,
    )
    result_status = db.Column(db.String(50), nullable=False)
    summary = db.Column(db.Text, nullable=True)
    failed_step = db.Column(db.String(255), nullable=True)
    error_code = db.Column(db.String(120), nullable=True)
    recommendation = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    job = db.relationship("TestJob", back_populates="result")

    def to_dict(self):
        return {
            "id": self.id,
            "jobId": self.job_id,
            "resultStatus": self.result_status,
            "summary": self.summary,
            "failedStep": self.failed_step,
            "errorCode": self.error_code,
            "recommendation": self.recommendation,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }
