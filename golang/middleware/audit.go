package middleware

import (
	"bytes"
	"io"
	"log"
	"siargao-trading-road/database"
	"siargao-trading-road/models"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type responseBodyWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
}

func (w responseBodyWriter) Write(b []byte) (int, error) {
	w.body.Write(b)
	return w.ResponseWriter.Write(b)
}

func AuditLogMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		startTime := time.Now()

		var userID *uint
		var employeeID *uint
		var role string
		if uid, exists := c.Get("user_id"); exists {
			if id, ok := uid.(uint); ok {
				userID = &id
			} else if idFloat, ok := uid.(float64); ok {
				id := uint(idFloat)
				userID = &id
			}
		}
		if eid, exists := c.Get("employee_id"); exists {
			if id, ok := eid.(uint); ok {
				employeeID = &id
			} else if idFloat, ok := eid.(float64); ok {
				id := uint(idFloat)
				employeeID = &id
			} else if idInt, ok := eid.(int); ok {
				id := uint(idInt)
				employeeID = &id
			}
		}
		if r, exists := c.Get("role"); exists {
			if roleStr, ok := r.(string); ok {
				role = roleStr
			}
		}

		var requestBody string
		if c.Request.Body != nil {
			contentType := c.ContentType()
			if strings.Contains(contentType, "multipart/form-data") {
				// Avoid logging binary multipart bodies (e.g., file uploads)
				requestBody = "(multipart/form-data omitted)"
			} else {
				bodyBytes, err := io.ReadAll(c.Request.Body)
				if err == nil && len(bodyBytes) > 0 {
					if len(bodyBytes) <= 10000 {
						requestBody = string(bodyBytes)
					} else {
						requestBody = string(bodyBytes[:10000]) + "... (truncated)"
					}
					c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))
				}
			}
		}

		writer := &responseBodyWriter{
			ResponseWriter: c.Writer,
			body:           &bytes.Buffer{},
		}
		c.Writer = writer

		c.Next()

		duration := time.Since(startTime)
		statusCode := c.Writer.Status()
		fullPath := c.FullPath()
		if fullPath == "" {
			fullPath = c.Request.URL.Path
		}
		contentType := c.Writer.Header().Get("Content-Type")

		var responseBody string
		if writer.body.Len() > 0 {
			if strings.Contains(contentType, "application/pdf") || strings.Contains(fullPath, "/invoice") {
				responseBody = ""
			} else {
				bodyBytes := writer.body.Bytes()
				if len(bodyBytes) <= 10000 {
					responseBody = string(bodyBytes)
				} else {
					responseBody = string(bodyBytes[:10000]) + "... (truncated)"
				}
			}
		}

		var errorMessage string
		if len(c.Errors) > 0 {
			errorMessage = c.Errors.String()
		}

		ipAddress := c.ClientIP()
		userAgent := c.Request.UserAgent()

		auditLog := models.AuditLog{
			UserID:       userID,
			EmployeeID:   employeeID,
			Role:         role,
			Action:       c.Request.Method + " " + fullPath,
			Endpoint:     c.Request.URL.Path,
			Method:       c.Request.Method,
			StatusCode:   statusCode,
			IPAddress:    ipAddress,
			UserAgent:    userAgent,
			RequestBody:  requestBody,
			ResponseBody: responseBody,
			DurationMs:   duration.Milliseconds(),
			ErrorMessage: errorMessage,
		}

		// Create audit log asynchronously but ensure it completes
		// We use a goroutine to avoid blocking the response, but we need to ensure DB is available
		go func() {
			defer func() {
				if r := recover(); r != nil {
					log.Printf("Panic in audit log goroutine: %v", r)
				}
			}()

			// Small delay to ensure response is sent first
			time.Sleep(50 * time.Millisecond)

			if database.DB == nil {
				log.Printf("AuditLogMiddleware ERROR: Database connection is nil")
				return
			}

			// Use the global DB instance
			if err := database.DB.Create(&auditLog).Error; err != nil {
				log.Printf("Failed to create audit log: %v", err)
				log.Printf("Audit log details: UserID=%v, Role=%s, Endpoint=%s, Method=%s, Status=%d",
					auditLog.UserID, auditLog.Role, auditLog.Endpoint, auditLog.Method, auditLog.StatusCode)
			} else {
				log.Printf("Audit log created: ID=%d, Endpoint=%s, Method=%s, Status=%d, UserID=%v",
					auditLog.ID, auditLog.Endpoint, auditLog.Method, auditLog.StatusCode, auditLog.UserID)
			}
		}()
	}
}
