package models

import (
	"time"

	"gorm.io/gorm"
)

type Rating struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	OrderID   uint           `gorm:"not null;index;uniqueIndex:idx_order_rater" json:"order_id"`
	Order     Order          `gorm:"foreignKey:OrderID;references:ID" json:"order,omitempty"`
	RaterID   uint           `gorm:"not null;index;uniqueIndex:idx_order_rater" json:"rater_id"`
	Rater     User           `gorm:"foreignKey:RaterID;references:ID" json:"rater,omitempty"`
	RatedID   uint           `gorm:"not null;index" json:"rated_id"`
	Rated     User           `gorm:"foreignKey:RatedID;references:ID" json:"rated,omitempty"`
	Rating    int            `gorm:"not null;check:rating >= 1 AND rating <= 5" json:"rating"`
	Comment   string         `gorm:"type:text" json:"comment,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
