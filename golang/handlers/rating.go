package handlers

import (
	"net/http"

	"siargao-trading-road/database"
	"siargao-trading-road/models"

	"github.com/gin-gonic/gin"
)

func GetRatingsSummary(c *gin.Context) {
	if !requireAdminLevel(c, 1) {
		return
	}

	type SupplierRatingSummary struct {
		SupplierID    uint    `json:"supplier_id"`
		SupplierName  string  `json:"supplier_name"`
		AverageRating float64 `json:"average_rating"`
		RatingCount   int64   `json:"rating_count"`
	}

	var supplierRatings []SupplierRatingSummary
	database.DB.Model(&models.Rating{}).
		Select("rated_id as supplier_id, users.name as supplier_name, AVG(ratings.rating) as average_rating, COUNT(*) as rating_count").
		Joins("JOIN users ON users.id = ratings.rated_id AND users.role = 'supplier'").
		Group("rated_id, users.name").
		Scan(&supplierRatings)

	type StoreRatingSummary struct {
		StoreID       uint    `json:"store_id"`
		StoreName     string  `json:"store_name"`
		AverageRating float64 `json:"average_rating"`
		RatingCount   int64   `json:"rating_count"`
	}

	var storeRatings []StoreRatingSummary
	database.DB.Model(&models.Rating{}).
		Select("rated_id as store_id, users.name as store_name, AVG(ratings.rating) as average_rating, COUNT(*) as rating_count").
		Joins("JOIN users ON users.id = ratings.rated_id AND users.role = 'store'").
		Group("rated_id, users.name").
		Scan(&storeRatings)

	type OrderWithRatings struct {
		OrderID      uint   `json:"order_id"`
		StoreName    string `json:"store_name"`
		SupplierName string `json:"supplier_name"`
		RatingCount  int64  `json:"rating_count"`
	}

	var ordersWithRatings []OrderWithRatings
	database.DB.Model(&models.Rating{}).
		Select("ratings.order_id, stores.name as store_name, suppliers.name as supplier_name, COUNT(*) as rating_count").
		Joins("JOIN orders ON orders.id = ratings.order_id").
		Joins("JOIN users stores ON stores.id = orders.store_id").
		Joins("JOIN users suppliers ON suppliers.id = orders.supplier_id").
		Group("ratings.order_id, stores.name, suppliers.name").
		Scan(&ordersWithRatings)

	c.JSON(http.StatusOK, gin.H{
		"suppliers":           supplierRatings,
		"stores":              storeRatings,
		"orders_with_ratings": ordersWithRatings,
	})
}

func GetOrdersWithRatings(c *gin.Context) {
	if !requireAdminLevel(c, 1) {
		return
	}

	var orderIDs []uint
	database.DB.Model(&models.Rating{}).
		Select("DISTINCT order_id").
		Scan(&orderIDs)

	c.JSON(http.StatusOK, gin.H{
		"order_ids": orderIDs,
	})
}

func GetMyRatings(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	var ratings []models.Rating
	if err := database.DB.
		Preload("Rater").
		Preload("Rated").
		Preload("Order").
		Where("rated_id = ?", userID).
		Order("created_at DESC").
		Find(&ratings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch ratings"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ratings": ratings})
}

func CreateRating(c *gin.Context) {
	userID, err := getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	orderID := c.Param("id")
	var order models.Order
	if err := database.DB.Where("id = ?", orderID).First(&order).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "order not found"})
		return
	}

	// Verify user has access to this order
	role, _ := c.Get("role")
	if role == "supplier" && order.SupplierID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		return
	}
	if role == "store" && order.StoreID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		return
	}

	// Only allow ratings for delivered orders
	if order.Status != models.OrderStatusDelivered {
		c.JSON(http.StatusBadRequest, gin.H{"error": "can only rate delivered orders"})
		return
	}

	var req struct {
		Rating  int    `json:"rating" binding:"required,min=1,max=5"`
		Comment string `json:"comment"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Determine who is being rated
	var ratedID uint
	if role == "store" {
		ratedID = order.SupplierID // Store rates supplier
	} else if role == "supplier" {
		ratedID = order.StoreID // Supplier rates store
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid role for rating"})
		return
	}

	// Check if rating already exists for this order by this user
	var existingRating models.Rating
	if err := database.DB.Where("order_id = ? AND rater_id = ?", orderID, userID).First(&existingRating).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "you have already rated this order"})
		return
	}

	rating := models.Rating{
		OrderID: order.ID,
		RaterID: userID,
		RatedID: ratedID,
		Rating:  req.Rating,
		Comment: req.Comment,
	}

	if err := database.DB.Create(&rating).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create rating"})
		return
	}

	database.DB.Preload("Rater").Preload("Rated").First(&rating, rating.ID)

	c.JSON(http.StatusCreated, rating)
}
