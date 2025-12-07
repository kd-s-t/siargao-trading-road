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

	err = database.Connect(cfg)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	var products []models.Product
	if err := database.DB.Preload("Supplier").Find(&products).Error; err != nil {
		log.Fatal("Failed to fetch products:", err)
	}

	fmt.Printf("\nTotal products: %d\n\n", len(products))

	for i, product := range products {
		fmt.Printf("Product %d:\n", i+1)
		fmt.Printf("  ID: %d\n", product.ID)
		fmt.Printf("  Name: %s\n", product.Name)
		fmt.Printf("  SKU: %s\n", product.SKU)
		fmt.Printf("  Price: %.2f\n", product.Price)
		fmt.Printf("  Stock: %d %s\n", product.StockQuantity, product.Unit)
		fmt.Printf("  Category: %s\n", product.Category)
		fmt.Printf("  Supplier: %s (ID: %d)\n", product.Supplier.Name, product.SupplierID)
		fmt.Println()

		if i >= 49 {
			fmt.Printf("... and %d more products\n", len(products)-50)
			break
		}
	}
}
