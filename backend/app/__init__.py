from flask import Flask
from flask_cors import CORS

from app.config import Config
from app.extensions import db
from app.routes.health import health_bp
from app.routes.reports import reports_bp
from app.routes.test_jobs import test_jobs_bp
from app.routes.test_requests import test_requests_bp
from app.routes.test_suites import test_suites_bp


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    db.init_app(app)

    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(test_requests_bp, url_prefix="/api")
    app.register_blueprint(test_suites_bp, url_prefix="/api")
    app.register_blueprint(test_jobs_bp, url_prefix="/api")
    app.register_blueprint(reports_bp, url_prefix="/api")

    with app.app_context():
        from app import models  # noqa: F401

        db.create_all()

    return app
