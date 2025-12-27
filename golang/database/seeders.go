package database

import (
	"fmt"
	"siargao-trading-road/models"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func floatPtr(f float64) *float64 {
	return &f
}

func ResetAndSeed() error {
	if err := ResetDatabase(); err != nil {
		return err
	}
	return SeedAll()
}

func ResetDatabase() error {
	if DB == nil {
		return fmt.Errorf("database connection not initialized")
	}

	if err := DB.Exec("TRUNCATE TABLE audit_logs, ratings, messages, order_items, orders, products, business_documents, schedule_exceptions, users CASCADE").Error; err != nil {
		return fmt.Errorf("failed to truncate tables: %w", err)
	}

	return nil
}

func SeedAll() error {
	if err := SeedAdmin(); err != nil {
		return err
	}

	if err := SeedSuppliers(); err != nil {
		return err
	}

	if err := SeedStores(); err != nil {
		return err
	}

	if err := SeedProducts(); err != nil {
		return err
	}

	if err := SeedOrders(); err != nil {
		return err
	}

	if err := SeedRatings(); err != nil {
		return err
	}

	return nil
}

func UpdateUserLocations() error {
	return nil
}

func SeedSuppliers() error {
	suppliers := []struct {
		email       string
		name        string
		phone       string
		logoURL     string
		bannerURL   string
		address     string
		latitude    *float64
		longitude   *float64
		facebook    string
		instagram   string
		twitter     string
		linkedin    string
		youtube     string
		tiktok      string
		website     string
		openingTime string
		closingTime string
	}{
		{"aron@example.com", "Aron", "09123456785", "", "", "National Highway, Dapa, Surigao del Norte", floatPtr(9.8098413), floatPtr(126.1375574), "", "", "", "", "", "", "", "08:00", "18:00"},
	}

	for _, s := range suppliers {
		var existing models.User
		if err := DB.Where("email = ?", s.email).First(&existing).Error; err == nil {
			existing.Name = s.name
			existing.Phone = s.phone
			if s.logoURL != "" {
				existing.LogoURL = s.logoURL
			}
			if s.bannerURL != "" {
				existing.BannerURL = s.bannerURL
			}
			existing.Address = s.address
			existing.Latitude = s.latitude
			existing.Longitude = s.longitude
			existing.Facebook = s.facebook
			existing.Instagram = s.instagram
			existing.Twitter = s.twitter
			existing.LinkedIn = s.linkedin
			existing.YouTube = s.youtube
			existing.TikTok = s.tiktok
			existing.Website = s.website
			existing.OpeningTime = s.openingTime
			existing.ClosingTime = s.closingTime
			if err := DB.Save(&existing).Error; err != nil {
				return err
			}
			continue
		}

		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("supplier123"), bcrypt.DefaultCost)
		if err != nil {
			return err
		}

		supplier := models.User{
			Email:       s.email,
			Password:    string(hashedPassword),
			Name:        s.name,
			Phone:       s.phone,
			Address:     s.address,
			Latitude:    s.latitude,
			Longitude:   s.longitude,
			LogoURL:     s.logoURL,
			BannerURL:   s.bannerURL,
			Facebook:    s.facebook,
			Instagram:   s.instagram,
			Twitter:     s.twitter,
			LinkedIn:    s.linkedin,
			YouTube:     s.youtube,
			TikTok:      s.tiktok,
			Website:     s.website,
			OpeningTime: s.openingTime,
			ClosingTime: s.closingTime,
			Role:        models.RoleSupplier,
		}

		if err := DB.Create(&supplier).Error; err != nil {
			return err
		}
	}

	return nil
}

func SeedStores() error {
	stores := []struct {
		email       string
		name        string
		phone       string
		logoURL     string
		bannerURL   string
		address     string
		latitude    *float64
		longitude   *float64
		facebook    string
		instagram   string
		twitter     string
		linkedin    string
		youtube     string
		tiktok      string
		website     string
		openingTime string
		closingTime string
	}{
		{"keyun@example.com", "Keyun", "09223456784", "", "", "Tourism Road, General Luna, Surigao del Norte", floatPtr(9.8430472), floatPtr(126.1347197), "", "", "", "", "", "", "", "08:00", "18:00"},
	}

	for _, s := range stores {
		var existing models.User
		if err := DB.Where("email = ?", s.email).First(&existing).Error; err == nil {
			existing.Name = s.name
			existing.Phone = s.phone
			if s.logoURL != "" {
				existing.LogoURL = s.logoURL
			}
			if s.bannerURL != "" {
				existing.BannerURL = s.bannerURL
			}
			existing.Address = s.address
			existing.Latitude = s.latitude
			existing.Longitude = s.longitude
			existing.Facebook = s.facebook
			existing.Instagram = s.instagram
			existing.Twitter = s.twitter
			existing.LinkedIn = s.linkedin
			existing.YouTube = s.youtube
			existing.TikTok = s.tiktok
			existing.Website = s.website
			existing.OpeningTime = s.openingTime
			existing.ClosingTime = s.closingTime
			if err := DB.Save(&existing).Error; err != nil {
				return err
			}
			continue
		}

		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("store123"), bcrypt.DefaultCost)
		if err != nil {
			return err
		}

		store := models.User{
			Email:       s.email,
			Password:    string(hashedPassword),
			Name:        s.name,
			Phone:       s.phone,
			Address:     s.address,
			Latitude:    s.latitude,
			Longitude:   s.longitude,
			LogoURL:     s.logoURL,
			BannerURL:   s.bannerURL,
			Facebook:    s.facebook,
			Instagram:   s.instagram,
			Twitter:     s.twitter,
			LinkedIn:    s.linkedin,
			YouTube:     s.youtube,
			TikTok:      s.tiktok,
			Website:     s.website,
			OpeningTime: s.openingTime,
			ClosingTime: s.closingTime,
			Role:        models.RoleStore,
		}

		if err := DB.Create(&store).Error; err != nil {
			return err
		}
	}

	return nil
}

func SeedProducts() error {
	supplierProducts := map[string][]struct {
		name        string
		description string
		sku         string
		price       float64
		stock       int
		unit        string
		category    string
		imageURL    string
	}{
		"aron@example.com": {
			{"White Sugar 1kg", "White refined sugar", "ARONS-SUG-001", 65.00, 300, "kg", "Consumer Goods", ""},
			{"Brown Sugar 1kg", "Brown sugar", "ARONS-SUG-002", 70.00, 250, "kg", "Consumer Goods", ""},
			{"Cooking Oil 1L", "Vegetable cooking oil", "ARONS-OIL-001", 120.00, 200, "bottle", "Consumer Goods", ""},
			{"Red Rice Bernal 25kg", "Premium red rice", "ARONS-RIC-001", 1300.00, 150, "bag", "Consumer Goods", ""},
			{"Red Rice Yan Yan 25kg", "High quality red rice", "ARONS-RIC-002", 1350.00, 140, "bag", "Consumer Goods", ""},
			{"Royal Product", "Royal brand product", "ARONS-ROY-001", 150.00, 100, "piece", "Consumer Goods", ""},
			{"Ganador", "Ganador product", "ARONS-GAN-001", 180.00, 120, "piece", "Consumer Goods", ""},
			{"Kohaku Yellow", "Kohaku yellow product", "ARONS-KOH-001", 200.00, 90, "piece", "Consumer Goods", ""},
			{"Nikel", "Nikel product", "ARONS-NIK-001", 95.00, 180, "piece", "Consumer Goods", ""},
		},
	}

	for email, products := range supplierProducts {
		var supplier models.User
		if err := DB.Where("role = ? AND email = ?", "supplier", email).First(&supplier).Error; err != nil {
			continue
		}

		for _, template := range products {
			var existing models.Product
			if err := DB.Unscoped().Where("sku = ?", template.sku).First(&existing).Error; err == nil {
				if existing.DeletedAt.Valid {
					var zeroDeletedAt gorm.DeletedAt
					existing.DeletedAt = zeroDeletedAt
					existing.SupplierID = supplier.ID
					existing.Name = template.name
					existing.Description = template.description
					existing.Price = template.price
					existing.StockQuantity = template.stock
					existing.Unit = template.unit
					existing.Category = template.category
					if err := DB.Unscoped().Save(&existing).Error; err != nil {
						return err
					}
				}
				continue
			}

			product := models.Product{
				SupplierID:    supplier.ID,
				Name:          template.name,
				Description:   template.description,
				SKU:           template.sku,
				Price:         template.price,
				StockQuantity: template.stock,
				Unit:          template.unit,
				Category:      template.category,
				ImageURL:      template.imageURL,
			}

			if err := DB.Create(&product).Error; err != nil {
				if err.Error() != "ERROR: duplicate key value violates unique constraint \"products_sku_key\" (SQLSTATE 23505)" {
					return err
				}
			}
		}
	}

	return nil
}

func SeedOrders() error {
	return nil
}

func SeedRatings() error {
	return nil
}
