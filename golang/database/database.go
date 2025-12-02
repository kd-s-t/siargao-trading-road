package database

import (
	"os"
	"siargao-trading-road/config"
	"siargao-trading-road/models"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect(cfg *config.Config) error {
	sslMode := "require"
	if cfg.DBHost == "localhost" || cfg.DBHost == "127.0.0.1" {
		sslMode = "disable"
	}

	dsn := "host=" + cfg.DBHost +
		" user=" + cfg.DBUser +
		" password=" + cfg.DBPassword +
		" dbname=" + cfg.DBName +
		" port=" + cfg.DBPort +
		" sslmode=" + sslMode + " TimeZone=Asia/Manila"

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return err
	}

	err = DB.AutoMigrate(&models.User{}, &models.Product{}, &models.Order{}, &models.OrderItem{}, &models.BusinessDocument{})
	if err != nil {
		return err
	}

	err = SeedAll()
	if err != nil {
		return err
	}

	return nil
}

func SeedAdmin() error {
	adminEmail := getEnv("ADMIN_EMAIL", "admin@example.com")
	adminPassword := getEnv("ADMIN_PASSWORD", "admin123")
	adminName := getEnv("ADMIN_NAME", "Admin")

	var existingAdmin models.User
	err := DB.Where("email = ? AND role = ?", adminEmail, models.RoleAdmin).First(&existingAdmin).Error
	if err == nil {
		return nil
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(adminPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	level1 := 1
	admin := models.User{
		Email:      adminEmail,
		Password:   string(hashedPassword),
		Name:       adminName,
		Role:       models.RoleAdmin,
		AdminLevel: &level1,
	}

	return DB.Create(&admin).Error
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
