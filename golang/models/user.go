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
	ID         uint           `gorm:"primaryKey" json:"id"`
	Email      string         `gorm:"uniqueIndex;not null" json:"email"`
	Password   string         `gorm:"not null" json:"-"`
	Name       string         `gorm:"not null" json:"name"`
	Phone      string         `json:"phone"`
	Role       UserRole       `gorm:"type:varchar(20);not null" json:"role"`
	AdminLevel *int           `gorm:"default:1" json:"admin_level,omitempty"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
}

type Supplier struct {
	User
	BusinessName string `json:"business_name"`
	Address      string `json:"address"`
	TaxID        string `json:"tax_id,omitempty"`
}

type Store struct {
	User
	StoreName       string `json:"store_name"`
	Address         string `json:"address"`
	BusinessLicense string `json:"business_license,omitempty"`
}
