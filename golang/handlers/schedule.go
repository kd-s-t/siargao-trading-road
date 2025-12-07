package handlers

import (
	"net/http"
	"time"

	"siargao-trading-road/database"
	"siargao-trading-road/models"

	"github.com/gin-gonic/gin"
)

func GetScheduleExceptions(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}

	var exceptions []models.ScheduleException
	if err := database.DB.Where("user_id = ?", userID).Order("date ASC").Find(&exceptions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch schedule exceptions"})
		return
	}

	c.JSON(http.StatusOK, exceptions)
}

func CreateScheduleException(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}

	var req struct {
		Date        string  `json:"date" binding:"required"`
		IsClosed    bool    `json:"is_closed"`
		OpeningTime *string `json:"opening_time"`
		ClosingTime *string `json:"closing_time"`
		Notes       string  `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	date, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date format. Use YYYY-MM-DD"})
		return
	}

	var existing models.ScheduleException
	if err := database.DB.Where("user_id = ? AND date = ?", userID, date.Format("2006-01-02")).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "schedule exception already exists for this date"})
		return
	}

	userIDUint := uint(userID.(float64))
	exception := models.ScheduleException{
		UserID:      userIDUint,
		Date:        date,
		IsClosed:    req.IsClosed,
		OpeningTime: req.OpeningTime,
		ClosingTime: req.ClosingTime,
		Notes:       req.Notes,
	}

	if err := database.DB.Create(&exception).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create schedule exception"})
		return
	}

	c.JSON(http.StatusCreated, exception)
}

func UpdateScheduleException(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}

	id := c.Param("id")
	var exception models.ScheduleException
	if err := database.DB.Where("id = ? AND user_id = ?", id, userID).First(&exception).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "schedule exception not found"})
		return
	}

	var req struct {
		IsClosed    *bool   `json:"is_closed"`
		OpeningTime *string `json:"opening_time"`
		ClosingTime *string `json:"closing_time"`
		Notes       *string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.IsClosed != nil {
		exception.IsClosed = *req.IsClosed
	}
	if req.OpeningTime != nil {
		exception.OpeningTime = req.OpeningTime
	}
	if req.ClosingTime != nil {
		exception.ClosingTime = req.ClosingTime
	}
	if req.Notes != nil {
		exception.Notes = *req.Notes
	}

	if err := database.DB.Save(&exception).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update schedule exception"})
		return
	}

	c.JSON(http.StatusOK, exception)
}

func DeleteScheduleException(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}

	id := c.Param("id")
	var exception models.ScheduleException
	if err := database.DB.Where("id = ? AND user_id = ?", id, userID).First(&exception).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "schedule exception not found"})
		return
	}

	if err := database.DB.Delete(&exception).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete schedule exception"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "schedule exception deleted"})
}

func BulkCreateScheduleExceptions(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}

	var req struct {
		Dates    []string `json:"dates" binding:"required"`
		IsClosed bool     `json:"is_closed"`
		Notes    string   `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var exceptions []models.ScheduleException
	for _, dateStr := range req.Dates {
		date, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date format. Use YYYY-MM-DD"})
			return
		}

		var existing models.ScheduleException
		if err := database.DB.Where("user_id = ? AND date = ?", userID, date.Format("2006-01-02")).First(&existing).Error; err == nil {
			continue
		}

		userIDUint := uint(userID.(float64))
		exceptions = append(exceptions, models.ScheduleException{
			UserID:   userIDUint,
			Date:     date,
			IsClosed: req.IsClosed,
			Notes:    req.Notes,
		})
	}

	if len(exceptions) > 0 {
		if err := database.DB.Create(&exceptions).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create schedule exceptions"})
			return
		}
	}

	c.JSON(http.StatusCreated, gin.H{"created": len(exceptions), "exceptions": exceptions})
}
