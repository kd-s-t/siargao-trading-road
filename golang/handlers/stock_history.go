package handlers

import (
	"net/http"
	"strconv"

	"siargao-trading-road/database"
	"siargao-trading-road/models"

	"github.com/gin-gonic/gin"
)

func GetStockHistory(c *gin.Context) {
	userID, err := getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}
	role, _ := c.Get("role")
	empCtx := getEmployeeContext(c)
	if empCtx.IsEmployee && !empCtx.CanManageInventory {
		c.JSON(http.StatusForbidden, gin.H{"error": "employee lacks inventory permission"})
		return
	}

	productIDStr := c.Query("product_id")
	changeType := c.Query("change_type")
	limitStr := c.DefaultQuery("limit", "100")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 || limit > 1000 {
		limit = 100
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	var stockHistories []models.StockHistory
	query := database.DB.Preload("Product").Preload("Product.Supplier").Preload("User").Preload("Employee").Preload("Order")

	if productIDStr != "" {
		productID, err := strconv.ParseUint(productIDStr, 10, 32)
		if err == nil {
			var product models.Product
			if err := database.DB.First(&product, uint(productID)).Error; err == nil {
				if role == "supplier" && product.SupplierID != userID {
					c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
					return
				}
				query = query.Where("product_id = ?", uint(productID))
			}
		}
	} else if role == "supplier" {
		var productIDs []uint
		database.DB.Model(&models.Product{}).Where("supplier_id = ?", userID).Pluck("id", &productIDs)
		if len(productIDs) > 0 {
			query = query.Where("product_id IN ?", productIDs)
		} else {
			c.JSON(http.StatusOK, []models.StockHistory{})
			return
		}
	}

	if changeType != "" {
		query = query.Where("change_type = ?", changeType)
	}

	if err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&stockHistories).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch stock history"})
		return
	}

	c.JSON(http.StatusOK, stockHistories)
}

func GetProductStockHistory(c *gin.Context) {
	productID := c.Param("id")
	userID, err := getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}
	role, _ := c.Get("role")
	empCtx := getEmployeeContext(c)
	if empCtx.IsEmployee && !empCtx.CanManageInventory {
		c.JSON(http.StatusForbidden, gin.H{"error": "employee lacks inventory permission"})
		return
	}

	var product models.Product
	query := database.DB.Where("id = ?", productID)

	if role == "supplier" {
		query = query.Where("supplier_id = ?", userID)
	}

	if err := query.First(&product).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
		return
	}

	limitStr := c.DefaultQuery("limit", "100")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 || limit > 1000 {
		limit = 100
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	changeType := c.Query("change_type")

	var stockHistories []models.StockHistory
	query = database.DB.Preload("User").Preload("Employee").Preload("Order").Where("product_id = ?", productID)

	if changeType != "" {
		query = query.Where("change_type = ?", changeType)
	}

	if err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&stockHistories).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch stock history"})
		return
	}

	c.JSON(http.StatusOK, stockHistories)
}
