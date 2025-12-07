package routes

import (
	"siargao-trading-road/config"
	"siargao-trading-road/handlers"
	"siargao-trading-road/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine, cfg *config.Config) {
	r.Use(func(c *gin.Context) {
		c.Set("config", cfg)
		c.Next()
	})

	r.Use(middleware.AuditLogMiddleware())

	api := r.Group("/api")
	{
		api.POST("/register", handlers.Register)
		api.POST("/login", handlers.Login)

		protected := api.Group("/")
		protected.Use(middleware.AuthMiddleware(cfg))
		{
			protected.GET("/me", handlers.GetMe)
			protected.PUT("/me", handlers.UpdateMe)
			protected.POST("/me/open", handlers.OpenStore)
			protected.POST("/me/close", handlers.CloseStore)
			protected.POST("/upload", handlers.UploadImage)
			protected.GET("/me/analytics", handlers.GetMyAnalytics)
			protected.GET("/me/ratings", handlers.GetMyRatings)

			protected.GET("/products", handlers.GetProducts)
			protected.GET("/products/:id", handlers.GetProduct)
			protected.POST("/products", handlers.CreateProduct)
			protected.POST("/products/bulk", handlers.BulkCreateProducts)
			protected.PUT("/products/:id", handlers.UpdateProduct)
			protected.DELETE("/products/:id", handlers.DeleteProduct)
			protected.POST("/products/:id/restore", handlers.RestoreProduct)

			protected.GET("/orders", handlers.GetOrders)
			protected.GET("/orders/draft", handlers.GetDraftOrder)
			protected.POST("/orders/draft", handlers.CreateDraftOrder)
			protected.GET("/orders/:id/messages", handlers.GetOrderMessages)
			protected.POST("/orders/:id/messages", handlers.CreateOrderMessage)
			protected.POST("/orders/:id/send-invoice", handlers.SendInvoiceEmail)
			protected.POST("/orders/:id/submit", handlers.SubmitOrder)
			protected.POST("/orders/:id/items", handlers.AddOrderItem)
			protected.PUT("/orders/:id/status", handlers.UpdateOrderStatus)
			protected.POST("/orders/:id/payment/paid", handlers.MarkPaymentAsPaid)
			protected.GET("/orders/:id", handlers.GetOrder)
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

			protected.GET("/audit-logs", handlers.GetAuditLogs)

			protected.GET("/ratings/summary", handlers.GetRatingsSummary)
			protected.GET("/ratings/orders", handlers.GetOrdersWithRatings)

			protected.POST("/orders/:id/rating", handlers.CreateRating)

			protected.POST("/bug-reports", handlers.CreateBugReport)
			protected.GET("/bug-reports", handlers.GetBugReports)
			protected.GET("/bug-reports/:id", handlers.GetBugReport)
			protected.PUT("/bug-reports/:id", handlers.UpdateBugReport)
			protected.DELETE("/bug-reports/:id", handlers.DeleteBugReport)

			protected.GET("/schedule/exceptions", handlers.GetScheduleExceptions)
			protected.POST("/schedule/exceptions", handlers.CreateScheduleException)
			protected.POST("/schedule/exceptions/bulk", handlers.BulkCreateScheduleExceptions)
			protected.PUT("/schedule/exceptions/:id", handlers.UpdateScheduleException)
			protected.DELETE("/schedule/exceptions/:id", handlers.DeleteScheduleException)
		}
	}
}
