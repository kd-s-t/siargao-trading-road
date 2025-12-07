package handlers

import (
	"log"
	"net/http"

	"siargao-trading-road/database"
	"siargao-trading-road/models"

	"github.com/gin-gonic/gin"
)

func GetSuppliers(c *gin.Context) {
	role, _ := c.Get("role")

	if role != "store" && role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "only stores and admins can view suppliers"})
		return
	}

	var suppliers []models.User
	if err := database.DB.Where("role = ?", "supplier").Find(&suppliers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch suppliers"})
		return
	}

	type SupplierInfo struct {
		ID            uint     `json:"id"`
		Name          string   `json:"name"`
		Email         string   `json:"email"`
		Phone         string   `json:"phone"`
		Description   string   `json:"description"`
		ProductCount  int      `json:"product_count"`
		LogoURL       *string  `json:"logo_url"`
		BannerURL     *string  `json:"banner_url"`
		AverageRating *float64 `json:"average_rating,omitempty"`
		RatingCount   int      `json:"rating_count"`
		WorkingDays   string   `json:"working_days"`
		OpeningTime   string   `json:"opening_time"`
		ClosingTime   string   `json:"closing_time"`
		IsOpen        bool     `json:"is_open"`
	}

	var supplierInfos []SupplierInfo
	for _, supplier := range suppliers {
		var productCount int64
		database.DB.Model(&models.Product{}).Where("supplier_id = ?", supplier.ID).Count(&productCount)

		var ratingStats struct {
			AverageRating float64
			RatingCount   int64
		}
		database.DB.Model(&models.Rating{}).
			Where("rated_id = ?", supplier.ID).
			Select("COALESCE(AVG(rating), 0) as average_rating, COUNT(*) as rating_count").
			Scan(&ratingStats)

		log.Printf("Supplier %s (ID: %d) - LogoURL: '%s', BannerURL: '%s'", supplier.Name, supplier.ID, supplier.LogoURL, supplier.BannerURL)

		logoURL := supplier.LogoURL
		bannerURL := supplier.BannerURL

		var avgRating *float64
		if ratingStats.RatingCount > 0 {
			avgRating = &ratingStats.AverageRating
		}

		supplierInfos = append(supplierInfos, SupplierInfo{
			ID:            supplier.ID,
			Name:          supplier.Name,
			Email:         supplier.Email,
			Phone:         supplier.Phone,
			Description:   "Siargao Trading Road supplier offering various products",
			ProductCount:  int(productCount),
			LogoURL:       &logoURL,
			BannerURL:     &bannerURL,
			AverageRating: avgRating,
			RatingCount:   int(ratingStats.RatingCount),
			OpeningTime:   supplier.OpeningTime,
			ClosingTime:   supplier.ClosingTime,
			IsOpen:        supplier.IsOpen,
		})
	}

	c.JSON(http.StatusOK, supplierInfos)
}

func GetSupplierProducts(c *gin.Context) {
	supplierID := c.Param("id")
	role, _ := c.Get("role")

	if role != "store" && role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "only stores and admins can view supplier products"})
		return
	}

	var supplier models.User
	if err := database.DB.Where("id = ? AND role = ?", supplierID, "supplier").First(&supplier).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "supplier not found"})
		return
	}

	var products []models.Product
	if err := database.DB.Where("supplier_id = ?", supplierID).Find(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch products"})
		return
	}

	c.JSON(http.StatusOK, products)
}

func GetStores(c *gin.Context) {
	role, _ := c.Get("role")

	if role != "supplier" && role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "only suppliers and admins can view stores"})
		return
	}

	var stores []models.User
	if err := database.DB.Where("role = ?", "store").Find(&stores).Error; err != nil {
		log.Printf("Error fetching stores: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch stores"})
		return
	}

	type StoreInfo struct {
		ID            uint     `json:"id"`
		Name          string   `json:"name"`
		Email         string   `json:"email"`
		Phone         string   `json:"phone"`
		Description   string   `json:"description"`
		LogoURL       *string  `json:"logo_url"`
		BannerURL     *string  `json:"banner_url"`
		AverageRating *float64 `json:"average_rating,omitempty"`
		RatingCount   int      `json:"rating_count"`
		WorkingDays   string   `json:"working_days"`
		OpeningTime   string   `json:"opening_time"`
		ClosingTime   string   `json:"closing_time"`
		IsOpen        bool     `json:"is_open"`
	}

	var storeInfos []StoreInfo
	for _, store := range stores {
		var ratingStats struct {
			AverageRating float64
			RatingCount   int64
		}
		if err := database.DB.Model(&models.Rating{}).
			Where("rated_id = ?", store.ID).
			Select("COALESCE(AVG(rating), 0) as average_rating, COUNT(*) as rating_count").
			Scan(&ratingStats).Error; err != nil {
			log.Printf("Error fetching rating stats for store %d: %v", store.ID, err)
			ratingStats.AverageRating = 0
			ratingStats.RatingCount = 0
		}

		log.Printf("Store %s (ID: %d) - LogoURL: '%s', BannerURL: '%s'", store.Name, store.ID, store.LogoURL, store.BannerURL)

		logoURL := store.LogoURL
		bannerURL := store.BannerURL

		var logoURLPtr *string
		if logoURL != "" {
			logoURLPtr = &logoURL
		}

		var bannerURLPtr *string
		if bannerURL != "" {
			bannerURLPtr = &bannerURL
		}

		var avgRating *float64
		if ratingStats.RatingCount > 0 {
			avgRating = &ratingStats.AverageRating
		}

		storeInfos = append(storeInfos, StoreInfo{
			ID:            store.ID,
			Name:          store.Name,
			Email:         store.Email,
			Phone:         store.Phone,
			Description:   "Siargao Trading Road store",
			LogoURL:       logoURLPtr,
			BannerURL:     bannerURLPtr,
			AverageRating: avgRating,
			RatingCount:   int(ratingStats.RatingCount),
			OpeningTime:   store.OpeningTime,
			ClosingTime:   store.ClosingTime,
			IsOpen:        store.IsOpen,
		})
	}

	c.JSON(http.StatusOK, storeInfos)
}
