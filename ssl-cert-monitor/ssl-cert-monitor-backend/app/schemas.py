from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.certificate import CertificateType, CertificateStatus


# Certificate schemas
class CertificateCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    hostname: str = Field(..., min_length=1, max_length=512)
    port: int = Field(default=443, ge=1, le=65535)
    certificate_type: CertificateType
    environment: str = Field(default="Production", max_length=100)
    owner_team: Optional[str] = None
    owner_email: Optional[str] = None
    description: Optional[str] = None
    enabled: bool = True


class CertificateUpdate(BaseModel):
    name: Optional[str] = None
    hostname: Optional[str] = None
    port: Optional[int] = None
    certificate_type: Optional[CertificateType] = None
    environment: Optional[str] = None
    owner_team: Optional[str] = None
    owner_email: Optional[str] = None
    description: Optional[str] = None
    enabled: Optional[bool] = None


class CertificateResponse(BaseModel):
    id: int
    name: str
    hostname: str
    port: int
    certificate_type: CertificateType
    status: CertificateStatus
    issuer: Optional[str] = None
    subject: Optional[str] = None
    serial_number: Optional[str] = None
    issued_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    days_until_expiry: Optional[int] = None
    environment: str
    owner_team: Optional[str] = None
    owner_email: Optional[str] = None
    description: Optional[str] = None
    enabled: bool
    servicenow_incident_id: Optional[str] = None
    incident_created_at: Optional[datetime] = None
    last_checked: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Dashboard schemas
class DashboardStats(BaseModel):
    total_certificates: int = 0
    valid_count: int = 0
    expiring_soon_count: int = 0
    critical_count: int = 0
    expired_count: int = 0
    unknown_count: int = 0
    error_count: int = 0
    by_type: dict[str, int] = {}
    by_environment: dict[str, int] = {}
    recent_incidents: list[dict] = []
    expiring_certificates: list[CertificateResponse] = []


class TypeBreakdown(BaseModel):
    certificate_type: CertificateType
    total: int = 0
    valid: int = 0
    expiring_soon: int = 0
    critical: int = 0
    expired: int = 0


# Notification log schemas
class NotificationLogResponse(BaseModel):
    id: int
    certificate_id: int
    notification_type: str
    recipient: Optional[str] = None
    subject: Optional[str] = None
    message: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Settings schemas
class SettingUpdate(BaseModel):
    key: str
    value: str
    description: Optional[str] = None


class SettingResponse(BaseModel):
    id: int
    key: str
    value: Optional[str] = None
    description: Optional[str] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Scan result
class ScanResult(BaseModel):
    certificate_id: int
    name: str
    hostname: str
    status: CertificateStatus
    days_until_expiry: Optional[int] = None
    message: str = ""
