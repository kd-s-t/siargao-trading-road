package handlers

import (
	"errors"
	"fmt"
	"log"
	"net/http"
	"time"

	"siargao-trading-road/database"
	"siargao-trading-road/models"

	"github.com/gin-gonic/gin"
)

func getUserID(c *gin.Context) (uint, error) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		return 0, errors.New("user not authenticated")
	}

	switch v := userIDVal.(type) {
	case uint:
		return v, nil
	case float64:
		return uint(v), nil
	case int:
		return uint(v), nil
	case int64:
		return uint(v), nil
	default:
		return 0, fmt.Errorf("invalid user ID type: %T", v)
	}
}

func GetOrders(c *gin.Context) {
	userID, _ := c.Get("user_id")
	role, _ := c.Get("role")
	status := c.Query("status")

	var orders []models.Order
	query := database.DB.Preload("Store").Preload("Supplier").Preload("OrderItems").Preload("OrderItems.Product")

	if status != "" {
		query = query.Where("status = ?", status)
	} else {
		query = query.Where("status != ?", "draft")
	}

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

	var ratings []models.Rating
	if err := database.DB.Preload("Rater").Preload("Rated").Where("order_id = ?", order.ID).Find(&ratings).Error; err != nil {
		log.Printf("Error fetching ratings for order %d: %v", order.ID, err)
		ratings = []models.Rating{} // Ensure it's always an array, not nil
	}

	log.Printf("GetOrder: order %d has %d ratings", order.ID, len(ratings))

	orderResponse := gin.H{
		"id":                order.ID,
		"store_id":          order.StoreID,
		"supplier_id":       order.SupplierID,
		"store":             order.Store,
		"supplier":          order.Supplier,
		"status":            order.Status,
		"total_amount":      order.TotalAmount,
		"payment_method":    order.PaymentMethod,
		"payment_status":    order.PaymentStatus,
		"payment_proof_url": order.PaymentProofURL,
		"delivery_option":   order.DeliveryOption,
		"delivery_fee":      order.DeliveryFee,
		"distance":          order.Distance,
		"shipping_address":  order.ShippingAddress,
		"notes":             order.Notes,
		"order_items":       order.OrderItems,
		"created_at":        order.CreatedAt,
		"updated_at":        order.UpdatedAt,
		"ratings":           ratings,
	}

	c.JSON(http.StatusOK, orderResponse)
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

	if req.Status == "delivered" && order.Status != "in_transit" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "order must be in transit before it can be marked as delivered"})
		return
	}

	if req.Status == "in_transit" && order.Status != "preparing" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "order must be preparing before it can be marked as in transit"})
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
	userID, err := getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

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

	var existingOrder models.Order
	if err := database.DB.Where("store_id = ? AND supplier_id = ? AND status = ?", userID, req.SupplierID, "draft").First(&existingOrder).Error; err == nil {
		database.DB.Preload("Store").Preload("Supplier").Preload("OrderItems").Preload("OrderItems.Product").First(&existingOrder, existingOrder.ID)
		c.JSON(http.StatusOK, existingOrder)
		return
	}

	order := models.Order{
		StoreID:     userID,
		SupplierID:  req.SupplierID,
		Status:      models.OrderStatusDraft,
		TotalAmount: 0,
	}

	log.Printf("Creating draft order: store_id=%d, supplier_id=%d", userID, req.SupplierID)

	if err := database.DB.Create(&order).Error; err != nil {
		log.Printf("Error creating order: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create order", "details": err.Error()})
		return
	}

	log.Printf("Order created successfully: id=%d", order.ID)

	if err := database.DB.Preload("Store").Preload("Supplier").Preload("OrderItems").Preload("OrderItems.Product").First(&order, order.ID).Error; err != nil {
		log.Printf("Error loading order details: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load order details", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, order)
}

func AddOrderItem(c *gin.Context) {
	orderID := c.Param("id")
	userID, err := getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

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
	var totalQuantity int
	if err := database.DB.Where("order_id = ? AND product_id = ?", orderID, req.ProductID).First(&existingItem).Error; err == nil {
		totalQuantity = existingItem.Quantity + req.Quantity
	} else {
		totalQuantity = req.Quantity
	}

	if totalQuantity > product.StockQuantity {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": fmt.Sprintf("insufficient stock: only %d %s available", product.StockQuantity, product.Unit),
		})
		return
	}

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

	product.StockQuantity -= req.Quantity
	if err := database.DB.Save(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update product stock"})
		return
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
	userID, err := getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}
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

	if orderItem.Order.StoreID != userID || orderItem.Order.Status != "draft" {
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

	var product models.Product
	if err := database.DB.First(&product, orderItem.ProductID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
		return
	}

	quantityDiff := req.Quantity - orderItem.Quantity
	newStock := product.StockQuantity - quantityDiff

	if newStock < 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": fmt.Sprintf("insufficient stock: only %d %s available", product.StockQuantity+orderItem.Quantity, product.Unit),
		})
		return
	}

	product.StockQuantity = newStock
	if err := database.DB.Save(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update product stock"})
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
	userID, err := getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

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

	if orderItem.Order.StoreID != userID || orderItem.Order.Status != "draft" {
		c.JSON(http.StatusForbidden, gin.H{"error": "cannot remove this order item"})
		return
	}

	var product models.Product
	if err := database.DB.First(&product, orderItem.ProductID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
		return
	}

	product.StockQuantity += orderItem.Quantity
	if err := database.DB.Save(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to restore product stock"})
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

func SubmitOrder(c *gin.Context) {
	orderID := c.Param("id")
	userID, err := getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	role, _ := c.Get("role")

	if role != "store" {
		c.JSON(http.StatusForbidden, gin.H{"error": "only stores can submit orders"})
		return
	}

	var order models.Order
	if err := database.DB.Preload("OrderItems").Where("id = ? AND store_id = ? AND status = ?", orderID, userID, "draft").First(&order).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "draft order not found"})
		return
	}

	if len(order.OrderItems) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot submit order with no items"})
		return
	}

	var req struct {
		PaymentMethod   string  `json:"payment_method" binding:"required"`
		DeliveryOption  string  `json:"delivery_option" binding:"required"`
		DeliveryFee     float64 `json:"delivery_fee"`
		Distance        float64 `json:"distance"`
		ShippingAddress string  `json:"shipping_address"`
		PaymentProofURL string  `json:"payment_proof_url"`
		Notes           string  `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	validPaymentMethods := map[string]bool{
		"cash_on_delivery": true,
		"gcash":            true,
	}

	validDeliveryOptions := map[string]bool{
		"pickup":  true,
		"deliver": true,
	}

	if !validPaymentMethods[req.PaymentMethod] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payment method"})
		return
	}

	if !validDeliveryOptions[req.DeliveryOption] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid delivery option"})
		return
	}

	var subtotal float64
	for _, item := range order.OrderItems {
		subtotal += item.Subtotal
	}

	const minimumOrderAmount = 5000.0
	if subtotal < minimumOrderAmount {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": fmt.Sprintf("minimum order amount is ₱%.2f. Current total: ₱%.2f", minimumOrderAmount, subtotal),
		})
		return
	}

	var store models.User
	if err := database.DB.First(&store, order.StoreID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "store not found"})
		return
	}

	if req.PaymentMethod == "gcash" {
		if req.PaymentProofURL == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "payment proof is required for GCash payment"})
			return
		}
		order.PaymentStatus = models.PaymentStatusPending
		order.PaymentProofURL = req.PaymentProofURL
	} else {
		order.PaymentStatus = models.PaymentStatusPaid
	}

	order.Status = models.OrderStatusPreparing
	order.PaymentMethod = models.PaymentMethod(req.PaymentMethod)
	order.DeliveryOption = models.DeliveryOption(req.DeliveryOption)
	order.DeliveryFee = req.DeliveryFee
	order.Distance = req.Distance
	order.TotalAmount = subtotal + req.DeliveryFee
	if req.DeliveryOption == "deliver" {
		if req.ShippingAddress == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "shipping address is required when delivery option is 'deliver'"})
			return
		}
		order.ShippingAddress = req.ShippingAddress
	}
	if req.Notes != "" {
		order.Notes = req.Notes
	}

	if err := database.DB.Save(&order).Error; err != nil {
		log.Printf("Error submitting order: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to submit order", "details": err.Error()})
		return
	}

	log.Printf("Order submitted successfully: id=%d", order.ID)

	if err := database.DB.Preload("Store").Preload("Supplier").Preload("OrderItems").Preload("OrderItems.Product").First(&order, order.ID).Error; err != nil {
		log.Printf("Error loading order details: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load order details", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, order)
}

func MarkPaymentAsPaid(c *gin.Context) {
	orderID := c.Param("id")
	userID, err := getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	role, _ := c.Get("role")
	if role != "supplier" {
		c.JSON(http.StatusForbidden, gin.H{"error": "only suppliers can mark payment as paid"})
		return
	}

	var order models.Order
	if err := database.DB.Where("id = ? AND supplier_id = ?", orderID, userID).First(&order).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "order not found or access denied"})
		return
	}

	if order.PaymentMethod != models.PaymentMethodGCash {
		c.JSON(http.StatusBadRequest, gin.H{"error": "payment confirmation is only applicable for GCash orders"})
		return
	}

	if order.PaymentStatus == models.PaymentStatusPaid {
		c.JSON(http.StatusBadRequest, gin.H{"error": "payment is already marked as paid"})
		return
	}

	order.PaymentStatus = models.PaymentStatusPaid
	if err := database.DB.Save(&order).Error; err != nil {
		log.Printf("MarkPaymentAsPaid: failed to update payment status. orderID=%s, userID=%d, error=%v", orderID, userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update payment status", "details": err.Error()})
		return
	}

	if err := database.DB.Preload("Store").Preload("Supplier").Preload("OrderItems").Preload("OrderItems.Product").First(&order, order.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load order details"})
		return
	}

	log.Printf("MarkPaymentAsPaid: payment marked as paid. orderID=%s, userID=%d", orderID, userID)
	c.JSON(http.StatusOK, order)
}

func GetDraftOrder(c *gin.Context) {
	userID, err := getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

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

func GetOrderMessages(c *gin.Context) {
	orderIDStr := c.Param("id")
	var orderID uint
	if _, err := fmt.Sscanf(orderIDStr, "%d", &orderID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid order ID"})
		return
	}
	userID, err := getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}
	role, _ := c.Get("role")

	var order models.Order
	query := database.DB.Where("id = ?", orderID)

	if role == "supplier" {
		query = query.Where("supplier_id = ?", userID)
	} else if role == "store" {
		query = query.Where("store_id = ?", userID)
	} else {
		c.JSON(http.StatusForbidden, gin.H{"error": "only suppliers and stores can view messages"})
		return
	}

	if err := query.First(&order).Error; err != nil {
		log.Printf("GetOrderMessages: order not found or access denied. orderID=%d, userID=%d, role=%s, error=%v", orderID, userID, role, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "order not found"})
		return
	}

	var messages []models.Message
	if err := database.DB.Preload("Sender").
		Where("order_id = ?", orderID).
		Order("created_at ASC").
		Find(&messages).Error; err != nil {
		log.Printf("GetOrderMessages: failed to fetch messages. orderID=%d, error=%v", orderID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch messages"})
		return
	}

	log.Printf("GetOrderMessages: found %d messages for orderID=%d", len(messages), orderID)
	c.JSON(http.StatusOK, messages)
}

func CreateOrderMessage(c *gin.Context) {
	orderID := c.Param("id")
	userID, err := getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	role, _ := c.Get("role")

	var order models.Order
	query := database.DB.Where("id = ?", orderID)

	if role == "supplier" {
		query = query.Where("supplier_id = ?", userID)
	} else if role == "store" {
		query = query.Where("store_id = ?", userID)
	} else {
		log.Printf("CreateOrderMessage: invalid role. orderID=%s, userID=%d, role=%s", orderID, userID, role)
		c.JSON(http.StatusForbidden, gin.H{"error": "only suppliers and stores can send messages"})
		return
	}

	if err := query.First(&order).Error; err != nil {
		log.Printf("CreateOrderMessage: order not found or access denied. orderID=%s, userID=%d, role=%s, error=%v", orderID, userID, role, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "order not found or access denied"})
		return
	}

	if order.Status == models.OrderStatusDelivered {
		now := time.Now()
		hoursSinceDelivery := now.Sub(order.UpdatedAt).Hours()
		if hoursSinceDelivery >= 12 {
			c.JSON(http.StatusForbidden, gin.H{"error": "messaging is closed. order was delivered more than 12 hours ago"})
			return
		}
	}

	var req struct {
		Content  string `json:"content"`
		ImageURL string `json:"image_url"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.ImageURL == "" && req.Content == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "message must have either content or an image"})
		return
	}

	if req.Content != "" && len(req.Content) > 5000 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "message content must be between 1 and 5000 characters"})
		return
	}

	message := models.Message{
		OrderID:  order.ID,
		SenderID: userID,
		Content:  req.Content,
		ImageURL: req.ImageURL,
	}

	if err := database.DB.Create(&message).Error; err != nil {
		log.Printf("CreateOrderMessage: failed to create message. orderID=%s, userID=%d, error=%v", orderID, userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create message", "details": err.Error()})
		return
	}

	if err := database.DB.Preload("Sender").First(&message, message.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load created message"})
		return
	}

	c.JSON(http.StatusCreated, message)
}
