package handlers

import (
	"net/http"
	"strconv"

	"siargao-trading-road/database"
	"siargao-trading-road/models"

	"github.com/gin-gonic/gin"
)

func GetAuditLogs(c *gin.Context) {
	userRole, _ := c.Get("role")
	currentUserID, err := getUserID(c)

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		c.Abort()
		return
	}

	adminLevel := getAdminLevel(c)
	if adminLevel == 0 {
		adminLevel = 1
	}
	isAdmin := userRole == "admin" && adminLevel <= 1

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	role := c.Query("role")
	userID := c.Query("user_id")
	employeeID := c.Query("employee_id")
	endpoint := c.Query("endpoint")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 50
	}

	if !isAdmin {
		if userRole != string(models.RoleSupplier) && userRole != string(models.RoleStore) {
			c.JSON(http.StatusForbidden, gin.H{"error": "only admin, suppliers, or stores can access this resource"})
			c.Abort()
			return
		}

		if employeeID == "" {
			c.JSON(http.StatusForbidden, gin.H{"error": "employee_id is required for non-admin users"})
			c.Abort()
			return
		}

		empID, err := strconv.ParseUint(employeeID, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid employee_id"})
			c.Abort()
			return
		}

		var employee models.Employee
		if err := database.DB.Where("id = ? AND owner_user_id = ?", uint(empID), currentUserID).First(&employee).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "employee not found or access denied"})
			c.Abort()
			return
		}
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

	if employeeID != "" {
		if id, err := strconv.ParseUint(employeeID, 10, 32); err == nil {
			query = query.Where("employee_id = ?", uint(id))
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
		Preload("Employee").
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
