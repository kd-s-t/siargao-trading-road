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

	// Check what GetProducts would return for this user (as store role)
	var products []models.Product
	query := database.DB.Preload("Supplier")

	// This is what the GetProducts handler does for store role
	if user.Role == "supplier" || user.Role == "store" {
		query = query.Where("supplier_id = ?", user.ID)
	}

	err = query.Find(&products).Error
	if err != nil {
		log.Fatal("Failed to find products:", err)
	}

	fmt.Printf("Products returned by GetProducts API for %s:\n", user.Email)
	fmt.Printf("Total: %d\n\n", len(products))

	for i, product := range products {
		fmt.Printf("Product %d:\n", i+1)
		fmt.Printf("  ID: %d\n", product.ID)
		fmt.Printf("  Name: %s\n", product.Name)
		fmt.Printf("  Supplier ID: %d\n", product.SupplierID)
		if product.Supplier.ID != 0 {
			fmt.Printf("  Supplier: %s (%s)\n", product.Supplier.Name, product.Supplier.Email)
		}
		fmt.Printf("  SKU: %s\n", product.SKU)
		fmt.Printf("  Price: %.2f\n", product.Price)
		fmt.Printf("  Stock: %d %s\n", product.StockQuantity, product.Unit)
		fmt.Printf("\n")
	}

	// Also check all products with supplier_id = 17
	var allProducts17 []models.Product
	err = database.DB.Unscoped().Where("supplier_id = ?", user.ID).Find(&allProducts17).Error
	fmt.Printf("\nAll products (including deleted) with supplier_id = %d:\n", user.ID)
	fmt.Printf("Total: %d\n", len(allProducts17))
	for _, p := range allProducts17 {
		fmt.Printf("  ID: %d, Name: %s, Deleted: %v\n", p.ID, p.Name, p.DeletedAt.Valid)
	}
}
