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
		{"nike@example.com", "Nike", "09123456781", fmt.Sprintf("%s/nikelogo.png", s3BaseURL), fmt.Sprintf("%s/nikebanner.jpg", s3BaseURL)},
		{"toms@example.com", "Toms", "09123456782", fmt.Sprintf("%s/tomslogo.jpeg", s3BaseURL), fmt.Sprintf("%s/tomsbanner.jpg", s3BaseURL)},
		{"711@example.com", "7-Eleven", "09123456783", fmt.Sprintf("%s/711logo.png", s3BaseURL), fmt.Sprintf("%s/711banner.webp", s3BaseURL)},
		{"walmart@example.com", "Walmart", "09123456784", fmt.Sprintf("%s/walmartlogo.png", s3BaseURL), fmt.Sprintf("%s/walmartbanner.jpg", s3BaseURL)},
	}

	for _, s := range suppliers {
		var existing models.User
		if err := DB.Where("email = ?", s.email).First(&existing).Error; err == nil {
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
	stores := []struct {
		email string
		name  string
		phone string
	}{
		{"store1@example.com", "Supermarket Chain", "09223456781"},
		{"store2@example.com", "Convenience Store", "09223456782"},
		{"store3@example.com", "Restaurant Supply", "09223456783"},
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
			Email:    s.email,
			Password: string(hashedPassword),
			Name:     s.name,
			Phone:    s.phone,
			Role:     models.RoleStore,
		}

		if err := DB.Create(&store).Error; err != nil {
			return err
		}
	}

	return nil
}

func SeedProducts() error {
	var suppliers []models.User
	if err := DB.Where("role = ?", "supplier").Find(&suppliers).Error; err != nil {
		return err
	}

	productTemplates := []struct {
		name        string
		description string
		sku         string
		price       float64
		stock       int
		unit        string
		category    string
	}{
		{"Premium Rice 50kg", "High quality premium rice", "RICE-001", 2500.00, 100, "bag", "Grains"},
		{"Fresh Chicken Whole", "Fresh whole chicken", "CHICKEN-001", 180.00, 200, "piece", "Meat"},
		{"Coca Cola 1.5L", "Carbonated soft drink", "BEV-001", 75.00, 500, "bottle", "Beverages"},
		{"Tomatoes Fresh", "Fresh red tomatoes", "VEG-001", 80.00, 300, "kg", "Vegetables"},
		{"Pork Belly", "Fresh pork belly", "PORK-001", 350.00, 150, "kg", "Meat"},
		{"Sprite 1.5L", "Lemon-lime soft drink", "BEV-002", 75.00, 500, "bottle", "Beverages"},
		{"Onions", "Fresh white onions", "VEG-002", 60.00, 250, "kg", "Vegetables"},
		{"Beef Steak", "Premium beef steak cuts", "BEEF-001", 450.00, 100, "kg", "Meat"},
		{"Mineral Water 500ml", "Purified drinking water", "BEV-003", 25.00, 1000, "bottle", "Beverages"},
		{"Potatoes", "Fresh potatoes", "VEG-003", 70.00, 200, "kg", "Vegetables"},
	}

	for i, supplier := range suppliers {
		for j, template := range productTemplates {
			sku := template.sku + "-" + string(rune('A'+i))
			var existing models.Product
			if err := DB.Where("sku = ?", sku).First(&existing).Error; err == nil {
				continue
			}

			product := models.Product{
				SupplierID:    supplier.ID,
				Name:          template.name,
				Description:   template.description,
				SKU:           sku,
				Price:         template.price,
				StockQuantity: template.stock + (j * 10),
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
		storeIndex    int
		supplierIndex int
	}{
		{0, 0}, {0, 1}, {0, 2},
		{1, 0}, {1, 1}, {1, 2},
		{2, 0}, {2, 1}, {2, 2},
		{2, 0},
	}

	orderCount := 0
	usedKeys := make(map[string]bool)

	for i, combo := range combinations {
		if orderCount >= 10 {
			break
		}

		if combo.storeIndex >= len(stores) || combo.supplierIndex >= len(suppliers) {
			continue
		}

		store := stores[combo.storeIndex]
		supplier := suppliers[combo.supplierIndex]
		status := statuses[i%len(statuses)]
		key := fmt.Sprintf("%d-%d-%s", store.ID, supplier.ID, status)

		if usedKeys[key] && orderCount < 9 {
			continue
		}

		var products []models.Product
		if err := DB.Where("supplier_id = ?", supplier.ID).Limit(3).Find(&products).Error; err != nil || len(products) == 0 {
			continue
		}

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
			quantity := (j + 1) * 10
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
