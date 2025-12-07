package main

import (
	"log"
	"os"

	"siargao-trading-road/config"
	"siargao-trading-road/database"
	"siargao-trading-road/middleware"
	"siargao-trading-road/routes"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal("Failed to load config:", err)
	}

	if len(os.Args) > 1 && os.Args[1] == "migrate" {
		err = database.Connect(cfg)
		if err != nil {
			log.Fatal("Failed to connect to database:", err)
		}
		err = database.Migrate()
		if err != nil {
			log.Fatal("Failed to migrate:", err)
		}
		log.Println("Database migrations completed successfully")
		return
	}

	err = database.Connect(cfg)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	r := gin.Default()

	r.Use(middleware.RecoveryMiddleware())
	r.Use(middleware.CORSMiddleware())

	routes.SetupRoutes(r, cfg)

	log.Printf("Server starting on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
