package handlers

import (
	"net/http"
	"strings"
	"time"

	"siargao-trading-road/config"
	"siargao-trading-road/database"
	"siargao-trading-road/models"
	"siargao-trading-road/services"

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

type EmployeeLoginRequest struct {
	OwnerEmail string `json:"owner_email" binding:"required,email"`
	Username   string `json:"username" binding:"required"`
	Password   string `json:"password" binding:"required"`
}

type UnifiedLoginRequest struct {
	EmailOrUsername string `json:"email_or_username" binding:"required"`
	Password        string `json:"password" binding:"required"`
}

type AuthResponse struct {
	Token string      `json:"token"`
	User  models.User `json:"user"`
}

type EmployeeAuthResponse struct {
	Token    string          `json:"token"`
	User     models.User     `json:"user"`
	Employee models.Employee `json:"employee"`
}

func getFeatureFlags(userID uint) []string {
	flags := []string{}
	if err := database.DB.Model(&models.FeatureFlag{}).
		Where("user_id = ?", userID).
		Pluck("flag", &flags).Error; err != nil {
		return []string{}
	}
	return flags
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

	if req.Phone != "" {
		if err := database.DB.Where("phone = ?", req.Phone).First(&existingUser).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "phone already exists"})
			return
		}
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

	cfg := c.MustGet("config").(*config.Config)
	emailService := services.NewEmailService(cfg)
	if emailService != nil {
		go emailService.SendThankYouEmail(user)
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

	if req.Phone != "" {
		if err := database.DB.Where("phone = ?", req.Phone).First(&existingUser).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "phone already exists"})
			return
		}
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
	c.JSON(http.StatusCreated, AuthResponse{
		Token: "",
		User:  user,
	})
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

func UnifiedLogin(c *gin.Context) {
	var req UnifiedLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	emailOrUsername := req.EmailOrUsername
	password := req.Password

	if strings.Contains(emailOrUsername, "@") {
		var user models.User
		if err := database.DB.Where("email = ?", emailOrUsername).First(&user).Error; err == nil {
			if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err == nil {
				now := time.Now()
				user.LastLogin = &now
				database.DB.Save(&user)

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
				return
			}
		}
	} else {
		var employee models.Employee
		var owner models.User
		if err := database.DB.Where("username = ?", emailOrUsername).First(&employee).Error; err == nil {
			if err := database.DB.Where("id = ? AND role IN ?", employee.OwnerUserID, []models.UserRole{models.RoleSupplier, models.RoleStore}).First(&owner).Error; err == nil {
				if employee.StatusActive {
					if err := bcrypt.CompareHashAndPassword([]byte(employee.Password), []byte(password)); err == nil {
						// Set employee_id and user_id in context for audit logging
						c.Set("employee_id", employee.ID)
						c.Set("user_id", owner.ID)
						c.Set("role", string(owner.Role))

						token, err := generateEmployeeToken(owner, employee, c.MustGet("config").(*config.Config))
						if err != nil {
							c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
							return
						}

						employee.Password = ""
						owner.Password = ""

						c.JSON(http.StatusOK, EmployeeAuthResponse{
							Token:    token,
							User:     owner,
							Employee: employee,
						})
						return
					}
				}
			}
		}
	}

	c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
}

func EmployeeLogin(c *gin.Context) {
	var req EmployeeLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var owner models.User
	if err := database.DB.Where("email = ? AND role IN ?", req.OwnerEmail, []models.UserRole{models.RoleSupplier, models.RoleStore}).First(&owner).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	var employee models.Employee
	if err := database.DB.Where("owner_user_id = ? AND username = ?", owner.ID, req.Username).First(&employee).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	if !employee.StatusActive {
		c.JSON(http.StatusForbidden, gin.H{"error": "employee account is inactive"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(employee.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	// Set employee_id and user_id in context for audit logging
	c.Set("employee_id", employee.ID)
	c.Set("user_id", owner.ID)
	c.Set("role", string(owner.Role))

	token, err := generateEmployeeToken(owner, employee, c.MustGet("config").(*config.Config))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	employee.Password = ""
	owner.Password = ""

	c.JSON(http.StatusOK, EmployeeAuthResponse{
		Token:    token,
		User:     owner,
		Employee: employee,
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

func generateEmployeeToken(owner models.User, employee models.Employee, cfg *config.Config) (string, error) {
	claims := jwt.MapClaims{
		"user_id":              owner.ID,
		"email":                owner.Email,
		"role":                 owner.Role,
		"is_employee":          true,
		"employee_id":          employee.ID,
		"can_manage_inventory": employee.CanManageInventory,
		"can_manage_orders":    employee.CanManageOrders,
		"can_chat":             employee.CanChat,
		"can_change_status":    employee.CanChangeStatus,
		"can_rate":             employee.CanRate,
		"exp":                  time.Now().Add(time.Hour * 24 * 7).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(cfg.JWTSecret))
}
