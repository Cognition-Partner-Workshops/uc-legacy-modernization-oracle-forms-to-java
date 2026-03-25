package com.hrms.employee.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "EMERGENCY_CONTACTS", schema = "HRMS")
public class EmergencyContact {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "ec_seq")
    @SequenceGenerator(name = "ec_seq", sequenceName = "SEQ_EMERGENCY_CONTACT", allocationSize = 1)
    @Column(name = "CONTACT_ID")
    private Long contactId;

    @Column(name = "EMP_ID", nullable = false)
    private Long empId;
    @Column(name = "CONTACT_NAME", nullable = false, length = 100)
    private String contactName;
    @Column(name = "RELATIONSHIP", length = 30)
    private String relationship;
    @Column(name = "PHONE_PRIMARY", nullable = false, length = 30)
    private String phonePrimary;
    @Column(name = "PHONE_SECONDARY", length = 30)
    private String phoneSecondary;
    @Column(name = "EMAIL", length = 100)
    private String email;
    @Column(name = "PRIORITY_ORDER")
    private Integer priorityOrder = 1;
    @Column(name = "ACTIVE_FLAG", length = 1)
    private String activeFlag = "Y";
    @Column(name = "CREATED_BY", updatable = false)
    private String createdBy;
    @Column(name = "CREATED_DATE", updatable = false)
    private LocalDateTime createdDate;
    @Column(name = "MODIFIED_BY")
    private String modifiedBy;
    @Column(name = "MODIFIED_DATE")
    private LocalDateTime modifiedDate;

    public EmergencyContact() {}

    @PrePersist
    protected void onCreate() {
        createdDate = LocalDateTime.now();
        if (activeFlag == null) activeFlag = "Y";
    }

    public Long getContactId() { return contactId; }
    public Long getEmpId() { return empId; }
    public void setEmpId(Long empId) { this.empId = empId; }
    public String getContactName() { return contactName; }
    public void setContactName(String contactName) { this.contactName = contactName; }
    public String getRelationship() { return relationship; }
    public void setRelationship(String relationship) { this.relationship = relationship; }
    public String getPhonePrimary() { return phonePrimary; }
    public void setPhonePrimary(String phonePrimary) { this.phonePrimary = phonePrimary; }
    public String getPhoneSecondary() { return phoneSecondary; }
    public void setPhoneSecondary(String phoneSecondary) { this.phoneSecondary = phoneSecondary; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Integer getPriorityOrder() { return priorityOrder; }
    public void setPriorityOrder(Integer priorityOrder) { this.priorityOrder = priorityOrder; }
    public String getActiveFlag() { return activeFlag; }
    public void setActiveFlag(String activeFlag) { this.activeFlag = activeFlag; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
}
