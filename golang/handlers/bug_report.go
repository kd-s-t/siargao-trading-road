package handlers

import (
	"net/http"
	"strconv"
	"time"

	"siargao-trading-road/database"
	"siargao-trading-road/models"

	"github.com/gin-gonic/gin"
)

func CreateBugReport(c *gin.Context) {
	var bugReport models.BugReport
	if err := c.ShouldBindJSON(&bugReport); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, exists := c.Get("user_id")
	if exists {
		if uid, ok := userID.(uint); ok {
			bugReport.UserID = &uid
		}
	}

	if bugReport.Status == "" {
		bugReport.Status = models.BugStatusOpen
	}

	if err := database.DB.Create(&bugReport).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create bug report"})
		return
	}

	database.DB.Preload("User").First(&bugReport, bugReport.ID)

	c.JSON(http.StatusCreated, bugReport)
}

func GetBugReports(c *gin.Context) {
	if !requireAdminLevel(c, 1) {
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	status := c.Query("status")
	platform := c.Query("platform")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 50
	}

	offset := (page - 1) * limit

	query := database.DB.Model(&models.BugReport{})

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if platform != "" {
		query = query.Where("platform = ?", platform)
	}

	var total int64
	query.Count(&total)

	var bugReports []models.BugReport
	query.Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Preload("User").
		Preload("ResolvedByUser").
		Find(&bugReports)

	c.JSON(http.StatusOK, gin.H{
		"data": bugReports,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
			"pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

func GetBugReport(c *gin.Context) {
	if !requireAdminLevel(c, 1) {
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid bug report id"})
		return
	}

	var bugReport models.BugReport
	if err := database.DB.Preload("User").Preload("ResolvedByUser").First(&bugReport, uint(id)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "bug report not found"})
		return
	}

	c.JSON(http.StatusOK, bugReport)
}

func UpdateBugReport(c *gin.Context) {
	if !requireAdminLevel(c, 1) {
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid bug report id"})
		return
	}

	var bugReport models.BugReport
	if err := database.DB.First(&bugReport, uint(id)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "bug report not found"})
		return
	}

	var updateData struct {
		Status *models.BugStatus `json:"status"`
		Notes  *string           `json:"notes"`
	}

	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	if uid, ok := userID.(uint); ok {
		if updateData.Status != nil {
			status := *updateData.Status
			if status == models.BugStatusResolved || status == models.BugStatusClosed || status == models.BugStatusFixed {
				bugReport.ResolvedBy = &uid
				now := time.Now()
				bugReport.ResolvedAt = &now
			}
			bugReport.Status = status
		}
	}

	if updateData.Notes != nil {
		bugReport.Notes = *updateData.Notes
	}

	if err := database.DB.Save(&bugReport).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update bug report"})
		return
	}

	database.DB.Preload("User").Preload("ResolvedByUser").First(&bugReport, bugReport.ID)

	c.JSON(http.StatusOK, bugReport)
}

func DeleteBugReport(c *gin.Context) {
	if !requireAdminLevel(c, 1) {
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid bug report id"})
		return
	}

	if err := database.DB.Delete(&models.BugReport{}, uint(id)).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete bug report"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "bug report deleted"})
}
