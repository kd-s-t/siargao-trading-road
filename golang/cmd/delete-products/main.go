package main

import (
	"database/sql"
	"fmt"
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

	productIDs := []uint{51, 52, 53, 56}

	fmt.Printf("Checking products before deletion...\n")
	for _, id := range productIDs {
		var count int64
		database.DB.Raw("SELECT COUNT(*) FROM order_items WHERE product_id = ?", id).Scan(&count)
		fmt.Printf("Product ID %d: %d order_items\n", id, count)
	}

	fmt.Printf("\nDeleting products: %v\n", productIDs)
	result := database.DB.Exec("UPDATE products SET deleted_at = NOW() WHERE id IN (51, 52, 53, 56) AND deleted_at IS NULL")

	if result.Error != nil {
		log.Fatal("Failed to delete products:", result.Error)
	}

	fmt.Printf("Successfully deleted %d products\n", result.RowsAffected)

	fmt.Printf("\nVerifying deletion...\n")
	for _, id := range productIDs {
		var deletedAt sql.NullTime
		database.DB.Raw("SELECT deleted_at FROM products WHERE id = ?", id).Scan(&deletedAt)
		if deletedAt.Valid {
			fmt.Printf("Product ID %d: deleted_at = %v\n", id, deletedAt.Time)
		} else {
			fmt.Printf("Product ID %d: NOT DELETED (deleted_at is NULL)\n", id)
		}
	}
}
