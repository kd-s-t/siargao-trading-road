package main

import (
	"fmt"
	"log"
	"strings"

	"siargao-trading-road/config"
	"siargao-trading-road/database"
	"siargao-trading-road/models"

	"gorm.io/gorm"
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

	testEmailPatterns := []string{
		"supplier-test-%@example.com",
		"store-test-%@example.com",
		"test-login-%@example.com",
		"test%@example.com",
	}

	fmt.Println("==========================================")
	fmt.Println("Deleting Test Users from Production")
	fmt.Println("==========================================")
	fmt.Println("")

	var deletedCount int
	var users []models.User

	// Find all test users
	for _, pattern := range testEmailPatterns {
		var matchingUsers []models.User
		if err := database.DB.Where("email LIKE ? AND deleted_at IS NULL", pattern).Find(&matchingUsers).Error; err != nil {
			if err != gorm.ErrRecordNotFound {
				log.Printf("Error querying users with pattern %s: %v", pattern, err)
			}
			continue
		}
		users = append(users, matchingUsers...)
	}

	if len(users) == 0 {
		fmt.Println("No test users found to delete.")
		return
	}

	fmt.Printf("Found %d test user(s) to delete:\n", len(users))
	for _, user := range users {
		fmt.Printf("  - ID: %d, Email: %s, Name: %s, Role: %s\n", user.ID, user.Email, user.Name, user.Role)
	}
	fmt.Println("")

	// Confirm deletion
	fmt.Print("Do you want to proceed with soft deletion? (yes/no): ")
	var confirmation string
	fmt.Scanln(&confirmation)

	if strings.ToLower(confirmation) != "yes" {
		fmt.Println("Deletion cancelled.")
		return
	}

	// Soft delete users
	for _, user := range users {
		if err := database.DB.Delete(&user).Error; err != nil {
			log.Printf("Error deleting user %d (%s): %v", user.ID, user.Email, err)
			continue
		}
		deletedCount++
		fmt.Printf("✓ Deleted user: %s (ID: %d)\n", user.Email, user.ID)
	}

	fmt.Println("")
	fmt.Printf("==========================================\n")
	fmt.Printf("Deleted %d test user(s) successfully.\n", deletedCount)
	fmt.Printf("==========================================\n")
}
