package handlers

import (
	"net/http"

	"siargao-trading-road/database"
	"siargao-trading-road/models"

	"github.com/gin-gonic/gin"
)

func GetOrders(c *gin.Context) {
	userID, _ := c.Get("user_id")
	role, _ := c.Get("role")

	var orders []models.Order
	query := database.DB.Preload("Store").Preload("OrderItems").Preload("OrderItems.Product").
		Where("status != ?", "draft")

	if role == "supplier" {
		query = query.Where("supplier_id = ?", userID)
	} else if role == "store" {
		query = query.Where("store_id = ?", userID)
	}

	if err := query.Order("created_at DESC").Find(&orders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch orders"})
		return
	}

	c.JSON(http.StatusOK, orders)
}

func GetOrder(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("user_id")
	role, _ := c.Get("role")

	var order models.Order
	query := database.DB.Preload("Store").Preload("OrderItems").Preload("OrderItems.Product").Where("id = ?", id)

	if role == "supplier" {
		query = query.Where("supplier_id = ?", userID)
	} else if role == "store" {
		query = query.Where("store_id = ?", userID)
	}

	if err := query.First(&order).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "order not found"})
		return
	}

	c.JSON(http.StatusOK, order)
}

func UpdateOrderStatus(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("user_id")
	role, _ := c.Get("role")

	var order models.Order
	query := database.DB.Where("id = ?", id)

	if role == "supplier" {
		query = query.Where("supplier_id = ?", userID)
	} else if role == "store" {
		query = query.Where("store_id = ?", userID)
	}

	if err := query.First(&order).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "order not found"})
		return
	}

	var req struct {
		Status string `json:"status" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	validStatuses := map[string]bool{
		"draft":      true,
		"preparing":  true,
		"in_transit": true,
		"delivered":  true,
		"cancelled":  true,
	}

	if !validStatuses[req.Status] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid status"})
		return
	}

	order.Status = models.OrderStatus(req.Status)

	if err := database.DB.Save(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update order status"})
		return
	}

	database.DB.Preload("Store").Preload("OrderItems").Preload("OrderItems.Product").First(&order, order.ID)

	c.JSON(http.StatusOK, order)
}

func CreateDraftOrder(c *gin.Context) {
	userID, _ := c.Get("user_id")
	role, _ := c.Get("role")

	if role != "store" {
		c.JSON(http.StatusForbidden, gin.H{"error": "only stores can create orders"})
		return
	}

	var req struct {
		SupplierID uint `json:"supplier_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var supplier models.User
	if err := database.DB.Where("id = ? AND role = ?", req.SupplierID, "supplier").First(&supplier).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "supplier not found"})
		return
	}

	order := models.Order{
		StoreID:     userID.(uint),
		SupplierID:  req.SupplierID,
		Status:      models.OrderStatusDraft,
		TotalAmount: 0,
	}

	if err := database.DB.Create(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create order"})
		return
	}

	database.DB.Preload("Store").Preload("Supplier").Preload("OrderItems").Preload("OrderItems.Product").First(&order, order.ID)

	c.JSON(http.StatusCreated, order)
}

func AddOrderItem(c *gin.Context) {
	orderID := c.Param("id")
	userID, _ := c.Get("user_id")
	role, _ := c.Get("role")

	if role != "store" {
		c.JSON(http.StatusForbidden, gin.H{"error": "only stores can add items to orders"})
		return
	}

	var order models.Order
	if err := database.DB.Where("id = ? AND store_id = ? AND status = ?", orderID, userID, "draft").First(&order).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "draft order not found"})
		return
	}

	var req struct {
		ProductID uint `json:"product_id" binding:"required"`
		Quantity  int  `json:"quantity" binding:"required,min=1"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var product models.Product
	if err := database.DB.Where("id = ? AND supplier_id = ?", req.ProductID, order.SupplierID).First(&product).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
		return
	}

	var existingItem models.OrderItem
	if err := database.DB.Where("order_id = ? AND product_id = ?", orderID, req.ProductID).First(&existingItem).Error; err == nil {
		existingItem.Quantity += req.Quantity
		existingItem.Subtotal = float64(existingItem.Quantity) * existingItem.UnitPrice
		database.DB.Save(&existingItem)
	} else {
		orderItem := models.OrderItem{
			OrderID:   order.ID,
			ProductID: req.ProductID,
			Quantity:  req.Quantity,
			UnitPrice: product.Price,
			Subtotal:  product.Price * float64(req.Quantity),
		}
		database.DB.Create(&orderItem)
	}

	var totalAmount float64
	database.DB.Model(&models.OrderItem{}).Where("order_id = ?", orderID).Select("COALESCE(SUM(subtotal), 0)").Scan(&totalAmount)
	order.TotalAmount = totalAmount
	database.DB.Save(&order)

	database.DB.Preload("Store").Preload("Supplier").Preload("OrderItems").Preload("OrderItems.Product").First(&order, order.ID)

	c.JSON(http.StatusOK, order)
}

func UpdateOrderItem(c *gin.Context) {
	itemID := c.Param("item_id")
	userID, _ := c.Get("user_id")
	role, _ := c.Get("role")

	if role != "store" {
		c.JSON(http.StatusForbidden, gin.H{"error": "only stores can update order items"})
		return
	}

	var orderItem models.OrderItem
	if err := database.DB.Preload("Order").First(&orderItem, itemID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "order item not found"})
		return
	}

	if orderItem.Order.StoreID != userID.(uint) || orderItem.Order.Status != "draft" {
		c.JSON(http.StatusForbidden, gin.H{"error": "cannot update this order item"})
		return
	}

	var req struct {
		Quantity int `json:"quantity" binding:"required,min=1"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	orderItem.Quantity = req.Quantity
	orderItem.Subtotal = orderItem.UnitPrice * float64(req.Quantity)
	database.DB.Save(&orderItem)

	var totalAmount float64
	database.DB.Model(&models.OrderItem{}).Where("order_id = ?", orderItem.OrderID).Select("COALESCE(SUM(subtotal), 0)").Scan(&totalAmount)
	orderItem.Order.TotalAmount = totalAmount
	database.DB.Save(&orderItem.Order)

	database.DB.Preload("Store").Preload("Supplier").Preload("OrderItems").Preload("OrderItems.Product").First(&orderItem.Order, orderItem.OrderID)

	c.JSON(http.StatusOK, orderItem.Order)
}

func RemoveOrderItem(c *gin.Context) {
	itemID := c.Param("item_id")
	userID, _ := c.Get("user_id")
	role, _ := c.Get("role")

	if role != "store" {
		c.JSON(http.StatusForbidden, gin.H{"error": "only stores can remove order items"})
		return
	}

	var orderItem models.OrderItem
	if err := database.DB.Preload("Order").First(&orderItem, itemID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "order item not found"})
		return
	}

	if orderItem.Order.StoreID != userID.(uint) || orderItem.Order.Status != "draft" {
		c.JSON(http.StatusForbidden, gin.H{"error": "cannot remove this order item"})
		return
	}

	orderID := orderItem.OrderID
	database.DB.Delete(&orderItem)

	var totalAmount float64
	database.DB.Model(&models.OrderItem{}).Where("order_id = ?", orderID).Select("COALESCE(SUM(subtotal), 0)").Scan(&totalAmount)
	orderItem.Order.TotalAmount = totalAmount
	database.DB.Save(&orderItem.Order)

	c.JSON(http.StatusOK, gin.H{"message": "item removed"})
}

func GetDraftOrder(c *gin.Context) {
	userID, _ := c.Get("user_id")
	role, _ := c.Get("role")
	supplierID := c.Query("supplier_id")

	if role != "store" {
		c.JSON(http.StatusForbidden, gin.H{"error": "only stores can view draft orders"})
		return
	}

	var order models.Order
	query := database.DB.Preload("Store").Preload("Supplier").Preload("OrderItems").Preload("OrderItems.Product").
		Where("store_id = ? AND status = ?", userID, "draft")

	if supplierID != "" {
		query = query.Where("supplier_id = ?", supplierID)
	}

	if err := query.First(&order).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "draft order not found"})
		return
	}

	c.JSON(http.StatusOK, order)
}

func SendInvoiceEmail(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("user_id")
	role, _ := c.Get("role")

	var order models.Order
	query := database.DB.Preload("Store").Preload("Supplier").Preload("OrderItems").Preload("OrderItems.Product").Where("id = ?", id)

	if role == "supplier" {
		query = query.Where("supplier_id = ?", userID)
	} else if role == "store" {
		query = query.Where("store_id = ?", userID)
	}

	if err := query.First(&order).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "order not found"})
		return
	}

	if order.Store.Email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "store email not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Invoice email sent successfully",
		"to":      order.Store.Email,
	})
}
