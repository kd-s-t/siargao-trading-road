package models

import (
	"time"

	"gorm.io/gorm"
)

type BugStatus string

const (
	BugStatusOpen          BugStatus = "open"
	BugStatusInvestigating BugStatus = "investigating"
	BugStatusFixed         BugStatus = "fixed"
	BugStatusResolved      BugStatus = "resolved"
	BugStatusClosed        BugStatus = "closed"
)

type BugReport struct {
	ID             uint           `gorm:"primaryKey" json:"id"`
	UserID         *uint          `gorm:"index" json:"user_id,omitempty"`
	User           *User          `gorm:"foreignKey:UserID;references:ID" json:"user,omitempty"`
	Platform       string         `gorm:"type:varchar(50);not null" json:"platform"`
	Title          string         `gorm:"type:varchar(255);not null" json:"title"`
	Description    string         `gorm:"type:text;not null" json:"description"`
	ErrorType      string         `gorm:"type:varchar(100)" json:"error_type"`
	StackTrace     string         `gorm:"type:text" json:"stack_trace"`
	DeviceInfo     string         `gorm:"type:text" json:"device_info"`
	AppVersion     string         `gorm:"type:varchar(50)" json:"app_version"`
	OSVersion      string         `gorm:"type:varchar(50)" json:"os_version"`
	Status         BugStatus      `gorm:"type:varchar(20);default:'open';not null;index" json:"status"`
	ResolvedBy     *uint          `json:"resolved_by,omitempty"`
	ResolvedByUser *User          `gorm:"foreignKey:ResolvedBy;references:ID" json:"resolved_by_user,omitempty"`
	ResolvedAt     *time.Time     `json:"resolved_at,omitempty"`
	Notes          string         `gorm:"type:text" json:"notes"`
	CreatedAt      time.Time      `gorm:"index" json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
}
