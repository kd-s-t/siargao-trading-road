package handlers

import (
	"net/http"

	"siargao-trading-road/database"
	"siargao-trading-road/models"

	"github.com/gin-gonic/gin"
)

func GetSuppliers(c *gin.Context) {
	role, _ := c.Get("role")

	if role != "store" {
		c.JSON(http.StatusForbidden, gin.H{"error": "only stores can view suppliers"})
		return
	}

	var suppliers []models.User
	if err := database.DB.Where("role = ?", "supplier").Find(&suppliers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch suppliers"})
		return
	}

	type SupplierInfo struct {
		ID           uint   `json:"id"`
		Name         string `json:"name"`
		Email        string `json:"email"`
		Phone        string `json:"phone"`
		Description  string `json:"description"`
		ProductCount int    `json:"product_count"`
		LogoURL      string `json:"logo_url"`
		BannerURL    string `json:"banner_url"`
	}

	var supplierInfos []SupplierInfo
	for _, supplier := range suppliers {
		var productCount int64
		database.DB.Model(&models.Product{}).Where("supplier_id = ?", supplier.ID).Count(&productCount)

		supplierInfos = append(supplierInfos, SupplierInfo{
			ID:           supplier.ID,
			Name:         supplier.Name,
			Email:        supplier.Email,
			Phone:        supplier.Phone,
			Description:  "Siargao Trading Road supplier offering various products",
			ProductCount: int(productCount),
			LogoURL:      supplier.LogoURL,
			BannerURL:    supplier.BannerURL,
		})
	}

	c.JSON(http.StatusOK, supplierInfos)
}

func GetSupplierProducts(c *gin.Context) {
	supplierID := c.Param("id")
	role, _ := c.Get("role")

	if role != "store" {
		c.JSON(http.StatusForbidden, gin.H{"error": "only stores can view supplier products"})
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
