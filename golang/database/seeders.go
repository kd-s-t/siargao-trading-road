package database

import (
	"fmt"
	"siargao-trading-road/models"

	"golang.org/x/crypto/bcrypt"
)

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

	if err := DB.Exec("TRUNCATE TABLE order_items, orders, products, business_documents, users CASCADE").Error; err != nil {
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

	return nil
}

func SeedSuppliers() error {
	const s3BaseURL = "https://siargaotradingroad-user-uploads-development.s3.us-east-1.amazonaws.com"

	suppliers := []struct {
		email     string
		name      string
		phone     string
		logoURL   string
		bannerURL string
	}{
		{"nike@example.com", "Nike", "09123456781", fmt.Sprintf("%s/assets/nikelogo.png", s3BaseURL), fmt.Sprintf("%s/assets/nikebanner.jpg", s3BaseURL)},
		{"toms@example.com", "Toms and Toms Coffee Shop", "09123456782", fmt.Sprintf("%s/assets/tomslogo.jpeg", s3BaseURL), fmt.Sprintf("%s/assets/tomsbanner.jpg", s3BaseURL)},
		{"711@example.com", "7-Eleven", "09123456783", fmt.Sprintf("%s/assets/711logo.png", s3BaseURL), fmt.Sprintf("%s/assets/711banner.webp", s3BaseURL)},
		{"walmart@example.com", "Walmart", "09123456784", fmt.Sprintf("%s/assets/walmartlogo.png", s3BaseURL), fmt.Sprintf("%s/assets/walmartbanner.jpg", s3BaseURL)},
	}

	for _, s := range suppliers {
		var existing models.User
		if err := DB.Where("email = ?", s.email).First(&existing).Error; err == nil {
			existing.Name = s.name
			existing.Phone = s.phone
			existing.LogoURL = s.logoURL
			existing.BannerURL = s.bannerURL
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
			Email:     s.email,
			Password:  string(hashedPassword),
			Name:      s.name,
			Phone:     s.phone,
			LogoURL:   s.logoURL,
			BannerURL: s.bannerURL,
			Role:      models.RoleSupplier,
		}

		if err := DB.Create(&supplier).Error; err != nil {
			return err
		}
	}

	return nil
}

func SeedStores() error {
	const s3BaseURL = "https://siargaotradingroad-user-uploads-development.s3.us-east-1.amazonaws.com"

	stores := []struct {
		email     string
		name      string
		phone     string
		logoURL   string
		bannerURL string
	}{
		{"ervies@example.com", "Ervies", "09223456781", fmt.Sprintf("%s/assets/ervieslogo.jpeg", s3BaseURL), fmt.Sprintf("%s/assets/ervieslogobanner.jpeg", s3BaseURL)},
		{"sarisari@example.com", "Sarisari", "09223456782", fmt.Sprintf("%s/assets/sarisarilogo.png", s3BaseURL), fmt.Sprintf("%s/assets/sarisarilogobanner.png", s3BaseURL)},
		{"kicks@example.com", "Kicks", "09223456783", fmt.Sprintf("%s/assets/kickslogo.jpeg", s3BaseURL), fmt.Sprintf("%s/assets/kicksbanner.jpeg", s3BaseURL)},
	}

	for _, s := range stores {
		var existing models.User
		if err := DB.Where("email = ?", s.email).First(&existing).Error; err == nil {
			continue
		}

		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("store123"), bcrypt.DefaultCost)
		if err != nil {
			return err
		}

		store := models.User{
			Email:     s.email,
			Password:  string(hashedPassword),
			Name:      s.name,
			Phone:     s.phone,
			LogoURL:   s.logoURL,
			BannerURL: s.bannerURL,
			Role:      models.RoleStore,
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
	}{
		"nike@example.com": {
			{"Nike Air Max Running Shoes", "Premium running shoes with air cushioning", "NIKE-SHOE-001", 5500.00, 50, "pair", "Footwear"},
			{"Nike Dri-FIT T-Shirt", "Moisture-wicking athletic t-shirt", "NIKE-APP-001", 1200.00, 100, "piece", "Apparel"},
			{"Nike Basketball", "Official size basketball", "NIKE-EQP-001", 2500.00, 75, "piece", "Equipment"},
			{"Nike Sports Socks Pack", "Pack of 3 athletic socks", "NIKE-ACC-001", 450.00, 200, "pack", "Accessories"},
			{"Nike Water Bottle", "Reusable sports water bottle", "NIKE-ACC-002", 800.00, 150, "piece", "Accessories"},
			{"Nike Backpack", "Sports backpack with multiple compartments", "NIKE-ACC-003", 3500.00, 60, "piece", "Accessories"},
		},
		"toms@example.com": {
			{"Premium Arabica Coffee Beans 1kg", "High quality Arabica coffee beans", "TOMS-COF-001", 850.00, 100, "kg", "Coffee"},
			{"Espresso Blend 500g", "Dark roast espresso blend", "TOMS-COF-002", 650.00, 150, "kg", "Coffee"},
			{"Coffee Filters 100pcs", "Paper coffee filters", "TOMS-ACC-001", 120.00, 300, "pack", "Accessories"},
			{"French Press Coffee Maker", "Stainless steel French press", "TOMS-EQP-001", 2500.00, 40, "piece", "Equipment"},
			{"Coffee Grinder", "Electric coffee bean grinder", "TOMS-EQP-002", 3500.00, 30, "piece", "Equipment"},
			{"Coffee Cups Set of 4", "Ceramic coffee cups", "TOMS-ACC-002", 800.00, 80, "set", "Accessories"},
		},
		"711@example.com": {
			{"Coca Cola 1.5L", "Carbonated soft drink", "711-BEV-001", 75.00, 500, "bottle", "Beverages"},
			{"Instant Noodles Pack", "Pack of instant noodles", "711-FOD-001", 25.00, 1000, "pack", "Food"},
			{"Chips Variety Pack", "Assorted chips pack", "711-SNK-001", 150.00, 300, "pack", "Snacks"},
			{"Mineral Water 500ml", "Purified drinking water", "711-BEV-002", 25.00, 1000, "bottle", "Beverages"},
			{"Energy Drink", "Caffeinated energy drink", "711-BEV-003", 95.00, 400, "can", "Beverages"},
			{"Sandwich", "Ready-to-eat sandwich", "711-FOD-002", 120.00, 200, "piece", "Food"},
		},
		"walmart@example.com": {
			{"Premium Rice 50kg", "High quality premium rice", "WAL-GRN-001", 2500.00, 100, "bag", "Grains"},
			{"Fresh Chicken Whole", "Fresh whole chicken", "WAL-MT-001", 180.00, 200, "piece", "Meat"},
			{"Tomatoes Fresh", "Fresh red tomatoes", "WAL-VEG-001", 80.00, 300, "kg", "Vegetables"},
			{"Pork Belly", "Fresh pork belly", "WAL-MT-002", 350.00, 150, "kg", "Meat"},
			{"Onions", "Fresh white onions", "WAL-VEG-002", 60.00, 250, "kg", "Vegetables"},
			{"Beef Steak", "Premium beef steak cuts", "WAL-MT-003", 450.00, 100, "kg", "Meat"},
		},
	}

	for email, products := range supplierProducts {
		var supplier models.User
		if err := DB.Where("role = ? AND email = ?", "supplier", email).First(&supplier).Error; err != nil {
			continue
		}

		for _, template := range products {
			var existing models.Product
			if err := DB.Where("sku = ?", template.sku).First(&existing).Error; err == nil {
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
			}

			if err := DB.Create(&product).Error; err != nil {
				return err
			}
		}
	}

	return nil
}

func SeedOrders() error {
	var stores []models.User
	if err := DB.Where("role = ?", "store").Find(&stores).Error; err != nil {
		return err
	}

	var suppliers []models.User
	if err := DB.Where("role = ?", "supplier").Find(&suppliers).Error; err != nil {
		return err
	}

	if len(stores) == 0 || len(suppliers) == 0 {
		return nil
	}

	statuses := []models.OrderStatus{
		models.OrderStatusPreparing,
		models.OrderStatusPreparing,
		models.OrderStatusInTransit,
		models.OrderStatusInTransit,
		models.OrderStatusDelivered,
		models.OrderStatusDelivered,
		models.OrderStatusDelivered,
		models.OrderStatusCancelled,
		models.OrderStatusPreparing,
		models.OrderStatusInTransit,
	}

	combinations := []struct {
		storeEmail    string
		supplierEmail string
	}{
		{"kicks@example.com", "nike@example.com"},
		{"kicks@example.com", "nike@example.com"},
		{"kicks@example.com", "nike@example.com"},
		{"ervies@example.com", "toms@example.com"},
		{"ervies@example.com", "toms@example.com"},
		{"ervies@example.com", "toms@example.com"},
		{"sarisari@example.com", "711@example.com"},
		{"sarisari@example.com", "711@example.com"},
		{"sarisari@example.com", "walmart@example.com"},
		{"sarisari@example.com", "walmart@example.com"},
	}

	orderCount := 0
	usedKeys := make(map[string]bool)

	for i, combo := range combinations {
		if orderCount >= 10 {
			break
		}

		var store models.User
		if err := DB.Where("role = ? AND email = ?", "store", combo.storeEmail).First(&store).Error; err != nil {
			continue
		}

		var supplier models.User
		if err := DB.Where("role = ? AND email = ?", "supplier", combo.supplierEmail).First(&supplier).Error; err != nil {
			continue
		}

		status := statuses[i%len(statuses)]
		key := fmt.Sprintf("%d-%d-%s", store.ID, supplier.ID, status)

		if usedKeys[key] && orderCount < 9 {
			continue
		}

		var products []models.Product
		if err := DB.Where("supplier_id = ?", supplier.ID).Limit(4).Find(&products).Error; err != nil || len(products) == 0 {
			continue
		}

		numItems := 2 + (i % 3)
		if numItems > len(products) {
			numItems = len(products)
		}
		products = products[:numItems]

		order := models.Order{
			StoreID:         store.ID,
			SupplierID:      supplier.ID,
			Status:          status,
			TotalAmount:     0,
			ShippingAddress: "123 Main Street, City, Province",
			Notes:           "Please deliver during business hours",
		}

		if err := DB.Create(&order).Error; err != nil {
			continue
		}

		var totalAmount float64
		for j, product := range products {
			var quantity int
			switch {
			case product.Unit == "pair" || product.Unit == "piece" && product.Category == "Footwear":
				quantity = 5 + (j * 2)
			case product.Unit == "piece" && (product.Category == "Equipment" || product.Category == "Apparel"):
				quantity = 10 + (j * 5)
			case product.Unit == "kg" && product.Category == "Coffee":
				quantity = 2 + j
			case product.Unit == "kg":
				quantity = 10 + (j * 5)
			case product.Unit == "bottle" || product.Unit == "can":
				quantity = 24 + (j * 12)
			case product.Unit == "pack":
				quantity = 12 + (j * 6)
			case product.Unit == "set":
				quantity = 2 + j
			default:
				quantity = 10 + (j * 5)
			}

			subtotal := product.Price * float64(quantity)

			orderItem := models.OrderItem{
				OrderID:   order.ID,
				ProductID: product.ID,
				Quantity:  quantity,
				UnitPrice: product.Price,
				Subtotal:  subtotal,
			}

			if err := DB.Create(&orderItem).Error; err != nil {
				continue
			}

			totalAmount += subtotal
		}

		order.TotalAmount = totalAmount
		DB.Save(&order)

		usedKeys[key] = true
		orderCount++
	}

	return nil
}
