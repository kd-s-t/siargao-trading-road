package models

import (
	"time"

	"gorm.io/gorm"
)

type OrderStatus string

const (
	OrderStatusDraft     OrderStatus = "draft"
	OrderStatusPreparing OrderStatus = "preparing"
	OrderStatusInTransit OrderStatus = "in_transit"
	OrderStatusDelivered OrderStatus = "delivered"
	OrderStatusCancelled OrderStatus = "cancelled"
)

type PaymentMethod string

const (
	PaymentMethodCashOnDelivery PaymentMethod = "cash_on_delivery"
	PaymentMethodGCash          PaymentMethod = "gcash"
)

type DeliveryOption string

const (
	DeliveryOptionPickup  DeliveryOption = "pickup"
	DeliveryOptionDeliver DeliveryOption = "deliver"
)

type PaymentStatus string

const (
	PaymentStatusPending PaymentStatus = "pending"
	PaymentStatusPaid    PaymentStatus = "paid"
	PaymentStatusFailed  PaymentStatus = "failed"
)

type Order struct {
	ID              uint           `gorm:"primaryKey" json:"id"`
	StoreID         uint           `gorm:"not null;index" json:"store_id"`
	Store           User           `gorm:"foreignKey:StoreID;references:ID" json:"store"`
	SupplierID      uint           `gorm:"not null;index" json:"supplier_id"`
	Supplier        User           `gorm:"foreignKey:SupplierID;references:ID" json:"supplier,omitempty"`
	Status          OrderStatus    `gorm:"type:varchar(20);not null;default:'draft'" json:"status"`
	TotalAmount     float64        `gorm:"type:decimal(10,2);default:0" json:"total_amount"`
	PaymentMethod   PaymentMethod  `gorm:"type:varchar(20)" json:"payment_method"`
	PaymentStatus   PaymentStatus  `gorm:"type:varchar(20);default:'pending'" json:"payment_status"`
	PaymentProofURL string         `gorm:"type:varchar(500)" json:"payment_proof_url,omitempty"`
	DeliveryOption  DeliveryOption `gorm:"type:varchar(20)" json:"delivery_option"`
	DeliveryFee     float64        `gorm:"type:decimal(10,2);default:0" json:"delivery_fee"`
	Distance        float64        `gorm:"type:decimal(10,2);default:0" json:"distance"`
	ShippingAddress string         `gorm:"type:text" json:"shipping_address"`
	Notes           string         `gorm:"type:text" json:"notes"`
	OrderItems      []OrderItem    `gorm:"foreignKey:OrderID" json:"order_items"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
}

type OrderItem struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	OrderID   uint      `gorm:"not null;index" json:"order_id"`
	Order     Order     `gorm:"foreignKey:OrderID" json:"-"`
	ProductID uint      `gorm:"not null;index" json:"product_id"`
	Product   Product   `gorm:"foreignKey:ProductID" json:"product"`
	Quantity  int       `gorm:"not null" json:"quantity"`
	UnitPrice float64   `gorm:"type:decimal(10,2);not null" json:"unit_price"`
	Subtotal  float64   `gorm:"type:decimal(10,2);not null" json:"subtotal"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
