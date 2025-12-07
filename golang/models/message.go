package models

import (
	"time"

	"gorm.io/gorm"
)

type Message struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	OrderID   uint           `gorm:"not null;index" json:"order_id"`
	Order     Order          `gorm:"foreignKey:OrderID" json:"-"`
	SenderID  uint           `gorm:"not null;index" json:"sender_id"`
	Sender    User           `gorm:"foreignKey:SenderID;references:ID" json:"sender"`
	Content   string         `gorm:"type:text;not null" json:"content"`
	ImageURL  string         `gorm:"type:varchar(500)" json:"image_url,omitempty"`
	ReadAt    *time.Time     `gorm:"index" json:"read_at,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
