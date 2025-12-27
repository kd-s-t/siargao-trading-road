package models

import (
	"time"

	"gorm.io/gorm"
)

type AuditLog struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	UserID       *uint          `gorm:"index" json:"user_id,omitempty"`
	User         *User          `gorm:"foreignKey:UserID;references:ID" json:"user,omitempty"`
	EmployeeID   *uint          `gorm:"index" json:"employee_id,omitempty"`
	Employee     *Employee      `gorm:"foreignKey:EmployeeID;references:ID" json:"employee,omitempty"`
	Role         string         `gorm:"type:varchar(20);index" json:"role,omitempty"`
	Action       string         `gorm:"type:varchar(255);not null" json:"action"`
	Endpoint     string         `gorm:"type:varchar(255);not null" json:"endpoint"`
	Method       string         `gorm:"type:varchar(10);not null" json:"method"`
	StatusCode   int            `gorm:"not null" json:"status_code"`
	IPAddress    string         `gorm:"type:varchar(45)" json:"ip_address"`
	UserAgent    string         `gorm:"type:text" json:"user_agent"`
	RequestBody  string         `gorm:"type:text" json:"request_body,omitempty"`
	ResponseBody string         `gorm:"type:text" json:"response_body,omitempty"`
	DurationMs   int64          `gorm:"not null" json:"duration_ms"`
	ErrorMessage string         `gorm:"type:text" json:"error_message,omitempty"`
	CreatedAt    time.Time      `gorm:"index" json:"created_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}
