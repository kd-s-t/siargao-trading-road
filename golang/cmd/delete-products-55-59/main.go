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

	productIDs := []uint{55, 59}

	// First delete order_items for these products
	for _, id := range productIDs {
		orderItemsResult := database.DB.Exec("DELETE FROM order_items WHERE product_id = ?", id)
		if orderItemsResult.Error != nil {
			log.Printf("Warning: Failed to delete order_items for product %d: %v", id, orderItemsResult.Error)
		} else {
			log.Printf("Deleted %d order_items for product %d", orderItemsResult.RowsAffected, id)
		}
	}

	// Then delete the products
	result := database.DB.Exec("DELETE FROM products WHERE id IN (55, 59)")
	if result.Error != nil {
		log.Fatal("Failed to delete products:", result.Error)
	}

	log.Printf("Successfully deleted products 55 and 59 (%d rows affected)", result.RowsAffected)
}

