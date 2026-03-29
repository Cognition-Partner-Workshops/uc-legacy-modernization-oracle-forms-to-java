import logging
from datetime import datetime, timezone
from typing import Optional

import httpx
from sqlalchemy.orm import Session

from app.models.certificate import Certificate
from app.models.notification_log import NotificationLog
from app.models.settings import AppSettings

logger = logging.getLogger(__name__)


def get_setting(db: Session, key: str) -> Optional[str]:
    """Get a setting value by key."""
    setting = db.query(AppSettings).filter(AppSettings.key == key).first()
    return setting.value if setting else None


def create_servicenow_incident(db: Session, certificate: Certificate) -> Optional[str]:
    """
    Create a ServiceNow incident for a certificate that is expiring within 7 days.
    Returns the incident number if successful, None otherwise.
    """
    # Skip if incident already created
    if certificate.servicenow_incident_id:
        logger.info(
            "Incident already exists for certificate %s: %s",
            certificate.name,
            certificate.servicenow_incident_id,
        )
        return certificate.servicenow_incident_id

    instance_url = get_setting(db, "servicenow_instance_url")
    username = get_setting(db, "servicenow_username")
    password = get_setting(db, "servicenow_password")
    assignment_group = get_setting(db, "servicenow_assignment_group") or "IT Operations"

    if not instance_url or not username or not password:
        logger.warning("ServiceNow settings not configured. Skipping incident creation.")
        _log_notification(
            db,
            certificate.id,
            "SERVICENOW",
            None,
            "ServiceNow Incident Creation",
            "ServiceNow settings not configured",
            "FAILED",
            "Missing ServiceNow configuration (instance_url, username, or password)",
        )
        return None

    short_description = (
        f"SSL Certificate Expiring - {certificate.name} "
        f"({certificate.hostname}:{certificate.port})"
    )
    description = (
        f"SSL Certificate Alert\n\n"
        f"Certificate: {certificate.name}\n"
        f"Host: {certificate.hostname}:{certificate.port}\n"
        f"Type: {certificate.certificate_type.value}\n"
        f"Environment: {certificate.environment}\n"
        f"Expiry Date: {certificate.expiry_date}\n"
        f"Days Until Expiry: {certificate.days_until_expiry}\n"
        f"Issuer: {certificate.issuer}\n"
        f"Subject: {certificate.subject}\n"
        f"Owner Team: {certificate.owner_team}\n"
        f"Owner Email: {certificate.owner_email}\n\n"
        f"Action Required: Please renew this certificate before it expires."
    )

    payload = {
        "short_description": short_description,
        "description": description,
        "category": "Software",
        "subcategory": "Certificate Management",
        "impact": "2",
        "urgency": "2" if certificate.days_until_expiry and certificate.days_until_expiry > 3 else "1",
        "assignment_group": assignment_group,
        "caller_id": username,
    }

    try:
        url = f"{instance_url.rstrip('/')}/api/now/table/incident"
        with httpx.Client(timeout=30) as client:
            response = client.post(
                url,
                json=payload,
                auth=(username, password),
                headers={"Content-Type": "application/json", "Accept": "application/json"},
            )
            response.raise_for_status()
            result = response.json()
            incident_number = result.get("result", {}).get("number", "UNKNOWN")

            # Update certificate record
            certificate.servicenow_incident_id = incident_number
            certificate.incident_created_at = datetime.now(timezone.utc)
            db.commit()

            _log_notification(
                db,
                certificate.id,
                "SERVICENOW",
                assignment_group,
                short_description,
                f"Incident {incident_number} created successfully",
                "SENT",
            )
            logger.info("Created ServiceNow incident %s for certificate %s", incident_number, certificate.name)
            return incident_number

    except httpx.HTTPStatusError as e:
        error_msg = f"HTTP {e.response.status_code}: {e.response.text}"
        logger.error("ServiceNow API error for %s: %s", certificate.name, error_msg)
        _log_notification(
            db, certificate.id, "SERVICENOW", None, short_description,
            "Failed to create incident", "FAILED", error_msg,
        )
    except Exception as e:
        logger.error("Error creating ServiceNow incident for %s: %s", certificate.name, str(e))
        _log_notification(
            db, certificate.id, "SERVICENOW", None, short_description,
            "Failed to create incident", "FAILED", str(e),
        )

    return None


def _log_notification(
    db: Session,
    certificate_id: int,
    notification_type: str,
    recipient: Optional[str],
    subject: Optional[str],
    message: Optional[str],
    status: str,
    error_message: Optional[str] = None,
):
    log = NotificationLog(
        certificate_id=certificate_id,
        notification_type=notification_type,
        recipient=recipient,
        subject=subject,
        message=message,
        status=status,
        error_message=error_message,
    )
    db.add(log)
    db.commit()
