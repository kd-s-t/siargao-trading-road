package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"siargao-trading-road/database"
	"siargao-trading-road/models"
)

func GetMe(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	user.Password = ""
	c.JSON(http.StatusOK, user)
}

