package handlers

import (
	"net/http"

	"siargao-trading-road/database"
	"siargao-trading-road/models"

	"github.com/gin-gonic/gin"
)

func GetPublicMetrics(c *gin.Context) {
	var totalUsers int64
	var totalSuppliers int64
	var totalOrders int64

	database.DB.Model(&models.User{}).Count(&totalUsers)
	database.DB.Model(&models.User{}).Where("role = ?", models.RoleSupplier).Count(&totalSuppliers)
	database.DB.Model(&models.Order{}).Where("status != ?", models.OrderStatusDraft).Count(&totalOrders)

	c.JSON(http.StatusOK, gin.H{
		"total_users":     totalUsers,
		"total_suppliers": totalSuppliers,
		"total_orders":    totalOrders,
	})
}
