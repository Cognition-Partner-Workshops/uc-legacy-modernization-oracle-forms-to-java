import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.certificate import Certificate
from app.models.notification_log import NotificationLog
from app.models.settings import AppSettings

logger = logging.getLogger(__name__)


def get_setting(db: Session, key: str) -> Optional[str]:
    setting = db.query(AppSettings).filter(AppSettings.key == key).first()
    return setting.value if setting else None


def send_expiry_notification_email(db: Session, certificate: Certificate) -> bool:
    """
    Send email notification about certificate expiring.
    Called when certificate is within 30 days of expiry.
    """
    smtp_host = get_setting(db, "smtp_host")
    smtp_port = get_setting(db, "smtp_port") or "587"
    smtp_username = get_setting(db, "smtp_username")
    smtp_password = get_setting(db, "smtp_password")
    from_email = get_setting(db, "email_from") or smtp_username
    team_email = get_setting(db, "team_notification_email")

    if not smtp_host or not smtp_username or not smtp_password:
        logger.warning("SMTP settings not configured. Skipping email notification.")
        _log_notification(
            db, certificate.id, "EMAIL", team_email,
            "SSL Certificate Expiry Alert",
            "SMTP settings not configured",
            "FAILED",
            "Missing SMTP configuration",
        )
        return False

    recipients = []
    if team_email:
        recipients.extend([e.strip() for e in team_email.split(",")])
    if certificate.owner_email:
        recipients.extend([e.strip() for e in certificate.owner_email.split(",")])

    if not recipients:
        logger.warning("No recipients configured for certificate %s", certificate.name)
        _log_notification(
            db, certificate.id, "EMAIL", None,
            "SSL Certificate Expiry Alert",
            "No recipients configured",
            "FAILED",
            "No team_notification_email or owner_email set",
        )
        return False

    severity = "CRITICAL" if certificate.days_until_expiry and certificate.days_until_expiry <= 7 else "WARNING"
    subject = f"[{severity}] SSL Certificate Expiring - {certificate.name} ({certificate.days_until_expiry} days)"

    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="background-color: {'#dc3545' if severity == 'CRITICAL' else '#ffc107'}; color: {'white' if severity == 'CRITICAL' else '#333'}; padding: 20px; text-align: center;">
                <h2 style="margin: 0;">SSL Certificate {severity} Alert</h2>
            </div>
            <div style="padding: 20px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Certificate Name</td>
                        <td style="padding: 8px; border-bottom: 1px solid #eee;">{certificate.name}</td></tr>
                    <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Hostname</td>
                        <td style="padding: 8px; border-bottom: 1px solid #eee;">{certificate.hostname}:{certificate.port}</td></tr>
                    <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Type</td>
                        <td style="padding: 8px; border-bottom: 1px solid #eee;">{certificate.certificate_type.value}</td></tr>
                    <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Environment</td>
                        <td style="padding: 8px; border-bottom: 1px solid #eee;">{certificate.environment}</td></tr>
                    <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Expiry Date</td>
                        <td style="padding: 8px; border-bottom: 1px solid #eee;">{certificate.expiry_date}</td></tr>
                    <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Days Until Expiry</td>
                        <td style="padding: 8px; border-bottom: 1px solid #eee; color: {'red' if severity == 'CRITICAL' else 'orange'}; font-weight: bold;">{certificate.days_until_expiry} days</td></tr>
                    <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Issuer</td>
                        <td style="padding: 8px; border-bottom: 1px solid #eee;">{certificate.issuer or 'N/A'}</td></tr>
                    <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Owner Team</td>
                        <td style="padding: 8px; border-bottom: 1px solid #eee;">{certificate.owner_team or 'N/A'}</td></tr>
                </table>
                <div style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border-radius: 4px;">
                    <strong>Action Required:</strong> Please renew this SSL certificate before it expires to avoid service disruption.
                </div>
            </div>
            <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #6c757d;">
                SSL Certificate Monitor - Automated Notification
            </div>
        </div>
    </body>
    </html>
    """

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = from_email
        msg["To"] = ", ".join(recipients)
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(smtp_host, int(smtp_port)) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.send_message(msg)

        _log_notification(
            db, certificate.id, "EMAIL", ", ".join(recipients), subject,
            f"Expiry notification sent for {certificate.name}", "SENT",
        )
        logger.info("Email sent for certificate %s to %s", certificate.name, recipients)
        return True

    except Exception as e:
        error_msg = str(e)
        logger.error("Failed to send email for %s: %s", certificate.name, error_msg)
        _log_notification(
            db, certificate.id, "EMAIL", ", ".join(recipients), subject,
            f"Failed to send expiry notification", "FAILED", error_msg,
        )
        return False


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
