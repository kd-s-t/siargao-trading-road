package database

import (
	"database/sql"
	"fmt"
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

	err = migrateAuditLogsActionColumn()
	if err != nil {
		return fmt.Errorf("failed to migrate audit_logs.action column: %w", err)
	}

	err = migrateRemoveWorkingDaysColumn()
	if err != nil {
		return fmt.Errorf("failed to remove working_days column: %w", err)
	}

	err = DB.AutoMigrate(&models.User{}, &models.Product{}, &models.Order{}, &models.OrderItem{}, &models.BusinessDocument{}, &models.Message{}, &models.Rating{}, &models.AuditLog{}, &models.BugReport{}, &models.ScheduleException{})
	if err != nil {
		return err
	}

	if os.Getenv("CI") == "" && os.Getenv("GITHUB_ACTIONS") == "" {
		err = SeedAll()
		if err != nil {
			return err
		}
	}

	return nil
}

func Migrate() error {
	if DB == nil {
		return fmt.Errorf("database connection not initialized")
	}

	err := migrateAuditLogsActionColumn()
	if err != nil {
		return fmt.Errorf("failed to migrate audit_logs.action column: %w", err)
	}

	err = migrateRemoveWorkingDaysColumn()
	if err != nil {
		return fmt.Errorf("failed to remove working_days column: %w", err)
	}

	err = DB.AutoMigrate(&models.User{}, &models.Product{}, &models.Order{}, &models.OrderItem{}, &models.BusinessDocument{}, &models.Message{}, &models.Rating{}, &models.AuditLog{}, &models.BugReport{}, &models.ScheduleException{})
	if err != nil {
		return err
	}

	return nil
}

func migrateAuditLogsActionColumn() error {
	if DB == nil {
		return fmt.Errorf("database connection not initialized")
	}

	var columnType string
	var maxLength *int
	err := DB.Raw(`
		SELECT data_type, character_maximum_length
		FROM information_schema.columns
		WHERE table_name = 'audit_logs' AND column_name = 'action'
	`).Row().Scan(&columnType, &maxLength)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil
		}
		return fmt.Errorf("failed to check column type: %w", err)
	}

	if columnType == "character varying" && maxLength != nil && *maxLength == 255 {
		return nil
	}

	err = DB.Exec("ALTER TABLE audit_logs ALTER COLUMN action TYPE VARCHAR(255)").Error
	if err != nil {
		return fmt.Errorf("failed to alter column: %w", err)
	}

	return nil
}

func migrateRemoveWorkingDaysColumn() error {
	if DB == nil {
		return fmt.Errorf("database connection not initialized")
	}

	var exists bool
	err := DB.Raw(`
		SELECT EXISTS (
			SELECT 1
			FROM information_schema.columns
			WHERE table_name = 'users' AND column_name = 'working_days'
		)
	`).Row().Scan(&exists)

	if err != nil {
		return fmt.Errorf("failed to check column existence: %w", err)
	}

	if !exists {
		return nil
	}

	err = DB.Exec("ALTER TABLE users DROP COLUMN IF EXISTS working_days").Error
	if err != nil {
		return fmt.Errorf("failed to drop working_days column: %w", err)
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
