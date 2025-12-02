package main

import (
	"log"
	"os"
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

	if len(os.Args) > 1 && os.Args[1] == "reset" {
		log.Println("Resetting database and re-seeding...")
		err = database.ResetAndSeed()
		if err != nil {
			log.Fatal("Failed to reset and seed:", err)
		}
		log.Println("Database reset and seeders completed successfully")
	} else {
		log.Println("Seeders completed successfully")
	}
}
