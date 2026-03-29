import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Enum, Text, Boolean
from app.database import Base


class CertificateType(str, enum.Enum):
    DATABASE_SERVER = "DATABASE_SERVER"
    OKTA = "OKTA"
    LOAD_BALANCER = "LOAD_BALANCER"
    JAVA_APP = "JAVA_APP"
    THIRD_PARTY = "THIRD_PARTY"


class CertificateStatus(str, enum.Enum):
    VALID = "VALID"
    EXPIRING_SOON = "EXPIRING_SOON"  # 30 days
    CRITICAL = "CRITICAL"  # 7 days
    EXPIRED = "EXPIRED"
    UNKNOWN = "UNKNOWN"
    ERROR = "ERROR"


class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    hostname = Column(String(512), nullable=False)
    port = Column(Integer, default=443)
    certificate_type = Column(Enum(CertificateType), nullable=False)
    status = Column(Enum(CertificateStatus), default=CertificateStatus.UNKNOWN)

    # Certificate details
    issuer = Column(String(512), nullable=True)
    subject = Column(String(512), nullable=True)
    serial_number = Column(String(255), nullable=True)
    issued_date = Column(DateTime, nullable=True)
    expiry_date = Column(DateTime, nullable=True)
    days_until_expiry = Column(Integer, nullable=True)

    # Additional metadata
    environment = Column(String(100), default="Production")
    owner_team = Column(String(255), nullable=True)
    owner_email = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    enabled = Column(Boolean, default=True)

    # ServiceNow tracking
    servicenow_incident_id = Column(String(100), nullable=True)
    incident_created_at = Column(DateTime, nullable=True)

    # Timestamps
    last_checked = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
