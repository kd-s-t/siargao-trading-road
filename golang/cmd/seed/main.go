package main

import (
	"log"
	"siargao-trading-road/config"
	"siargao-trading-road/database"
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

	log.Println("Seeders completed successfully")
}
