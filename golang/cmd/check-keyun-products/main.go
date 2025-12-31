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

	fmt.Printf("User found:\n")
	fmt.Printf("  ID: %d\n", user.ID)
	fmt.Printf("  Name: %s\n", user.Name)
	fmt.Printf("  Email: %s\n", user.Email)
	fmt.Printf("  Role: %s\n", user.Role)
	fmt.Printf("\n")

	// Find all products for this supplier
	var products []models.Product
	err = database.DB.Where("supplier_id = ?", user.ID).Find(&products).Error
	if err != nil {
		log.Fatal("Failed to find products:", err)
	}

	fmt.Printf("Products for %s (ID: %d):\n", user.Email, user.ID)
	fmt.Printf("Total products: %d\n\n", len(products))

	if len(products) == 0 {
		fmt.Printf("No products found for this supplier.\n")
		return
	}

	for i, product := range products {
		fmt.Printf("Product %d:\n", i+1)
		fmt.Printf("  ID: %d\n", product.ID)
		fmt.Printf("  Name: %s\n", product.Name)
		fmt.Printf("  SKU: %s\n", product.SKU)
		fmt.Printf("  Price: %.2f\n", product.Price)
		fmt.Printf("  Stock: %d %s\n", product.StockQuantity, product.Unit)
		fmt.Printf("  Category: %s\n", product.Category)
		fmt.Printf("\n")
	}
}
