import os


class Config:
    MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
    MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
    MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "testops_lab")
    MYSQL_USER = os.getenv("MYSQL_USER", "testops_user")
    MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "testops_password")

    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}"
        f"@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
