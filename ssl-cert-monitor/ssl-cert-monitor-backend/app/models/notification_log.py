from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from app.database import Base


class NotificationLog(Base):
    __tablename__ = "notification_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    certificate_id = Column(Integer, ForeignKey("certificates.id"), nullable=False)
    notification_type = Column(String(50), nullable=False)  # EMAIL, SERVICENOW
    recipient = Column(String(255), nullable=True)
    subject = Column(String(512), nullable=True)
    message = Column(Text, nullable=True)
    status = Column(String(50), default="SENT")  # SENT, FAILED
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
