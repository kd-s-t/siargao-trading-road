package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"siargao-trading-road/database"
	"siargao-trading-road/models"
)

type CreateProductRequest struct {
	Name         string  `json:"name" binding:"required"`
	Description  string  `json:"description"`
	SKU          string  `json:"sku" binding:"required"`
	Price        float64 `json:"price" binding:"required,min=0"`
	StockQuantity int    `json:"stock_quantity" binding:"min=0"`
	Unit         string  `json:"unit"`
	Category     string  `json:"category"`
	ImageURL     string  `json:"image_url"`
}

type UpdateProductRequest struct {
	Name         string  `json:"name"`
	Description  string  `json:"description"`
	SKU          string  `json:"sku"`
	Price        float64 `json:"price" binding:"omitempty,min=0"`
	StockQuantity *int   `json:"stock_quantity"`
	Unit         string  `json:"unit"`
	Category     string  `json:"category"`
	ImageURL     string  `json:"image_url"`
}

func GetProducts(c *gin.Context) {
	userID, _ := c.Get("user_id")
	role, _ := c.Get("role")
	includeDeleted := c.Query("include_deleted") == "true"

	var products []models.Product
	query := database.DB

	if role == "supplier" {
		query = query.Where("supplier_id = ?", userID)
	}

	if includeDeleted {
		query = query.Unscoped()
	}

	if err := query.Find(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch products"})
		return
	}

	c.JSON(http.StatusOK, products)
}

func GetProduct(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("user_id")
	role, _ := c.Get("role")

	var product models.Product
	query := database.DB.Where("id = ?", id)

	if role == "supplier" {
		query = query.Where("supplier_id = ?", userID)
	}

	if err := query.First(&product).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
		return
	}

	c.JSON(http.StatusOK, product)
}

func CreateProduct(c *gin.Context) {
	userID, _ := c.Get("user_id")
	role, _ := c.Get("role")

	if role != "supplier" {
		c.JSON(http.StatusForbidden, gin.H{"error": "only suppliers can create products"})
		return
	}

	var req CreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var existingProduct models.Product
	if err := database.DB.Where("sku = ?", req.SKU).First(&existingProduct).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "SKU already exists"})
		return
	}

	product := models.Product{
		SupplierID:   userID.(uint),
		Name:         req.Name,
		Description:  req.Description,
		SKU:          req.SKU,
		Price:        req.Price,
		StockQuantity: req.StockQuantity,
		Unit:         req.Unit,
		Category:     req.Category,
		ImageURL:     req.ImageURL,
	}

	if err := database.DB.Create(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create product"})
		return
	}

	c.JSON(http.StatusCreated, product)
}

func UpdateProduct(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("user_id")
	role, _ := c.Get("role")

	var product models.Product
	query := database.DB.Where("id = ?", id)

	if role == "supplier" {
		query = query.Where("supplier_id = ?", userID)
	}

	if err := query.First(&product).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
		return
	}

	var req UpdateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.SKU != "" && req.SKU != product.SKU {
		var existingProduct models.Product
		if err := database.DB.Where("sku = ? AND id != ?", req.SKU, id).First(&existingProduct).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "SKU already exists"})
			return
		}
		product.SKU = req.SKU
	}

	if req.Name != "" {
		product.Name = req.Name
	}
	if req.Description != "" {
		product.Description = req.Description
	}
	if req.Price > 0 {
		product.Price = req.Price
	}
	if req.StockQuantity != nil {
		product.StockQuantity = *req.StockQuantity
	}
	if req.Unit != "" {
		product.Unit = req.Unit
	}
	if req.Category != "" {
		product.Category = req.Category
	}
	if req.ImageURL != "" {
		product.ImageURL = req.ImageURL
	}

	if err := database.DB.Save(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update product"})
		return
	}

	c.JSON(http.StatusOK, product)
}

func DeleteProduct(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("user_id")
	role, _ := c.Get("role")

	var product models.Product
	query := database.DB.Where("id = ?", id)

	if role == "supplier" {
		query = query.Where("supplier_id = ?", userID)
	}

	if err := query.First(&product).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
		return
	}

	if err := database.DB.Delete(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete product"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "product deleted"})
}

func RestoreProduct(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("user_id")
	role, _ := c.Get("role")

	var product models.Product
	query := database.DB.Unscoped().Where("id = ?", id)

	if role == "supplier" {
		query = query.Where("supplier_id = ?", userID)
	}

	if err := query.First(&product).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
		return
	}

	if err := database.DB.Unscoped().Model(&product).Update("deleted_at", nil).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to restore product"})
		return
	}

	c.JSON(http.StatusOK, product)
}

