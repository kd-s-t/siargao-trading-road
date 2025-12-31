package models

import (
	"time"

	"gorm.io/gorm"
)

// Employee accounts are owned by a supplier or store user.
type Employee struct {
	ID                 uint           `gorm:"primaryKey" json:"id"`
	OwnerUserID        uint           `gorm:"not null;index:idx_employee_owner_username,priority:1" json:"owner_user_id"`
	Username           string         `gorm:"not null;index:idx_employee_owner_username,priority:2" json:"username"`
	Password           string         `gorm:"not null" json:"-"`
	Name               string         `json:"name"`
	Phone              string         `json:"phone"`
	Role               string         `gorm:"type:varchar(50)" json:"role"`
	CanManageInventory bool           `gorm:"default:true" json:"can_manage_inventory"`
	CanManageOrders    bool           `gorm:"default:true" json:"can_manage_orders"`
	CanChat            bool           `gorm:"default:true" json:"can_chat"`
	CanChangeStatus    bool           `gorm:"default:true" json:"can_change_status"`
	CanRate            bool           `gorm:"default:false" json:"can_rate"`
	StatusActive       bool           `gorm:"default:true" json:"status_active"`
	ProfilePicURL      string         `json:"profile_pic_url"`
	CreatedAt          time.Time      `json:"created_at"`
	UpdatedAt          time.Time      `json:"updated_at"`
	DeletedAt          gorm.DeletedAt `gorm:"index" json:"-"`
}

func (Employee) TableName() string {
	return "employees"
}
