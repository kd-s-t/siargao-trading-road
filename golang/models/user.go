package models

import (
	"time"

	"gorm.io/gorm"
)

type UserRole string

const (
	RoleSupplier UserRole = "supplier"
	RoleStore    UserRole = "store"
	RoleAdmin    UserRole = "admin"
)

type User struct {
	ID               uint           `gorm:"primaryKey" json:"id"`
	Email            string         `gorm:"uniqueIndex;not null" json:"email"`
	Password         string         `gorm:"not null" json:"-"`
	Name             string         `gorm:"not null" json:"name"`
	Phone            string         `json:"phone"`
	Address          string         `json:"address"`
	Latitude         *float64       `gorm:"type:decimal(10,8)" json:"latitude,omitempty"`
	Longitude        *float64       `gorm:"type:decimal(11,8)" json:"longitude,omitempty"`
	LogoURL          string         `json:"logo_url"`
	BannerURL        string         `json:"banner_url"`
	Facebook         string         `json:"facebook"`
	Instagram        string         `json:"instagram"`
	Twitter          string         `json:"twitter"`
	LinkedIn         string         `json:"linkedin"`
	YouTube          string         `json:"youtube"`
	TikTok           string         `json:"tiktok"`
	Website          string         `json:"website"`
	Role             UserRole       `gorm:"type:varchar(20);not null" json:"role"`
	AdminLevel       *int           `gorm:"default:1" json:"admin_level,omitempty"`
	OpeningTime      string         `json:"opening_time"`
	ClosingTime      string         `json:"closing_time"`
	ClosedDaysOfWeek string         `json:"closed_days_of_week"` // Comma-separated: 0=Sunday, 1=Monday, etc.
	IsOpen           bool           `gorm:"default:true" json:"is_open"`
	FCMToken         string         `json:"fcm_token,omitempty"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	LastLogin        *time.Time     `json:"last_login,omitempty"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`
}

type Supplier struct {
	User
	BusinessName string `json:"business_name"`
	TaxID        string `json:"tax_id,omitempty"`
}

type Store struct {
	User
	StoreName       string `json:"store_name"`
	BusinessLicense string `json:"business_license,omitempty"`
}
