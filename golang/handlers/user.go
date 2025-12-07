package handlers

import (
	"net/http"
	"time"

	"siargao-trading-road/database"
	"siargao-trading-road/models"

	"github.com/gin-gonic/gin"
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

	role, exists := c.Get("role")
	if !exists {
		c.JSON(http.StatusOK, user)
		return
	}

	roleStr, ok := role.(string)
	if !ok {
		c.JSON(http.StatusOK, user)
		return
	}

	if roleStr == "store" || roleStr == "supplier" {
		var ratingStats struct {
			AverageRating float64
			RatingCount   int64
		}
		database.DB.Model(&models.Rating{}).
			Where("rated_id = ?", userID).
			Select("COALESCE(AVG(rating), 0) as average_rating, COUNT(*) as rating_count").
			Scan(&ratingStats)

		var averageRating *float64
		if ratingStats.RatingCount > 0 {
			averageRating = &ratingStats.AverageRating
		}

		response := map[string]interface{}{
			"id":             user.ID,
			"email":          user.Email,
			"name":           user.Name,
			"phone":          user.Phone,
			"address":        user.Address,
			"latitude":       user.Latitude,
			"longitude":      user.Longitude,
			"logo_url":       user.LogoURL,
			"banner_url":     user.BannerURL,
			"facebook":       user.Facebook,
			"instagram":      user.Instagram,
			"twitter":        user.Twitter,
			"linkedin":       user.LinkedIn,
			"youtube":        user.YouTube,
			"tiktok":         user.TikTok,
			"website":        user.Website,
			"role":           user.Role,
			"admin_level":    user.AdminLevel,
			"working_days":   user.WorkingDays,
			"opening_time":   user.OpeningTime,
			"closing_time":   user.ClosingTime,
			"is_open":        user.IsOpen,
			"created_at":     user.CreatedAt,
			"updated_at":     user.UpdatedAt,
			"last_login":     user.LastLogin,
			"average_rating": averageRating,
			"rating_count":   ratingStats.RatingCount,
		}

		c.JSON(http.StatusOK, response)
		return
	}

	c.JSON(http.StatusOK, user)
}

func UpdateMe(c *gin.Context) {
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

	var req struct {
		Name        string   `json:"name"`
		Phone       string   `json:"phone"`
		Address     string   `json:"address"`
		Latitude    *float64 `json:"latitude"`
		Longitude   *float64 `json:"longitude"`
		LogoURL     string   `json:"logo_url"`
		BannerURL   string   `json:"banner_url"`
		Facebook    string   `json:"facebook"`
		Instagram   string   `json:"instagram"`
		Twitter     string   `json:"twitter"`
		LinkedIn    string   `json:"linkedin"`
		YouTube     string   `json:"youtube"`
		TikTok      string   `json:"tiktok"`
		Website     string   `json:"website"`
		WorkingDays string   `json:"working_days"`
		OpeningTime string   `json:"opening_time"`
		ClosingTime string   `json:"closing_time"`
		IsOpen      *bool    `json:"is_open"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Name != "" {
		user.Name = req.Name
	}
	if req.Phone != "" {
		user.Phone = req.Phone
	}
	if req.Address != "" {
		user.Address = req.Address
	}
	if req.Latitude != nil {
		user.Latitude = req.Latitude
	}
	if req.Longitude != nil {
		user.Longitude = req.Longitude
	}
	if req.LogoURL != "" {
		user.LogoURL = req.LogoURL
	}
	if req.BannerURL != "" {
		user.BannerURL = req.BannerURL
	}
	if req.Facebook != "" {
		user.Facebook = req.Facebook
	}
	if req.Instagram != "" {
		user.Instagram = req.Instagram
	}
	if req.Twitter != "" {
		user.Twitter = req.Twitter
	}
	if req.LinkedIn != "" {
		user.LinkedIn = req.LinkedIn
	}
	if req.YouTube != "" {
		user.YouTube = req.YouTube
	}
	if req.TikTok != "" {
		user.TikTok = req.TikTok
	}
	if req.Website != "" {
		user.Website = req.Website
	}
	if req.WorkingDays != "" {
		user.WorkingDays = req.WorkingDays
	}
	if req.OpeningTime != "" {
		user.OpeningTime = req.OpeningTime
	}
	if req.ClosingTime != "" {
		user.ClosingTime = req.ClosingTime
	}
	if req.IsOpen != nil {
		user.IsOpen = *req.IsOpen
	}

	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update user"})
		return
	}

	user.Password = ""
	c.JSON(http.StatusOK, user)
}

func GetMyAnalytics(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}

	role, _ := c.Get("role")
	if role != "store" && role != "supplier" {
		c.JSON(http.StatusForbidden, gin.H{"error": "analytics only available for stores and suppliers"})
		return
	}

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	var totalOrders int64
	var totalEarnings float64
	var orders []models.Order

	if user.Role == "store" {
		database.DB.Model(&models.Order{}).
			Where("store_id = ? AND status != ?", userID, "draft").
			Count(&totalOrders)

		database.DB.Model(&models.Order{}).
			Where("store_id = ? AND status != ?", userID, "draft").
			Select("COALESCE(SUM(total_amount), 0)").
			Scan(&totalEarnings)

		if err := database.DB.Model(&models.Order{}).
			Preload("Supplier").
			Preload("OrderItems").
			Preload("OrderItems.Product").
			Where("store_id = ? AND status != ?", userID, "draft").
			Order("created_at DESC").
			Find(&orders).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch orders"})
			return
		}
	} else if user.Role == "supplier" {
		database.DB.Model(&models.Order{}).
			Where("supplier_id = ? AND status != ?", userID, "draft").
			Count(&totalOrders)

		database.DB.Model(&models.Order{}).
			Where("supplier_id = ? AND status != ?", userID, "draft").
			Select("COALESCE(SUM(total_amount), 0)").
			Scan(&totalEarnings)

		if err := database.DB.Model(&models.Order{}).
			Preload("Store").
			Preload("OrderItems").
			Preload("OrderItems.Product").
			Where("supplier_id = ? AND status != ?", userID, "draft").
			Order("created_at DESC").
			Find(&orders).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch orders"})
			return
		}
	}

	var productCounts = make(map[uint]map[string]interface{})
	var totalProductsBought int64
	var productsBought []map[string]interface{}

	if user.Role == "store" {
		for _, order := range orders {
			for _, item := range order.OrderItems {
				totalProductsBought += int64(item.Quantity)
				if productInfo, exists := productCounts[item.ProductID]; exists {
					productInfo["quantity"] = productInfo["quantity"].(int64) + int64(item.Quantity)
					productInfo["total_spent"] = productInfo["total_spent"].(float64) + item.Subtotal
				} else {
					productCounts[item.ProductID] = map[string]interface{}{
						"product_id":   item.ProductID,
						"product_name": item.Product.Name,
						"quantity":     int64(item.Quantity),
						"total_spent":  item.Subtotal,
					}
				}
			}
		}

		for _, productInfo := range productCounts {
			productsBought = append(productsBought, productInfo)
		}
	} else if user.Role == "supplier" {
		var products []models.Product
		if err := database.DB.Where("supplier_id = ?", userID).Find(&products).Error; err == nil {
			for _, product := range products {
				productsBought = append(productsBought, map[string]interface{}{
					"product_id":   product.ID,
					"product_name": product.Name,
					"price":        product.Price,
					"stock":        product.StockQuantity,
					"unit":         product.Unit,
					"category":     product.Category,
					"sku":          product.SKU,
				})
				totalProductsBought += int64(product.StockQuantity)
			}
		}
	}

	thirtyDaysAgo := time.Now().AddDate(0, 0, -30)
	var recentOrders []models.Order
	if user.Role == "store" {
		database.DB.Preload("OrderItems").Preload("OrderItems.Product").Preload("Supplier").
			Where("store_id = ? AND status != ? AND created_at >= ?", userID, "draft", thirtyDaysAgo).
			Order("created_at DESC").
			Find(&recentOrders)
	} else {
		database.DB.Preload("OrderItems").Preload("OrderItems.Product").Preload("Store").
			Where("supplier_id = ? AND status != ? AND created_at >= ?", userID, "draft", thirtyDaysAgo).
			Order("created_at DESC").
			Find(&recentOrders)
	}

	var ratingStats struct {
		AverageRating float64
		RatingCount   int64
	}
	database.DB.Model(&models.Rating{}).
		Where("rated_id = ?", userID).
		Select("COALESCE(AVG(rating), 0) as average_rating, COUNT(*) as rating_count").
		Scan(&ratingStats)

	var averageRating *float64
	if ratingStats.RatingCount > 0 {
		averageRating = &ratingStats.AverageRating
	}

	c.JSON(http.StatusOK, gin.H{
		"total_orders":          totalOrders,
		"total_earnings":        totalEarnings,
		"total_products_bought": totalProductsBought,
		"orders":                orders,
		"products_bought":       productsBought,
		"recent_orders":         recentOrders,
		"average_rating":        averageRating,
		"rating_count":          ratingStats.RatingCount,
	})
}

func GetUsers(c *gin.Context) {
	if !requireAdminLevel(c, 3) {
		return
	}

	var users []models.User
	if err := database.DB.Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch users"})
		return
	}

	for i := range users {
		users[i].Password = ""
	}

	c.JSON(http.StatusOK, users)
}

func GetUser(c *gin.Context) {
	if !requireAdminLevel(c, 3) {
		return
	}

	id := c.Param("id")
	var user models.User
	if err := database.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	user.Password = ""
	c.JSON(http.StatusOK, user)
}

func GetUserAnalytics(c *gin.Context) {
	if !requireAdminLevel(c, 3) {
		return
	}

	userID := c.Param("id")

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	var totalOrders int64
	var totalEarnings float64
	var orders []models.Order

	if user.Role == "store" {
		database.DB.Model(&models.Order{}).
			Where("store_id = ? AND status != ?", userID, "draft").
			Count(&totalOrders)

		database.DB.Model(&models.Order{}).
			Where("store_id = ? AND status != ?", userID, "draft").
			Select("COALESCE(SUM(total_amount), 0)").
			Scan(&totalEarnings)

		if err := database.DB.Model(&models.Order{}).
			Preload("Supplier").
			Preload("OrderItems").
			Preload("OrderItems.Product").
			Where("store_id = ? AND status != ?", userID, "draft").
			Order("created_at DESC").
			Find(&orders).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch orders"})
			return
		}
	} else if user.Role == "supplier" {
		database.DB.Model(&models.Order{}).
			Where("supplier_id = ? AND status != ?", userID, "draft").
			Count(&totalOrders)

		database.DB.Model(&models.Order{}).
			Where("supplier_id = ? AND status != ?", userID, "draft").
			Select("COALESCE(SUM(total_amount), 0)").
			Scan(&totalEarnings)

		if err := database.DB.Model(&models.Order{}).
			Preload("Store").
			Preload("OrderItems").
			Preload("OrderItems.Product").
			Where("supplier_id = ? AND status != ?", userID, "draft").
			Order("created_at DESC").
			Find(&orders).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch orders"})
			return
		}
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "analytics only available for stores and suppliers"})
		return
	}

	var productCounts = make(map[uint]map[string]interface{})
	var totalProductsBought int64
	var productsBought []map[string]interface{}

	if user.Role == "store" {
		for _, order := range orders {
			for _, item := range order.OrderItems {
				totalProductsBought += int64(item.Quantity)
				if productInfo, exists := productCounts[item.ProductID]; exists {
					productInfo["quantity"] = productInfo["quantity"].(int64) + int64(item.Quantity)
					productInfo["total_spent"] = productInfo["total_spent"].(float64) + item.Subtotal
				} else {
					productCounts[item.ProductID] = map[string]interface{}{
						"product_id":   item.ProductID,
						"product_name": item.Product.Name,
						"quantity":     int64(item.Quantity),
						"total_spent":  item.Subtotal,
					}
				}
			}
		}

		for _, productInfo := range productCounts {
			productsBought = append(productsBought, productInfo)
		}
	} else if user.Role == "supplier" {
		var products []models.Product
		if err := database.DB.Where("supplier_id = ?", userID).Find(&products).Error; err == nil {
			for _, product := range products {
				productsBought = append(productsBought, map[string]interface{}{
					"product_id":   product.ID,
					"product_name": product.Name,
					"price":        product.Price,
					"stock":        product.StockQuantity,
					"unit":         product.Unit,
					"category":     product.Category,
					"sku":          product.SKU,
				})
				totalProductsBought += int64(product.StockQuantity)
			}
		}
	}

	thirtyDaysAgo := time.Now().AddDate(0, 0, -30)
	var recentOrders []models.Order
	if user.Role == "store" {
		database.DB.Preload("OrderItems").Preload("OrderItems.Product").Preload("Supplier").
			Where("store_id = ? AND status != ? AND created_at >= ?", userID, "draft", thirtyDaysAgo).
			Order("created_at DESC").
			Find(&recentOrders)
	} else {
		database.DB.Preload("OrderItems").Preload("OrderItems.Product").Preload("Store").
			Where("supplier_id = ? AND status != ? AND created_at >= ?", userID, "draft", thirtyDaysAgo).
			Order("created_at DESC").
			Find(&recentOrders)
	}

	var ratingStats struct {
		AverageRating float64
		RatingCount   int64
	}
	database.DB.Model(&models.Rating{}).
		Where("rated_id = ?", userID).
		Select("COALESCE(AVG(rating), 0) as average_rating, COUNT(*) as rating_count").
		Scan(&ratingStats)

	var averageRating *float64
	if ratingStats.RatingCount > 0 {
		averageRating = &ratingStats.AverageRating
	}

	c.JSON(http.StatusOK, gin.H{
		"total_orders":          totalOrders,
		"total_earnings":        totalEarnings,
		"total_products_bought": totalProductsBought,
		"orders":                orders,
		"products_bought":       productsBought,
		"recent_orders":         recentOrders,
		"average_rating":        averageRating,
		"rating_count":          ratingStats.RatingCount,
	})
}

func GetDashboardAnalytics(c *gin.Context) {
	if !requireAdminLevel(c, 3) {
		return
	}

	var totalUsers int64
	var totalSuppliers int64
	var totalStores int64
	var totalOrders int64
	var totalEarnings float64

	database.DB.Model(&models.User{}).Count(&totalUsers)
	database.DB.Model(&models.User{}).Where("role = ?", "supplier").Count(&totalSuppliers)
	database.DB.Model(&models.User{}).Where("role = ?", "store").Count(&totalStores)
	database.DB.Model(&models.Order{}).Where("status != ?", "draft").Count(&totalOrders)
	database.DB.Model(&models.Order{}).
		Where("status != ?", "draft").
		Select("COALESCE(SUM(total_amount), 0)").
		Scan(&totalEarnings)

	var orders []models.Order
	database.DB.Preload("Store").Preload("Supplier").Preload("OrderItems").
		Where("status != ?", "draft").
		Order("created_at DESC").
		Limit(100).
		Find(&orders)

	thirtyDaysAgo := time.Now().AddDate(0, 0, -30)
	var dailyStats []map[string]interface{}

	for i := 0; i < 30; i++ {
		date := thirtyDaysAgo.AddDate(0, 0, i)
		nextDate := date.AddDate(0, 0, 1)

		var dayOrders int64
		var dayEarnings float64

		database.DB.Model(&models.Order{}).
			Where("status != ? AND created_at >= ? AND created_at < ?", "draft", date, nextDate).
			Count(&dayOrders)

		database.DB.Model(&models.Order{}).
			Where("status != ? AND created_at >= ? AND created_at < ?", "draft", date, nextDate).
			Select("COALESCE(SUM(total_amount), 0)").
			Scan(&dayEarnings)

		dailyStats = append(dailyStats, map[string]interface{}{
			"date":     date.Format("2006-01-02"),
			"orders":   dayOrders,
			"earnings": dayEarnings,
		})
	}

	var usersRegisteredLast30Days int64
	var usersLoggedInLast30Days int64

	database.DB.Model(&models.User{}).
		Where("created_at >= ?", thirtyDaysAgo).
		Count(&usersRegisteredLast30Days)

	database.DB.Model(&models.User{}).
		Where("last_login >= ?", thirtyDaysAgo).
		Count(&usersLoggedInLast30Days)

	c.JSON(http.StatusOK, gin.H{
		"total_users":                   totalUsers,
		"total_suppliers":               totalSuppliers,
		"total_stores":                  totalStores,
		"total_orders":                  totalOrders,
		"total_earnings":                totalEarnings,
		"users_registered_last_30_days": usersRegisteredLast30Days,
		"users_logged_in_last_30_days":  usersLoggedInLast30Days,
		"recent_orders":                 orders,
		"daily_stats":                   dailyStats,
	})
}

func OpenStore(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}

	role, _ := c.Get("role")
	if role != "store" && role != "supplier" {
		c.JSON(http.StatusForbidden, gin.H{"error": "only stores and suppliers can open/close"})
		return
	}

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	user.IsOpen = true
	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to open store"})
		return
	}

	user.Password = ""
	c.JSON(http.StatusOK, user)
}

func CloseStore(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}

	role, _ := c.Get("role")
	if role != "store" && role != "supplier" {
		c.JSON(http.StatusForbidden, gin.H{"error": "only stores and suppliers can open/close"})
		return
	}

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	user.IsOpen = false
	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to close store"})
		return
	}

	user.Password = ""
	c.JSON(http.StatusOK, user)
}
