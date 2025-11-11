package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"siargao-trading-road/config"
	"siargao-trading-road/database"
	"siargao-trading-road/models"
)

func setupAuthTest(t *testing.T) (*gin.Engine, *config.Config) {
	gin.SetMode(gin.TestMode)
	
	cfg := &config.Config{
		JWTSecret: "test-secret-key",
	}
	
	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set("config", cfg)
		c.Next()
	})
	
	r.POST("/api/register", Register)
	r.POST("/api/login", Login)
	
	return r, cfg
}

func TestRegister(t *testing.T) {
	r, _ := setupAuthTest(t)
	
	database.DB.Exec("TRUNCATE TABLE users CASCADE")
	
	t.Run("successful registration", func(t *testing.T) {
		reqBody := RegisterRequest{
			Email:    "test@example.com",
			Password: "password123",
			Name:     "Test User",
			Role:     "supplier",
		}
		
		body, _ := json.Marshal(reqBody)
		req, _ := http.NewRequest("POST", "/api/register", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		
		if w.Code != http.StatusCreated {
			t.Errorf("Expected status %d, got %d", http.StatusCreated, w.Code)
		}
		
		var response AuthResponse
		json.Unmarshal(w.Body.Bytes(), &response)
		
		if response.Token == "" {
			t.Error("Expected token in response")
		}
		
		if response.User.Email != reqBody.Email {
			t.Errorf("Expected email %s, got %s", reqBody.Email, response.User.Email)
		}
	})
	
	t.Run("duplicate email", func(t *testing.T) {
		reqBody := RegisterRequest{
			Email:    "test@example.com",
			Password: "password123",
			Name:     "Test User 2",
			Role:     "store",
		}
		
		body, _ := json.Marshal(reqBody)
		req, _ := http.NewRequest("POST", "/api/register", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		
		if w.Code != http.StatusConflict {
			t.Errorf("Expected status %d, got %d", http.StatusConflict, w.Code)
		}
	})
	
	t.Run("invalid role", func(t *testing.T) {
		reqBody := RegisterRequest{
			Email:    "test2@example.com",
			Password: "password123",
			Name:     "Test User",
			Role:     "invalid",
		}
		
		body, _ := json.Marshal(reqBody)
		req, _ := http.NewRequest("POST", "/api/register", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		
		if w.Code != http.StatusBadRequest {
			t.Errorf("Expected status %d, got %d", http.StatusBadRequest, w.Code)
		}
	})
}

func TestLogin(t *testing.T) {
	r, _ := setupAuthTest(t)
	
	database.DB.Exec("TRUNCATE TABLE users CASCADE")
	
	user := models.User{
		Email:    "login@example.com",
		Password: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
		Name:     "Login User",
		Role:     models.RoleSupplier,
	}
	database.DB.Create(&user)
	
	t.Run("successful login", func(t *testing.T) {
		reqBody := LoginRequest{
			Email:    "login@example.com",
			Password: "password123",
		}
		
		body, _ := json.Marshal(reqBody)
		req, _ := http.NewRequest("POST", "/api/login", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		
		if w.Code != http.StatusOK {
			t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
		}
		
		var response AuthResponse
		json.Unmarshal(w.Body.Bytes(), &response)
		
		if response.Token == "" {
			t.Error("Expected token in response")
		}
	})
	
	t.Run("invalid credentials", func(t *testing.T) {
		reqBody := LoginRequest{
			Email:    "login@example.com",
			Password: "wrongpassword",
		}
		
		body, _ := json.Marshal(reqBody)
		req, _ := http.NewRequest("POST", "/api/login", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		
		if w.Code != http.StatusUnauthorized {
			t.Errorf("Expected status %d, got %d", http.StatusUnauthorized, w.Code)
		}
	})
}

