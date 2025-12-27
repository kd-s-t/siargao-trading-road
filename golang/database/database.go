package database

import (
	"database/sql"
	"fmt"
	"net/url"
	"os"
	"siargao-trading-road/config"
	"siargao-trading-road/models"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Connect(cfg *config.Config) error {
	sslMode := "require"
	if cfg.DBHost == "localhost" || cfg.DBHost == "127.0.0.1" {
		sslMode = "disable"
	}

	dsn := buildPostgresDSN(cfg, sslMode)
	fmt.Printf("Connecting to DB host=%s user=%s db=%s sslmode=%s\n", cfg.DBHost, cfg.DBUser, cfg.DBName, sslMode)
	fmt.Printf("DSN: %s\n", dsn)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger:                                   logger.Default.LogMode(logger.Info),
		DisableForeignKeyConstraintWhenMigrating: true,
	})
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	sqlDB, err := DB.DB()
	if err != nil {
		return fmt.Errorf("failed to get database instance: %w", err)
	}

	if err := sqlDB.Ping(); err != nil {
		fmt.Printf("Warning: ping failed: %v\n", err)
	}

	err = migrateAuditLogsActionColumn()
	if err != nil {
		return fmt.Errorf("failed to migrate audit_logs.action column: %w", err)
	}

	err = migrateAuditLogsEmployeeIDColumn()
	if err != nil {
		return fmt.Errorf("failed to migrate audit_logs.employee_id column: %w", err)
	}

	err = migrateRemoveWorkingDaysColumn()
	if err != nil {
		return fmt.Errorf("failed to remove working_days column: %w", err)
	}

	err = migrateFeatureFlagsIndex()
	if err != nil {
		return fmt.Errorf("failed to migrate feature_flags index: %w", err)
	}

	if DB == nil {
		return fmt.Errorf("database connection not initialized before AutoMigrate")
	}

	migrator := DB.Migrator()

	modelsToMigrate := []interface{}{
		&models.User{},
		&models.Employee{},
		&models.FeatureFlag{},
		&models.Product{},
		&models.BusinessDocument{},
		&models.Order{},
		&models.OrderItem{},
		&models.Message{},
		&models.Rating{},
		&models.AuditLog{},
		&models.BugReport{},
		&models.ScheduleException{},
	}

	for _, model := range modelsToMigrate {
		if err := migrator.AutoMigrate(model); err != nil {
			return fmt.Errorf("failed to migrate model %T: %w", model, err)
		}
	}

	if os.Getenv("CI") == "" && os.Getenv("GITHUB_ACTIONS") == "" {
		err = SeedAll()
		if err != nil {
			return err
		}
	}

	return nil
}

func buildPostgresDSN(cfg *config.Config, sslMode string) string {
	// Use DSN string format which is more reliable
	return fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
		url.QueryEscape(cfg.DBUser),
		url.QueryEscape(cfg.DBPassword),
		cfg.DBHost,
		cfg.DBPort,
		cfg.DBName,
		sslMode,
	)
}

func Migrate() error {
	if DB == nil {
		return fmt.Errorf("database connection not initialized")
	}

	err := migrateAuditLogsActionColumn()
	if err != nil {
		return fmt.Errorf("failed to migrate audit_logs.action column: %w", err)
	}

	err = migrateAuditLogsEmployeeIDColumn()
	if err != nil {
		return fmt.Errorf("failed to migrate audit_logs.employee_id column: %w", err)
	}

	err = migrateRemoveWorkingDaysColumn()
	if err != nil {
		return fmt.Errorf("failed to remove working_days column: %w", err)
	}

	err = migrateFeatureFlagsIndex()
	if err != nil {
		return fmt.Errorf("failed to migrate feature_flags index: %w", err)
	}

	err = DB.AutoMigrate(&models.User{}, &models.Employee{}, &models.Product{}, &models.Order{}, &models.OrderItem{}, &models.BusinessDocument{}, &models.Message{}, &models.Rating{}, &models.AuditLog{}, &models.BugReport{}, &models.ScheduleException{}, &models.FeatureFlag{})
	if err != nil {
		return err
	}

	return nil
}

func migrateAuditLogsActionColumn() error {
	if DB == nil {
		return fmt.Errorf("database connection not initialized")
	}

	var columnType sql.NullString
	var maxLength sql.NullInt64
	row := DB.Raw(`
		SELECT data_type, character_maximum_length
		FROM information_schema.columns
		WHERE table_name = 'audit_logs' AND column_name = 'action'
	`).Row()

	err := row.Scan(&columnType, &maxLength)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil
		}
		return fmt.Errorf("failed to check column type: %w", err)
	}

	if !columnType.Valid {
		return nil
	}

	if columnType.String == "character varying" && maxLength.Valid && maxLength.Int64 == 255 {
		return nil
	}

	err = DB.Exec("ALTER TABLE audit_logs ALTER COLUMN action TYPE VARCHAR(255)").Error
	if err != nil {
		return fmt.Errorf("failed to alter column: %w", err)
	}

	return nil
}

func migrateAuditLogsEmployeeIDColumn() error {
	if DB == nil {
		return fmt.Errorf("database connection not initialized")
	}

	var exists bool
	err := DB.Raw(`
		SELECT EXISTS (
			SELECT 1
			FROM information_schema.columns
			WHERE table_name = 'audit_logs' AND column_name = 'employee_id'
		)
	`).Row().Scan(&exists)

	if err != nil {
		return fmt.Errorf("failed to check column existence: %w", err)
	}

	if exists {
		return nil
	}

	// Add the employee_id column as nullable (safe, won't delete data)
	err = DB.Exec("ALTER TABLE audit_logs ADD COLUMN employee_id INTEGER").Error
	if err != nil {
		return fmt.Errorf("failed to add employee_id column: %w", err)
	}

	// Add index for better query performance
	err = DB.Exec("CREATE INDEX IF NOT EXISTS idx_audit_logs_employee_id ON audit_logs(employee_id)").Error
	if err != nil {
		return fmt.Errorf("failed to create employee_id index: %w", err)
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

func migrateFeatureFlagsIndex() error {
	if DB == nil {
		return fmt.Errorf("database connection not initialized")
	}

	if err := DB.Exec("DROP INDEX IF EXISTS idx_feature_flags_flag").Error; err != nil {
		return fmt.Errorf("failed to drop legacy feature_flags index: %w", err)
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

func ConnectWithoutMigrations(cfg *config.Config) error {
	sslMode := "require"
	if cfg.DBHost == "localhost" || cfg.DBHost == "127.0.0.1" {
		sslMode = "disable"
	}

	dsn := buildPostgresDSN(cfg, sslMode)
	fmt.Printf("Connecting to DB host=%s user=%s db=%s sslmode=%s\n", cfg.DBHost, cfg.DBUser, cfg.DBName, sslMode)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger:                                   logger.Default.LogMode(logger.Info),
		DisableForeignKeyConstraintWhenMigrating: true,
	})
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	sqlDB, err := DB.DB()
	if err != nil {
		return fmt.Errorf("failed to get database instance: %w", err)
	}

	if err := sqlDB.Ping(); err != nil {
		fmt.Printf("Warning: ping failed: %v\n", err)
	}

	return nil
}

func FixDatabaseTables() error {
	if DB == nil {
		return fmt.Errorf("database connection not initialized")
	}

	tableNames := []string{"users", "employees", "products", "orders", "order_items", "business_documents", "messages", "ratings", "audit_logs", "bug_reports", "schedule_exceptions", "feature_flags"}

	fmt.Println("Dropping problematic tables to allow clean recreation...")
	for _, tableName := range tableNames {
		if err := DB.Exec(fmt.Sprintf("DROP TABLE IF EXISTS %s CASCADE", tableName)).Error; err != nil {
			fmt.Printf("Warning: Could not drop %s table: %v\n", tableName, err)
		} else {
			fmt.Printf("Dropped %s table\n", tableName)
		}
	}

	fmt.Println("Re-running migrations...")
	err := migrateAuditLogsActionColumn()
	if err != nil {
		return fmt.Errorf("failed to migrate audit_logs.action column: %w", err)
	}

	err = migrateAuditLogsEmployeeIDColumn()
	if err != nil {
		return fmt.Errorf("failed to migrate audit_logs.employee_id column: %w", err)
	}

	err = migrateRemoveWorkingDaysColumn()
	if err != nil {
		return fmt.Errorf("failed to remove working_days column: %w", err)
	}

	err = migrateFeatureFlagsIndex()
	if err != nil {
		return fmt.Errorf("failed to migrate feature_flags index: %w", err)
	}

	err = DB.AutoMigrate(&models.User{}, &models.Employee{}, &models.Product{}, &models.Order{}, &models.OrderItem{}, &models.BusinessDocument{}, &models.Message{}, &models.Rating{}, &models.AuditLog{}, &models.BugReport{}, &models.ScheduleException{}, &models.FeatureFlag{})
	if err != nil {
		return fmt.Errorf("failed to migrate models after dropping tables: %w", err)
	}

	fmt.Println("Database tables fixed and migrated successfully")
	return nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
