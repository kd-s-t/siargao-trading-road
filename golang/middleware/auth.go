package middleware

import (
	"net/http"
	"strings"

	"siargao-trading-road/config"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "authorization header required"})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization header format"})
			c.Abort()
			return
		}

		tokenString := parts[1]
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(cfg.JWTSecret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token claims"})
			c.Abort()
			return
		}

		c.Set("user_id", claims["user_id"])
		c.Set("email", claims["email"])
		c.Set("role", claims["role"])
		if adminLevel, ok := claims["admin_level"]; ok {
			c.Set("admin_level", adminLevel)
		}
		if isEmployee, ok := claims["is_employee"]; ok {
			c.Set("is_employee", isEmployee)
		}
		if employeeID, ok := claims["employee_id"]; ok {
			c.Set("employee_id", employeeID)
		}
		if val, ok := claims["can_manage_inventory"]; ok {
			c.Set("can_manage_inventory", val)
		}
		if val, ok := claims["can_manage_orders"]; ok {
			c.Set("can_manage_orders", val)
		}
		if val, ok := claims["can_chat"]; ok {
			c.Set("can_chat", val)
		}
		if val, ok := claims["can_change_status"]; ok {
			c.Set("can_change_status", val)
		}
		if val, ok := claims["can_rate"]; ok {
			c.Set("can_rate", val)
		}

		c.Next()
	}
}

func RoleMiddleware(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "role not found"})
			c.Abort()
			return
		}

		roleStr := role.(string)
		for _, allowed := range allowedRoles {
			if roleStr == allowed {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, gin.H{"error": "insufficient permissions"})
		c.Abort()
	}
}
