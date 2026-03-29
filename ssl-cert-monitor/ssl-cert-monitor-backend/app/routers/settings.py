from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.settings import AppSettings
from app.models.notification_log import NotificationLog
from app.schemas import SettingUpdate, SettingResponse, NotificationLogResponse

router = APIRouter(prefix="/api/settings", tags=["settings"])

DEFAULT_SETTINGS = [
    {"key": "smtp_host", "value": "", "description": "SMTP server hostname"},
    {"key": "smtp_port", "value": "587", "description": "SMTP server port"},
    {"key": "smtp_username", "value": "", "description": "SMTP username"},
    {"key": "smtp_password", "value": "", "description": "SMTP password"},
    {"key": "email_from", "value": "", "description": "From email address"},
    {"key": "team_notification_email", "value": "", "description": "Team notification email addresses (comma-separated)"},
    {"key": "servicenow_instance_url", "value": "", "description": "ServiceNow instance URL"},
    {"key": "servicenow_username", "value": "", "description": "ServiceNow API username"},
    {"key": "servicenow_password", "value": "", "description": "ServiceNow API password"},
    {"key": "servicenow_assignment_group", "value": "IT Operations", "description": "ServiceNow assignment group"},
    {"key": "scan_interval_hours", "value": "24", "description": "Certificate scan interval in hours"},
    {"key": "expiry_warning_days", "value": "30", "description": "Days before expiry to start email warnings"},
    {"key": "expiry_critical_days", "value": "7", "description": "Days before expiry to create ServiceNow incidents"},
]


@router.get("", response_model=list[SettingResponse])
def list_settings(db: Session = Depends(get_db)):
    settings = db.query(AppSettings).order_by(AppSettings.key).all()
    if not settings:
        # Initialize defaults
        for s in DEFAULT_SETTINGS:
            setting = AppSettings(**s)
            db.add(setting)
        db.commit()
        settings = db.query(AppSettings).order_by(AppSettings.key).all()
    return settings


@router.put("", response_model=SettingResponse)
def update_setting(data: SettingUpdate, db: Session = Depends(get_db)):
    setting = db.query(AppSettings).filter(AppSettings.key == data.key).first()
    if not setting:
        setting = AppSettings(key=data.key, value=data.value, description=data.description)
        db.add(setting)
    else:
        setting.value = data.value
        if data.description:
            setting.description = data.description
    db.commit()
    db.refresh(setting)
    return setting


@router.put("/bulk", response_model=list[SettingResponse])
def bulk_update_settings(settings: list[SettingUpdate], db: Session = Depends(get_db)):
    results = []
    for data in settings:
        setting = db.query(AppSettings).filter(AppSettings.key == data.key).first()
        if not setting:
            setting = AppSettings(key=data.key, value=data.value, description=data.description)
            db.add(setting)
        else:
            setting.value = data.value
            if data.description:
                setting.description = data.description
        db.commit()
        db.refresh(setting)
        results.append(setting)
    return results


@router.get("/notifications", response_model=list[NotificationLogResponse])
def list_notification_logs(
    limit: int = 50,
    db: Session = Depends(get_db),
):
    return (
        db.query(NotificationLog)
        .order_by(NotificationLog.created_at.desc())
        .limit(limit)
        .all()
    )
