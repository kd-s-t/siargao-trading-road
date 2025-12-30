package handlers

import (
	"log"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

	"siargao-trading-road/database"
	"siargao-trading-road/models"

	"github.com/gin-gonic/gin"
)

var philippineTZ = time.FixedZone("Asia/Manila", 8*60*60)

func nowInPH() time.Time {
	return time.Now().In(philippineTZ)
}

func GetSuppliers(c *gin.Context) {
	role, _ := c.Get("role")

	if role != "store" && role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "only stores and admins can view suppliers"})
		return
	}

	search := strings.TrimSpace(strings.ToLower(c.Query("search")))
	status := strings.TrimSpace(strings.ToLower(c.Query("status")))
	now := nowInPH()

	db := database.DB.Where("role = ?", "supplier")
	if search != "" {
		db = db.Where("LOWER(name) LIKE ?", "%"+search+"%")
	}

	suppliers := make([]models.User, 0)
	if err := db.Order("name ASC").Find(&suppliers).Error; err != nil {
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
		Latitude      *float64 `json:"latitude,omitempty"`
		Longitude     *float64 `json:"longitude,omitempty"`
	}

	supplierInfos := make([]SupplierInfo, 0, len(suppliers))
	for _, supplier := range suppliers {
		openNow := isOpenNow(supplier, now)
		if status == "open" && !openNow {
			continue
		}
		if status == "closed" && openNow {
			continue
		}

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
			IsOpen:        openNow,
			Latitude:      supplier.Latitude,
			Longitude:     supplier.Longitude,
		})
	}

	sort.Slice(supplierInfos, func(i, j int) bool {
		if supplierInfos[i].IsOpen == supplierInfos[j].IsOpen {
			return strings.ToLower(supplierInfos[i].Name) < strings.ToLower(supplierInfos[j].Name)
		}
		return supplierInfos[i].IsOpen && !supplierInfos[j].IsOpen
	})

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

	search := strings.TrimSpace(strings.ToLower(c.Query("search")))
	status := strings.TrimSpace(strings.ToLower(c.Query("status")))
	now := nowInPH()

	db := database.DB.Where("role = ?", "store")
	if search != "" {
		db = db.Where("LOWER(name) LIKE ?", "%"+search+"%")
	}

	stores := make([]models.User, 0)
	if err := db.Order("name ASC").Find(&stores).Error; err != nil {
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

	storeInfos := make([]StoreInfo, 0, len(stores))
	for _, store := range stores {
		openNow := isOpenNow(store, now)
		if status == "open" && !openNow {
			continue
		}
		if status == "closed" && openNow {
			continue
		}

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
			IsOpen:        openNow,
		})
	}

	sort.Slice(storeInfos, func(i, j int) bool {
		if storeInfos[i].IsOpen == storeInfos[j].IsOpen {
			return strings.ToLower(storeInfos[i].Name) < strings.ToLower(storeInfos[j].Name)
		}
		return storeInfos[i].IsOpen && !storeInfos[j].IsOpen
	})

	c.JSON(http.StatusOK, storeInfos)
}

func isClosedToday(closedDays string, now time.Time) bool {
	if closedDays == "" {
		return false
	}
	day := int(now.Weekday())
	for _, part := range strings.Split(closedDays, ",") {
		p := strings.TrimSpace(part)
		if p == "" {
			continue
		}
		val, err := strconv.Atoi(p)
		if err != nil {
			continue
		}
		if val == day {
			return true
		}
	}
	return false
}

func parseTimeToday(value string, now time.Time) (time.Time, bool) {
	val := strings.TrimSpace(value)
	if val == "" {
		return time.Time{}, false
	}
	parsed, err := time.Parse("15:04", val)
	if err != nil {
		return time.Time{}, false
	}
	return time.Date(now.Year(), now.Month(), now.Day(), parsed.Hour(), parsed.Minute(), 0, 0, now.Location()), true
}

func isOpenNow(u models.User, now time.Time) bool {
	if isClosedToday(u.ClosedDaysOfWeek, now) {
		return false
	}

	opening, hasOpening := parseTimeToday(u.OpeningTime, now)
	closing, hasClosing := parseTimeToday(u.ClosingTime, now)

	if hasOpening && hasClosing {
		openToday := opening
		closeToday := closing
		if !closeToday.After(openToday) {
			closeToday = closeToday.Add(24 * time.Hour)
		}
		if !now.Before(openToday) && now.Before(closeToday) {
			return true
		}
		openPrev := openToday.Add(-24 * time.Hour)
		closePrev := closeToday.Add(-24 * time.Hour)
		if !now.Before(openPrev) && now.Before(closePrev) {
			return true
		}
		return false
	}

	return u.IsOpen
}
