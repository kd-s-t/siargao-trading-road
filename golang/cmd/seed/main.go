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

	if len(os.Args) > 1 {
		switch os.Args[1] {
		case "reset":
			log.Println("Resetting database and re-seeding...")
			err = database.ResetAndSeed()
			if err != nil {
				log.Fatal("Failed to reset and seed:", err)
			}
			log.Println("Database reset and seeders completed successfully")
		case "migrate":
			log.Println("Running database migrations...")
			err = database.Migrate()
			if err != nil {
				log.Fatal("Failed to migrate:", err)
			}
			log.Println("Database migrations completed successfully")
		case "update-locations":
			log.Println("Updating user locations...")
			err = database.UpdateUserLocations()
			if err != nil {
				log.Fatal("Failed to update locations:", err)
			}
			log.Println("User locations updated successfully")
		default:
			log.Println("Seeders completed successfully")
		}
	} else {
		log.Println("Seeders completed successfully")
	}
}
