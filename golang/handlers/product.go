package handlers

import (
	"fmt"
	"log"
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

func logStockChange(productID uint, previousStock int, newStock int, changeType string, userID *uint, employeeID *uint, orderID *uint, notes string) {
	changeAmount := newStock - previousStock
	if changeAmount == 0 {
		return
	}

	if database.DB == nil {
		log.Printf("ERROR: Database connection is nil when trying to create stock history")
		return
	}

	stockHistory := models.StockHistory{
		ProductID:     productID,
		PreviousStock: previousStock,
		NewStock:      newStock,
		ChangeAmount:  changeAmount,
		ChangeType:    changeType,
		OrderID:       orderID,
		UserID:        userID,
		EmployeeID:    employeeID,
		Notes:         notes,
	}

	result := database.DB.Omit("Product", "User", "Employee", "Order").Create(&stockHistory)
	if result.Error != nil {
		log.Printf("ERROR: Failed to create stock history: %v", result.Error)
		log.Printf("ERROR: Stock history details: ProductID=%d, PreviousStock=%d, NewStock=%d, ChangeType=%s, UserID=%v, EmployeeID=%v, OrderID=%v",
			productID, previousStock, newStock, changeType, userID, employeeID, orderID)
		log.Printf("ERROR: SQL Error: %s", result.Error.Error())
		fmt.Printf("STOCK_HISTORY_ERROR: %v\n", result.Error)
	} else {
		log.Printf("SUCCESS: Stock history created: ID=%d, ProductID=%d, ChangeType=%s, ChangeAmount=%d, RowsAffected=%d",
			stockHistory.ID, productID, changeType, changeAmount, result.RowsAffected)
		fmt.Printf("STOCK_HISTORY_SUCCESS: ID=%d, ProductID=%d\n", stockHistory.ID, productID)
	}
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

	if role == "supplier" || role == "store" {
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

	if role == "supplier" || role == "store" {
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
	case "supplier", "store":
		supplierID = userID
	default:
		c.JSON(http.StatusForbidden, gin.H{"error": "only suppliers, stores, and admins can create products"})
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

	if product.StockQuantity > 0 {
		var userIDPtr *uint
		if role != "admin" {
			userIDPtr = &userID
		}
		var employeeIDPtr *uint
		if empCtx.IsEmployee {
			employeeIDPtr = &empCtx.EmployeeID
		}
		logStockChange(product.ID, 0, product.StockQuantity, "initial_stock", userIDPtr, employeeIDPtr, nil, "")
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

	if role == "supplier" || role == "store" {
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

	previousStock := product.StockQuantity
	var userIDPtr *uint
	if role != "admin" {
		userIDPtr = &userID
	}
	var employeeIDPtr *uint
	if empCtx.IsEmployee {
		employeeIDPtr = &empCtx.EmployeeID
	}

	// Employees can only update stock quantity
	if empCtx.IsEmployee {
		if req.StockQuantity != nil {
			product.StockQuantity = *req.StockQuantity
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "employees can only update stock quantity"})
			return
		}
	} else {
		// Owners can update all fields
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
	}

	if err := database.DB.Save(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update product"})
		return
	}

	if req.StockQuantity != nil && previousStock != product.StockQuantity {
		logStockChange(product.ID, previousStock, product.StockQuantity, "manual_adjustment", userIDPtr, employeeIDPtr, nil, "")
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
	if empCtx.IsEmployee {
		c.JSON(http.StatusForbidden, gin.H{"error": "employees cannot delete products"})
		return
	}

	var product models.Product
	query := database.DB.Where("id = ?", id)

	if role == "supplier" || role == "store" {
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

	if role == "supplier" || role == "store" {
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

	var products []models.Product
	if err := database.DB.Where("supplier_id = ?", userID).
		Where("deleted_at IS NULL").
		Where("stock_quantity != 0").
		Find(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch products"})
		return
	}

	var userIDPtr *uint
	if role != "admin" {
		userIDPtr = &userID
	}
	var employeeIDPtr *uint
	if empCtx.IsEmployee {
		employeeIDPtr = &empCtx.EmployeeID
	}

	for _, product := range products {
		previousStock := product.StockQuantity
		logStockChange(product.ID, previousStock, 0, "stock_reset", userIDPtr, employeeIDPtr, nil, "")
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
		} else if role == "supplier" || role == "store" {
			supplierID = userID
		} else {
			errors = append(errors, fmt.Sprintf("Product %d: only suppliers, stores, and admins can create products", i+1))
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

		if product.StockQuantity > 0 {
			var userIDPtr *uint
			if role != "admin" {
				userIDPtr = &userID
			}
			var employeeIDPtr *uint
			if empCtx.IsEmployee {
				employeeIDPtr = &empCtx.EmployeeID
			}
			logStockChange(product.ID, 0, product.StockQuantity, "initial_stock", userIDPtr, employeeIDPtr, nil, "")
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
