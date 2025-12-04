package handlers

import (
	"net/http"
	"strconv"

	"siargao-trading-road/database"
	"siargao-trading-road/models"

	"github.com/gin-gonic/gin"
)

func GetAuditLogs(c *gin.Context) {
	if !requireAdminLevel(c, 1) {
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	role := c.Query("role")
	userID := c.Query("user_id")
	endpoint := c.Query("endpoint")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 50
	}

	offset := (page - 1) * limit

	query := database.DB.Model(&models.AuditLog{})

	if role != "" {
		query = query.Where("role = ?", role)
	}

	if userID != "" {
		if id, err := strconv.ParseUint(userID, 10, 32); err == nil {
			query = query.Where("user_id = ?", uint(id))
		}
	}

	if endpoint != "" {
		query = query.Where("endpoint LIKE ?", "%"+endpoint+"%")
	}

	var total int64
	query.Count(&total)

	var auditLogs []models.AuditLog
	query.Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Preload("User").
		Find(&auditLogs)

	c.JSON(http.StatusOK, gin.H{
		"data": auditLogs,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
			"pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}
