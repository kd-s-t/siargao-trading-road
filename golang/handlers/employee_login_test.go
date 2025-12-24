package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"siargao-trading-road/config"
	"siargao-trading-road/database"
	"siargao-trading-road/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupEmployeeTestDB(t *testing.T) {
	t.Helper()
	dsn := "file:" + t.Name() + "?mode=memory&cache=shared"
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	if err := db.AutoMigrate(&models.User{}, &models.Employee{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	database.DB = db
}

func buildEmployeeRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set("config", &config.Config{JWTSecret: "secret"})
	})
	r.POST("/employee/login", EmployeeLogin)
	return r
}

func TestEmployeeLoginSuccess(t *testing.T) {
	setupEmployeeTestDB(t)
	hashedOwner, _ := bcrypt.GenerateFromPassword([]byte("ownerpass"), bcrypt.DefaultCost)
	owner := models.User{
		Email:    "owner@example.com",
		Password: string(hashedOwner),
		Name:     "Owner",
		Phone:    "123",
		Role:     models.RoleSupplier,
	}
	if err := database.DB.Create(&owner).Error; err != nil {
		t.Fatalf("create owner: %v", err)
	}
	hashedEmp, _ := bcrypt.GenerateFromPassword([]byte("emp-pass"), bcrypt.DefaultCost)
	emp := models.Employee{
		OwnerUserID:        owner.ID,
		Username:           "emp1",
		Password:           string(hashedEmp),
		CanManageInventory: true,
		CanManageOrders:    true,
		CanChat:            true,
		CanChangeStatus:    true,
		StatusActive:       true,
	}
	if err := database.DB.Create(&emp).Error; err != nil {
		t.Fatalf("create employee: %v", err)
	}

	router := buildEmployeeRouter()
	body := `{"owner_email":"owner@example.com","username":"emp1","password":"emp-pass"}`
	req := httptest.NewRequest(http.MethodPost, "/employee/login", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}

	var resp EmployeeAuthResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if resp.Employee.Username != "emp1" || resp.Employee.OwnerUserID != owner.ID {
		t.Fatalf("unexpected employee payload: %+v", resp.Employee)
	}

	token, err := jwt.Parse(resp.Token, func(token *jwt.Token) (interface{}, error) {
		return []byte("secret"), nil
	})
	if err != nil || !token.Valid {
		t.Fatalf("token invalid: %v", err)
	}
	claims := token.Claims.(jwt.MapClaims)
	if claims["is_employee"] != true {
		t.Fatalf("is_employee claim missing")
	}
	if claims["can_manage_inventory"] != true || claims["can_manage_orders"] != true || claims["can_chat"] != true || claims["can_change_status"] != true {
		t.Fatalf("permission claims missing: %+v", claims)
	}
}

func TestEmployeeLoginInactive(t *testing.T) {
	setupEmployeeTestDB(t)
	hashedOwner, _ := bcrypt.GenerateFromPassword([]byte("ownerpass"), bcrypt.DefaultCost)
	owner := models.User{
		Email:    "owner@example.com",
		Password: string(hashedOwner),
		Name:     "Owner",
		Phone:    "123",
		Role:     models.RoleStore,
	}
	if err := database.DB.Create(&owner).Error; err != nil {
		t.Fatalf("create owner: %v", err)
	}
	hashedEmp, _ := bcrypt.GenerateFromPassword([]byte("emp-pass"), bcrypt.DefaultCost)
	emp := models.Employee{
		OwnerUserID:  owner.ID,
		Username:     "emp1",
		Password:     string(hashedEmp),
		StatusActive: false,
	}
	if err := database.DB.Create(&emp).Error; err != nil {
		t.Fatalf("create employee: %v", err)
	}
	if err := database.DB.Model(&emp).Update("status_active", false).Error; err != nil {
		t.Fatalf("deactivate employee: %v", err)
	}

	router := buildEmployeeRouter()
	body := `{"owner_email":"owner@example.com","username":"emp1","password":"emp-pass"}`
	req := httptest.NewRequest(http.MethodPost, "/employee/login", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Fatalf("expected status 403, got %d", w.Code)
	}
}
