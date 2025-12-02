package models

import (
	"time"

	"gorm.io/gorm"
)

type DocumentType string

const (
	DocumentTypeBIRRegistration    DocumentType = "bir_registration"
	DocumentTypeGovernmentID       DocumentType = "government_id"
	DocumentTypeBusinessPermit     DocumentType = "business_permit"
	DocumentTypeDTIRegistration    DocumentType = "dti_registration"
	DocumentTypeSECRegistration    DocumentType = "sec_registration"
	DocumentTypeBarangayClearance  DocumentType = "barangay_clearance"
	DocumentTypeFireSafety         DocumentType = "fire_safety"
	DocumentTypeSanitaryPermit     DocumentType = "sanitary_permit"
	DocumentTypeEnvironmentalClear DocumentType = "environmental_clearance"
	DocumentTypeSSS                DocumentType = "sss"
	DocumentTypePhilHealth         DocumentType = "philhealth"
	DocumentTypePagIBIG            DocumentType = "pagibig"
	DocumentTypeOther              DocumentType = "other"
)

type DocumentStatus string

const (
	DocumentStatusPending  DocumentStatus = "pending"
	DocumentStatusApproved DocumentStatus = "approved"
	DocumentStatusRejected DocumentStatus = "rejected"
	DocumentStatusExpired  DocumentStatus = "expired"
)

type BusinessDocument struct {
	ID             uint           `gorm:"primaryKey" json:"id"`
	UserID         uint           `gorm:"not null;index" json:"user_id"`
	User           User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
	DocumentType   DocumentType   `gorm:"type:varchar(50);not null" json:"document_type"`
	DocumentName   string         `gorm:"not null" json:"document_name"`
	DocumentNumber string         `json:"document_number"`
	FileURL        string         `gorm:"not null" json:"file_url"`
	ExpiryDate     *time.Time     `json:"expiry_date,omitempty"`
	Status         DocumentStatus `gorm:"type:varchar(20);not null;default:'pending'" json:"status"`
	Remarks        string         `gorm:"type:text" json:"remarks"`
	VerifiedBy     *uint          `json:"verified_by,omitempty"`
	VerifiedAt     *time.Time     `json:"verified_at,omitempty"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
}
