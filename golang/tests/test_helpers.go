package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gin-gonic/gin"
	"siargao-trading-road/config"
	"siargao-trading-road/database"
	"siargao-trading-road/handlers"
	"siargao-trading-road/middleware"
)

func setupTestDB(t *testing.T) *config.Config {
	os.Setenv("DB_NAME", "siargao_trading_road_test")
	os.Setenv("JWT_SECRET", "test-secret-key")

	cfg, err := config.Load()
	if err != nil {
		t.Fatalf("Failed to load config: %v", err)
	}

	err = database.Connect(cfg)
	if err != nil {
		t.Fatalf("Failed to connect to database: %v", err)
	}

	database.DB.Exec("TRUNCATE TABLE order_items, orders, products, users CASCADE")

	return cfg
}

func cleanupTestDB(t *testing.T) {
	if database.DB != nil {
		database.DB.Exec("TRUNCATE TABLE order_items, orders, products, users CASCADE")
	}
}

func setupRouter(cfg *config.Config) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	r.Use(func(c *gin.Context) {
		c.Set("config", cfg)
		c.Next()
	})

	api := r.Group("/api")
	{
		api.POST("/register", handlers.Register)
		api.POST("/login", handlers.Login)

		protected := api.Group("/")
		protected.Use(middleware.AuthMiddleware(cfg))
		{
			protected.GET("/me", handlers.GetMe)
			protected.GET("/products", handlers.GetProducts)
			protected.GET("/products/:id", handlers.GetProduct)
			protected.POST("/products", handlers.CreateProduct)
			protected.PUT("/products/:id", handlers.UpdateProduct)
			protected.DELETE("/products/:id", handlers.DeleteProduct)
			protected.POST("/products/:id/restore", handlers.RestoreProduct)
			protected.GET("/orders", handlers.GetOrders)
			protected.GET("/orders/:id", handlers.GetOrder)
			protected.PUT("/orders/:id/status", handlers.UpdateOrderStatus)
			protected.GET("/orders/draft", handlers.GetDraftOrder)
			protected.POST("/orders/draft", handlers.CreateDraftOrder)
			protected.POST("/orders/:id/items", handlers.AddOrderItem)
			protected.PUT("/orders/items/:item_id", handlers.UpdateOrderItem)
			protected.DELETE("/orders/items/:item_id", handlers.RemoveOrderItem)
			protected.GET("/suppliers", handlers.GetSuppliers)
			protected.GET("/suppliers/:id/products", handlers.GetSupplierProducts)
		}
	}

	return r
}

type TestClient struct {
	router *gin.Engine
	token  string
	t      *testing.T
}

func NewTestClient(t *testing.T, cfg *config.Config) *TestClient {
	return &TestClient{
		router: setupRouter(cfg),
		t:      t,
	}
}

func (tc *TestClient) Register(email, password, name, role string) map[string]interface{} {
	phone := fmt.Sprintf("1%09d", len(email)+len(name))
	if len(phone) > 10 {
		phone = phone[:10]
	}
	reqBody := map[string]interface{}{
		"email":    email,
		"password": password,
		"name":     name,
		"phone":    phone,
		"role":     role,
	}

	body, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("POST", "/api/register", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	tc.router.ServeHTTP(w, req)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)

	if w.Code == http.StatusCreated {
		if token, ok := response["token"].(string); ok {
			tc.token = token
		}
	}

	return response
}

func (tc *TestClient) Login(email, password string) map[string]interface{} {
	reqBody := map[string]interface{}{
		"email":    email,
		"password": password,
	}

	body, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("POST", "/api/login", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	tc.router.ServeHTTP(w, req)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)

	if w.Code == http.StatusOK {
		if token, ok := response["token"].(string); ok {
			tc.token = token
		}
	}

	return response
}

func (tc *TestClient) SetToken(token string) {
	tc.token = token
}

func (tc *TestClient) DoRequest(method, path string, body interface{}) *httptest.ResponseRecorder {
	var reqBody []byte
	if body != nil {
		reqBody, _ = json.Marshal(body)
	} else {
		reqBody = []byte{}
	}

	req, _ := http.NewRequest(method, path, bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")
	if tc.token != "" {
		req.Header.Set("Authorization", "Bearer "+tc.token)
	}

	w := httptest.NewRecorder()
	tc.router.ServeHTTP(w, req)
	return w
}

func (tc *TestClient) CreateProduct(product map[string]interface{}) map[string]interface{} {
	w := tc.DoRequest("POST", "/api/products", product)
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	return response
}

func (tc *TestClient) GetProducts() []map[string]interface{} {
	w := tc.DoRequest("GET", "/api/products", nil)
	var products []map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &products)
	return products
}

func (tc *TestClient) GetSuppliers() []map[string]interface{} {
	w := tc.DoRequest("GET", "/api/suppliers", nil)
	var suppliers []map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &suppliers)
	return suppliers
}

func (tc *TestClient) GetSupplierProducts(supplierID uint) []map[string]interface{} {
	w := tc.DoRequest("GET", "/api/suppliers/"+fmt.Sprintf("%d", supplierID)+"/products", nil)
	var products []map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &products)
	return products
}

func (tc *TestClient) CreateDraftOrder(supplierID uint) map[string]interface{} {
	reqBody := map[string]interface{}{
		"supplier_id": supplierID,
	}
	w := tc.DoRequest("POST", "/api/orders/draft", reqBody)
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	return response
}

func (tc *TestClient) GetDraftOrder(supplierID uint) map[string]interface{} {
	path := "/api/orders/draft"
	if supplierID > 0 {
		path += "?supplier_id=" + fmt.Sprintf("%d", supplierID)
	}
	w := tc.DoRequest("GET", path, nil)
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	return response
}

func (tc *TestClient) AddOrderItem(orderID uint, productID uint, quantity int) map[string]interface{} {
	reqBody := map[string]interface{}{
		"product_id": productID,
		"quantity":   quantity,
	}
	w := tc.DoRequest("POST", "/api/orders/"+fmt.Sprintf("%d", orderID)+"/items", reqBody)
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	return response
}

func (tc *TestClient) GetOrders() []map[string]interface{} {
	w := tc.DoRequest("GET", "/api/orders", nil)
	var orders []map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &orders)
	return orders
}

func (tc *TestClient) GetOrder(orderID uint) map[string]interface{} {
	w := tc.DoRequest("GET", "/api/orders/"+fmt.Sprintf("%d", orderID), nil)
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	return response
}

func (tc *TestClient) UpdateOrderStatus(orderID uint, status string) map[string]interface{} {
	reqBody := map[string]interface{}{
		"status": status,
	}
	w := tc.DoRequest("PUT", "/api/orders/"+fmt.Sprintf("%d", orderID)+"/status", reqBody)
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	return response
}

func Float64(v interface{}) float64 {
	switch val := v.(type) {
	case float64:
		return val
	case float32:
		return float64(val)
	case int:
		return float64(val)
	case int64:
		return float64(val)
	default:
		return 0
	}
}

func Uint(v interface{}) uint {
	switch val := v.(type) {
	case uint:
		return val
	case float64:
		return uint(val)
	case int:
		return uint(val)
	case int64:
		return uint(val)
	default:
		return 0
	}
}
