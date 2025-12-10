package models

import (
	"time"

	"gorm.io/gorm"
)

type FeatureFlag struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Flag      string         `gorm:"not null;index:idx_feature_flags_user_flag,unique" json:"flag"`
	UserID    *uint          `gorm:"index:idx_feature_flags_user_flag,unique" json:"user_id,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
