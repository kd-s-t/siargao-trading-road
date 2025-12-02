package models

import (
	"time"

	"gorm.io/gorm"
)

type Product struct {
	ID            uint           `gorm:"primaryKey" json:"id"`
	SupplierID    uint           `gorm:"not null;index" json:"supplier_id"`
	Supplier      User           `gorm:"foreignKey:SupplierID" json:"supplier,omitempty"`
	Name          string         `gorm:"not null" json:"name"`
	Description   string         `gorm:"type:text" json:"description"`
	SKU           string         `gorm:"uniqueIndex" json:"sku"`
	Price         float64        `gorm:"type:decimal(10,2);not null" json:"price"`
	StockQuantity int            `gorm:"default:0;not null" json:"stock_quantity"`
	Unit          string         `gorm:"type:varchar(20)" json:"unit"`
	Category      string         `gorm:"type:varchar(50)" json:"category"`
	ImageURL      string         `json:"image_url"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
}
