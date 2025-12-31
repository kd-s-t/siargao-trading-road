package services

import (
	_ "embed"
	"encoding/base64"
	"fmt"
	"log"
	"strconv"
	"siargao-trading-road/config"
	"siargao-trading-road/models"

	"gopkg.in/gomail.v2"
)

//go:embed assets/splash.png
var logoBytes []byte

type EmailService struct {
	config    *config.Config
	logoBase64 string
}

func NewEmailService(cfg *config.Config) *EmailService {
	logoBase64 := ""
	if len(logoBytes) > 0 {
		logoBase64 = base64.StdEncoding.EncodeToString(logoBytes)
	}
	return &EmailService{
		config:     cfg,
		logoBase64: logoBase64,
	}
}

func (es *EmailService) getEmailHeader() string {
	logoImg := ""
	if es.logoBase64 != "" {
		logoImg = fmt.Sprintf(`<img src="data:image/png;base64,%s" alt="Siargao Trading Road" style="max-width: 200px; height: auto; margin-bottom: 20px;" />`, es.logoBase64)
	}
	return fmt.Sprintf(`
		<div style="background-color: #ffffff; padding: 20px 0; text-align: center; border-bottom: 2px solid #3498db;">
			%s
		</div>
	`, logoImg)
}

func (es *EmailService) getEmailFooter() string {
	return `
		<div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin-top: 30px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px;">
			<p style="margin: 5px 0;">© 2024 Siargao Trading Road. All rights reserved.</p>
			<p style="margin: 5px 0;">Connecting suppliers and stores in Siargao</p>
		</div>
	`
}

func (es *EmailService) SendEmail(to, subject, body string) error {
	if es.config.SMTPHost == "" || es.config.SMTPUser == "" || es.config.SMTPPassword == "" {
		log.Printf("Email not configured, skipping email to %s", to)
		return nil
	}

	m := gomail.NewMessage()
	m.SetHeader("From", es.config.SMTPFrom)
	m.SetHeader("To", to)
	m.SetHeader("Subject", subject)
	m.SetBody("text/html", body)

	port := 587
	if es.config.SMTPPort != "" {
		if p, err := strconv.Atoi(es.config.SMTPPort); err == nil {
			port = p
		}
	}

	d := gomail.NewDialer(es.config.SMTPHost, port, es.config.SMTPUser, es.config.SMTPPassword)

	if err := d.DialAndSend(m); err != nil {
		log.Printf("Failed to send email to %s: %v", to, err)
		return err
	}

	log.Printf("Email sent successfully to %s", to)
	return nil
}

func (es *EmailService) SendThankYouEmail(user models.User) error {
	subject := "Welcome to Siargao Trading Road!"
	body := fmt.Sprintf(`
		<html>
		<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
			<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
				%s
				<div style="padding: 20px;">
					<h1 style="color: #2c3e50; margin-top: 0;">Thank You for Registering!</h1>
					<p>Dear %s,</p>
					<p>Welcome to Siargao Trading Road! We're excited to have you on board.</p>
					<p>Your account has been successfully created. You can now start trading and connecting with suppliers and stores in the Siargao area.</p>
					<p>If you have any questions or need assistance, please don't hesitate to reach out to us.</p>
					<p>Best regards,<br>The Siargao Trading Road Team</p>
				</div>
				%s
			</div>
		</body>
		</html>
	`, es.getEmailHeader(), user.Name, es.getEmailFooter())

	return es.SendEmail(user.Email, subject, body)
}

func (es *EmailService) SendOrderSuccessEmail(order models.Order) error {
	subject := fmt.Sprintf("Order #%d Confirmed", order.ID)
	
	var paymentInfo string
	if order.PaymentMethod == models.PaymentMethodGCash {
		paymentInfo = fmt.Sprintf("Payment Method: GCash (Status: %s)", order.PaymentStatus)
	} else {
		paymentInfo = "Payment Method: Cash on Delivery"
	}

	var deliveryInfo string
	if order.DeliveryOption == models.DeliveryOptionDeliver {
		deliveryInfo = fmt.Sprintf("Delivery to: %s", order.ShippingAddress)
	} else {
		deliveryInfo = "Pickup at supplier location"
	}

	itemsList := ""
	for _, item := range order.OrderItems {
		itemsList += fmt.Sprintf("<tr><td>%s</td><td>%d</td><td>₱%.2f</td><td>₱%.2f</td></tr>", 
			item.Product.Name, item.Quantity, item.UnitPrice, item.Subtotal)
	}

	body := fmt.Sprintf(`
		<html>
		<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
			<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
				%s
				<div style="padding: 20px;">
					<h1 style="color: #2c3e50; margin-top: 0;">Order Confirmed!</h1>
					<p>Dear %s,</p>
					<p>Your order has been successfully submitted and is now being prepared.</p>
					<h2 style="color: #34495e;">Order Details</h2>
					<p><strong>Order ID:</strong> #%d</p>
					<p><strong>Supplier:</strong> %s</p>
					<p><strong>%s</strong></p>
					<p><strong>%s</strong></p>
					<p><strong>Status:</strong> %s</p>
					<table style="width: 100%%; border-collapse: collapse; margin: 20px 0;">
						<thead>
							<tr style="background-color: #34495e; color: white;">
								<th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Product</th>
								<th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Quantity</th>
								<th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Unit Price</th>
								<th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Subtotal</th>
							</tr>
						</thead>
						<tbody>
							%s
						</tbody>
					</table>
					<p style="text-align: right; font-size: 18px; font-weight: bold;">
						<strong>Total Amount: ₱%.2f</strong>
					</p>
					<p>We'll keep you updated on your order status. Thank you for your business!</p>
					<p>Best regards,<br>The Siargao Trading Road Team</p>
				</div>
				%s
			</div>
		</body>
		</html>
	`, es.getEmailHeader(), order.Store.Name, order.ID, order.Supplier.Name, paymentInfo, deliveryInfo, order.Status, itemsList, order.TotalAmount, es.getEmailFooter())

	emails := []string{}
	if order.Store.Email != "" {
		emails = append(emails, order.Store.Email)
	}
	if order.Supplier.Email != "" {
		emails = append(emails, order.Supplier.Email)
	}

	for _, email := range emails {
		if err := es.SendEmail(email, subject, body); err != nil {
			log.Printf("Failed to send order success email to %s: %v", email, err)
		}
	}

	return nil
}

func (es *EmailService) SendOrderStatusChangeEmail(order models.Order, oldStatus models.OrderStatus) error {
	subject := fmt.Sprintf("Order #%d Status Updated", order.ID)
	
	statusMessages := map[models.OrderStatus]string{
		models.OrderStatusPreparing: "Your order is now being prepared by the supplier.",
		models.OrderStatusInTransit: "Your order is now in transit and on its way to you.",
		models.OrderStatusDelivered: "Your order has been delivered! We hope you're satisfied with your purchase.",
		models.OrderStatusCancelled: "Your order has been cancelled.",
	}

	message := statusMessages[order.Status]
	if message == "" {
		message = fmt.Sprintf("Your order status has been updated to: %s", order.Status)
	}

	body := fmt.Sprintf(`
		<html>
		<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
			<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
				%s
				<div style="padding: 20px;">
					<h1 style="color: #2c3e50; margin-top: 0;">Order Status Updated</h1>
					<p>Dear %s,</p>
					<p>%s</p>
					<h2 style="color: #34495e;">Order Information</h2>
					<p><strong>Order ID:</strong> #%d</p>
					<p><strong>Previous Status:</strong> %s</p>
					<p><strong>Current Status:</strong> %s</p>
					<p><strong>Total Amount:</strong> ₱%.2f</p>
					<p>Thank you for your business!</p>
					<p>Best regards,<br>The Siargao Trading Road Team</p>
				</div>
				%s
			</div>
		</body>
		</html>
	`, es.getEmailHeader(), order.Store.Name, message, order.ID, oldStatus, order.Status, order.TotalAmount, es.getEmailFooter())

	emails := []string{}
	if order.Store.Email != "" {
		emails = append(emails, order.Store.Email)
	}
	if order.Supplier.Email != "" {
		emails = append(emails, order.Supplier.Email)
	}

	for _, email := range emails {
		if err := es.SendEmail(email, subject, body); err != nil {
			log.Printf("Failed to send status change email to %s: %v", email, err)
		}
	}

	return nil
}

func (es *EmailService) SendPaymentPaidEmail(order models.Order) error {
	subject := fmt.Sprintf("Payment Confirmed for Order #%d", order.ID)
	
	body := fmt.Sprintf(`
		<html>
		<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
			<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
				%s
				<div style="padding: 20px;">
					<h1 style="color: #2c3e50; margin-top: 0;">Payment Confirmed!</h1>
					<p>Dear %s,</p>
					<p>We're pleased to confirm that payment for your order has been received and verified.</p>
					<h2 style="color: #34495e;">Payment Details</h2>
					<p><strong>Order ID:</strong> #%d</p>
					<p><strong>Payment Method:</strong> %s</p>
					<p><strong>Payment Status:</strong> Paid</p>
					<p><strong>Total Amount:</strong> ₱%.2f</p>
					<p>Your order will now proceed to the next stage. Thank you for your payment!</p>
					<p>Best regards,<br>The Siargao Trading Road Team</p>
				</div>
				%s
			</div>
		</body>
		</html>
	`, es.getEmailHeader(), order.Store.Name, order.ID, order.PaymentMethod, order.TotalAmount, es.getEmailFooter())

	emails := []string{}
	if order.Store.Email != "" {
		emails = append(emails, order.Store.Email)
	}
	if order.Supplier.Email != "" {
		emails = append(emails, order.Supplier.Email)
	}

	for _, email := range emails {
		if err := es.SendEmail(email, subject, body); err != nil {
			log.Printf("Failed to send payment paid email to %s: %v", email, err)
		}
	}

	return nil
}

func (es *EmailService) SendOrderDeliveredEmail(order models.Order) error {
	subject := fmt.Sprintf("Order #%d Delivered", order.ID)
	
	deliveryDetails := ""
	if order.DeliveryOption == models.DeliveryOptionDeliver && order.ShippingAddress != "" {
		deliveryDetails = fmt.Sprintf("<p><strong>Delivery Address:</strong> %s</p>", order.ShippingAddress)
	} else {
		deliveryDetails = "<p><strong>Delivery Method:</strong> Pickup</p>"
	}
	
	body := fmt.Sprintf(`
		<html>
		<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
			<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
				%s
				<div style="padding: 20px;">
					<h1 style="color: #27ae60; margin-top: 0;">Order Delivered!</h1>
					<p>Dear %s,</p>
					<p>Great news! Your order has been successfully delivered.</p>
					<h2 style="color: #34495e;">Delivery Details</h2>
					<p><strong>Order ID:</strong> #%d</p>
					<p><strong>Total Amount:</strong> ₱%.2f</p>
					%s
					<p>We hope you're satisfied with your purchase. If you have any questions or concerns, please don't hesitate to contact us.</p>
					<p>Thank you for choosing Siargao Trading Road!</p>
					<p>Best regards,<br>The Siargao Trading Road Team</p>
				</div>
				%s
			</div>
		</body>
		</html>
	`, es.getEmailHeader(), order.Store.Name, order.ID, order.TotalAmount, deliveryDetails, es.getEmailFooter())

	emails := []string{}
	if order.Store.Email != "" {
		emails = append(emails, order.Store.Email)
	}
	if order.Supplier.Email != "" {
		emails = append(emails, order.Supplier.Email)
	}

	for _, email := range emails {
		if err := es.SendEmail(email, subject, body); err != nil {
			log.Printf("Failed to send delivery email to %s: %v", email, err)
		}
	}

	return nil
}

func (es *EmailService) SendInvoiceEmail(order models.Order, invoiceURL string) error {
	subject := fmt.Sprintf("Invoice for Order #%d", order.ID)
	
	invoiceLink := ""
	if invoiceURL != "" {
		invoiceLink = fmt.Sprintf(`<p><a href="%s" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Download Invoice</a></p>`, invoiceURL)
	}
	
	body := fmt.Sprintf(`
		<html>
		<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
			<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
				%s
				<div style="padding: 20px;">
					<h1 style="color: #2c3e50; margin-top: 0;">Your Invoice</h1>
					<p>Dear %s,</p>
					<p>Please find attached your invoice for Order #%d.</p>
					<p><strong>Total Amount:</strong> ₱%.2f</p>
					%s
					<p>Thank you for your business!</p>
					<p>Best regards,<br>The Siargao Trading Road Team</p>
				</div>
				%s
			</div>
		</body>
		</html>
	`, es.getEmailHeader(), order.Store.Name, order.ID, order.TotalAmount, invoiceLink, es.getEmailFooter())

	return es.SendEmail(order.Store.Email, subject, body)
}

