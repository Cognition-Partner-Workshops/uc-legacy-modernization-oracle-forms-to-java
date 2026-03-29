import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.certificate import Certificate, CertificateStatus
from app.services.certificate_scanner import scan_all_certificates
from app.services.servicenow_service import create_servicenow_incident
from app.services.email_service import send_expiry_notification_email

logger = logging.getLogger(__name__)

EXPIRY_EMAIL_THRESHOLD_DAYS = 30
EXPIRY_INCIDENT_THRESHOLD_DAYS = 7


def run_certificate_scan_job():
    """
    Scheduled job that:
    1. Scans all enabled certificates
    2. Sends email notifications for certs expiring within 30 days
    3. Creates ServiceNow incidents for certs expiring within 7 days
    """
    logger.info("Starting scheduled certificate scan job at %s", datetime.now(timezone.utc))
    db: Session = SessionLocal()

    try:
        # Step 1: Scan all certificates
        scanned = scan_all_certificates(db)
        logger.info("Scanned %d certificates", len(scanned))

        # Step 2: Process notifications for expiring certificates
        for cert in scanned:
            if cert.days_until_expiry is None:
                continue

            # Send email for certificates expiring within 30 days
            if cert.days_until_expiry <= EXPIRY_EMAIL_THRESHOLD_DAYS:
                try:
                    send_expiry_notification_email(db, cert)
                except Exception as e:
                    logger.error("Failed to send email for %s: %s", cert.name, str(e))

            # Create ServiceNow incident for certificates expiring within 7 days
            if cert.days_until_expiry <= EXPIRY_INCIDENT_THRESHOLD_DAYS:
                try:
                    create_servicenow_incident(db, cert)
                except Exception as e:
                    logger.error("Failed to create incident for %s: %s", cert.name, str(e))

        logger.info("Certificate scan job completed successfully")

    except Exception as e:
        logger.error("Certificate scan job failed: %s", str(e))
    finally:
        db.close()
