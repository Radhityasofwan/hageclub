0. Introduction
QRISLY is a powerful and reliable QRIS payment solution for seamlessly integrating Indonesian digital payment methods into your applications. Built with enterprise-grade infrastructure and real-time support, QRISLY makes it easy for merchants to receive payments via QRIS with a seamless experience.

Dynamic QRIS Generation: Create QRIS codes with custom amounts and unique identifiers
Real-time Payment Tracking: Monitor payment status in real-time
Webhook Notifications: Receive payment notifications directly to your application
QRIS Management: Upload, manage, and organize QRIS codes with ease
Mobile Integration: Full integration with mobile apps for payment tracking
Enterprise Security: API key authentication with rate limiting and access control
99.9% Uptime SLA
RESTful API that's easy to integrate
Real-time Webhooks for instant notifications
Support for multiple payment providers
Generate API Key - Sign up at the dashboard and generate your API key
Integrate Endpoints - Use 4 main endpoints for payment workflow
Handle Webhooks - Setup webhooks to receive real-time payment notifications


1. auth
Add the API Key to the header of each request with the following format:

X-API-Key: your_api_key_here
You're now ready to make requests to QRISLY endpoints.

curl --location 'https://api-sandbox.collaborator.komerce.id/user/api/v1/qrisly/generate-qris' \
--header 'x-api-key: your-api-key' \
--header 'Content-Type: application/json' \
--data '{
    "qris_id": 18,
    "amount": 1000,
    "output_type": "string",
}'
API requests are limited based on your subscription tier. Pay attention to the following headers in each response:

Header	Description
X-RateLimit-Limit
Total requests allowed in the time window
X-RateLimit-Remaining
Number of requests remaining
X-RateLimit-Reset
Timestamp when the limit will reset
If you receive a 401 error, check:

✓ API Key is included in the X-API-Key header
✓ API Key is still active in the dashboard
✓ No extra spaces or characters in the API Key
✓ Make sure you're using HTTPS, not HTTP
🔐 Don't hardcode API Key - Use environment variables
🔄 Rotate API Key periodically - Update key every 90 days
📊 Monitor API usage - Check dashboard for usage tracking
🛡️ Use HTTPS - Always use HTTPS for all requests
⏱️ Implement retry logic - Use exponential backoff for error handling



2. Flow Overview
On first setup, upload your QRIS image to the platform. This only needs to be done once.

Request:

POST /api/v1/qrisly/upload-qris
- File: QRIS image (PNG/JPG)
- Name: Identity of your QRIS
Response:

{
  "qris_id": "9d6c9f9e-8c33-4f42-8b1f-0e6a3e2e7d10",
  "name": "abc",
  "merchant_name": "YZ Digital"
}
Every time there's a new order, generate a QRIS with the appropriate amount.

Request:

POST /api/v1/qrisly/generate-qris
- qris_id: from step 1
- amount: Amount to be paid in Rupiah
- output_type: "string" or "image"
Response:

{
  "history_id": 1758,
  "qris_string": "00020101...",
  "original_amount": 1000,
  "final_amount": 1001,
  "payment_status": "unpaid",
  "expiry_time": "2026-03-03 11:03:27"
}
💡 Tip: Save this history_id for tracking payment status later.

After generating the QRIS, the customer can scan and pay. You will receive webhook notifications automatically.

Webhook Event:

{
  "qris_history_id": 1771,
  "transaction_id": "TEST-177251866516",
  "payment_status": "paid",
  "amount": 1001,
  "paid_amount": 1001,
  "paid_at": "2026-03-03 13:17:47",
  "expired_at": "2026-03-03 13:22:22"
}
Verify the payment using the status endpoint to ensure confirmation.

Request:

GET /api/v1/qrisly/payment-status/{history_id}
Response:

{
  "history_id": 1770,
  "payment_status": "paid",
  "amount": 1001,
  "name": "ABC",
  "paid_at": null,
  "created_at": "2026-03-03T13:14:13+07:00",
  "updated_at": "2026-03-03T13:16:22+07:00"
}



3. Pricing
No setup fees or subscriptions. Pay only when you generate a QRIS!

Item	Cost
API Access
Free
Per QRIS Generation
IDR 100
Failed Transactions
Free
 (no charge)
Webhook Notifications
Free
QRIS Management
Free
QRIS generation fees will be decreased Balance wallet per use (pay per use)
Payment can be made via bank transfer or e-wallet


4. Available Endpoints
Upload QRIS image with merchant details to be used in QRIS generation.

Endpoint:

POST /api/v1/qrisly/upload-qris
Base URLs:

Production: https://api.collaborator.komerce.id/user
Sandbox: https://api-sandbox.collaborator.komerce.id/user
Request Format:

Content-Type: multipart/form-data
Request Parameters:

Parameter	Type	Required	Description
name
String
Yes
QRIS identity name (max 100 chars)
qris_image
File
Yes
QRIS image file (PNG/JPG, max 5MB)
Request Example:

curl -X POST "https://api-sandbox.collaborator.komerce.id/user/api/v1/qrisly/upload-qris" \
  -H "X-API-Key: your_api_key_here" \
  -F "name=ABC Online Store" \
  -F "qris_image=@/path/to/qris.png"
Success Response (200):

{
  "success": true,
  "message": "QRIS successfully uploaded and validated",
  "data": {
    "qris_id": "9d6c9f9e-8c33-4f42-8b1f-0e6a3e2e7d10",
    "provider": "DANA",
    "name": "ABC Store",
    "merchant_name": "ABC Store",
    "created_at": "2026-03-03 14:00:54"
  }
}
Error Response Examples:

// Invalid file format
{
  "message": "Please upload a file with one of these types: image/png,image/jpeg,image/jpg",
  "code": 400,
  "status": "error"
}
// File too large
{
  "message": "file size must be less than 5MB",
  "code": 400,
  "status": "error"
}
Key Points:

📤 Upload once, reuse qris_id for multiple transactions
🖼️ Supported formats: PNG, JPG
📊 Max file size: 5MB
✅ QRIS image will be validated automatically
Generate dynamic QRIS with custom amount for each transaction.

Endpoint:

POST /api/v1/qrisly/generate-qris
Base URLs:

Production: https://api.collaborator.komerce.id/user
Sandbox: https://api-sandbox.collaborator.komerce.id/user
Request Format:

Content-Type: application/json
Request Parameters:

Parameter	Type	Required	Description
qris_id
Number
Yes
QRIS ID from upload step
amount
Number
Yes
Amount in Rupiah (must be >= 1000)
output_type
String
Yes
"string" or "image"
unique_amount
Boolean
Yes
Add unique identifier to amount (default: true)
Request Example:

curl -X POST "https://api-sandbox.collaborator.komerce.id/user/api/v1/qrisly/generate-qris" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key_here" \
  -d '{
    "qris_id": 123,
    "amount": 100000,
    "output_type": "string",
    "unique_amount": true
  }'
Success Response (200):

{
  "success": true,
  "message": "QRIS successfully generated",
  "data": {
    "history_id": 1778,
    "qris_string": "000201021126360011com.danamon5230141331231230061010160313UME51450015ID.CO.VERIFKATORKODE0520418345220630058203645304100650045600962070703121703031280072G051160014ID.KOMERCE.VERIFKATOR52047648530335802ID0106012023012301070440000962220601141331231230071391000160131231230000000000000000000000000000000000000000000000000000000000000000063049FD2",
    "original_amount": 1000,
    "final_amount": 1003,
    "payment_status": "unpaid",
    "expiry_time": "2026-03-03 14:52:52"
  }
}
Error Response Examples:

// Invalid amount
{
  "message": "amount must be between 1000 and 100000000",
  "code": 400,
  "status": "error"
}
// QRIS not found
{
  "success": false,
  "message": "QRIS not found",
  "error_code": "QRIS_NOT_FOUND",
  "details": {
    "suggestion": "Verify QRIS ID or upload a new QRIS"
  }
}
When you enable unique_amount: true, QRISLY adds a unique decimal identifier to your amount. This helps your mobile app listener distinguish between identical amounts.

Example:

Original Amount Requested: IDR 10,000
Response with unique_amount: true: IDR 10,001
If you request IDR 10,000 again:
First request:  IDR 10,000 → IDR 10,001
Second request: IDR 10,000 → IDR 10,002
Third request:  IDR 10,000 → IDR 10,003
Why This Matters: Your mobile banking app listener reads the payment amount to confirm transactions. Without unique identifiers, two identical payments would look the same. The decimal addition (0.001, 0.002, etc.) tells the listener app that these are separate transactions, enabling proper tracking even when amounts match.

Key Points:

💵 IDR 100 per generate - charged immediately
🎯 Use unique_amount: true to prevent duplicate payments with identical amounts
📊 Each unique amount increment is tracked by QRISLY automatically
⏰ Default expiry: 15 minutes from generation
📱 Output can be string (for display in app) or image (for print)
🔔 Mobile app listener can distinguish transactions via the unique decimal identifier
Monitor real-time payment status for each generated QRIS.

Endpoint:

GET /api/v1/qrisly/payment-status/{history_id}
Base URLs:

Production: https://api.collaborator.komerce.id/user
Sandbox: https://api-sandbox.collaborator.komerce.id/user
Path Parameters:

Parameter	Type	Required	Description
history_id
INT
Yes
History ID from generate-qris response
Request Example:

curl -X GET "https://api-sandbox.collaborator.komerce.id/user/api/v1/qrisly/payment-status/1771" \
  -H "X-API-Key: your_api_key_here"
Success Response (200):

{
  "meta": {
    "message": "QRIS payment status successfully retrieved",
    "code": 200,
    "status": "success"
  },
  "data": {
    "history_id": 2720,
    "payment_status": "unpaid",
    "amount": 1003,
    "name": "ABC",
    "paid_at": null,
    "created_at": "2026-04-06T08:41:56+07:00",
    "updated_at": "2026-04-06T08:41:56+07:00"
  }
}
Payment Status Values:

Status	Description
unpaid
QRIS has been generated, waiting for payment
paid
Payment successfully received
expired
QRIS has expired, need to generate new
cancelled
Payment cancelled by user
Error Response Example:

{
  "meta": {
    "message": "Payment history not found",
    "code": 404,
    "status": "error"
  },
  "data": null
}
Key Points:

✅ Real-time status, updated instantly when payment is received
📞 Use this endpoint as fallback if webhook is not received
🔄 Safe to call multiple times without additional charges
⏰ Stored for 90 days after transaction



5. Webhook
QRISLY sends webhook notifications whenever there's a change in payment status. Implement webhooks to get real-time payment confirmation in your application.

After a customer pays through QRIS, QRISLY will:

Receive payment notification from payment provider
Validate payment details
Send webhook to your registered endpoint
Your application processes the notification and updates order status
Create an HTTP POST endpoint in your application to receive webhook:

POST https://yourapp.com/webhook/qrisly
Login to RajaOngkir dashboard
⁠Navigate to Webhook → QRISLY
⁠Make sure the APK Webhook configuration has been added
⁠Click "Outbound Webhook"
⁠Enter webhook URL: 
⁠Click Save
Sent when payment is successfully received.

Webhook Payload:

{
  "event": "payment.success",
  "timestamp": "2025-01-14T10:35:22Z",
  "data": {
    "qris_history_id": "8c5b8e8d-7b22-3e31-7a0e-0d5a2d1d6c09",
    "qris_id": "9d6c9f9e-8c33-4f42-8b1f-0e6a3e2e7d10",
    "amount": 100001,
    "original_amount": 100000,
    "status": "paid",
    "paid_at": "2025-01-14T10:35:22Z",
    "payment_method": "Bank Transfer",
    "payment_provider": "Bank BCA",
    "created_at": "2025-01-14T10:30:00Z"
  }
}
Sent when QRIS has expired and there's no payment.

Webhook Payload:

{
  "event": "payment.expired",
  "timestamp": "2025-01-15T23:59:59Z",
  "data": {
    "qris_history_id": "8c5b8e8d-7b22-3e31-7a0e-0d5a2d1d6c09",
    "qris_id": "9d6c9f9e-8c33-4f42-8b1f-0e6a3e2e7d10",
    "amount": 100001,
    "status": "expired",
    "created_at": "2025-01-14T10:30:00Z",
    "expired_at": "2025-01-15T23:59:59Z"
  }
}
Webhook Response

Your endpoint must return HTTP 200 OK with a JSON response:

{
  "success": true,
  "message": "Webhook received and processed"
}
If your application fails to process the webhook, QRISLY will retry 3 times with exponential backoff:

Retry 1: After 1 minute
Retry 2: After 5 minutes
Retry 3: After 15 minutes


6. Mobile App Listener (Download)
To monitor QRIS payments in real-time from your mobile device, download the QRISLY Payment Listener app. This app acts as a local webhook receiver and helps you test payment flows without a backend server.

📱 Real-time payment notifications on your phone
🔔 Instant alerts when QRIS is scanned
📊 Payment history and transaction logs
🧪 Perfect for testing and development
🔐 Secure local webhook handling
📈 Simple analytics dashboard
📥 Direct Download (Android)
https://storage.googleapis.com/komerce/Qrisly/Qrisly%20Assistant%20v2.0.0.apk
Download from direct APK link
Install on your mobile device (Android Only)
Grant necessary permissions (notifications, internet,battery)
Open QRISLY Listener app
Go to Settings → Webhook Configuration
Enter your local IP or ngrok tunnel: http://192.168.x.x:3000/webhooks/qrisly
Input your webhook secret key
Click Save & Test
Go to Dashboard
Generate a QRIS from your application
Scan with another phone's banking app
Watch real-time notifications appear in the listener app


7. Error Handling
Success Responses:

200 OK - Request successful
201 Created - Resource created successfully
Client Error Responses:

400 Bad Request - Invalid parameters or malformed JSON
401 Unauthorized - Invalid or missing API key
403 Forbidden - Insufficient permissions
404 Not Found - Resource not found
429 Too Many Requests - Rate limit exceeded
Server Error Responses:

500 Internal Server Error - Unexpected server error
503 Service Unavailable - Service temporarily unavailable
Error Code	Description	Solution
INVALID_API_KEY
API key is invalid or expired
Verify API key in dashboard
RATE_LIMIT_EXCEEDED
Too many requests
Wait or upgrade your plan
INVALID_QRIS_FORMAT
QRIS data format is invalid
Upload new QRIS or check format
QRIS_NOT_FOUND
QRIS ID does not exist
Verify QRIS ID or create new QRIS
PAYMENT_EXPIRED
Payment window has expired
Generate new QRIS for payment
VALIDATION_ERROR
Invalid request parameters
Check request body for errors
Problem: 401 Unauthorized

✓ Check if API key is included in X-API-Key header
✓ Verify API key is active in your dashboard
✓ Ensure no extra spaces or characters in API key
✓ Use HTTPS instead of HTTP
Problem: 429 Too Many Requests

✓ Implement exponential backoff in your retry logic
✓ Check Retry-After header for wait time
✓ Consider upgrading to higher tier for increased limits
✓ Batch requests when possible to reduce API calls
Problem: Invalid QRIS Format

✓ Ensure amount is a positive number
✓ Verify QRIS ID is a valid number
✓ Check output_type matches your subscription plan
✓ Validate all required fields are provided
✓ Always check the success field in responses
✓ Implement proper error handling for all status codes
✓ Use HTTPS for all API requests
✓ Monitor your API usage in the dashboard
✓ Set up webhooks and install the Listener Application
Get help, report issues, and connect with our developer community and support team.

Comprehensive guides and tutorials
Getting Started Guide
Integration Examples
Best Practices
FAQ & Troubleshooting
Email Support (24/7)

support@rajaongkir.com


## progress terakhir:

Fitur QRISLY selesai — typecheck bersih (TSC_EXIT=0), webhook terverifikasi live di dev server. Ringkasan:

Engine (lib/komerce-qrisly.ts + constants)

- Config dari panel admin: qrisly_api_key, qrisly_base_url (sandbox/production), qrisly_qris_id — semuanya di SystemSetting, cache 5 menit, tanpa API key tidak ada yang rusak (error NOT_CONFIGURED yang jelas)
- Upload QRIS statis (sekali, dipakai semua transaksi): POST /api/v1/qrisly/upload-qris — PNG/JPG ≤5MB, hasilnya qris_id + merchant name + provider otomatis tersimpan
- Generate QRIS dinamis: generate-qris — min Rp 1.000, unique_amount (nominal +1 s.d. +999), expiry 15 menit server-side
- Status: payment-status/{history_id} (unpaid/paid/expired/cancelled) + mapping ke enum lokal
- Uji koneksi GRATIS — memakai status endpoint, sengaja tidak memanggil generate karena berbayar IDR 100/kali (401/403 = key invalid, 404 = key valid)

Admin (/admin/settings/qrisly + icon QRISLY di sidebar)

- Status card (API Key / Environment / QRIS Statis), environment sandbox-production, API key password + reveal
- Upload QRIS statis dengan preview gambar — validasi format/ukuran client-side, hasilnya (QRIS ID, merchant, provider) tampil langsung
- QRIS ID bisa diedit manual (jika sudah pernah upload dari platform lain), Uji Koneksi, webhook URL + copy, panduan singkat 5 langkah

Alur checkout (konsisten di 3 route)

- POST /api/orders + refresh + status: QRIS → QRISLY dulu (bila apiKey + QRIS statis terpasang), fallback payment-service QRIS; VA tetap payment service. QRIS dirender dari qris_string via /api/payments/qr — UI checkout (PaymentDisplay) tidak berubah sama sekali
- Webhook /api/payments/qrisly/webhook (sudah dikecualikan di middleware): payload {event, data:{qris_history_id,...}}, idempotent, restore stok saat expired/cancelled, increment coupon + email konfirmasi saat paid, balas {"success":true} 200 (retry 3× sesuai dokumen kalau bukan 200). Dokumentasi QRISLY tidak menyebut HMAC — verifikasi bergantung konfigurasi URL di dashboard RajaOngkir

Verifikasi

- tsc --noEmit bersih, webhook merespons {"success":true,"message":"Webhook received and processed"} sesuai dokumen §5, QR route 200 image/png, 4 row setting baru di DB

Langkah berikutnya dari kamu: isi API key QRISLY + upload gambar QRIS statis toko di panel admin, lalu daftarkan webhook URL di dashboard RajaOngkir → Webhook → QRISLY → Outbound Webhook.