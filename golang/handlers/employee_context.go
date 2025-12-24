package handlers

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

type employeeContext struct {
	IsEmployee         bool
	EmployeeID         uint
	CanManageInventory bool
	CanManageOrders    bool
	CanChat            bool
	CanChangeStatus    bool
	CanRate            bool
}

func getEmployeeContext(c *gin.Context) employeeContext {
	ctx := employeeContext{}

	if isEmp, ok := c.Get("is_employee"); ok {
		if b, ok := isEmp.(bool); ok && b {
			ctx.IsEmployee = true
		}
	}

	if ctx.IsEmployee {
		if v, ok := c.Get("employee_id"); ok {
			switch id := v.(type) {
			case uint:
				ctx.EmployeeID = id
			case int:
				ctx.EmployeeID = uint(id)
			case int64:
				ctx.EmployeeID = uint(id)
			case float64:
				ctx.EmployeeID = uint(id)
			}
		}

		ctx.CanManageInventory = getBoolClaim(c, "can_manage_inventory")
		ctx.CanManageOrders = getBoolClaim(c, "can_manage_orders")
		ctx.CanChat = getBoolClaim(c, "can_chat")
		ctx.CanChangeStatus = getBoolClaim(c, "can_change_status")
		ctx.CanRate = getBoolClaim(c, "can_rate")
	}

	return ctx
}

func getBoolClaim(c *gin.Context, key string) bool {
	if v, ok := c.Get(key); ok {
		switch b := v.(type) {
		case bool:
			return b
		case float64:
			return b != 0
		case int:
			return b != 0
		case int64:
			return b != 0
		}
	}
	return false
}

func ensureEmployeePermission(c *gin.Context, allowed bool, name string) bool {
	emp := getEmployeeContext(c)
	if !emp.IsEmployee {
		return true
	}
	if allowed {
		return true
	}
	c.JSON(http.StatusForbidden, gin.H{"error": fmt.Sprintf("insufficient employee permission: %s", name)})
	return false
}
