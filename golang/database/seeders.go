package database

import (
	"fmt"
	"siargao-trading-road/models"

	"golang.org/x/crypto/bcrypt"
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

	if err := DB.Exec("TRUNCATE TABLE audit_logs, ratings, order_items, orders, products, business_documents, users CASCADE").Error; err != nil {
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
	const s3BaseURL = "https://siargaotradingroad-user-uploads-development.s3.us-east-1.amazonaws.com"

	supplierLocations := map[string]struct {
		address   string
		latitude  *float64
		longitude *float64
	}{
		"nike@example.com":       {"Tourism Road, General Luna, Surigao del Norte", floatPtr(9.8404527), floatPtr(126.1356772)},
		"toms@example.com":       {"Tourism Road, General Luna, Surigao del Norte", floatPtr(9.8430472), floatPtr(126.1347197)},
		"711@example.com":        {"National Highway, Dapa, Surigao del Norte", floatPtr(9.8098413), floatPtr(126.1375574)},
		"walmart@example.com":    {"Del Carmen Road, Del Carmen, Surigao del Norte", floatPtr(9.7739032), floatPtr(126.1304724)},
		"arons@example.com":      {"Tourism Road, General Luna, Surigao del Norte", floatPtr(9.8404527), floatPtr(126.1356772)},
		"arniestore@example.com": {"National Highway, Dapa, Surigao del Norte", floatPtr(9.8098413), floatPtr(126.1375574)},
	}

	storeLocations := map[string]struct {
		address   string
		latitude  *float64
		longitude *float64
	}{
		"ervies@example.com":   {"Tourism Road, General Luna, Surigao del Norte", floatPtr(9.8404527), floatPtr(126.1356772)},
		"sarisari@example.com": {"National Highway, Dapa, Surigao del Norte", floatPtr(9.8098413), floatPtr(126.1375574)},
		"kicks@example.com":    {"Del Carmen Road, Del Carmen, Surigao del Norte", floatPtr(9.7739032), floatPtr(126.1304724)},
	}

	for email, location := range supplierLocations {
		var user models.User
		if err := DB.Where("email = ? AND role = ?", email, "supplier").First(&user).Error; err == nil {
			user.Address = location.address
			user.Latitude = location.latitude
			user.Longitude = location.longitude
			if err := DB.Save(&user).Error; err != nil {
				return fmt.Errorf("failed to update supplier %s: %w", email, err)
			}
		}
	}

	for email, location := range storeLocations {
		var user models.User
		if err := DB.Where("email = ? AND role = ?", email, "store").First(&user).Error; err == nil {
			user.Address = location.address
			user.Latitude = location.latitude
			user.Longitude = location.longitude
			if err := DB.Save(&user).Error; err != nil {
				return fmt.Errorf("failed to update store %s: %w", email, err)
			}
		}
	}

	return nil
}

func SeedSuppliers() error {
	const s3BaseURL = "https://siargaotradingroad-user-uploads-development.s3.us-east-1.amazonaws.com"

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
		workingDays string
		openingTime string
		closingTime string
	}{
		{"nike@example.com", "Nike", "09123456781", fmt.Sprintf("%s/assets/nikelogo.png", s3BaseURL), fmt.Sprintf("%s/assets/nikebanner.jpg", s3BaseURL), "Tourism Road, General Luna, Surigao del Norte", floatPtr(9.8404527), floatPtr(126.1356772), "https://facebook.com/nike", "https://instagram.com/nike", "https://twitter.com/nike", "https://linkedin.com/company/nike", "https://youtube.com/nike", "https://tiktok.com/@nike", "https://nike.com", "Monday-Friday", "09:00", "18:00"},
		{"toms@example.com", "Toms and Toms Coffee Shop", "09123456782", fmt.Sprintf("%s/assets/tomslogo.jpeg", s3BaseURL), fmt.Sprintf("%s/assets/tomsbanner.jpg", s3BaseURL), "Tourism Road, General Luna, Surigao del Norte", floatPtr(9.8430472), floatPtr(126.1347197), "https://facebook.com/tomscoffee", "https://instagram.com/tomscoffee", "", "", "", "https://tiktok.com/@tomscoffee", "https://tomscoffee.com", "Monday-Sunday", "07:00", "21:00"},
		{"711@example.com", "7-Eleven", "09123456783", fmt.Sprintf("%s/assets/711logo.png", s3BaseURL), fmt.Sprintf("%s/assets/711banner.webp", s3BaseURL), "National Highway, Dapa, Surigao del Norte", floatPtr(9.8098413), floatPtr(126.1375574), "https://facebook.com/7eleven", "https://instagram.com/7eleven", "https://twitter.com/7eleven", "", "", "", "https://7-eleven.com", "Monday-Sunday", "00:00", "23:59"},
		{"walmart@example.com", "Walmart", "09123456784", fmt.Sprintf("%s/assets/walmartlogo.png", s3BaseURL), fmt.Sprintf("%s/assets/walmartbanner.jpg", s3BaseURL), "Del Carmen Road, Del Carmen, Surigao del Norte", floatPtr(9.7739032), floatPtr(126.1304724), "https://facebook.com/walmart", "https://instagram.com/walmart", "https://twitter.com/walmart", "https://linkedin.com/company/walmart", "https://youtube.com/walmart", "", "https://walmart.com", "Monday-Sunday", "08:00", "22:00"},
		{"arons@example.com", "Arons Consumer goods store", "09123456785", fmt.Sprintf("%s/assets/aronslogo.png", s3BaseURL), fmt.Sprintf("%s/assets/aronsbanner.png", s3BaseURL), "Tourism Road, General Luna, Surigao del Norte", floatPtr(9.8404527), floatPtr(126.1356772), "", "", "", "", "", "", "", "Monday-Friday", "08:00", "18:00"},
		{"arniestore@example.com", "Arnie Store", "09123456786", fmt.Sprintf("%s/assets/arniestorelogo.png", s3BaseURL), fmt.Sprintf("%s/assets/arniestorebanner.png", s3BaseURL), "National Highway, Dapa, Surigao del Norte", floatPtr(9.8098413), floatPtr(126.1375574), "", "", "", "", "", "", "", "Monday-Friday", "08:00", "18:00"},
	}

	for _, s := range suppliers {
		var existing models.User
		if err := DB.Where("email = ?", s.email).First(&existing).Error; err == nil {
			existing.Name = s.name
			existing.Phone = s.phone
			existing.LogoURL = s.logoURL
			existing.BannerURL = s.bannerURL
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
			existing.WorkingDays = s.workingDays
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
			WorkingDays: s.workingDays,
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
	const s3BaseURL = "https://siargaotradingroad-user-uploads-development.s3.us-east-1.amazonaws.com"

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
		workingDays string
		openingTime string
		closingTime string
	}{
		{"ervies@example.com", "Ervies", "09223456781", fmt.Sprintf("%s/assets/ervieslogo.jpeg", s3BaseURL), fmt.Sprintf("%s/assets/ervieslogobanner.jpeg", s3BaseURL), "Tourism Road, General Luna, Surigao del Norte", floatPtr(9.8404527), floatPtr(126.1356772), "https://facebook.com/ervies", "https://instagram.com/ervies", "", "", "", "https://tiktok.com/@ervies", "", "Monday-Saturday", "08:00", "19:00"},
		{"sarisari@example.com", "Sarisari", "09223456782", fmt.Sprintf("%s/assets/sarisarilogo.png", s3BaseURL), fmt.Sprintf("%s/assets/sarisarilogobanner.png", s3BaseURL), "National Highway, Dapa, Surigao del Norte", floatPtr(9.8098413), floatPtr(126.1375574), "https://facebook.com/sarisari", "https://instagram.com/sarisari", "", "", "", "", "", "Monday-Sunday", "07:00", "20:00"},
		{"kicks@example.com", "Kicks", "09223456783", fmt.Sprintf("%s/assets/kickslogo.jpeg", s3BaseURL), fmt.Sprintf("%s/assets/kicksbanner.jpeg", s3BaseURL), "Del Carmen Road, Del Carmen, Surigao del Norte", floatPtr(9.7739032), floatPtr(126.1304724), "https://facebook.com/kicks", "https://instagram.com/kicks", "https://twitter.com/kicks", "", "", "https://tiktok.com/@kicks", "https://kicks.com", "Monday-Saturday", "09:00", "19:00"},
	}

	for _, s := range stores {
		var existing models.User
		if err := DB.Where("email = ?", s.email).First(&existing).Error; err == nil {
			existing.Name = s.name
			existing.Phone = s.phone
			existing.LogoURL = s.logoURL
			existing.BannerURL = s.bannerURL
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
			existing.WorkingDays = s.workingDays
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
			WorkingDays: s.workingDays,
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
	}{}

	for email, products := range supplierProducts {
		var supplier models.User
		if err := DB.Where("role = ? AND email = ?", "supplier", email).First(&supplier).Error; err != nil {
			continue
		}

		for _, template := range products {
			var existing models.Product
			if err := DB.Where("sku = ?", template.sku).First(&existing).Error; err == nil {
				if template.imageURL != "" {
					existing.ImageURL = template.imageURL
					if err := DB.Save(&existing).Error; err != nil {
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

		paymentMethod := models.PaymentMethodCashOnDelivery
		paymentStatus := models.PaymentStatusPaid
		deliveryOption := models.DeliveryOptionDeliver

		if i%3 == 0 {
			paymentMethod = models.PaymentMethodGCash
			if status == models.OrderStatusPreparing || status == models.OrderStatusInTransit {
				paymentStatus = models.PaymentStatusPending
			} else {
				paymentStatus = models.PaymentStatusPaid
			}
		}

		if i%2 == 0 {
			deliveryOption = models.DeliveryOptionPickup
		}

		order := models.Order{
			StoreID:         store.ID,
			SupplierID:      supplier.ID,
			Status:          status,
			TotalAmount:     0,
			PaymentMethod:   paymentMethod,
			PaymentStatus:   paymentStatus,
			DeliveryOption:  deliveryOption,
			DeliveryFee:     0.0,
			Distance:        0.0,
			ShippingAddress: "123 Main Street, City, Province",
			Notes:           "Please deliver during business hours",
		}

		if paymentMethod == models.PaymentMethodGCash && paymentStatus == models.PaymentStatusPending {
			order.PaymentProofURL = "https://siargaotradingroad-messaging-images-development.s3.us-east-1.amazonaws.com/payment-proofs/sample-proof.png"
		}

		if deliveryOption == models.DeliveryOptionPickup {
			order.ShippingAddress = ""
		}

		if err := DB.Create(&order).Error; err != nil {
			continue
		}

		var totalAmount float64
		var totalQuantity int
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
			totalQuantity += quantity

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

		if deliveryOption == models.DeliveryOptionDeliver {
			order.DeliveryFee = float64(totalQuantity) * 20.0
			order.Distance = 5.0 + float64(i%10)
		}

		order.TotalAmount = totalAmount + order.DeliveryFee
		DB.Save(&order)

		usedKeys[key] = true
		orderCount++
	}

	return nil
}

func SeedRatings() error {
	var deliveredOrders []models.Order
	if err := DB.Where("status = ?", models.OrderStatusDelivered).Find(&deliveredOrders).Error; err != nil {
		return err
	}

	if len(deliveredOrders) == 0 {
		return nil
	}

	ratingData := []struct {
		storeRating     int
		supplierRating  int
		storeComment    string
		supplierComment string
	}{
		{5, 5, "Excellent service and fast delivery. Products arrived in perfect condition.", "Great customer to work with. Clear communication and prompt payment."},
		{4, 4, "Good quality products. Delivery was on time. Would order again.", "Professional store owner. Easy to coordinate with."},
		{5, 4, "Outstanding supplier! Best prices and quality in the area.", "Reliable customer. Always pays on time."},
		{3, 5, "Products were okay but delivery was a bit delayed.", "Very understanding customer. Appreciate their patience."},
		{4, 5, "Satisfactory experience. Good communication throughout the process.", "Excellent customer. Highly recommend doing business with them."},
		{5, 5, "Perfect order! Everything was exactly as described.", "Great business partner. Very professional."},
		{4, 4, "Good experience overall. Would recommend.", "Pleasant to work with. Timely payments."},
		{5, 4, "Excellent quality and service. Will order again soon.", "Reliable and trustworthy customer."},
		{4, 5, "Good products, fast delivery. Very satisfied.", "Professional and easy to communicate with."},
		{5, 5, "Outstanding service! Best supplier we've worked with.", "Excellent customer. Highly recommended."},
	}

	for i, order := range deliveredOrders {
		// Check if ratings already exist for this order
		var existingRatings int64
		DB.Model(&models.Rating{}).Where("order_id = ?", order.ID).Count(&existingRatings)
		if existingRatings > 0 {
			continue // Skip if ratings already exist
		}

		// Use rating data in a cycle
		data := ratingData[i%len(ratingData)]

		storeRating := models.Rating{
			OrderID: order.ID,
			RaterID: order.StoreID,
			RatedID: order.SupplierID,
			Rating:  data.storeRating,
			Comment: data.storeComment,
		}

		if err := DB.Create(&storeRating).Error; err != nil {
			continue
		}

		supplierRating := models.Rating{
			OrderID: order.ID,
			RaterID: order.SupplierID,
			RatedID: order.StoreID,
			Rating:  data.supplierRating,
			Comment: data.supplierComment,
		}

		if err := DB.Create(&supplierRating).Error; err != nil {
			continue
		}
	}

	return nil
}
