package models

import (
	"time"

	"gorm.io/gorm"
)

type StockHistory struct {
	ID            uint           `gorm:"primaryKey" json:"id"`
	ProductID     uint           `gorm:"not null;index" json:"product_id"`
	Product       Product        `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	PreviousStock int            `gorm:"not null" json:"previous_stock"`
	NewStock      int            `gorm:"not null" json:"new_stock"`
	ChangeAmount  int            `gorm:"not null" json:"change_amount"`
	ChangeType    string         `gorm:"type:varchar(50);not null;index" json:"change_type"`
	OrderID       *uint          `gorm:"index" json:"order_id,omitempty"`
	Order         *Order         `gorm:"foreignKey:OrderID" json:"order,omitempty"`
	UserID        *uint          `gorm:"index" json:"user_id,omitempty"`
	User          *User          `gorm:"foreignKey:UserID" json:"user,omitempty"`
	EmployeeID    *uint          `gorm:"index" json:"employee_id,omitempty"`
	Employee      *Employee      `gorm:"foreignKey:EmployeeID" json:"employee,omitempty"`
	Notes         string         `gorm:"type:text" json:"notes"`
	CreatedAt     time.Time      `gorm:"index" json:"created_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
}

func (StockHistory) TableName() string {
	return "products_stocks_history"
}
