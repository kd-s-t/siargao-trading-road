package main

import (
	"fmt"
	"log"
	"siargao-trading-road/config"
	"siargao-trading-road/database"
	"siargao-trading-road/models"
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

	// Find user with email keyun@example.com
	var user models.User
	err = database.DB.Where("email = ?", "keyun@example.com").First(&user).Error
	if err != nil {
		log.Fatal("Failed to find user keyun@example.com:", err)
	}

	fmt.Printf("User: %s (ID: %d, Role: %s)\n\n", user.Email, user.ID, user.Role)

	// Check ALL products (including deleted) with supplier_id = 17
	var allProducts []models.Product
	err = database.DB.Unscoped().Where("supplier_id = ?", user.ID).Find(&allProducts).Error
	if err != nil {
		log.Fatal("Failed to find products:", err)
	}

	fmt.Printf("All products (including deleted) with supplier_id = %d:\n", user.ID)
	fmt.Printf("Total: %d\n\n", len(allProducts))

	for i, product := range allProducts {
		fmt.Printf("Product %d:\n", i+1)
		fmt.Printf("  ID: %d\n", product.ID)
		fmt.Printf("  Name: %s\n", product.Name)
		fmt.Printf("  SKU: %s\n", product.SKU)
		fmt.Printf("  Deleted: %v\n", product.DeletedAt.Valid)
		if product.DeletedAt.Valid {
			fmt.Printf("  Deleted At: %v\n", product.DeletedAt.Time)
		}
		fmt.Printf("\n")
	}

	// Also check if there are any products that might be showing up incorrectly
	fmt.Printf("\nChecking all products with supplier_id = 16 (the one we deleted from):\n")
	var products16 []models.Product
	err = database.DB.Unscoped().Where("supplier_id = ?", 16).Find(&products16).Error
	fmt.Printf("Total products with supplier_id = 16: %d\n", len(products16))
	for _, p := range products16 {
		fmt.Printf("  ID: %d, Name: %s, Deleted: %v\n", p.ID, p.Name, p.DeletedAt.Valid)
	}

	// Check all active products
	fmt.Printf("\nChecking all active (non-deleted) products:\n")
	var allActiveProducts []models.Product
	err = database.DB.Find(&allActiveProducts).Error
	fmt.Printf("Total active products: %d\n", len(allActiveProducts))
	for _, p := range allActiveProducts {
		fmt.Printf("  ID: %d, Name: %s, Supplier ID: %d\n", p.ID, p.Name, p.SupplierID)
	}
}
