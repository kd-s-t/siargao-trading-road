package handlers

import (
	"net/http"
	"strconv"

	"siargao-trading-road/database"
	"siargao-trading-road/models"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type EmployeeCreateRequest struct {
	Username           string `json:"username" binding:"required"`
	Password           string `json:"password" binding:"required,min=6"`
	Name               string `json:"name"`
	Phone              string `json:"phone"`
	Role               string `json:"role"`
	CanManageInventory *bool  `json:"can_manage_inventory"`
	CanManageOrders    *bool  `json:"can_manage_orders"`
	CanChat            *bool  `json:"can_chat"`
	CanChangeStatus    *bool  `json:"can_change_status"`
	StatusActive       *bool  `json:"status_active"`
}

type EmployeeUpdateRequest struct {
	Username           *string `json:"username"`
	Password           *string `json:"password" binding:"omitempty,min=6"`
	Name               *string `json:"name"`
	Phone              *string `json:"phone"`
	Role               *string `json:"role"`
	CanManageInventory *bool   `json:"can_manage_inventory"`
	CanManageOrders    *bool   `json:"can_manage_orders"`
	CanChat            *bool   `json:"can_chat"`
	CanChangeStatus    *bool   `json:"can_change_status"`
	StatusActive       *bool   `json:"status_active"`
}

func ListEmployees(c *gin.Context) {
	userID, err := getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}
	role, _ := c.Get("role")
	empCtx := getEmployeeContext(c)
	if empCtx.IsEmployee {
		c.JSON(http.StatusForbidden, gin.H{"error": "employees cannot manage employees"})
		return
	}
	if role != string(models.RoleSupplier) && role != string(models.RoleStore) {
		c.JSON(http.StatusForbidden, gin.H{"error": "only suppliers or stores can list employees"})
		return
	}

	var employees []models.Employee
	if err := database.DB.Where("owner_user_id = ?", userID).Find(&employees).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch employees"})
		return
	}

	for i := range employees {
		employees[i].Password = ""
	}

	c.JSON(http.StatusOK, employees)
}

func CreateEmployee(c *gin.Context) {
	userID, err := getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}
	role, _ := c.Get("role")
	empCtx := getEmployeeContext(c)
	if empCtx.IsEmployee {
		c.JSON(http.StatusForbidden, gin.H{"error": "employees cannot manage employees"})
		return
	}
	if role != string(models.RoleSupplier) && role != string(models.RoleStore) {
		c.JSON(http.StatusForbidden, gin.H{"error": "only suppliers or stores can create employees"})
		return
	}

	var req EmployeeCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var existing models.Employee
	if err := database.DB.Unscoped().Where("owner_user_id = ? AND username = ?", userID, req.Username).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "username already exists for this owner"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	employee := models.Employee{
		OwnerUserID:        userID,
		Username:           req.Username,
		Password:           string(hashedPassword),
		Name:               req.Name,
		Phone:              req.Phone,
		Role:               req.Role,
		CanManageInventory: true,
		CanManageOrders:    true,
		CanChat:            true,
		CanChangeStatus:    true,
		CanRate:            false,
		StatusActive:       true,
	}

	if req.CanManageInventory != nil {
		employee.CanManageInventory = *req.CanManageInventory
	}
	if req.CanManageOrders != nil {
		employee.CanManageOrders = *req.CanManageOrders
	}
	if req.CanChat != nil {
		employee.CanChat = *req.CanChat
	}
	if req.CanChangeStatus != nil {
		employee.CanChangeStatus = *req.CanChangeStatus
	}
	if req.StatusActive != nil {
		employee.StatusActive = *req.StatusActive
	}

	if err := database.DB.Create(&employee).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create employee"})
		return
	}

	employee.Password = ""
	c.JSON(http.StatusCreated, employee)
}

func UpdateEmployee(c *gin.Context) {
	userID, err := getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}
	role, _ := c.Get("role")
	empCtx := getEmployeeContext(c)

	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid employee id"})
		return
	}

	var employee models.Employee

	if empCtx.IsEmployee {
		if empCtx.EmployeeID == 0 {
			c.JSON(http.StatusForbidden, gin.H{"error": "employee context not found"})
			return
		}
		if empCtx.EmployeeID != uint(id) {
			c.JSON(http.StatusForbidden, gin.H{"error": "employees can only update their own profile"})
			return
		}
		if err := database.DB.Where("id = ? AND owner_user_id = ?", empCtx.EmployeeID, userID).First(&employee).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "employee not found"})
			return
		}
	} else {
		if role != string(models.RoleSupplier) && role != string(models.RoleStore) {
			c.JSON(http.StatusForbidden, gin.H{"error": "only suppliers or stores can update employees"})
			return
		}
		if err := database.DB.Where("id = ? AND owner_user_id = ?", id, userID).First(&employee).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "employee not found"})
			return
		}
	}

	var req EmployeeUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Username != nil && *req.Username != employee.Username {
		var existing models.Employee
		if err := database.DB.Unscoped().Where("owner_user_id = ? AND username = ?", userID, *req.Username).First(&existing).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "username already exists for this owner"})
			return
		}
		employee.Username = *req.Username
	}

	if req.Password != nil {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(*req.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
			return
		}
		employee.Password = string(hashedPassword)
	}

	if req.Name != nil {
		employee.Name = *req.Name
	}
	if req.Phone != nil {
		employee.Phone = *req.Phone
	}
	if req.Role != nil {
		employee.Role = *req.Role
	}
	if !empCtx.IsEmployee {
		if req.CanManageInventory != nil {
			employee.CanManageInventory = *req.CanManageInventory
		}
		if req.CanManageOrders != nil {
			employee.CanManageOrders = *req.CanManageOrders
		}
		if req.CanChat != nil {
			employee.CanChat = *req.CanChat
		}
		if req.CanChangeStatus != nil {
			employee.CanChangeStatus = *req.CanChangeStatus
		}
		if req.StatusActive != nil {
			employee.StatusActive = *req.StatusActive
		}
	}

	if err := database.DB.Save(&employee).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update employee"})
		return
	}

	employee.Password = ""
	c.JSON(http.StatusOK, employee)
}

func GetMyEmployee(c *gin.Context) {
	userID, err := getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	empCtx := getEmployeeContext(c)
	if !empCtx.IsEmployee || empCtx.EmployeeID == 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "not an employee"})
		return
	}

	var employee models.Employee
	if err := database.DB.Where("id = ? AND owner_user_id = ?", empCtx.EmployeeID, userID).First(&employee).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "employee not found"})
		return
	}

	employee.Password = ""
	c.JSON(http.StatusOK, employee)
}
