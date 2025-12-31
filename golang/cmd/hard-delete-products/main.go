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

	productIDs := []uint{51, 52, 53, 56, 57}

	fmt.Printf("Checking products status...\n")
	for _, id := range productIDs {
		var result struct {
			Name      string
			DeletedAt sql.NullTime
		}
		database.DB.Raw("SELECT name, deleted_at FROM products WHERE id = ?", id).Scan(&result)
		if result.DeletedAt.Valid {
			fmt.Printf("Product ID %d (%s): SOFT DELETED at %v\n", id, result.Name, result.DeletedAt.Time)
		} else {
			fmt.Printf("Product ID %d (%s): NOT DELETED\n", id, result.Name)
		}
	}

	fmt.Printf("\nHard deleting products...\n")
	fmt.Printf("WARNING: This will permanently remove these products from the database!\n")

	// First, delete products without order_items (56, 57)
	result := database.DB.Exec("DELETE FROM products WHERE id IN (56, 57) AND id NOT IN (SELECT DISTINCT product_id FROM order_items WHERE product_id IN (56, 57))")
	if result.Error != nil {
		log.Printf("Warning: Failed to delete some products: %v", result.Error)
	} else {
		fmt.Printf("Successfully hard deleted %d products without order_items\n", result.RowsAffected)
	}

	// For products with order_items, we need to delete order_items first
	productsWithOrders := []uint{51, 52, 53}
	fmt.Printf("\nProducts 51, 52, 53 have order_items. Deleting order_items first...\n")

	for _, id := range productsWithOrders {
		orderItemsResult := database.DB.Exec("DELETE FROM order_items WHERE product_id = ?", id)
		if orderItemsResult.Error != nil {
			log.Printf("Warning: Failed to delete order_items for product %d: %v", id, orderItemsResult.Error)
		} else {
			fmt.Printf("Deleted %d order_items for product %d\n", orderItemsResult.RowsAffected, id)
		}
	}

	// Now delete the products
	result = database.DB.Exec("DELETE FROM products WHERE id IN (51, 52, 53)")
	if result.Error != nil {
		log.Fatal("Failed to delete products:", result.Error)
	}
	fmt.Printf("Successfully hard deleted %d products with order_items\n", result.RowsAffected)

	fmt.Printf("\nVerifying deletion...\n")
	for _, id := range productIDs {
		var count int64
		database.DB.Raw("SELECT COUNT(*) FROM products WHERE id = ?", id).Scan(&count)
		if count == 0 {
			fmt.Printf("Product ID %d: PERMANENTLY DELETED\n", id)
		} else {
			fmt.Printf("Product ID %d: STILL EXISTS\n", id)
		}
	}
}
