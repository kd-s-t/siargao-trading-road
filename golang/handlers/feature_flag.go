package handlers

import (
	"net/http"
	"siargao-trading-road/database"
	"siargao-trading-road/models"

	"github.com/gin-gonic/gin"
)

func CheckFeatureFlag(c *gin.Context) {
	flagName := c.Param("flag")
	userID, err := getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	var featureFlag models.FeatureFlag
	err = database.DB.Where("flag = ?", flagName).Where("user_id = ?", userID).First(&featureFlag).Error
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"exists": false})
		return
	}

	c.JSON(http.StatusOK, gin.H{"exists": true})
}

func SetFeatureFlag(c *gin.Context) {
	flagName := c.Param("flag")
	userID, err := getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	var featureFlag models.FeatureFlag
	err = database.DB.Where("flag = ?", flagName).Where("user_id = ?", userID).First(&featureFlag).Error
	if err == nil {
		c.JSON(http.StatusOK, gin.H{"message": "Feature flag already exists"})
		return
	}

	newFlag := models.FeatureFlag{
		Flag:   flagName,
		UserID: &userID,
	}

	err = database.DB.Create(&newFlag).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create feature flag"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Feature flag created", "flag": newFlag})
}
