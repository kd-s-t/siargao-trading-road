package models

import (
	"time"

	"gorm.io/gorm"
)

type ScheduleException struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	UserID      uint           `gorm:"not null;index" json:"user_id"`
	User        User           `gorm:"foreignKey:UserID" json:"-"`
	Date        time.Time      `gorm:"type:date;not null;index" json:"date"`
	IsClosed    bool           `gorm:"default:false" json:"is_closed"`
	OpeningTime *string        `json:"opening_time,omitempty"`
	ClosingTime *string        `json:"closing_time,omitempty"`
	Notes       string         `json:"notes"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

func (ScheduleException) TableName() string {
	return "schedule_exceptions"
}
