0. Introduction
Komship API is a shipping integration solution designed to simplify logistics for businesses, especially those utilizing the Cash on Delivery (COD) and Bank Transfer payment model. It provides seamless access to 6+ shipping services, allowing businesses to automate their shipping process, track orders in real-time, and manage COD payments efficiently.

Komship API enables businesses to:

Create and Manage Shipments - Integrate your e-commerce or business platform with various supported shipping providers through a single API.
Real-time Tracking & Notifications - Monitor shipment status with accurate tracking and automated updates.
Efficient COD Management - Receive COD payments with a fast disbursement process, even outside regular banking hours.
Seamless Integration - A developer-friendly API that is easy to implement into your existing system.
✅ Operational Efficiency - Automate shipping processes to reduce manual work and improve productivity.
✅ Fast & Reliable COD Settlement - Ensure faster COD fund disbursement, helping businesses maintain healthy cash flow.
✅ Multi-Courier Support - Access a wide range of shipping partners for flexible and cost-effective deliveries.
✅ Secure & Scalable - Built on a robust infrastructure ensuring security, reliability, and scalability for growing businesses.
✅ Detailed Reporting & Analytics - Gain insights into shipping performance, COD transactions, and customer delivery trends.
✅ Comprehensive API Documentation - Well-structured and easy-to-follow API documentation to facilitate quick implementation.
✅ Customer & Technical Support - Get assistance whenever needed to ensure smooth integration and operation.

Komship API is ideal for:

E-commerce Platforms & Marketplaces - Automate shipping and COD processes for sellers and merchants.
Retail & Wholesale Businesses - Streamline logistics for direct-to-customer or B2B shipping.
Logistics & Courier Services - Enhance last-mile delivery efficiency and tracking.
Developers & Tech Teams - Integrate a scalable shipping solution into custom-built platforms.
With Komship API, businesses can offer faster, more reliable, and customer-friendly shipping services, ensuring better logistics management and higher customer satisfaction.


1. endpoint

All Komerce API requests are made through a centralized base URL. Depending on the environment you are working in (production or sandbox/testing), you should direct your requests to the appropriate endpoint.

This is the live environment where real delivery orders, shipping rate calculations, and plugin communications occur.

Base URL:

https://api.collaborator.komerce.id/
Use this URL when your integration is ready for production and has passed sandbox testing. All production requests must be authenticated with a valid production token.

The sandbox environment is designed for testing purposes. No real shipments are created, and you can experiment safely with all endpoints.

Base URL:

https://api-sandbox.collaborator.komerce.id/
This endpoint behaves identically to production but operates in a separate, isolated environment.

To switch environments, you only need to change the base URL in your requests:

Use the sandbox URL during development or testing.
Use the production URL when your app is live.
⚠️ Make sure to use the correct authentication APIKEY for each environment. Sandbox APIKEY won't work in production when you didn't have any approval access from our Administrator.

Here's a sample curl request to retrieve the list of available couriers in production:

curl --request GET \
  --url https://api.collaborator.komerce.id/
  --header 'x-api-key: YOUR_PRODUCTION_KEY'
For sandbox testing, just replace the base URL:

curl --request GET \
  --url https://api-sandbox.collaborator.komerce.id/
  --header 'x-api-key: YOUR_SANDBOX_KEY'
Name	Path	Method	Description
Search Destination
/tariff/api/v1/destination/
GET
for Search origin or destination
id
Calculate
/tariff/api/v1/calculate
GET
for Search estimated shipping cost by origin and destination
Store Order
/order/api/v1/orders/store
POST
for Submit an order's
Cancel Order
/order/api/v1/orders/cancel
PUT
for Cancel an order's
Detail Order
/order/api/v1/orders/detail
GET
for Getting more information about Submited order
History AWB
/order/api/v1/orders/history-airway-bill
GET
for Checking track AWB
Pickup Order
/order/api/v1/pickup/request
POST
for Request a order Pickup time
Label Order
/order/api/v1/orders/print-label
POST
for Getting an label order's
Webhook
/Used your webhook handler URL
PUT
for Getting automation respon's about the order's
Always test new features or workflows in the sandbox before going live.
Maintain separate credentials for sandbox and production.
Never use sandbox credentials or URLs in your production app.
Monitor responses and logs to ensure you're hitting the correct environment.
With the correct base URL and environment, you're now ready to explore Komerce's API capabilities.

2. auth
Include your API key as a Middleware in the HEADER of each API request:

x-api-key: YOUR_API_KEY
curl --request GET \
  --url https://api-sandbox.collaborator.komerce.id
  --header 'x-api-key: YOUR_API_KEY'
This will return the list of available couriers for your delivery orders.

If your API key is compromised or you need to rotate it, you can regenerate a new one from the same API Key section in your Komerce dashboard.

3. 3PL availability

3 PL Availability
Komerce empowers businesses to scale their order fulfillment process by integrating with multiple 3PL (Third-Party Logistics) providers. This flexibility enables sellers to select the most suitable shipping partners based on service types, cost-efficiency, delivery speed, and geographic coverage. Each courier offers a unique combination of delivery categories - such as regular, cargo, instant, and small package services - tailored to accommodate varying customer and operational needs.

By supporting a broad ecosystem of couriers, Komerce enables merchants to:

Optimize delivery timelines through same-day or scheduled shipping.
Minimize logistics cost with discounted shipping rates.
Reach a wider range of customer destinations - including urban, suburban, and inter-island areas.
Offer flexible payment options including Bank Transfer and Cash on Delivery (COD) to improve customer convenience and trust.
Ensure real-time order tracking and better operational control.
Moreover, businesses can leverage pre-negotiated discounts for each courier, enabling cost savings from the first shipment without requiring separate agreements. Whether you're shipping lightweight items, high-volume cargo, or looking for real-time delivery via instant couriers, Komerce makes it seamless to match each order to the ideal logistics partner.

The following tables break down the supported services, payment method compatibility, and discount benefits for each of our integrated couriers, helping you make better operational and financial decisions.

Our service has collaborated with several trusted couriers in Indonesia, we are committed to being able to continue to present several additional couriers in the future, in order to maximize the delivery that will be made by our clients, especially each of them must have personal preferences in using shipping services.

Courier Name	Regular Services	Cargo Services	Flat Services	Small Services	International Service	Instant Service
JNE
✅
✅
✅
❌
❌
❌
SAP
✅
✅
❌
❌
❌
❌
IDExpress
✅
✅
✅
✅
❌
❌
SiCepat
✅
✅
❌
❌
❌
❌
J&T
✅
❌
❌
❌
❌
❌
Ninja
✅
❌
❌
❌
❌
❌
Lion
✅
✅
❌
❌
❌
❌
GoSend
❌
❌
❌
❌
❌
✅
As for the payment services that can be used to use our delivery service, please note that we only provide 2 payment service options, namely Cash on delivery and Bank Transfer. COD is a service that we present for direct payments made by buyers when the package they buy arrives at the destination, while Bank Transfer is a method that we present for the type of payment made by the buyer at the beginning, which includes payment of shipping costs. Later the Bank Transfer service will directly deduct the balance that the client has in his account.

Courier	Cash On Delivery	Bank Transfer
JNE
✅
✅
SAP
✅
✅
IDExpress
✅
✅
SiCepat
✅
✅
Ninja
✅
✅
J&T
✅
✅
Lion
❌
✅
GoSend
❌
✅
We also provide several discount schemes that can be enjoyed by clients, we hope that with this discount, clients will find it easier to choose which courier or service they want and adjust to the needs of their customers.

Courier	Service	Discount
JNE
Regular
25%
SAP
Regular
30%
IDExpress
Regular
25%
SiCepat
Regular
20%
Ninja
Regular
40%
J&T
Regular
25%
Lion
Regular
20%
GoSend
Regular
No Discount

4. search destination

Search Destination
The Search Destination Endpoint is designed to provide a fast and accurate way to find locations within the shipping system. This endpoint supports searching for various administrative levels, including:

City
Districts
Sub-districts
Postal Codes
By integrating this endpoint, users can easily retrieve precise location details without manually mapping regional hierarchies. This ensures greater flexibility and accuracy in defining both origin and destination areas.

✅ Comprehensive Location Search - Supports multi-level search from provinces to sub-districts.
✅ Optimized for Efficiency - Fast response times without additional processing on the user's side.
✅ Seamless Logistics Integration - Ensures accurate regional mapping for shipping cost calculations.
✅ Error Minimization - Reduces inconsistencies caused by mismatched regional data structures.

The Search Destination Endpoint streamlines the process of finding and selecting locations within a shipping workflow. Instead of requiring users to manually filter through Province → City → District → Sub-district, the system automates the search and presents relevant location options based on input criteria.

1️⃣ Automatic Location Hierarchy Processing

Users can input search queries using City, District, Sub-district, or Postal Code.
The system automatically maps and retrieves related location data without additional configuration.
2️⃣ Precise & Reliable Data Retrieval

The response includes region IDs corresponding to the searched origin or destination.
Users receive a structured JSON response containing multiple location options to select from.
3️⃣ Seamless Transition to Cost Calculation

Once a user selects a location, the region ID can be used in the Calculate Endpoint for shipping cost estimation.
This workflow ensures smooth data transition from location selection to shipping fee calculation.
The Search Destination Endpoint returns a JSON object containing:

Region ID - Unique identifier for the location.
Location Name - Full name of the matched region.
Hierarchy Details - Information on province, city, and sub-district levels.
Users must select one of the provided options to finalize their destination before proceeding to cost estimation. This step ensures that the most accurate location is used for logistics calculations.

By leveraging the Search Destination Endpoint, users can enhance their shipping processes with:

✔ Faster location searches
✔ More accurate origin & destination mapping
✔ Effortless integration with the shipping fee calculation system

This approach eliminates manual regional data mapping, improving efficiency and reducing errors in shipping operations.

curl --location 'https://api-sandbox.collaborator.komerce.id/tariff/api/v1/destination/search?keyword=53131' \
--header 'x-api-key: yourapikey'
{
  "meta": {
    "message": "Sucessfully Get Destination Data",
    "code": 200,
    "status": "success"
  },
  "data": [
    {
      "id": 34167,
      "label": "PURWOKERTO, NGADILUWIH, KEDIRI, 64171",
      "subdistrict_name": "PURWOKERTO",
      "district_name": "NGADILUWIH",
      "city_name": "KEDIRI",
      "zip_code": "64171"
    },
    {
      "id": 67150,
      "label": "PURWOKERTO, KAYEN, PATI, 59171",
      "subdistrict_name": "PURWOKERTO",
      "district_name": "KAYEN",
      "city_name": "PATI",
      "zip_code": "59171"
    },
    {
      "id": 67266,
      "label": "PURWOKERTO, TAYU, PATI, 59155",
      "subdistrict_name": "PURWOKERTO",
      "district_name": "TAYU",
      "city_name": "PATI",
      "zip_code": "59155"



5. Calculate Delivery Price
The Calculate Endpoint is designed to help users retrieve accurate shipping cost estimates based on various factors such as origin, destination, and package weight. This endpoint is a crucial part of the Komship Delivery API, which integrates several courier services to facilitate seamless shipping operations.

By leveraging this endpoint, users can efficiently determine shipping fees without needing manual calculations, ensuring a faster, error-free, and automated process.

✅ Multi-Courier Support - Access shipping costs from several courier services in one request.
✅ Automated Data Validation - Ensures accurate calculations based on verified origin & destination IDs.
✅ Decimal Weight Handling - Supports precise weight calculations with automatic rounding.
✅ Seamless API Workflow - Integrates with the Search Destination Endpoint for smooth data transition.

To perform a shipping cost calculation, users must provide:

Origin ID - Obtained from the Search Destination Endpoint.
Destination ID - Also retrieved from the Search Destination Endpoint.
Origin and Destination pinpoint - If you want to deliver your order to the customer using the instant delivery or any other specific delivery service, you must use this API first to check the availability of that service type for your route.
Package weight - Expressed in kilograms (kg).
Note

💡 Important: Incorrect origin or destination IDs will lead to inaccurate shipping costs. Always ensure the data is correct before making a request.

Users often ask:

Note

"How does the system handle decimal weights?"

The Calculate Endpoint supports decimal weight values, which should be formatted using a dot (.) as the decimal separator. To comply with courier service standards, the system automatically rounds weights as needed, preventing errors and ensuring smooth validation.

Once all required data is submitted:

The system validates the origin, destination, pinpoint, and weight values.
The API fetches real-time shipping cost data from multiple courier services in our systems.
A JSON response is returned, detailing available shipping options, prices, and simulate our store_order services for your maximize information.
curl --location 'https://api-sandbox.collaborator.komerce.id/tariff/api/v1/calculate?shipper_destination_id=31597&receiver_destination_id=46116&weight=1&item_value=300000&cod=yes&origin_pin_point=-7.279849431298132\%2C109.35114360314475&destination_pin_point=-7.30585\%2C109.36814' \
--header 'x-api-key: inputapikey'
Key	Type	Description
x-api-key
string
this Value contain an secret APIKEY identic for Shipping API
Key	Type	Description
shipper_destination_id
*
int
this Value containt an
id
during Search Destination
receiver_destination_id
*
int
this Value containt an
id
during Search Destination
origin_pin_point
*
string
this Value contain an a geolocation from origin
latitude, longitude
address
destination_pin_point
*
string
this Value contain an a geolocation from destination
latitude, longitude
address
weight
*
float
this Value is an Kilogram, use dot(.) for float value
item_value
*
int
this Value is an Item Price
cod
boolean
this Value is containt an a boolean method (yes/no) method of shipping if cod=yes system will give response of Coverage Area or possibility to COD or not
Additional information for the using origin or destination, pin_point is used to calculate the estimated shipping cost by using instant courier. Make sure pin_point data submitted is in accordance with the estimated delivery from the origin location to the destination.

Danger

For each header and parameter that has a * sign, it is a Required parameter when making a request, otherwise there will be a system error that will warn the user regarding the request made.

Key	Value
meta.message
Response for searching address
meta.code
Any response have different code
meta.status
Boolean status for checking address
data.calculate_reguler
List of available couriers for regular delivery
data.calculate_cargo
List of available couriers for cargo delivery
data.calculate_instant
List of available couriers for instan or sameday delivery
data.calculate_{{servicetype}}.shipping_name
Name of the courier that can be used for delivery of goods
data.calculate_{{servicetype}}.service_name
The name of the courier delivery service that can be used to deliver goods
data.calculate_{{servicetype}}.weight
Weight of goods from request
data.calculate_{{servicetype}}.is_cod
COD delivery usage information
data.calculate_{{servicetype}}.shipping_cost
Original shipping price
data.calculate_{{servicetype}}.shipping_cashback
Discounted price on shipping costs
data.calculate_{{servicetype}}.shipping_cost_net
Shipping cost price after discount
data.calculate_{{servicetype}}.grandtotal
The total payment price that the seller gets
data.calculate_{{servicetype}}.service_fee
Value of 2.8% of
grand_total
if the package is delivered using COD payment
data.calculate_{{servicetype}}.net_income
Net income earned by the seller
data.calculate_{{servicetype}}.etd
Estimated delivery time
{
  "meta": {
    "message": "Success Calculate Shipping",
    "code": 200,
    "status": "success"
  },
  "data": {
    "calculate_reguler": [
      {
        "shipping_name": "NINJA",
        "service_name": "Standard",
        "weight": 5,
        "is_cod": true,
        "shipping_cost": 83000,
        "shipping_cashback": 37350,
        "shipping_cost_net": 45650,
        "grandtotal": 383000,
        "service_fee": 10724,
        "net_income": 326626,
        "etd": "-"
      },
      {
        "shipping_name": "SAP",
        "service_name": "SAPFlat",
        "weight": 5,
        "is_cod": true,
        "shipping_cost": 46500,
        "shipping_cashback": 0,
        "shipping_cost_net": 46500,
        "grandtotal": 346500,
        "service_fee": 9702,
        "net_income": 290298,
        "etd": ""
      },
      {
        "shipping_name": "JNE",
        "service_name": "REG23",
        "weight": 5,
        "is_cod": true,
        "shipping_cost": 80000,
        "shipping_cashback": 20000,
        "shipping_cost_net": 60000,
        "grandtotal": 380000,
        "service_fee": 10640,
        "net_income": 309360,
        "etd": "3-4 day"
      },
      {
        "shipping_name": "SICEPAT",
        "service_name": "REG",
        "weight": 5,
        "is_cod": true,
        "shipping_cost": 76500,
        "shipping_cashback": 22950,
        "shipping_cost_net": 53550,
        "grandtotal": 376500,
        "service_fee": 10542,
        "net_income": 312408,
        "etd": "2-4 day"
      },
      {
        "shipping_name": "IDEXPRESS",
        "service_name": "STD",
        "weight": 5,
        "is_cod": true,
        "shipping_cost": 135500,
        "shipping_cashback": 33875,
        "shipping_cost_net": 101625,
        "grandtotal": 435500,
        "service_fee": 12194,
        "net_income": 321681,
        "etd": "-"
      },
      {
        "shipping_name": "LION",
        "service_name": "REGPACK",
        "weight": 5,
        "is_cod": false,
        "shipping_cost": 80000,
        "shipping_cashback": 16000,
        "shipping_cost_net": 64000,
        "grandtotal": 380000,
        "service_fee": 10640,
        "net_income": 305360,
        "etd": "3-5 day"
      },
      {
        "shipping_name": "JNT",
        "service_name": "EZ",
        "weight": 5,
        "is_cod": true,
        "shipping_cost": 75000,
        "shipping_cashback": 18750,
        "shipping_cost_net": 56250,
        "grandtotal": 375000,
        "service_fee": 10500,
        "net_income": 308250,
        "etd": "-"
      }
    ],
    "calculate_cargo": [
      {
        "shipping_name": "SAP",
        "service_name": "DRGREG",
        "weight": 5,
        "is_cod": true,
        "shipping_cost": 52500,
        "shipping_cashback": 15750,
        "shipping_cost_net": 36750,
        "grandtotal": 352500,
        "service_fee": 9870,
        "net_income": 305880,
        "etd": "3-5 day"
      },
      {
        "shipping_name": "JNE",
        "service_name": "JTR23",
        "weight": 5,
        "is_cod": true,
        "shipping_cost": 50000,
        "shipping_cashback": 1250,
        "shipping_cost_net": 48750,
        "grandtotal": 350000,
        "service_fee": 9800,
        "net_income": 291450,
        "etd": "3-4 day"
      },
      {
        "shipping_name": "SICEPAT",
        "service_name": "GOKIL",
        "weight": 5,
        "is_cod": true,
        "shipping_cost": 60000,
        "shipping_cashback": 3000,
        "shipping_cost_net": 57000,
        "grandtotal": 360000,
        "service_fee": 10080,
        "net_income": 292920,
        "etd": "3-5 day"
      },
      {
        "shipping_name": "IDEXPRESS",
        "service_name": "Idtruck",
        "weight": 5,
        "is_cod": true,
        "shipping_cost": 42500,
        "shipping_cashback": 850,
        "shipping_cost_net": 41650,
        "grandtotal": 342500,
        "service_fee": 9590,
        "net_income": 291260,
        "etd": "-"
      },
      {
        "shipping_name": "LION",
        "service_name": "BIGPACK",
        "weight": 5,
        "is_cod": false,
        "shipping_cost": 90000,
        "shipping_cashback": 18000,
        "shipping_cost_net": 72000,
        "grandtotal": 390000,
        "service_fee": 10920,
        "net_income": 307080,
        "etd": "3-7 day"
      }
    ],
    "calculate_instant": [
      {
        "shipping_name": "GOSEND",
        "service_name": "Instant",
        "weight": 5,
        "is_cod": false,
        "shipping_cost": 9500,
        "shipping_cashback": 0,
        "shipping_cost_net": 9500,
        "grandtotal": 309500,
        "service_fee": 0,
        "net_income": 300000,
        "etd": "1-2 hours"
      }
    ]
  }
}
{
    "meta": {
        "message": "Success Calculate Shipping",
        "code": 200,
        "status": "success"
    },
    "data": {
        "calculate_reguler": [],
        "calculate_cargo": [],
        "calculate_instant": []
    }
}
Warning

This response can occur if only the parameters shipper_destination_id, receiver_destination_id, origin_pin_point, and destination_pin_point are not filled in during the request.

Code	Status	Description	How To Fix
400
Bad request
The request parameter has an error
Check the desired request parameters again, this usually happens because there is a mismatch between the request and the expectations of the request that occurred.
401
Unauthorized
API key invalid or missing from parameter
Make sure your API key is valid using your Account
422
Unprocessable Entity
Keywoard parameter is missing
Add an valid keywoard parameter in your requested query. Parameter Request can't be null or missing
500
-
-
-
Ensure required parameters are present:

shipper_destination_id & receiver_destination_id → this value you can get from Search_destination EndPoint when you searching the origin or destination address using District/SubDistrict/PostalCode. This value can helping you to get more information about Regular or Cargo Shipping.
origin_pin_point & destination_pin_point → this value you can get from ThirdParty maps to ensure identic pinpoint for origin and destination address for using InstantDelivery like GoSend, etc.
weight → the total weight of the items (in Calculate EndPoint this value using an grams).
item_value → the total value of the items (in IDR currency), this value can helping you to understand when using store_order parameter and describe more value to using the service.


6. Create Order
The Store Order Endpoint allows users to create an order that will be validated and processed by Komerce. This endpoint integrates data obtained from previous steps:

Search Destination Endpoint → Provides origin & destination IDs.
Calculate Endpoint → Provides shipping cost details, including courier information.
Once an order is created, the system automatically deducts the shipping fee from the user's dashboard balance (if using the Bank Transfer method). If the balance is insufficient, the order will not be processed, and an error response will be returned.

✅ Seamless Order Creation - Integrates with previous endpoints to streamline the process.
✅ Automated Balance Deduction - Ensures smooth transactions for prepaid orders.
✅ Strict Data Validation - Ensures correct phone number format & other required fields.
✅ Supports Multiple Payment Methods - Including COD and Bank Transfer.

Users must provide the following details:

Order Information → Order date, brand name, shipper & receiver details.
Shipping Details → Courier name, service type, shipping cost.
Payment Method → COD or Bank Transfer. Unfortunetly, we don't have invoicing method automaticly. But, you can use invoicing method if you contact our Business Development for request invoicing method.
Product Details → Name, variant, weight, dimensions, quantity.
Warning

Phone numbers must start with 0 or 62 (e.g., 081234567890, 6281234567890), not start with +62.
An insufficient balance will prevent order processing if your balance is less than the value of the shipping charges to be made.
Ensure all required fields are formatted correctly to avoid errors.
Once an order is submitted:

The system validates the order details, including phone numbers, shipping cost, and payment method.
If using Bank Transfer, the shipping cost is deducted from the user's balance.
If all data is valid, the order is sent to us for processing.
The system returns a confirmation response, indicating the order has been successfully created.
curl --location 'https://api-sandbox.collaborator.komerce.id/order/api/v1/orders/store' \
--header 'x-api-key: inputapikey' \
--header 'Content-Type: application/json' \
--data-raw '{
    "order_date": "2025-05-21",
    "brand_name": "Xiaomi Official",
    "shipper_name": "XIAOMI",
    "shipper_phone": "0853123413241",
    "shipper_destination_id": 5969,
    "shipper_address": "Alamat pengirim",
    "origin_pin_point": "-7.274631, 109.207174",
    "receiver_name": "Buyer Bandung",
    "receiver_phone": "08123458282",
    "receiver_destination_id": 4956,
    "receiver_address": "Alamat penerima",
    "shipper_email": "admin@admin.com",
    "destination_pin_point": "-7.274631, 109.207174",
    "shipping": "JNE",
    "shipping_type": "REG23",
    "payment_method": "BANK TRANSFER",
    "shipping_cost": 16000,
    "shipping_cashback": 4000,
    "service_fee": 0,
    "additional_cost": 0,
    "grand_total": 516000,
    "cod_value": 0,
    "insurance_value": 5631.11,
    "notes": "Contoh note"
    "order_details": [
        {
            "product_name": "Xiaomi Redmi Note 99",
            "product_variant_name": "Blue 8/256",
            "product_price": 315555,
            "product_weight": 1000,
            "product_width": 10,
            "product_height": 8,
            "product_length": 50,
            "qty": 1,
            "subtotal": 315555
        }
    ]
}'
Key	Type	Description
x-api-key
*
string
this Value contain an secret APIKEY identic for Shipping API
Key	Type	Description
order_date
*
date-time
The date and time when the order was created.
brand_name
*
string
The brand name displayed on the shipping label.
shipper_name
*
string
The name of the person sending the package.
shipper_phone
*
string
The phone number of the sender.
shipper_destination_id
*
int
The ID representing the pickup location for the shipment.
origin_pin_point
string
Geolocation (latitude, longitude) of the pickup address.
shipper_address
*
string
Full address of the sender for pickup.
shipper_email
*
string
Email address of the sender.
receiver_name
*
string
The name of the recipient.
receiver_phone
*
string
The phone number of the recipient.
receiver_destination_id
*
int
The ID representing the delivery destination.
destination_pin_point
string
Geolocation (latitude, longitude) of the delivery address.
receiver_address
*
string
Full delivery address of the recipient.
receiver_email
string
Email address of the recipient.
shipping
*
string
Selected shipping courier, e.g., JNE, SICEPAT, SAP, IDEXPRESS, J&T, NINJA.
shipping_type
*
string
Shipping service type, such as REG19, GOKIL, REGULER, INSTANT, etc.
shipping_cost
*
int
The standard shipping cost charged to the user.
shipping_cashback
*
int
Discount or cashback applied to the shipping cost.
payment_method
*
string
The payment method used for the order (e.g., COD, bank transfer).
service_fee
*
int
Get from calculate. 2.8% from
cod_value
,
service_fee = 0
for
BANK TRANSFER
payment method.
additional_cost
*
int
Any extra costs related to the order (e.g., packaging, handling).
grand_total
*
int
Total payment amount, calculated as: product total + shipping cost + additional cost.
cod_value
*
int
COD payment amount. This value must match the
grand_total
.
insurance_value
*
float
Declared value for insurance, if insurance is used.
product_name
*
string
Name of the product being shipped.
product_variant_name
*
string
Variant or specific type of the product (if applicable).
product_price
*
int
Price per unit of the product.
product_width
*
int
Product width in centimeters.
product_height
*
int
Product height in centimeters.
product_length
*
int
Product length in centimeters.
product_weight
*
int
Product weight in grams.
qty
*
int
Quantity of the product ordered.
subtotal
*
int
Total product value, calculated as
product_price
*
qty
.
notes
string
Anything you would like the expedition to note.
Pinpoint information

Additional information for the params origin_pin_point and destination_pin_point are used to calculate the estimated shipping cost if you use Instant or LionParcel Courier. Make sure the pin_point data's geolocation sent is accurate so that the courier can pick up and deliver to the appropriate address.

Danger

For each header and parameter that has a * sign, it is a Required parameter when making a request, otherwise there will be a system error that will warn the user regarding the request made.

Key	Value
meta.message
Response for creating an order
meta.code
Any respons have different status code
meta.status
Bollean status for creating an order
data.order_id
An unique
id
if successfully creating an order
data.order_no
An unique number for order
{
  "meta": {
    "message": "Success Create New Order",
    "code": 201,
    "status": "success"
  },
  "data": {
    "order_id": 9999,
    "order_no": "KOMXXXXXXXXXXXXXXXXX"
  }
}
example.json
{
  "meta": {
    "message": "{{ error.message }}",
    "code": 400,
    "status": "failed"
  },
  "data": null
}
Code	Status	Description	How to Fix
400
Failed
There is a mismatch in one or more of the parameters used
Check all available parameters, make sure the values entered match the desired conditions.
401
Unauthorized
API key invalid or missing from parameter
Make sure your API key is valid using your Account.
422
Unprocessable Entity
Parameter is missing
Add an valid parameter in your requested query. Parameter Request can't be null or missing
500
-
-
-
Always include the Authorization header with a valid token.
Do not leave the any parameter empty - it's required.
Makesure all parameters using correct value
Use the correct endpoint and query structure.


7. About Insurance
When creating an order via the store_order endpoint, users have the option to include insurance coverage for their shipments. Insurance is used to protect the value of the shipped goods in case of damage or loss during transit.

The insurance_value is determined based on the total product price (total_product_price) in an order and the specific courier's insurance policy. Each courier has its own insurance calculation method, as shown in the table below:

Courier	Insurance Price	Information
JNE
(0.2% *
total_product_price
) + Rp5.000
Fixed admin fee of IDR 5.000 applies.
SiCepat
0.3% *
grand_total
Insurance is only applicable if grand_total > IDR 500.000.
IDExpress
0.2% *
total_product_price
No additional admin fees.
SAP
(0.3% *
total_product_price
) + Rp2.000/AWB
Additional IDR 2.000 per Air Waybill (AWB).
Ninja
0.25% *
total_product_price
If
total_product_price
<= IDR 1.000.000,
insurance_value
= IDR 2.500. If
total_product_price
> IDR 1.000.000,
insurance_value
= 0.25% x
total_product_price
.
J&T
0.2% *
total_product_price
No additional admin fees.
Lion
0.3% *
total_product_price
No additional admin fees.
GoSend
Rp1.000 for Silver Insurance,
Rp2.000 for Gold Insurance,
Rp5.000 for Platinum Insurance
No additional admin fees.
Let's say a merchant ships an order using JNE, with:

total_product_price = IDR 1.000.000
shipping_cost = IDR 25.000
grand_total = IDR 1.025.000
Using JNE formulas :

(0.2\% x 1000000) + 5000 = 2000 + 5000 = IDR 7000
So, the insurance cost insurance_value = IDR 7.000.

Insurance costs directly affect the merchant's net profit. The formula for net profit is:

net_profit = cod_value - (shipping_cost - shipping_cashback) - service_fee - insurance_value
If the merchant wants to pass the insurance cost to the buyer, they should add the same amount as insurance_value to additional_cost when creating the order.

Warning

Minimum of insurance_value : The minimum order value eligible for insurance is IDR 300,000.
Accuracy of Calculation: Ensure that total_product_price and grand_total are correctly inputted to avoid discrepancies in insurance cost.
Mandatory for High-Value Shipments: Some couriers require insurance for orders exceeding a certain value threshold (e.g., SiCepat for grand_total > IDR 500,000).
By properly including insurance in your orders, you ensure that your shipments are protected while maintaining a clear and accurate cost structure. 🚀



8. About Commodity
The commodity_code is a mandatory parameter used to classify the type of goods being shipped. This code ensures proper handling and compliance with courier requirements.

For a complete list of available commodity codes and their descriptions, please refer to the .

⚠️ The commodity_code parameter is mandatory only for shipping : LION. Omitting it will result in a error.

When creating orders, include the commodity_code parameter in the request body.

When creating an order with LION Parcel, include the commodity_code parameter in the request body:

{
  "order_date": "2025-05-21",
  "brand_name": "Your Brand",
  "shipper_name": "SENDER NAME",
  "shipper_phone": "82121669737",
  "shipper_destination_id": 5969,
  "shipper_address": "Alamat pengirim",
  "origin_pin_point": "-7.274631, 109.207174",
  "receiver_name": "Buyer Name",
  "receiver_phone": "8123458282",
  "receiver_destination_id": 4956,
  "receiver_address": "Alamat penerima",
  "shipper_email": "admin@example.com",
  "destination_pin_point": "-7.274631, 109.207174",
  "shipping": "LION",
  "shipping_type": "STANDARD",
  "commodity_code": "ELG150",
  "payment_method": "BANK TRANSFER",
  "shipping_cost": 20000,
  "shipping_cashback": 0,
  "service_fee": 0,
  "additional_cost": 0,
  "grand_total": 520000,
  "cod_value": 0,
  "insurance_value": 1500,
  "order_details": [
    {
      "product_name": "Smartphone X",
      "product_variant_name": "Black 128GB",
      "product_price": 500000,
      "product_weight": 250,
      "product_width": 8,
      "product_height": 15,
      "product_length": 2,
      "qty": 1,
      "subtotal": 500000
    }
  ]
}
Key	Type	Required	Description
commodity_code
string
Yes
Classification code for the shipment content. See About Commodity for available codes.



9. Gosend Pricing
As part of our shipping aggregator service, you can utilize GoSend for Instant and Same Day deliveries. However, please note the fundamental difference in GoSend's pricing scheme compared to regular expedition services.

Real-Time Rate Fluctuations: Unlike standard expeditions that offer stable and fixed rates (e.g., a rate of Rp 10,000 for regular intercity delivery), GoSend employs a dynamic pricing model. These rates can fluctuate within minutes.

Factors Affecting Price: This price fluctuation is driven by real-time supply and demand conditions. During periods of high demand (rush hours), adverse weather, or limited driver availability, the system will automatically increase the price (surge pricing). Conversely, when demand decreases, prices will normalize.

Reference:


Create Order vs Pickup Price: The GoSend rates retrieved from the Check Rates and Store Order endpoint should be treated as an estimate valid only at the exact time of the request. When Pick up request time has a time interval from order creation, price may differ. The price difference will informed and deducted from Collaborator’s balance in monthly reconciliation
End-User Education: We highly recommend adding a disclaimer or visual indicator (such as a tooltip) in your application's UI to inform your end-users that instant delivery rates are subject to change based on real-time traffic and market demand upon checkout.
We recommend not having a long time interval between order creation (store order API) and pick up request (pick up API).



10. Detail Order
The Detail Order Endpoint is designed to retrieve detailed information about a specific order, allowing users to access real-time data on their order status, shipping details, and payment information. This endpoint enhances transparency by ensuring users have a clear view of their orders at any given time.

By using this endpoint, users can efficiently track their order progress, verify order details, and resolve any discrepancies before the shipping process is affected.

✅ Real-time Order Tracking → Users can instantly check their order status and monitor its progress.
✅ Enhanced Transparency → Provides full visibility into shipping, payment, and order details.
✅ Error Prevention → Users can verify order accuracy before shipping, reducing potential issues.
✅ Improved Customer Support → Customer service teams can quickly retrieve order details for assistance.
✅ Automated System Integration → Businesses can integrate this endpoint to streamline order management workflows.

Initiate Request: The user sends a GET request to the endpoint, providing the unique Order ID as a parameter.
Data Retrieval: The system searches its database for the corresponding Order ID. If found, it compiles all relevant order information.
Response Delivery: The system returns a structured response containing detailed information, including:
Order Information: Order ID, status, creation and last update timestamps.
Shipping Details: Courier name, shipping method, cost, and estimated delivery time.
Origin and Destination: Addresses, region IDs, and city names for both sender and recipient.
Recipient Information: Name, phone number, and full address of the recipient.
Payment Details: Payment status, method, and total amount paid.
Order Tracking : Users can check whether their order is still being processed, has been packed, or is already shipped.
Address Verification : If a user notices incorrect destination details, they can cancel the order and make new one with the correct details, as long as the order has not been picked up by the courier.
Shipping Cost Confirmation : Businesses can confirm whether the correct shipping fee is applied.
Payment Verification : Users can check if their payment has been received successfully or if further action is needed.
Customer Support Assistance : Support agents can use the Order ID to retrieve all relevant order details when assisting customers with inquiries.
Warning

Important Notes

A valid Order ID is required to retrieve order details.
Orders cannot be modified through this endpoint-only order details can be viewed.
Real-time updates ensure that users always receive the most up-to-date order status.
If an order is canceled, the response will indicate the cancellation status and refund details (if applicable).
By utilizing the Detail Order Endpoint, users and businesses can efficiently monitor and manage orders, ensuring a smooth and transparent order processing experience.

curl --location 'https://api-sandbox.collaborator.komerce.id/order/api/v1/orders/detail?order_no=KOMXXXXXXXXXXXXXXXXX' \
--header 'x-api-key: inputapikey'
Key	Type	Description
x-api-key
*
string
this Value contain an secret APIKEY identic for Shipping API.
Key	Type	Description
order_no
*
string
Value is filled with the order number that has been created.
Danger

For each header and parameter that has a * sign, it is a Required parameter when making a request, otherwise there will be a system error that will warn the user regarding the request made.

Key	Value (Description)
meta.message
Message indicating the result of the API request.
meta.code
HTTP status code representing the request status.
meta.status
Status of the API response (e.g., success or error).
data.order_no
Unique identifier for the order within the system.
data.awb
Air Waybill number used for package tracking (if available).
data.order_status
Current status of the order (e.g., Diajukan = Submitted).
data.order_date
Date the order was created.
data.brand_name
Brand name displayed on the shipping label.
data.shipper_name
Name of the sender or shipper.
data.shipper_phone
Phone number of the sender.
data.shipper_destination_id
ID representing the pickup address region.
data.shipper_address
Full address of the sender (pickup location).
data.receiver_name
Name of the person receiving the package.
data.receiver_phone
Phone number of the receiver.
data.receiver_destination_id
ID representing the delivery address region.
data.receiver_address
Full address of the receiver (delivery location).
data.shipping
Name of the selected shipping courier.
data.shipping_type
Type of shipping service chosen (e.g., Standard, Express).
data.payment_method
Method of payment used by the customer.
data.shipping_cost
Cost charged for the shipping service.
data.shipping_cashback
Discount applied to the shipping cost.
data.service_fee
Additional fee charged for COD (if applicable).
data.additional_cost
Any other cost added to the order.
data.grand_total
Final total amount (product + shipping + additional cost - cashback).
data.cod_value
Total amount to be collected if using COD. Should match grand_total.
data.notes
Optional notes or remarks related to the order.
data.insurance_value
Value of insurance applied to the shipment (if any).
data.origin_pin_point
Latitude and longitude of the sender's location.
data.destination_pin_point
Latitude and longitude of the receiver's location (if available).
data.booking_id
ID from the courier or third-party booking system (if available).
data.driver_name
Name of the courier driver handling the delivery.
data.driver_phone
Contact number of the assigned courier driver.
data.cancelation_reason
Reason for the order cancellation (if any).
data.live_tracking_url
URL to track the shipment in real time.
data.commodity_code
Code representing the type of goods or commodity.
data.order_details[].product_name
Name of the product in the order.
data.order_details[].product_variant_name
Specific variant or configuration of the product.
data.order_details[].product_weight
Weight of the product in grams.
data.order_details[].product_height
Height of the product in centimeters.
data.order_details[].product_width
Width of the product in centimeters.
data.order_details[].product_length
Length of the product in centimeters.
data.order_details[].product_price
Unit price of the product.
data.order_details[].qty
Quantity of the product ordered.
data.order_details[].subtotal
Total price for this item (product_price x qty).
{
    "meta": {
        "message": "Success get order detail",
        "code": 200,
        "status": "success"
    },
    "data": {
        "order_no": "KOMXXXXXXXXXXXXXXXXX",
        "awb": "{{ awb.number }}",
        "order_status": "{{ status }}",
        "order_date": "{{ order.date }}",
        "brand_name": "{{ brand_name }}",
        "shipper_name": "{{ shipper_name }}",
        "shipper_phone": "{{ shipper_phone_number }}",
        "shipper_destination_id": {{ shipper_destination_id }},
        "shipper_address": "{{ shipper_detail_address }}",
        "receiver_name": "{{ receiver_name }}",
        "receiver_phone": "{{ receiver_phone_number }}",
        "receiver_destination_id": {{ receiver_destination_id }},
        "receiver_address": "{{ receiver_detail_address }}",
        "shipping": "{{ courier }}",
        "shipping_type": "{{ courier.service }}",
        "payment_method": "{{ payment_method }}",
        "shipping_cost": {{ Shipping_cost }},
        "shipping_cashback": {{ shipping_cashback }},
        "service_fee": {{ service_fee, 2.8\% }},
        "additional_cost": {{ additional_cost }},
        "grand_total": {{ grand_total }},
        "cod_value": {{ cod_value }},
        "notes": "{{ Order_notes }}",
        "insurance_value": {{ insurance_value }},
        "origin_pin_point": "{{ longitude }}, {{ latitude }}",
        "destination_pin_point": "{{ longitude }}, {{ latitude }}",
        "booking_id": "{{ booking_id }}",
        "driver_name": "{{ driver_name }}",
        "driver_phone": "{{ driver_phone }}",
        "cancelation_reason": "{{ reason }}",
        "live_tracking_url": "{{ track_url }}",
        "commodity_code": "{{ commodity }}",
        "order_details": [
            {
                "product_name": "{{ product_name }}",
                "product_variant_name": "{{ product_variant }}",
                "product_weight": {{ product_weight }},
                "product_height": {{ product_height }},
                "product_width": {{ product_width }},
                "product_length": {{ product_length }},
                "product_price": {{ product_price }},
                "qty": {{ qty }},
                "subtotal": {{ subtotal }}
            }
        ]
    }
}
{
  "meta": {
    "message": "Get Order detail failed",
    "code": 400,
    "status": "error"
  },
  "data": {
    "errors": "Data not found"
  }
}
Code	Status	Description	How to Fix
400
Not Found
order_no
not found
Check the order_no again, whether it matches the order number that was previously created.
401
Unauthorized
API key invalid or missing from parameter
Make sure your API key is valid using your Account
422
Unprocessable Entity
Keywoard parameter is missing
Add an valid keywoard parameter in your requested query. Parameter Request can't be null or missing
500
-
-
-
Always include the Authorization header with a valid apikey.
Do not leave the order_no parameter empty - it's required.
Use the correct endpoint and query structure.



11. Pickup Order
The Pickup Order Endpoint allows users to schedule a pickup for their orders at a specific date and time, with a choice of vehicle types to accommodate different shipping needs. This ensures flexibility and efficiency in handling order deliveries while maintaining operational constraints.

By leveraging this endpoint, users can manage pickup schedules seamlessly, ensuring that orders are collected by couriers within the allowed timeframe.

✅ Schedule a Courier Pickup Easily : Allows merchants to request a pickup from the logistics partner based on the shipping address and order details provided.
✅ Supports Multiple Couriers : Compatible with various supported courier partners, ensuring flexibility and broad delivery coverage.
✅ Auto-Validation of Pickup Requirements : Validates whether pickup can be scheduled based on courier rules, address eligibility, and required fields before confirming the request.
✅ Pickup Request Status Feedback : Provides clear status messages to indicate if the pickup has been successfully scheduled, or if further action is needed.
✅ Linked to Order Flow : Seamlessly integrates with the order creation process - pickups can only be requested for valid and confirmed orders.
✅ Real-Time Scheduling : Pickup requests are processed immediately, allowing merchants to coordinate handoffs without delay.

User Schedules a Pickup Request
Users provide the pickup date, pickup time, and vehicle type.
Orders to be picked up must be specified using their order numbers.
The system validates that the selected pickup time is at least 90 minutes from the current time or the order creation time (whichever is later).
System Processes the Request
The system checks if the orders are eligible for pickup.
It ensures the selected vehicle type is appropriate based on the total weight of the orders.
If the request meets all requirements, the pickup is scheduled and confirmed.
Courier Arrives for Pickup
At the scheduled time, the courier will collect the orders from the pickup location.
The system updates the status to "Out for Pickup" once the request is confirmed.
🚀 Motorcycle Pickup
Recommended for lightweight packages.
Each order must not exceed 5 kg.
Best suited for small parcels and documents.
🚗 Car Pickup
Recommended for bulk pickups when multiple orders need to be collected.
Suitable for medium-sized packages.
Users can group multiple orders in a single pickup request for efficiency.
🚛 Truck Pickup
Required for shipments weighing 10 kg or more.
Ideal for large or heavy orders that exceed the capacity of smaller vehicles.
curl --location 'https://api-sandbox.collaborator.komerce.id/order/api/v1/pickup/request' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'x-api-key: inputapikey' \
--data '{
    "pickup_date": "YYYY-MM-DD",
    "pickup_time": "HH:MM",
    "pickup_vehicle": "{{ Vehicle : Motor/Mobil/Truk }}",
    "orders": [
        {
            "order_no": "KOMXXXXXXXXXXXXXXXXX"
        }
    ]
}'
Key	Type	Description
x-api-key
*
string
this Value contain an secret APIKEY identic for Shipping API.
Key	Type	Value
pickup_date
*
date
Set order pickup days.
pickup_time
*
time
Set order pickup hours.
pickup_vehicle
*
string
Set order pickup vehicle, only available for Motor, Mobil, and Truk.
orders.order_no
*
string
Select the order number that will be scheduled for pickup by the courier, multiple order numbers can be filled in one request.
Danger

For each header and parameter that has a * sign, it is a Required parameter when making a request, otherwise there will be a system error that will warn the user regarding the request made.

Key	Value (Description)
meta.message
Message indicating the result of the API request.
meta.code
HTTP status code representing the request status.
meta.status
Status of the API response (e.g., success or error).
data.status
Information on the status of the pickup request to the courier, if the request is successful it will be success, if the request fails it will be failed.
data.order_no
Information from the order number submitted for pickup scheduling
data.awb
Information from the awb number that was successfully obtained for scheduling package pickup from the order number.
{
  "meta": {
    "message": "Success Request Pickup",
    "code": 201,
    "status": "success"
  },
  "data": [
    {
      "status": "success",
      "order_no": "KOMXXXXXXXXXXXXXXXXX",
      "awb": "KOMERKOMXXXXXXXXXXXXXXXXX"
    }
  ]
}
{
  "meta": {
    "message": "Success Request Pickup",
    "code": 201,
    "status": "success"
  },
  "data": [
    {
      "status": "failed",
      "order_no": "KOMXXXXXXXXXXXXXXXXXX",
      "awb": ""
    }
  ]
}
Code	Status	Description	How to Fix
400
Pickup Failed
Pickup request failed, pickup date cannot be before today.
Make sure the pickup request time occurs in the next few hours/day.
401
Unauthorized
API key invalid or missing from parameter
Make sure your API key is valid using your Account
500
Request Failed
Request Pickup failed
Check all body raw request
Use Valid order_no Values: Ensure each order_no provided exists and is eligible for pickup.
Provide Correct pickup_date and pickup_time: Use the format YYYY-MM-DD for dates and HH:mm:ss for times.
Specify pickup_vehicle Accurately: Choose from accepted vehicle types like "Motor" or "Mobil".
Avoid Duplicate Pickup Requests: Do not send multiple pickup requests for the same order.
Validate JSON Payload Structure: Ensure your JSON payload is correctly formatted.
Use a Valid API Token: Include a valid and authorized API token in your request headers.
Check for Successful Response: A successful request will return a status code of 200 and include AWB numbers in the response.
Info

Additional note: For Sandbox environment, only JNE and Ninja are available for pickup.


12. Label Order
The Label Printing Endpoint allows users to generate and print shipping labels (resis) for their orders. This feature supports both bulk printing and different label formats to accommodate various shipping and logistical needs.

Users can request labels for one or multiple orders by providing the order number(s). Additionally, they can specify the label format and page size based on their printer type and operational requirements.

✅ Orders Must Be Eligible → Only orders ready for shipment can have labels printed.
✅ Bulk Printing Supported → Multiple orders can be processed in a single request.
✅ Correct Page Format Required → Users must specify a valid page type for label generation.

✅ E-commerce Sellers → Quickly generate shipping labels for multiple orders.
✅ Warehouses & Fulfillment Centers → Automate bulk label printing.
✅ Courier Management → Standardize label formats for efficient logistics.

By using the Label Printing Endpoint, businesses can streamline their order processing, reduce manual errors, and improve shipping efficiency. 🚀

Once an order is created and the pickup is successfully scheduled, the next critical step is to generate a shipping label - a document used by logistics partners to track, transport, and deliver the package. This is done through the POST /label-order endpoint.

From a business perspective, here's how the process flows:

Order Confirmation: A customer places an order through your platform. This order is recorded in the system using the store-order API.
Pickup Scheduled: Once the order is confirmed, your system schedules a pickup with the selected logistics provider using the pickup-order endpoint. This ensures the courier knows when and where to collect the package.
Label Generation: After the pickup is scheduled, the label-order endpoint is called to generate the shipping label. This label includes the AWB (Air Waybill) number and essential delivery details. It serves as a ticket for the courier to recognize and deliver the parcel.
Download & Attach: The label is returned in PDF format and should be downloaded and printed. The merchant or warehouse team then attaches this label to the package before handing it over to the courier.
Package Ready for Delivery: Once labeled, the package is fully ready for pickup and delivery, ensuring a smooth handoff to logistics and end-to-end traceability.
Ensures traceability with valid AWB numbers.
Reduces manual errors during order processing.
Improves delivery reliability by aligning with logistics partner requirements.
Keeps your operations scalable and automated.
curl --location --request POST 'https://api-sandbox.collaborator.komerce.id/order/api/v1/orders/print-label?page=page_5&order_no=KOMXXXXXXXXXXXXXXXXX' \
--header 'x-api-key: inputapikey'
Key	Type	Description
x-api-key
*
string
this Value contain an secret APIKEY identic for Shipping API.
Key	Type	Description
page
*
string
The label format and page size for printing. Options include: page_1 (A4 size, 1 label per page), page_2 (A4 size, 2 labels per page), page_4 (A4 size, 4 labels per page (A6 format)), page_5 (Thermal size 10cm x 10cm), and page_6 (Thermal size 10cm x 15cm)
order_no
*
string
The order number(s) to generate labels for. Multiple orders can be specified using a comma separator (,).
Danger

For each header and parameter that has a * sign, it is a Required parameter when making a request, otherwise there will be a system error that will warn the user regarding the request made.

Key	Value (Description)
meta.message
Message indicating the result of the API request.
meta.code
HTTP status code representing the request status.
meta.status
Status of the API response (e.g., success or error).
data.path
Order label storage location
data.base_64
Binary code to generate the label file
{
    "meta": {
        "message": "Generate Print Label success",
        "code": 200,
        "status": "success"
    },
    "data": {
        "path": "/storage/label-DD-MM-YYY-00-00-00000000000.pdf",
        "base_64": "{{ long_base_64 }}
    }
}
Warning

Important If want to download shipping label request result file, you need to understand that it is necessary to add the /order path before /storage/label-DD-MM-YYY-00-00-00000000000.pdf.

{
  "meta": {
    "message": "Generate Print Label failed",
    "code": 500,
    "status": "error"
  },
  "data": "order_no not found"
}
Code	Status	Description	How to Fix
200
Success
Success generate print label
401
Unauthorized
API key invalid or missing from parameter
Make sure your API key is valid using your Account
422
Error
Generate print label failed
Ensure that the query parameters of the given request are appropriate
500
Generate print label failed
order_no
not found
Make sure the
order_no
requested to generate the label matches the data you have.
Ensure Pickup is Scheduled: Before generating a label, confirm that the pickup has been successfully scheduled using the POST /pickup-order endpoint.
Use a Valid order_no: Verify that the order_no provided exists and corresponds to an order that has completed the pickup scheduling process.
Avoid Duplicate Label Requests: Once a label has been generated for an order, refrain from making additional label generation requests for the same order to prevent duplication errors.
Check Order Status: Labels can only be generated for orders that are in the appropriate status (e.g., "Pickup Scheduled"). Attempting to generate a label for an order in an incorrect status will result in an error.
Validate API Token: Ensure that your API token is valid and has the necessary permissions to perform label generation operations.
Handle Errors Gracefully: Implement error handling in your application to manage scenarios where label generation fails, such as displaying user-friendly messages or retrying the operation as appropriate.



13. Cancel Order
The Cancel Order Endpoint is designed to allow users to cancel an order that has already been created but has not yet been shipped. This functionality provides greater flexibility in order management and ensures that users do not incur unnecessary costs for orders that are no longer needed.

This endpoint is particularly important for orders that use the Bank Transfer payment method. When an order is created with this payment method, the system automatically deducts the shipping cost from the user's dashboard balance. If the order is later canceled, the system will refund the previously deducted balance, ensuring a fair and transparent process.

By implementing this endpoint, users can manage their orders efficiently, preventing unnecessary shipments and maintaining full control over their transactions.

✅ Flexibility: Users can cancel orders that are no longer needed before they are shipped.
✅ Automatic Refunds: If a Bank Transfer payment was used, the system will automatically return the deducted balance, reducing financial risk for the user.
✅ Transparency: The cancellation process ensures that users have full visibility into their order and financial status.
✅ Error Prevention: By canceling unnecessary orders early, users can avoid incorrect shipments and additional logistics costs.
✅ User-Friendly Process: The cancellation request is processed instantly, providing a seamless experience for users.

Not all orders can be canceled. To be eligible for cancellation, an order must meet the following conditions:
Order Status Requirement
The order must be in "Created" or "Packing" status.
Orders in "Shipped", "In Transit", or "Delivered" status cannot be canceled.
If an order is already in the shipping process, cancellation is no longer possible, as the order is already being handled by the logistics provider.
Payment Method Considerations
Orders paid via Bank Transfer will have their shipping costs automatically deducted from the user's dashboard balance at the time of order creation.
If such an order is canceled, the system will automatically refund the deducted balance back to the user's account.
Orders paid using Cash on Delivery (COD) or other non-prepaid payment methods do not involve balance deductions, and therefore do not require a refund upon cancellation.
Cancellation Timeframe
Users must request cancellation before the order is shipped. Once the package has been handed over to the courier, the order can no longer be canceled.
The system will immediately validate the cancellation request and process it accordingly.
User Initiates Cancellation Request
The user sends a cancellation request via the Cancel Order Endpoint, including the order ID and relevant details.
The system checks the current status of the order to determine if it is eligible for cancellation.
System Validation
The system verifies whether the order is in "Created" or "Packing" status.
If the order is in a valid status, the system approves the cancellation request.
If the order has already been shipped or has an invalid status, the request is rejected, and an error message is returned.
Automatic Refund for Bank Transfer Payments
If the order was paid using Bank Transfer, the system automatically refunds the deducted balance to the user's dashboard.
This ensures that the user does not lose funds on canceled orders.
Order Status Update
Once successfully canceled, the order status is updated to "Canceled", preventing further processing or shipping.
The cancellation is recorded in the system for future reference.
The buyer changes their mind : If the customer decides not to proceed with the order before it is shipped, the seller can cancel it immediately.
Incorrect order details : If the order contains incorrect shipping information, product details, or pricing errors, the user can cancel the order and create a new one with the correct details.
Out-of-stock products : If the seller realizes that a product is unavailable, they can cancel the order before processing it further.
Payment-related issues : If there was an issue with payment (e.g., insufficient balance or failed transaction), the order can be canceled to prevent further complications.
Accidental order creation : In cases where an order was placed by mistake, the cancellation feature allows users to correct the situation without unnecessary costs.
curl --location --request PUT 'https://api-sandbox.collaborator.komerce.id/order/api/v1/orders/cancel' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'x-api-key: inputapikey' \
--data '{
  "order_no": "KOMXXXXXXXXXXXXXXXXX"
}'
Key	Type	Description
x-api-key
*
string
this Value contain an secret APIKEY identic for Shipping API.
Key	Type	Description
order_no
*
string
This value is requested according to the order number that will be canceled.
Danger

For each header and parameter that has a * sign, it is a Required parameter when making a request, otherwise there will be a system error that will warn the user regarding the request made.

Key	Value (Description)
meta.message
Message indicating the result of the API request.
meta.code
HTTP status code representing the request status.
meta.status
Status of the API response (e.g., success or error).
data.null
Indicates a successful cancel status without any warning.
data.errors
Indicates a failed cancel status with a warning.
{
  "meta": {
    "message": "success cancel order",
    "code": 200,
    "status": "success"
  },
  "data": null
}
{
  "meta": {
    "message": "cancel order failed",
    "code": 422,
    "status": "error"
  },
  "data": {
    "errors": "Failed Cancel order, order status "
  }
}
Code	Status	Description	How to Fix
400
Not Found
order_no
not found
Check the order_no again, whether it matches the order number that was previously created.
401
Unauthorized
API key invalid or missing from parameter
Make sure your API key is valid using your Account
422
Failed
Failed Cancel order, order status
Check the order number to be canceled, whether it is registered or not. Or it could be because the order status has been canceled before
500
-
-
-
Use a valid order_no: Ensure the order_no exists and is correctly written.
Provide a clear cancelation_reason : This field is required. Use reasons like "Customer changed mind" or "Wrong address".
Check order status before canceling : Only orders that haven't been shipped can be canceled.
Use correct JSON format : Make sure your payload is valid request body
Avoid duplicate cancel requests : Don't send a cancel request again if the order is already canceled.
Use a valid API token : Make sure your apikey is active and authorized.



14. History AWB Order
Endpoint provides a detailed view of a shipment's delivery history by tracking the status updates based on its AWB (Air Waybill) number. This endpoint acts as a bridge between your system and the courier's tracking services, offering up-to-date delivery events that help merchants and customers stay informed about their package's journey.

Tracking transparency is crucial for both operational teams and end-users. With this endpoint, businesses can monitor every logistical step-from pickup confirmation to successful delivery-improving delivery reliability, building trust with customers, and streamlining after-sales support in case of delays or delivery issues.

Whether you're managing hundreds of daily shipments or offering individual tracking to customers via your application, this endpoint empowers your system to deliver real-time shipping visibility.

Real-Time Delivery Status Updates: Retrieves real-time tracking history from the courier's system using a valid AWB number. Includes timestamps, status codes, and detailed descriptions.
Courier-Agnostic Integration: Automatically fetches tracking data from the relevant courier, depending on the logistics provider used in the original order.
Structured Timeline: Returns a chronological series of events showing the full lifecycle of a package, from pickup, transit, attempted deliveries, to final delivery or return.
Supports Customer Service Workflows: Can be used to proactively inform customers about delays, resolve complaints faster, and improve support ticket handling.
Enables End-to-End Shipment Monitoring: Useful for operational dashboards or customer-facing tracking pages, allowing both internal teams and buyers to follow shipment progress.
Compatible with Label-Generated Shipments: Designed to work in tandem with the POST /label-order process, ensuring traceability for each AWB assigned via the Komerce platform.
Order Label is Generated: When an order is created and labeled via POST /label-order, an AWB number is returned from the courier.
Tracking Request Made: Send a GET request to the /history-airwaybill endpoint with the AWB number included as a query parameter.
System Connects with Courier: Komerce routes the request to the relevant courier's tracking system and retrieves the complete tracking log for that shipment.
Receive Status Timeline: The API responds with a list of historical status updates, each containing a date-time, status code, and description of the event.
Integrate with UI or Operations: Display returned data on merchant dashboards, customer tracking pages, or use it for operations follow-up and support tickets.
Refresh As Needed: Poll this endpoint at intervals to refresh delivery status until the package reaches a final state (delivered, returned, canceled, etc.).
curl --location 'https://api-sandbox.collaborator.komerce.id/order/api/v1/orders/history-airway-bill?shipping={{courier}}&airway_bill=KOMERKOMXXXXXXXXXXXXXXXXX' \
  --header 'x-api-key: inputapikey'
Key	Type	Description
x-api-key
*
string
This value contains a secret API key used for the Shipping API.
Key	Type	Description
shipping
*
string
Name of the courier used for delivery of the package.
airway_bill
*
string
AWB number that will be checked for package travel history.
Danger

All headers and parameters marked with a * are required. If omitted, the system will return an error indicating that the request is invalid.

Key	Value (Description)
meta.message
Message indicating the result of the API request.
meta.code
HTTP status code representing the request status.
meta.status
Status of the API response (e.g., success or error).
data.airway_bill
The AWB number being searched for in the travel history.
data.last_status
The latest delivery status information of the AWB.
data.history[].desc
Description of each event in the AWB's travel history.
data.history[].date
Date and time of each travel history event
(YYYY-MM-DD HH:MM:SS)
.
data.history[].code
Status code corresponding to each travel history event.
data.history[].status
General status description for each travel history event.
{
  "meta": {
    "message": "success get data",
    "code": 200,
    "status": "success"
  },
  "data": {
    "airway_bill": "KOMERKOMXXXXXXXXXXXXXXXXX",
    "last_status": "{{ last status }}",
    "history": [
      {
        "desc": "{{ description }}",
        "date": "{{ YYYY-MM-DD HH:MM:SS }}",
        "code": "{{ code }}",
        "status": "{{ status }}"
      }
    ]
  }
}
{
  "meta": {
    "message": "invalid cnote/airway bill",
    "code": 400,
    "status": "error"
  },
  "data": {}
}
Code	Status	Description	How to Fix
200
Success
Successfully retrieved AWB history
400
Invalid
AWB data not found
Make sure the AWB number you are looking for is correct
422
Failed
Failed to retrieve data
Ensure all required request parameters are provided and valid
500
Error
Internal server error
Contact support or retry the request later
Use a valid AWB number generated from a successful POST /label-order call. Invalid or mistyped numbers will return no data or an error.
Wait for pickup confirmation before making tracking requests. If the package hasn't been scanned by the courier yet, the tracking history may be empty.
Not all couriers support real-time tracking or may have delays in updating status. Implement fallback logic for cases where tracking data is temporarily unavailable.
Handle empty or null results gracefully in UI displays and inform users that tracking may not be available yet.
Implement rate-limiting and caching for high-frequency tracking requests to avoid performance bottlenecks or overuse of courier resources.
Avoid exposing query parameter AWB numbers on the client-side if your application needs privacy or added security for tracking details.


15. Webhook
Endpoint allows you to register or update your application's webhook URL for receiving real-time notifications from Komerce. Once set up, this webhook becomes a critical channel through which your system is informed of key order events, such as order status changes, pickup updates, delivery confirmations, cancellations, and more.

By using this endpoint, businesses no longer need to constantly poll the API for updates. Instead, Komerce will automatically push the latest data to your specified endpoint URL whenever an event occurs. This leads to faster system reactions, better resource efficiency, and a seamless user experience across your platform.

✅ Real-Time Event Notification : Automatically receive updates on order status changes without needing to query the API manually.
✅ Flexible URL Management : Easily update the destination URL at any time by sending a new webhook URL to this endpoint.
✅ Supports Multiple Event Types : Events include status updates like 'Diajukan', 'Dijemput', 'Dikirim', 'Dibatalkan', 'Selesai', etc.
✅ Secure Data Push : Komerce sends structured JSON payloads to your system, allowing you to process updates automatically.
✅ Single Source of Truth : Synchronize internal databases, user interfaces, and notification systems based on real-time data from Komerce.

You Register the Webhook : Send a PUT request to /webhook with your desired webhook URL in the request body.
Komerce Stores the URL : Komerce saves the URL as the destination for all future event notifications related to your orders.
Events are Triggered : When a tracked event (e.g., pickup confirmed, delivery completed, order canceled) occurs, Komerce triggers your webhook.
Komerce Sends a Payload : Komerce sends a structured JSON payload to your webhook URL, including details such as the order number, status, timestamp, and other metadata.
Your Server Processes the Data : Your server receives the payload and processes it - for example, updating a database, notifying users, or logging the event.
You Respond with a 200 Status : To confirm that your system has received the payload successfully, return an HTTP 200 response to Komerce.
curl --location --request PUT 'your_webhook_handler_url' \
--header 'accept: application/json' \
--header 'Content-Type: application/json' \
--data '{
  "order_no": "{{ order.no }}",
  "cnote": "{{ awb.no }}",
  "status": "{{ status }}"
}'
Key	Type	Description
order_no
string
Information on
order_no
that have change notifications
cnote
string
Information on
awb
that have change notifications
status
string
Current delivery status
✅ Use a valid, HTTPS-secured URL to ensure safe and trusted communication between Komerce and your system.
⚠️ Make sure your server can handle incoming POST requests and is always online to receive webhook notifications.
🛑 Always return a 200 OK HTTP response to signal successful receipt. Failure to do so may lead to retries or webhook deactivation.
🔐 Validate the incoming data to ensure the request is indeed from Komerce (you may implement signature validation for added security if supported).
🧪 Test your webhook handler before going live to verify that it processes the payload correctly and handles edge cases like empty or malformed data.
🔁 Avoid circular API calls that could be triggered by the webhook payload itself to prevent infinite loops in your system.
💾 Log all webhook events for auditing and debugging purposes, especially when errors occur.


## progress terakhir:

- Lacak: timeline riwayat dari Komship, status tersinkron otomatis
- Detail + Batalkan (dengan konfirmasi)

Webhook & cleanup
- POST/PUT /api/shipping/webhook — menerima {order_no, cnote, status} dari Komerce, update deliveryStatus/AWB, selalu balas 200
- **Registrasi webhook (2026-08-02):** tombol "Daftarkan Webhook" di Settings → Pengiriman memanggil PUT {base}/webhook (section 15) dengan body {webhook_url} — wajib HTTPS (ditolak di dev karena NEXT_PUBLIC_APP_URL=http). Verifikasi opsional di handler: x-webhook-secret vs rajaongkir_webhook_secret, atau x-api-key/x-callback-api-key vs komship_api_key bila header hadir; tanpa header tetap diterima (sesuai dokumen).
- **Validasi kendaraan pickup (2026-08-02):** Motor ≤5 kg/order & Truk ≥10 kg divalidasi di client (modal pickup) dan server (POST /api/admin/delivery/pickup) sesuai aturan dokumen; commodity_code LION diwajibkan saat store order.
- /api/orders/[id]/status dipivot dari trackPackage V1 → historyAWB Komship
- Fungsi legacy V1 tanpa konsumen (createAWB, requestPickup, printLabel, trackPackage + 4 type) dihapus dari lib/rajaongkir.ts; payment (createPayment, getPaymentStatus, QRIS) tetap jalan

Server dev kamu yang jalan akan hot-reload otomatis — coba urutan: isi API key di Settings → Pengiriman → Uji Koneksi → buka order berstatus Processing → Buat Pengiriman. Catatan: di sandbox hanya JNE & Ninja yang tersedia untuk pickup, dan pickup minimal 90 menit dari sekarang.