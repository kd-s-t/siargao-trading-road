package main

import (
	"fmt"
	"testing"
)

func TestFullBusinessFlow(t *testing.T) {
	cfg := setupTestDB(t)
	defer cleanupTestDB(t)

	suppliers := []struct {
		email string
		name  string
	}{
		{"arni@arniestore.com", "Arnie Store"},
		{"sm@smstore.com", "SM Store"},
		{"ayala@ayalastore.com", "Ayala Store"},
	}

	supplierIDs := make([]uint, 3)
	supplierTokens := make([]string, 3)

	for i, supplier := range suppliers {
		t.Run("Register supplier "+supplier.name, func(t *testing.T) {
			client := NewTestClient(t, cfg)
			response := client.Register(supplier.email, "password123", supplier.name, "supplier")

			if token, ok := response["token"].(string); ok && token != "" {
				supplierTokens[i] = token
				if user, ok := response["user"].(map[string]interface{}); ok {
					supplierIDs[i] = Uint(user["id"])
					if supplierIDs[i] == 0 {
						t.Fatalf("Failed to extract supplier ID for %s, got 0", supplier.name)
					}
				} else {
					t.Fatalf("Failed to extract user from response for %s", supplier.name)
				}
			} else {
				t.Fatalf("Failed to register supplier %s: %v", supplier.name, response)
			}
		})
	}

	for i, supplier := range suppliers {
		t.Run("Supplier "+supplier.name+" add products", func(t *testing.T) {
			client := NewTestClient(t, cfg)
			client.SetToken(supplierTokens[i])

			for j := 1; j <= 10; j++ {
				product := map[string]interface{}{
					"name":           fmt.Sprintf("%s Product %d", supplier.name, j),
					"description":    "Test product description",
					"sku":            fmt.Sprintf("%s-SKU-%d", supplier.name, j),
					"price":          100.0 + float64(j)*10,
					"stock_quantity": 50 + j*5,
					"unit":           "piece",
					"category":       "test",
				}

				response := client.CreateProduct(product)
				if _, ok := response["id"]; !ok {
					t.Errorf("Failed to create product %d for %s", j, supplier.name)
				}
			}
		})
	}

	storeClients := make([]*TestClient, 3)
	storeTokens := make([]string, 3)

	for i := 0; i < 3; i++ {
		t.Run(fmt.Sprintf("Register and login store %d", i+1), func(t *testing.T) {
			client := NewTestClient(t, cfg)
			response := client.Register(
				fmt.Sprintf("store%d@test.com", i+1),
				"password123",
				fmt.Sprintf("Store %d", i+1),
				"store",
			)

			if token, ok := response["token"].(string); ok {
				storeTokens[i] = token
				storeClients[i] = client
			} else {
				t.Fatalf("Failed to register store %d", i+1)
			}
		})
	}

	for i := 0; i < 3; i++ {
		t.Run(fmt.Sprintf("Store %d create order with supplier %d", i+1, i+1), func(t *testing.T) {
			client := storeClients[i]
			if client == nil {
				t.Fatalf("Store client %d is nil", i+1)
			}
			client.SetToken(storeTokens[i])

			suppliersList := client.GetSuppliers()
			if len(suppliersList) == 0 {
				t.Fatal("No suppliers found")
			}

			selectedSupplierID := supplierIDs[i]

			order := client.CreateDraftOrder(selectedSupplierID)
			orderID := Uint(order["id"])

			products := client.GetSupplierProducts(selectedSupplierID)
			if len(products) == 0 {
				t.Fatal("No products found for supplier")
			}

			for j := 0; j < 3 && j < len(products); j++ {
				productID := Uint(products[j]["id"])
				quantity := 2
				client.AddOrderItem(orderID, productID, quantity)
			}

			client.UpdateOrderStatus(orderID, "preparing")
		})
	}

	for i := 0; i < 3; i++ {
		t.Run(fmt.Sprintf("Store %d create second order with supplier %d", i+1, (i+1)%3+1), func(t *testing.T) {
			client := storeClients[i]
			if client == nil {
				t.Fatalf("Store client %d is nil", i+1)
			}
			client.SetToken(storeTokens[i])

			selectedSupplierID := supplierIDs[(i+1)%3]

			order := client.CreateDraftOrder(selectedSupplierID)
			orderID := Uint(order["id"])

			products := client.GetSupplierProducts(selectedSupplierID)
			if len(products) == 0 {
				t.Fatal("No products found for supplier")
			}

			for j := 0; j < 3 && j < len(products); j++ {
				productID := Uint(products[j]["id"])
				quantity := 2
				client.AddOrderItem(orderID, productID, quantity)
			}

			client.UpdateOrderStatus(orderID, "preparing")
		})
	}

	for i := 0; i < 3; i++ {
		t.Run(fmt.Sprintf("Store %d create third order with supplier %d", i+1, (i+2)%3+1), func(t *testing.T) {
			client := storeClients[i]
			if client == nil {
				t.Fatalf("Store client %d is nil", i+1)
			}
			client.SetToken(storeTokens[i])

			selectedSupplierID := supplierIDs[(i+2)%3]

			order := client.CreateDraftOrder(selectedSupplierID)
			orderID := Uint(order["id"])

			products := client.GetSupplierProducts(selectedSupplierID)
			if len(products) == 0 {
				t.Fatal("No products found for supplier")
			}

			for j := 0; j < 3 && j < len(products); j++ {
				productID := Uint(products[j]["id"])
				quantity := 2
				client.AddOrderItem(orderID, productID, quantity)
			}

			client.UpdateOrderStatus(orderID, "preparing")
		})
	}

	for i := 0; i < 3; i++ {
		t.Run(fmt.Sprintf("Supplier %d check and prepare order", i+1), func(t *testing.T) {
			client := NewTestClient(t, cfg)
			client.SetToken(supplierTokens[i])

			orders := client.GetOrders()
			if len(orders) == 0 {
				t.Fatal("No orders found for supplier")
			}

			orderID := Uint(orders[0]["id"])

			currentOrder := client.GetOrder(orderID)
			currentStatus, _ := currentOrder["status"].(string)

			if currentStatus != "preparing" {
				client.UpdateOrderStatus(orderID, "preparing")
			}
		})
	}

	for i := 0; i < 3; i++ {
		t.Run(fmt.Sprintf("Supplier %d set order to in transit", i+1), func(t *testing.T) {
			client := NewTestClient(t, cfg)
			client.SetToken(supplierTokens[i])

			orders := client.GetOrders()
			if len(orders) == 0 {
				t.Fatal("No orders found for supplier")
			}

			orderID := Uint(orders[0]["id"])

			currentOrder := client.GetOrder(orderID)
			currentStatus, _ := currentOrder["status"].(string)

			if currentStatus != "preparing" {
				client.UpdateOrderStatus(orderID, "preparing")
			}

			client.UpdateOrderStatus(orderID, "in_transit")
		})
	}

	for i := 0; i < 3; i++ {
		t.Run(fmt.Sprintf("Supplier %d set order to delivered", i+1), func(t *testing.T) {
			client := NewTestClient(t, cfg)
			client.SetToken(supplierTokens[i])

			orders := client.GetOrders()
			if len(orders) == 0 {
				t.Fatal("No orders found for supplier")
			}

			orderID := Uint(orders[0]["id"])

			currentOrder := client.GetOrder(orderID)
			currentStatus := currentOrder["status"].(string)

			if currentStatus != "preparing" {
				client.UpdateOrderStatus(orderID, "preparing")
			}

			currentOrder = client.GetOrder(orderID)
			currentStatus, _ = currentOrder["status"].(string)
			if currentStatus != "in_transit" {
				client.UpdateOrderStatus(orderID, "in_transit")
			}

			client.UpdateOrderStatus(orderID, "delivered")
		})
	}
}
