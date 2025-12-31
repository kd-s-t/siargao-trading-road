package main

import (
	"log"
	"siargao-trading-road/config"
	"siargao-trading-road/database"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal("Failed to load config:", err)
	}

	err = database.ConnectWithoutMigrations(cfg)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// First delete order_items
	orderItemsResult := database.DB.Exec("DELETE FROM order_items WHERE product_id = 57")
	if orderItemsResult.Error != nil {
		log.Printf("Warning: Failed to delete order_items: %v", orderItemsResult.Error)
	} else {
		log.Printf("Deleted %d order_items for product 57", orderItemsResult.RowsAffected)
	}

	// Then delete the product
	result := database.DB.Exec("DELETE FROM products WHERE id = 57")
	if result.Error != nil {
		log.Fatal("Failed to delete product 57:", result.Error)
	}

	log.Printf("Successfully deleted product 57 (%d rows affected)", result.RowsAffected)
}

