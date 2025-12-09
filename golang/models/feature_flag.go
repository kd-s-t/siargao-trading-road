package models

import (
	"time"

	"gorm.io/gorm"
)

type FeatureFlag struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Flag      string         `gorm:"uniqueIndex;not null" json:"flag"`
	UserID    *uint          `json:"user_id,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
