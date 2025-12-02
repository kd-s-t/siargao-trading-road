package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port         string
	DBHost       string
	DBPort       string
	DBUser       string
	DBPassword   string
	DBName       string
	JWTSecret    string
	AWSRegion    string
	S3Bucket     string
	AWSAccessKey string
	AWSSecretKey string
}

func Load() (*Config, error) {
	godotenv.Load()

	return &Config{
		Port:         getEnv("PORT", "3020"),
		DBHost:       getEnv("DB_HOST", "localhost"),
		DBPort:       getEnv("DB_PORT", "5432"),
		DBUser:       getEnv("DB_USER", "postgres"),
		DBPassword:   getEnv("DB_PASSWORD", "postgres"),
		DBName:       getEnv("DB_NAME", "siargaotradingroad"),
		JWTSecret:    getEnv("JWT_SECRET", "change-this-secret"),
		AWSRegion:    getEnv("AWS_REGION", "us-east-1"),
		S3Bucket:     getEnv("S3_BUCKET", ""),
		AWSAccessKey: getEnv("AWS_ACCESS_KEY_ID", ""),
		AWSSecretKey: getEnv("AWS_SECRET_ACCESS_KEY", ""),
	}, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
