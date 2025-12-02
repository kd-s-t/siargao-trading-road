package main

import (
	"log"

	"siargao-trading-road/config"
	"siargao-trading-road/database"
	"siargao-trading-road/handlers"
	"siargao-trading-road/middleware"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal("Failed to load config:", err)
	}

	err = database.Connect(cfg)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	r := gin.Default()

	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")
		c.Writer.Header().Set("Access-Control-Max-Age", "86400")

		if c.Request.Method == "OPTIONS" {
			c.Writer.WriteHeader(204)
			c.Abort()
			return
		}

		c.Next()
	})

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
			protected.PUT("/me", handlers.UpdateMe)
			protected.POST("/upload", handlers.UploadImage)
			protected.GET("/me/analytics", handlers.GetMyAnalytics)
			protected.GET("/products", handlers.GetProducts)
			protected.GET("/products/:id", handlers.GetProduct)
			protected.POST("/products", handlers.CreateProduct)
			protected.PUT("/products/:id", handlers.UpdateProduct)
			protected.DELETE("/products/:id", handlers.DeleteProduct)
			protected.POST("/products/:id/restore", handlers.RestoreProduct)
			protected.GET("/orders", handlers.GetOrders)
			protected.GET("/orders/:id", handlers.GetOrder)
			protected.PUT("/orders/:id/status", handlers.UpdateOrderStatus)
			protected.POST("/orders/:id/send-invoice", handlers.SendInvoiceEmail)
			protected.GET("/orders/draft", handlers.GetDraftOrder)
			protected.POST("/orders/draft", handlers.CreateDraftOrder)
			protected.POST("/orders/:id/items", handlers.AddOrderItem)
			protected.PUT("/orders/items/:item_id", handlers.UpdateOrderItem)
			protected.DELETE("/orders/items/:item_id", handlers.RemoveOrderItem)
			protected.GET("/suppliers", handlers.GetSuppliers)
			protected.GET("/suppliers/:id/products", handlers.GetSupplierProducts)
			protected.GET("/stores", handlers.GetStores)
			protected.GET("/users", handlers.GetUsers)
			protected.GET("/users/:id", handlers.GetUser)
			protected.GET("/users/:id/analytics", handlers.GetUserAnalytics)
			protected.POST("/users/register", handlers.AdminRegisterUser)
			protected.GET("/dashboard/analytics", handlers.GetDashboardAnalytics)
		}
	}

	log.Printf("Server starting on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
