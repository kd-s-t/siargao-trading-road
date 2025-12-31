package handlers

import (
	"context"
	"fmt"
	"net/http"
	"path/filepath"
	"time"

	"siargao-trading-road/config"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/gin-gonic/gin"
)

func UploadImage(c *gin.Context) {
	userID, err := getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}

	cfg, _ := c.Get("config")
	config := cfg.(*config.Config)

	if config.S3Bucket == "" {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "S3_BUCKET environment variable is not set"})
		return
	}
	if config.AWSAccessKey == "" {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "AWS_ACCESS_KEY_ID environment variable is not set"})
		return
	}
	if config.AWSSecretKey == "" {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "AWS_SECRET_ACCESS_KEY environment variable is not set"})
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
		return
	}

	ext := filepath.Ext(file.Filename)
	allowedExts := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".gif":  true,
		".webp": true,
	}

	if !allowedExts[ext] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid file type. Only images are allowed"})
		return
	}

	if file.Size > 5*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file size exceeds 5MB limit"})
		return
	}

	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to open file"})
		return
	}
	defer src.Close()

	ctx := context.Background()
	var awsCfg aws.Config
	var cfgErr error

	if config.AWSAccessKey != "" && config.AWSSecretKey != "" {
		awsCfg, cfgErr = awsconfig.LoadDefaultConfig(ctx,
			awsconfig.WithRegion(config.AWSRegion),
			awsconfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
				config.AWSAccessKey,
				config.AWSSecretKey,
				"",
			)),
		)
	} else {
		awsCfg, cfgErr = awsconfig.LoadDefaultConfig(ctx,
			awsconfig.WithRegion(config.AWSRegion),
		)
	}

	if cfgErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create AWS config"})
		return
	}

	svc := s3.NewFromConfig(awsCfg)

	role, _ := c.Get("role")
	folderType := c.Query("type")
	employeeID := c.Query("employee_id")

	var key string
	timestamp := fmt.Sprintf("%d%s", time.Now().Unix(), ext)
	switch folderType {
	case "product":
		key = fmt.Sprintf("products/%d/%s", userID, timestamp)
	case "employee":
		if employeeID != "" {
			key = fmt.Sprintf("employees/%d/%s/%s", userID, employeeID, timestamp)
		} else {
			key = fmt.Sprintf("employees/%d/%s", userID, timestamp)
		}
	default:
		key = fmt.Sprintf("uploads/%s/%d/%s", role, userID, timestamp)
	}

	contentType := file.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	_, err = svc.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(config.S3Bucket),
		Key:         aws.String(key),
		Body:        src,
		ContentType: aws.String(contentType),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to upload file"})
		return
	}

	imageURL := fmt.Sprintf("https://%s.s3.%s.amazonaws.com/%s", config.S3Bucket, config.AWSRegion, key)

	c.JSON(http.StatusOK, gin.H{
		"url": imageURL,
		"key": key,
	})
}
