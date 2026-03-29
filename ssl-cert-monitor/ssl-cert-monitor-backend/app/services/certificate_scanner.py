import ssl
import socket
import logging
from datetime import datetime, timezone
from typing import Optional
from cryptography import x509
from cryptography.x509.oid import NameOID
from sqlalchemy.orm import Session

from app.models.certificate import Certificate, CertificateStatus

logger = logging.getLogger(__name__)

EXPIRY_WARNING_DAYS = 30
EXPIRY_CRITICAL_DAYS = 7


def fetch_ssl_certificate_info(hostname: str, port: int = 443, timeout: int = 10) -> dict:
    """Connect to a host and retrieve SSL certificate information."""
    result = {
        "issuer": None,
        "subject": None,
        "serial_number": None,
        "issued_date": None,
        "expiry_date": None,
        "days_until_expiry": None,
        "status": CertificateStatus.UNKNOWN,
        "error": None,
    }

    try:
        context = ssl.create_default_context()
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE

        with socket.create_connection((hostname, port), timeout=timeout) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                der_cert = ssock.getpeercert(binary_form=True)
                if der_cert is None:
                    result["status"] = CertificateStatus.ERROR
                    result["error"] = "No certificate returned by server"
                    return result

                cert = x509.load_der_x509_certificate(der_cert)

                # Extract issuer
                try:
                    issuer_parts = []
                    for attr in cert.issuer:
                        issuer_parts.append(f"{attr.oid._name}={attr.value}")
                    result["issuer"] = ", ".join(issuer_parts)
                except Exception:
                    result["issuer"] = str(cert.issuer)

                # Extract subject
                try:
                    subject_parts = []
                    for attr in cert.subject:
                        subject_parts.append(f"{attr.oid._name}={attr.value}")
                    result["subject"] = ", ".join(subject_parts)
                except Exception:
                    result["subject"] = str(cert.subject)

                result["serial_number"] = format(cert.serial_number, "x")
                result["issued_date"] = cert.not_valid_before_utc
                result["expiry_date"] = cert.not_valid_after_utc

                now = datetime.now(timezone.utc)
                delta = cert.not_valid_after_utc - now
                result["days_until_expiry"] = delta.days

                if delta.days < 0:
                    result["status"] = CertificateStatus.EXPIRED
                elif delta.days <= EXPIRY_CRITICAL_DAYS:
                    result["status"] = CertificateStatus.CRITICAL
                elif delta.days <= EXPIRY_WARNING_DAYS:
                    result["status"] = CertificateStatus.EXPIRING_SOON
                else:
                    result["status"] = CertificateStatus.VALID

    except socket.timeout:
        result["status"] = CertificateStatus.ERROR
        result["error"] = f"Connection timed out to {hostname}:{port}"
        logger.warning("Timeout connecting to %s:%d", hostname, port)
    except socket.gaierror:
        result["status"] = CertificateStatus.ERROR
        result["error"] = f"DNS resolution failed for {hostname}"
        logger.warning("DNS resolution failed for %s", hostname)
    except ConnectionRefusedError:
        result["status"] = CertificateStatus.ERROR
        result["error"] = f"Connection refused to {hostname}:{port}"
        logger.warning("Connection refused to %s:%d", hostname, port)
    except Exception as e:
        result["status"] = CertificateStatus.ERROR
        result["error"] = str(e)
        logger.error("Error scanning %s:%d - %s", hostname, port, str(e))

    return result


def scan_certificate(db: Session, cert: Certificate) -> Certificate:
    """Scan a single certificate and update its record."""
    info = fetch_ssl_certificate_info(cert.hostname, cert.port)

    cert.issuer = info["issuer"]
    cert.subject = info["subject"]
    cert.serial_number = info["serial_number"]
    cert.issued_date = info["issued_date"]
    cert.expiry_date = info["expiry_date"]
    cert.days_until_expiry = info["days_until_expiry"]
    cert.status = info["status"]
    cert.last_checked = datetime.now(timezone.utc)

    db.commit()
    db.refresh(cert)
    return cert


def scan_all_certificates(db: Session) -> list[Certificate]:
    """Scan all enabled certificates."""
    certs = db.query(Certificate).filter(Certificate.enabled == True).all()
    results = []
    for cert in certs:
        try:
            updated = scan_certificate(db, cert)
            results.append(updated)
        except Exception as e:
            logger.error("Error scanning certificate %s: %s", cert.name, str(e))
            cert.status = CertificateStatus.ERROR
            cert.last_checked = datetime.now(timezone.utc)
            db.commit()
            results.append(cert)
    return results
