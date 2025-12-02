package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"siargao-trading-road/config"
	"siargao-trading-road/database"
	"siargao-trading-road/middleware"
	"siargao-trading-road/models"
)

func setupOrderTest(t *testing.T) (*gin.Engine, *config.Config, models.User, models.User) {
	gin.SetMode(gin.TestMode)

	cfg := &config.Config{
		JWTSecret: "test-secret-key",
	}

	database.DB.Exec("TRUNCATE TABLE order_items, orders, products, users CASCADE")

	supplier := models.User{
		Email:    "supplier@test.com",
		Password: "hashed",
		Name:     "Test Supplier",
		Role:     models.RoleSupplier,
	}
	database.DB.Create(&supplier)

	store := models.User{
		Email:    "store@test.com",
		Password: "hashed",
		Name:     "Test Store",
		Role:     models.RoleStore,
	}
	database.DB.Create(&store)

	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set("config", cfg)
		c.Next()
	})

	api := r.Group("/api")
	api.Use(middleware.AuthMiddleware(cfg))
	{
		api.GET("/orders", GetOrders)
		api.GET("/orders/:id", GetOrder)
		api.PUT("/orders/:id/status", UpdateOrderStatus)
		api.GET("/orders/draft", GetDraftOrder)
		api.POST("/orders/draft", CreateDraftOrder)
		api.POST("/orders/:id/items", AddOrderItem)
		api.PUT("/orders/items/:item_id", UpdateOrderItem)
		api.DELETE("/orders/items/:item_id", RemoveOrderItem)
	}

	return r, cfg, supplier, store
}

func createTestToken(userID uint, role string, cfg *config.Config) string {
	claims := jwt.MapClaims{
		"user_id": userID,
		"email":   "test@example.com",
		"role":    role,
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, _ := token.SignedString([]byte(cfg.JWTSecret))
	return tokenString
}

func TestCreateDraftOrder(t *testing.T) {
	r, cfg, supplier, store := setupOrderTest(t)

	token := createTestToken(store.ID, "store", cfg)

	reqBody := map[string]interface{}{
		"supplier_id": supplier.ID,
	}

	body, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("POST", "/api/orders/draft", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("Expected status %d, got %d", http.StatusCreated, w.Code)
	}

	var order models.Order
	json.Unmarshal(w.Body.Bytes(), &order)

	if order.Status != models.OrderStatusDraft {
		t.Errorf("Expected status %s, got %s", models.OrderStatusDraft, order.Status)
	}
	if order.SupplierID != supplier.ID {
		t.Errorf("Expected supplier_id %d, got %d", supplier.ID, order.SupplierID)
	}
}

func TestAddOrderItem(t *testing.T) {
	r, cfg, supplier, store := setupOrderTest(t)

	product := models.Product{
		SupplierID:    supplier.ID,
		Name:          "Test Product",
		SKU:           "SKU001",
		Price:         100.00,
		StockQuantity: 50,
	}
	database.DB.Create(&product)

	order := models.Order{
		StoreID:     store.ID,
		SupplierID:  supplier.ID,
		Status:      models.OrderStatusDraft,
		TotalAmount: 0,
	}
	database.DB.Create(&order)

	token := createTestToken(store.ID, "store", cfg)

	reqBody := map[string]interface{}{
		"product_id": product.ID,
		"quantity":   5,
	}

	body, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("POST", fmt.Sprintf("/api/orders/%d/items", order.ID), bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	var updatedOrder models.Order
	json.Unmarshal(w.Body.Bytes(), &updatedOrder)

	if updatedOrder.TotalAmount != 500.00 {
		t.Errorf("Expected total_amount 500.00, got %f", updatedOrder.TotalAmount)
	}
}

func TestUpdateOrderStatus(t *testing.T) {
	r, cfg, supplier, store := setupOrderTest(t)

	order := models.Order{
		StoreID:     store.ID,
		SupplierID:  supplier.ID,
		Status:      models.OrderStatusDraft,
		TotalAmount: 100.00,
	}
	database.DB.Create(&order)

	token := createTestToken(supplier.ID, "supplier", cfg)

	reqBody := map[string]interface{}{
		"status": "preparing",
	}

	body, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("PUT", fmt.Sprintf("/api/orders/%d/status", order.ID), bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	var updatedOrder models.Order
	json.Unmarshal(w.Body.Bytes(), &updatedOrder)

	if updatedOrder.Status != models.OrderStatusPreparing {
		t.Errorf("Expected status %s, got %s", models.OrderStatusPreparing, updatedOrder.Status)
	}
}
