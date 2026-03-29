from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.certificate import Certificate, CertificateType, CertificateStatus
from app.schemas import CertificateCreate, CertificateUpdate, CertificateResponse, ScanResult
from app.services.certificate_scanner import scan_certificate, scan_all_certificates

router = APIRouter(prefix="/api/certificates", tags=["certificates"])


@router.get("", response_model=list[CertificateResponse])
def list_certificates(
    certificate_type: Optional[CertificateType] = Query(None),
    status: Optional[CertificateStatus] = Query(None),
    environment: Optional[str] = Query(None),
    enabled: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Certificate)
    if certificate_type:
        query = query.filter(Certificate.certificate_type == certificate_type)
    if status:
        query = query.filter(Certificate.status == status)
    if environment:
        query = query.filter(Certificate.environment == environment)
    if enabled is not None:
        query = query.filter(Certificate.enabled == enabled)
    if search:
        query = query.filter(
            (Certificate.name.ilike(f"%{search}%"))
            | (Certificate.hostname.ilike(f"%{search}%"))
            | (Certificate.owner_team.ilike(f"%{search}%"))
        )
    return query.order_by(Certificate.days_until_expiry.asc().nullslast()).all()


@router.get("/{certificate_id}", response_model=CertificateResponse)
def get_certificate(certificate_id: int, db: Session = Depends(get_db)):
    cert = db.query(Certificate).filter(Certificate.id == certificate_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return cert


@router.post("", response_model=CertificateResponse, status_code=201)
def create_certificate(data: CertificateCreate, db: Session = Depends(get_db)):
    cert = Certificate(**data.model_dump())
    db.add(cert)
    db.commit()
    db.refresh(cert)
    return cert


@router.put("/{certificate_id}", response_model=CertificateResponse)
def update_certificate(certificate_id: int, data: CertificateUpdate, db: Session = Depends(get_db)):
    cert = db.query(Certificate).filter(Certificate.id == certificate_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(cert, field, value)
    db.commit()
    db.refresh(cert)
    return cert


@router.delete("/{certificate_id}", status_code=204)
def delete_certificate(certificate_id: int, db: Session = Depends(get_db)):
    cert = db.query(Certificate).filter(Certificate.id == certificate_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    db.delete(cert)
    db.commit()


@router.post("/{certificate_id}/scan", response_model=CertificateResponse)
def scan_single_certificate(certificate_id: int, db: Session = Depends(get_db)):
    cert = db.query(Certificate).filter(Certificate.id == certificate_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return scan_certificate(db, cert)


@router.post("/scan/all", response_model=list[CertificateResponse])
def scan_all(db: Session = Depends(get_db)):
    return scan_all_certificates(db)
