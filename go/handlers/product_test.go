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

func setupProductTest(t *testing.T) (*gin.Engine, *config.Config, models.User) {
	gin.SetMode(gin.TestMode)
	
	cfg := &config.Config{
		JWTSecret: "test-secret-key",
	}
	
	database.DB.Exec("TRUNCATE TABLE products, users CASCADE")
	
	supplier := models.User{
		Email:    "supplier@test.com",
		Password: "hashed",
		Name:     "Test Supplier",
		Role:     models.RoleSupplier,
	}
	database.DB.Create(&supplier)
	
	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set("config", cfg)
		c.Next()
	})
	
	api := r.Group("/api")
	api.Use(middleware.AuthMiddleware(cfg))
	{
		api.GET("/products", GetProducts)
		api.GET("/products/:id", GetProduct)
		api.POST("/products", CreateProduct)
		api.PUT("/products/:id", UpdateProduct)
		api.DELETE("/products/:id", DeleteProduct)
	}
	
	return r, cfg, supplier
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

func TestCreateProduct(t *testing.T) {
	r, cfg, supplier := setupProductTest(t)
	
	token := createTestToken(supplier.ID, "supplier", cfg)
	
	t.Run("successful creation", func(t *testing.T) {
		reqBody := CreateProductRequest{
			Name:          "Test Product",
			Description:   "Test Description",
			SKU:           "SKU001",
			Price:         100.50,
			StockQuantity: 50,
			Unit:          "piece",
			Category:      "test",
		}
		
		body, _ := json.Marshal(reqBody)
		req, _ := http.NewRequest("POST", "/api/products", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)
		
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		
		if w.Code != http.StatusCreated {
			t.Errorf("Expected status %d, got %d", http.StatusCreated, w.Code)
		}
		
		var product models.Product
		json.Unmarshal(w.Body.Bytes(), &product)
		
		if product.Name != reqBody.Name {
			t.Errorf("Expected name %s, got %s", reqBody.Name, product.Name)
		}
		if product.Price != reqBody.Price {
			t.Errorf("Expected price %f, got %f", reqBody.Price, product.Price)
		}
	})
	
	t.Run("duplicate SKU", func(t *testing.T) {
		reqBody := CreateProductRequest{
			Name:          "Another Product",
			SKU:           "SKU001",
			Price:         200.00,
			StockQuantity: 30,
		}
		
		body, _ := json.Marshal(reqBody)
		req, _ := http.NewRequest("POST", "/api/products", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)
		
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		
		if w.Code != http.StatusConflict {
			t.Errorf("Expected status %d, got %d", http.StatusConflict, w.Code)
		}
	})
}

func TestGetProducts(t *testing.T) {
	r, cfg, supplier := setupProductTest(t)
	
	product := models.Product{
		SupplierID:   supplier.ID,
		Name:         "Test Product",
		SKU:          "SKU002",
		Price:        100.00,
		StockQuantity: 50,
	}
	database.DB.Create(&product)
	
	token := createTestToken(supplier.ID, "supplier", cfg)
	
	req, _ := http.NewRequest("GET", "/api/products", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	
	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}
	
	var products []models.Product
	json.Unmarshal(w.Body.Bytes(), &products)
	
	if len(products) != 1 {
		t.Errorf("Expected 1 product, got %d", len(products))
	}
}

func TestUpdateProduct(t *testing.T) {
	r, cfg, supplier := setupProductTest(t)
	
	product := models.Product{
		SupplierID:   supplier.ID,
		Name:         "Original Product",
		SKU:          "SKU003",
		Price:        100.00,
		StockQuantity: 50,
	}
	database.DB.Create(&product)
	
	token := createTestToken(supplier.ID, "supplier", cfg)
	
	reqBody := UpdateProductRequest{
		Name:         "Updated Product",
		Price:        150.00,
		StockQuantity: intPtr(75),
	}
	
	body, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("PUT", fmt.Sprintf("/api/products/%d", product.ID), bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	
	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}
	
	var updatedProduct models.Product
	json.Unmarshal(w.Body.Bytes(), &updatedProduct)
	
	if updatedProduct.Name != reqBody.Name {
		t.Errorf("Expected name %s, got %s", reqBody.Name, updatedProduct.Name)
	}
}

func intPtr(i int) *int {
	return &i
}

