package handlers

import (
	"net/http"
	"time"

	"siargao-trading-road/config"
	"siargao-trading-road/database"
	"siargao-trading-road/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type RegisterRequest struct {
	Email      string   `json:"email" binding:"required,email"`
	Password   string   `json:"password" binding:"required,min=6"`
	Name       string   `json:"name" binding:"required"`
	Phone      string   `json:"phone" binding:"required"`
	Role       string   `json:"role" binding:"required"`
	AdminLevel *int     `json:"admin_level,omitempty"`
	LogoURL    string   `json:"logo_url,omitempty"`
	BannerURL  string   `json:"banner_url,omitempty"`
	Address    string   `json:"address,omitempty"`
	Latitude   *float64 `json:"latitude,omitempty"`
	Longitude  *float64 `json:"longitude,omitempty"`
	Facebook   string   `json:"facebook,omitempty"`
	Instagram  string   `json:"instagram,omitempty"`
	Twitter    string   `json:"twitter,omitempty"`
	LinkedIn   string   `json:"linkedin,omitempty"`
	YouTube    string   `json:"youtube,omitempty"`
	TikTok     string   `json:"tiktok,omitempty"`
	Website    string   `json:"website,omitempty"`

	BusinessName    string `json:"business_name,omitempty"`
	TaxID           string `json:"tax_id,omitempty"`
	StoreName       string `json:"store_name,omitempty"`
	BusinessLicense string `json:"business_license,omitempty"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	Token string      `json:"token"`
	User  models.User `json:"user"`
}

func Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Role != string(models.RoleSupplier) && req.Role != string(models.RoleStore) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "role must be 'supplier' or 'store'"})
		return
	}

	var existingUser models.User
	if err := database.DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "email already exists"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	user := models.User{
		Email:     req.Email,
		Password:  string(hashedPassword),
		Name:      req.Name,
		Phone:     req.Phone,
		Role:      models.UserRole(req.Role),
		LogoURL:   req.LogoURL,
		BannerURL: req.BannerURL,
		Address:   req.Address,
		Latitude:  req.Latitude,
		Longitude: req.Longitude,
		Facebook:  req.Facebook,
		Instagram: req.Instagram,
		Twitter:   req.Twitter,
		LinkedIn:  req.LinkedIn,
		YouTube:   req.YouTube,
		TikTok:    req.TikTok,
		Website:   req.Website,
	}

	if err := database.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
		return
	}

	token, err := generateToken(user, c.MustGet("config").(*config.Config))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	user.Password = ""
	c.JSON(http.StatusCreated, AuthResponse{
		Token: token,
		User:  user,
	})
}

func AdminRegisterUser(c *gin.Context) {
	role, _ := c.Get("role")
	adminLevel, _ := c.Get("admin_level")

	if role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "only admin can register users"})
		return
	}

	level := 1
	if adminLevel != nil {
		if l, ok := adminLevel.(float64); ok {
			level = int(l)
		} else if l, ok := adminLevel.(int); ok {
			level = l
		}
	}

	if level > 2 {
		c.JSON(http.StatusForbidden, gin.H{"error": "level 3 admins cannot register users"})
		return
	}

	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Role != string(models.RoleSupplier) && req.Role != string(models.RoleStore) && req.Role != string(models.RoleAdmin) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "role must be 'supplier', 'store', or 'admin'"})
		return
	}

	if req.Role == string(models.RoleAdmin) {
		if level > 1 {
			c.JSON(http.StatusForbidden, gin.H{"error": "only level 1 admins can create admin users"})
			return
		}
		if req.AdminLevel == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "admin_level is required when creating admin users"})
			return
		}
		if *req.AdminLevel < 2 || *req.AdminLevel > 3 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "admin_level must be 2 or 3"})
			return
		}
		if level == 2 && *req.AdminLevel < 3 {
			c.JSON(http.StatusForbidden, gin.H{"error": "level 2 admins can only create level 3 admin users"})
			return
		}
	}

	var existingUser models.User
	if err := database.DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "email already exists"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	user := models.User{
		Email:     req.Email,
		Password:  string(hashedPassword),
		Name:      req.Name,
		Phone:     req.Phone,
		Role:      models.UserRole(req.Role),
		LogoURL:   req.LogoURL,
		BannerURL: req.BannerURL,
		Address:   req.Address,
		Latitude:  req.Latitude,
		Longitude: req.Longitude,
		Facebook:  req.Facebook,
		Instagram: req.Instagram,
		Twitter:   req.Twitter,
		LinkedIn:  req.LinkedIn,
		YouTube:   req.YouTube,
		TikTok:    req.TikTok,
		Website:   req.Website,
	}
	if req.Role == string(models.RoleAdmin) && req.AdminLevel != nil {
		user.AdminLevel = req.AdminLevel
	}

	if err := database.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
		return
	}

	user.Password = ""
	c.JSON(http.StatusCreated, user)
}

func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := database.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}

	now := time.Now()
	user.LastLogin = &now
	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update last login"})
		return
	}

	token, err := generateToken(user, c.MustGet("config").(*config.Config))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	user.Password = ""
	c.JSON(http.StatusOK, AuthResponse{
		Token: token,
		User:  user,
	})
}

func generateToken(user models.User, cfg *config.Config) (string, error) {
	claims := jwt.MapClaims{
		"user_id": user.ID,
		"email":   user.Email,
		"role":    user.Role,
		"exp":     time.Now().Add(time.Hour * 24 * 7).Unix(),
	}
	if user.AdminLevel != nil {
		claims["admin_level"] = *user.AdminLevel
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(cfg.JWTSecret))
}
