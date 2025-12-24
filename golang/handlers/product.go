package handlers

import (
	"fmt"
	"net/http"
	"strings"

	"siargao-trading-road/database"
	"siargao-trading-road/models"

	"github.com/gin-gonic/gin"
)

type CreateProductRequest struct {
	Name          string  `json:"name" binding:"required"`
	Description   string  `json:"description"`
	SKU           string  `json:"sku" binding:"required"`
	Price         float64 `json:"price" binding:"required,min=0"`
	StockQuantity int     `json:"stock_quantity" binding:"min=0"`
	Unit          string  `json:"unit"`
	Category      string  `json:"category"`
	ImageURL      string  `json:"image_url"`
	SupplierID    *uint   `json:"supplier_id"`
}

type UpdateProductRequest struct {
	Name          string  `json:"name"`
	Description   string  `json:"description"`
	SKU           string  `json:"sku"`
	Price         float64 `json:"price" binding:"omitempty,min=0"`
	StockQuantity *int    `json:"stock_quantity"`
	Unit          string  `json:"unit"`
	Category      string  `json:"category"`
	ImageURL      string  `json:"image_url"`
}

func GetProducts(c *gin.Context) {
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
	includeDeleted := c.Query("include_deleted") == "true"
	search := strings.TrimSpace(strings.ToLower(c.Query("search")))

	var products []models.Product
	query := database.DB.Preload("Supplier")

	if role == "supplier" {
		query = query.Where("supplier_id = ?", userID)
	}

	if includeDeleted {
		query = query.Unscoped()
	}

	if search != "" {
		query = query.Where("LOWER(name) LIKE ?", "%"+search+"%")
	}

	if err := query.Find(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch products"})
		return
	}

	c.JSON(http.StatusOK, products)
}

func GetProduct(c *gin.Context) {
	id := c.Param("id")
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
	query := database.DB.Preload("Supplier").Where("id = ?", id)

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

	var req CreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var supplierID uint
	switch role {
	case "admin":
		if req.SupplierID == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "supplier_id is required when creating product as admin"})
			return
		}
		var supplier models.User
		if err := database.DB.Where("id = ? AND role = ?", *req.SupplierID, "supplier").First(&supplier).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid supplier_id"})
			return
		}
		supplierID = *req.SupplierID
	case "supplier":
		supplierID = userID
	default:
		c.JSON(http.StatusForbidden, gin.H{"error": "only suppliers and admins can create products"})
		return
	}

	var existingProduct models.Product
	if err := database.DB.Where("sku = ?", req.SKU).First(&existingProduct).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "SKU already exists"})
		return
	}

	product := models.Product{
		SupplierID:    supplierID,
		Name:          req.Name,
		Description:   req.Description,
		SKU:           req.SKU,
		Price:         req.Price,
		StockQuantity: req.StockQuantity,
		Unit:          req.Unit,
		Category:      req.Category,
		ImageURL:      req.ImageURL,
	}

	if err := database.DB.Create(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create product"})
		return
	}

	if err := database.DB.Preload("Supplier").First(&product, product.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load created product"})
		return
	}

	c.JSON(http.StatusCreated, product)
}

func UpdateProduct(c *gin.Context) {
	id := c.Param("id")
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

func ResetProductStocks(c *gin.Context) {
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

	if role != "supplier" {
		c.JSON(http.StatusForbidden, gin.H{"error": "only suppliers can reset stocks"})
		return
	}

	result := database.DB.Model(&models.Product{}).
		Where("supplier_id = ?", userID).
		Where("deleted_at IS NULL").
		Where("stock_quantity != 0").
		Update("stock_quantity", 0)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to reset stocks"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"updated": result.RowsAffected})
}

func BulkCreateProducts(c *gin.Context) {
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

	var req []CreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(req) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no products provided"})
		return
	}

	var createdProducts []models.Product
	var errors []string

	for i, productReq := range req {
		var supplierID uint
		if role == "admin" {
			if productReq.SupplierID == nil {
				errors = append(errors, fmt.Sprintf("Product %d: supplier_id is required", i+1))
				continue
			}
			var supplier models.User
			if err := database.DB.Where("id = ? AND role = ?", *productReq.SupplierID, "supplier").First(&supplier).Error; err != nil {
				errors = append(errors, fmt.Sprintf("Product %d: invalid supplier_id", i+1))
				continue
			}
			supplierID = *productReq.SupplierID
		} else if role == "supplier" {
			supplierID = userID
		} else {
			errors = append(errors, fmt.Sprintf("Product %d: only suppliers and admins can create products", i+1))
			continue
		}

		var existingProduct models.Product
		if err := database.DB.Where("sku = ?", productReq.SKU).First(&existingProduct).Error; err == nil {
			errors = append(errors, fmt.Sprintf("Product %d: SKU %s already exists", i+1, productReq.SKU))
			continue
		}

		product := models.Product{
			SupplierID:    supplierID,
			Name:          productReq.Name,
			Description:   productReq.Description,
			SKU:           productReq.SKU,
			Price:         productReq.Price,
			StockQuantity: productReq.StockQuantity,
			Unit:          productReq.Unit,
			Category:      productReq.Category,
			ImageURL:      productReq.ImageURL,
		}

		if err := database.DB.Create(&product).Error; err != nil {
			errors = append(errors, fmt.Sprintf("Product %d: failed to create - %v", i+1, err))
			continue
		}

		if err := database.DB.Preload("Supplier").First(&product, product.ID).Error; err != nil {
			errors = append(errors, fmt.Sprintf("Product %d: failed to load created product", i+1))
			continue
		}

		createdProducts = append(createdProducts, product)
	}

	if len(errors) > 0 && len(createdProducts) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "failed to create any products",
			"details": errors,
		})
		return
	}

	response := gin.H{
		"created":  len(createdProducts),
		"failed":   len(errors),
		"products": createdProducts,
	}

	if len(errors) > 0 {
		response["errors"] = errors
		c.JSON(http.StatusPartialContent, response)
		return
	}

	c.JSON(http.StatusCreated, response)
}
