package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func getAdminLevel(c *gin.Context) int {
	adminLevel, exists := c.Get("admin_level")
	if !exists {
		return 0
	}
	if level, ok := adminLevel.(float64); ok {
		return int(level)
	}
	if level, ok := adminLevel.(int); ok {
		return level
	}
	return 0
}

func requireAdminLevel(c *gin.Context, maxLevel int) bool {
	role, _ := c.Get("role")
	if role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "only admin can access this resource"})
		c.Abort()
		return false
	}

	level := getAdminLevel(c)
	if level == 0 {
		level = 1
	}

	if level > maxLevel {
		c.JSON(http.StatusForbidden, gin.H{"error": "insufficient admin level"})
		c.Abort()
		return false
	}

	return true
}

func canCreateUsers(c *gin.Context) bool {
	role, _ := c.Get("role")
	if role != "admin" {
		return false
	}

	level := getAdminLevel(c)
	if level == 0 {
		level = 1
	}

	return level <= 2
}

func canCreateAdminUsers(c *gin.Context) bool {
	role, _ := c.Get("role")
	if role != "admin" {
		return false
	}

	level := getAdminLevel(c)
	if level == 0 {
		level = 1
	}

	return level == 1
}

func isReadOnly(c *gin.Context) bool {
	role, _ := c.Get("role")
	if role != "admin" {
		return false
	}

	level := getAdminLevel(c)
	if level == 0 {
		level = 1
	}

	return level == 3
}

