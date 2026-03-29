from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.certificate import Certificate, CertificateType, CertificateStatus
from app.models.notification_log import NotificationLog
from app.schemas import DashboardStats, CertificateResponse, TypeBreakdown

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    total = db.query(Certificate).count()

    status_counts = (
        db.query(Certificate.status, func.count(Certificate.id))
        .group_by(Certificate.status)
        .all()
    )
    status_map = {str(s): c for s, c in status_counts}

    type_counts = (
        db.query(Certificate.certificate_type, func.count(Certificate.id))
        .group_by(Certificate.certificate_type)
        .all()
    )
    by_type = {str(t): c for t, c in type_counts}

    env_counts = (
        db.query(Certificate.environment, func.count(Certificate.id))
        .group_by(Certificate.environment)
        .all()
    )
    by_environment = {str(e): c for e, c in env_counts}

    # Recent incidents (notification logs for ServiceNow)
    recent_incidents = (
        db.query(NotificationLog)
        .filter(NotificationLog.notification_type == "SERVICENOW")
        .order_by(NotificationLog.created_at.desc())
        .limit(10)
        .all()
    )
    incidents_list = [
        {
            "id": inc.id,
            "certificate_id": inc.certificate_id,
            "subject": inc.subject,
            "status": inc.status,
            "created_at": inc.created_at.isoformat() if inc.created_at else None,
        }
        for inc in recent_incidents
    ]

    # Expiring certificates (within 30 days)
    expiring = (
        db.query(Certificate)
        .filter(
            Certificate.days_until_expiry.isnot(None),
            Certificate.days_until_expiry <= 30,
        )
        .order_by(Certificate.days_until_expiry.asc())
        .limit(20)
        .all()
    )

    return DashboardStats(
        total_certificates=total,
        valid_count=status_map.get(CertificateStatus.VALID.value, 0),
        expiring_soon_count=status_map.get(CertificateStatus.EXPIRING_SOON.value, 0),
        critical_count=status_map.get(CertificateStatus.CRITICAL.value, 0),
        expired_count=status_map.get(CertificateStatus.EXPIRED.value, 0),
        unknown_count=status_map.get(CertificateStatus.UNKNOWN.value, 0),
        error_count=status_map.get(CertificateStatus.ERROR.value, 0),
        by_type=by_type,
        by_environment=by_environment,
        recent_incidents=incidents_list,
        expiring_certificates=expiring,
    )


@router.get("/type-breakdown", response_model=list[TypeBreakdown])
def get_type_breakdown(db: Session = Depends(get_db)):
    results = []
    for cert_type in CertificateType:
        certs = db.query(Certificate).filter(Certificate.certificate_type == cert_type.value).all()
        breakdown = TypeBreakdown(
            certificate_type=cert_type,
            total=len(certs),
            valid=sum(1 for c in certs if c.status == CertificateStatus.VALID.value),
            expiring_soon=sum(1 for c in certs if c.status == CertificateStatus.EXPIRING_SOON.value),
            critical=sum(1 for c in certs if c.status == CertificateStatus.CRITICAL.value),
            expired=sum(1 for c in certs if c.status == CertificateStatus.EXPIRED.value),
        )
        results.append(breakdown)
    return results
