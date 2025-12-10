package handlers

import (
	"fmt"
	"net/http"
	"path/filepath"
	"time"

	"siargao-trading-road/config"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
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

	awsConfig := &aws.Config{}

	if config.AWSRegion != "" {
		awsConfig.Region = aws.String(config.AWSRegion)
	}

	if config.AWSAccessKey != "" && config.AWSSecretKey != "" {
		awsConfig.Credentials = credentials.NewStaticCredentials(
			config.AWSAccessKey,
			config.AWSSecretKey,
			"",
		)
	}

	sess, err := session.NewSession(awsConfig)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create AWS session"})
		return
	}

	svc := s3.New(sess)

	role, _ := c.Get("role")
	folderType := c.Query("type")

	var key string
	if folderType == "product" {
		key = fmt.Sprintf("products/%d/%s", userID, fmt.Sprintf("%d%s", time.Now().Unix(), ext))
	} else {
		key = fmt.Sprintf("uploads/%s/%d/%s", role, userID, fmt.Sprintf("%d%s", time.Now().Unix(), ext))
	}

	_, err = svc.PutObject(&s3.PutObjectInput{
		Bucket:      aws.String(config.S3Bucket),
		Key:         aws.String(key),
		Body:        src,
		ContentType: aws.String(file.Header.Get("Content-Type")),
		ACL:         aws.String("public-read"),
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
