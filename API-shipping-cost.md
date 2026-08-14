prompt:
pahami dokumentasi resmi dari rajaongkir terkait shipping cost, sekarang fokus fitur API shipping cost yang dintegrasikan dengan rajaongkir. dikarenakan API key belum ada, semua yang berhubungan dengan API key nya bisa dikelola melalui panel admin nanti. yang terpenting adalah arsitektur engine backend dan UI/UX shipping cost sudah 100% fungsi normal konsisten dans tabil dan UI/UX panel admin jelas, user friendly untuk kelola API setting nya

disclaimer: saya sedang membuat website e-commerce yang akan diintegrasikan dengan semua layanan dari rajaongkir. salah satunya shipping cost. dan saya juga sudah login dashboard rajaongkir nya untuk generate API key yang dibutuhkan

berikut ada 2 metode shipping cost, terapkan kedua metode di bawah ini ke dalam web hageclub yang konsisten dan sinkron dengan arsitektur yang sudah dibangun. jika ada perlu 

##endpoint for step by step method

1. search province: https://rajaongkir.komerce.id/api/v1/destination/province
methode
Method
GET
methode
Base URL
https://rajaongkir.komerce.id/api/v1/destination/province
description
Description
Retrieves a comprehensive list of all Indonesian provinces with their corresponding unique identifiers. This data serves as the first level in the location hierarchy and is required to subsequently fetch cities and districts within each province.

#request body
curl --location 'https://rajaongkir.komerce.id/api/v1/destination/province' \
--header 'Key: YOUR_API_KEY'

#response
{
  "meta": {
    "message": "Success Get Province",
    "code": 200,
    "status": "success"
  },
  "data": [
    {
      "id": 1,
      "name": "NUSA TENGGARA BARAT (NTB)"
    },
    {
      "id": 2,
      "name": "NUSA TENGGARA BARAT"
    },
    {
      "id": 3,
      "name": "MALUKU"
    },
    {
      "id": 4,
      "name": "KALIMANTAN SELATAN"
    },
    {
      "id": 5,
      "name": "KALIMANTAN TENGAH"
    },
    {
      "id": 6,
      "name": "JAWA BARAT"
    },
    {
      "id": 7,
      "name": "BENGKULU"
    },
    {
      "id": 8,
      "name": "KALIMANTAN TIMUR"
    },
    {
      "id": 9,
      "name": "KEPULAUAN RIAU"
    },
    {
      "id": 10,
      "name": "NANGGROE ACEH DARUSSALAM (NAD)"
    },
    {
      "id": 11,
      "name": "DKI JAKARTA"
    },
    {
      "id": 12,
      "name": "BANTEN"
    },
    {
      "id": 13,
      "name": "JAWA TENGAH"
    },
    {
      "id": 14,
      "name": "JAMBI"
    },
    {
      "id": 15,
      "name": "PAPUA"
    },
    {
      "id": 16,
      "name": "BALI"
    },
    {
      "id": 17,
      "name": "SUMATERA UTARA"
    },
    {
      "id": 18,
      "name": "GORONTALO"
    },
    {
      "id": 19,
      "name": "JAWA TIMUR"
    },
    {
      "id": 20,
      "name": "DI YOGYAKARTA"
    },
    {
      "id": 21,
      "name": "SULAWESI TENGGARA"
    },
    {
      "id": 22,
      "name": "NUSA TENGGARA TIMUR (NTT)"
    },
    {
      "id": 23,
      "name": "SULAWESI UTARA"
    },
    {
      "id": 24,
      "name": "SUMATERA BARAT"
    },
    {
      "id": 25,
      "name": "BANGKA BELITUNG"
    },
    {
      "id": 26,
      "name": "RIAU"
    },
    {
      "id": 27,
      "name": "SUMATERA SELATAN"
    },
    {
      "id": 28,
      "name": "SULAWESI TENGAH"
    },
    {
      "id": 29,
      "name": "KALIMANTAN BARAT"
    },
    {
      "id": 30,
      "name": "PAPUA BARAT"
    },
    {
      "id": 31,
      "name": "LAMPUNG"
    },
    {
      "id": 32,
      "name": "KALIMANTAN UTARA"
    },
    {
      "id": 33,
      "name": "MALUKU UTARA"
    },
    {
      "id": 34,
      "name": "SULAWESI SELATAN"
    },
    {
      "id": 35,
      "name": "SULAWESI BARAT"
    }
  ]
}

2. seach city : 
methode
Method
GET
methode
Base URL
https://rajaongkir.komerce.id/api/v1/destination/city/{province_id}
description
Description
Retrieves a comprehensive list of all cities within a specified Indonesian province using the province ID. This data serves as the second level in the location hierarchy and is required to subsequently fetch districts within each selected city.

#request
curl --location 'https://rajaongkir.komerce.id/api/v1/destination/city/12' \
--header 'Key: YOUR_API_KEY'

#response
{
  "meta": {
    "message": "Success Get District By City ID",
    "code": 200,
    "status": "success"
  },
  "data": [
    {
      "id": 1360,
      "name": "JAKARTA SELATAN",
      "zip_code": "0"
    },
    {
      "id": 1361,
      "name": "JAGAKARSA",
      "zip_code": "12630"
    },
    {
      "id": 1362,
      "name": "KEBAYORAN BARU",
      "zip_code": "12150"
    },
    {
      "id": 1363,
      "name": "KEBAYORAN LAMA",
      "zip_code": "12230"
    },
    {
      "id": 1364,
      "name": "MAMPANG PRAPATAN",
      "zip_code": "12730"
    },
    {
      "id": 1365,
      "name": "PANCORAN",
      "zip_code": "12770"
    },
    {
      "id": 1366,
      "name": "PASAR MINGGU",
      "zip_code": "12560"
    },
    {
      "id": 1367,
      "name": "PESANGGRAHAN",
      "zip_code": "12330"
    },
    {
      "id": 1368,
      "name": "SETIA BUDI",
      "zip_code": "12980"
    },
    {
      "id": 1369,
      "name": "TEBET",
      "zip_code": "12840"
    },
    {
      "id": 1370,
      "name": "CILANDAK",
      "zip_code": "12430"
    }
  ]
}

3. search district
Method
GET
methode
Base URL
https://rajaongkir.komerce.id/api/v1/destination/district/{city_id}
description
Description
Retrieves a list of all districts within a specified Indonesian city using the city ID. This endpoint provides the third level in the location hierarchy and is essential for completing the destination input needed for shipping cost calculations and logistic planning.

#request
curl --location 'https://rajaongkir.komerce.id/api/v1/destination/district/575' \
--header 'Key: YOUR_API_KEY'

#response
{
  "meta": {
    "message": "Success Get District By City ID",
    "code": 200,
    "status": "success"
  },
  "data": [
    {
      "id": 1360,
      "name": "JAKARTA SELATAN",
      "zip_code": "0"
    },
    {
      "id": 1361,
      "name": "JAGAKARSA",
      "zip_code": "12630"
    },
    {
      "id": 1362,
      "name": "KEBAYORAN BARU",
      "zip_code": "12150"
    },
    {
      "id": 1363,
      "name": "KEBAYORAN LAMA",
      "zip_code": "12230"
    },
    {
      "id": 1364,
      "name": "MAMPANG PRAPATAN",
      "zip_code": "12730"
    },
    {
      "id": 1365,
      "name": "PANCORAN",
      "zip_code": "12770"
    },
    {
      "id": 1366,
      "name": "PASAR MINGGU",
      "zip_code": "12560"
    },
    {
      "id": 1367,
      "name": "PESANGGRAHAN",
      "zip_code": "12330"
    },
    {
      "id": 1368,
      "name": "SETIA BUDI",
      "zip_code": "12980"
    },
    {
      "id": 1369,
      "name": "TEBET",
      "zip_code": "12840"
    },
    {
      "id": 1370,
      "name": "CILANDAK",
      "zip_code": "12430"
    }
  ]
}

4. district calculate cost
Method
POST
methode
Base URL
https://rajaongkir.komerce.id/api/v1/calculate/district/domestic-cost
Content-Type
application/x-www-form-urlencoded
description
Description
Calculates domestic shipping costs between two Indonesian districts using the selected couriers and package weight. The result includes shipping options, estimated delivery times, and total fees from multiple courier services.

#request
curl --location 'https://rajaongkir.komerce.id/api/v1/calculate/district/domestic-cost' \
--header 'key: YOUR_API_KEY' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'origin=1391' \
--data-urlencode 'destination=1376' \
--data-urlencode 'weight=1000' \
--data-urlencode 'courier=jne:sicepat:ide:sap:jnt:ninja:tiki:lion:anteraja:pos:ncs:rex:rpx:sentral:star:wahana:dse' \
--data-urlencode 'price=lowest'

5. search sub district
Method
GET
methode
Base URL
https://rajaongkir.komerce.id/api/v1/destination/sub-district/{district_id}
description
Description
Retrieves a list of all subdistrict within a specified Indonesian district using the district ID. This endpoint provides the third level in the location hierarchy and is essential for completing the destination input needed for shipping cost calculations and logistic planning.

#request
curl --location 'https://rajaongkir.komerce.id/api/v1/destination/sub-district/5823' \
--header 'Key: YOUR_API_KEY'#response
#response
{
    "meta": {
        "message": "Success Get Sub District By District ID",
        "code": 200,
        "status": "success"
    },
    "data": [
        {
            "id": 68513,
            "name": "BALERAKSA",
            "zip_code": "53355"
        },
        {
            "id": 68514,
            "name": "GRANTUNG",
            "zip_code": "53355"
        },
        {
            "id": 68515,
            "name": "KARANGSARI",
            "zip_code": "53355"
        },
        {
            "id": 68516,
            "name": "KRAMAT",
            "zip_code": "53355"
        },
        {
            "id": 68517,
            "name": "PEKIRINGAN",
            "zip_code": "53355"
        },
        {
            "id": 68518,
            "name": "PEPEDAN",
            "zip_code": "53355"
        },
        {
            "id": 68519,
            "name": "RAJAWANA",
            "zip_code": "53355"
        },
        {
            "id": 68520,
            "name": "SIRAU",
            "zip_code": "53355"
        },
        {
            "id": 68521,
            "name": "TAJUG",
            "zip_code": "53355"
        },
        {
            "id": 68522,
            "name": "TAMANSARI",
            "zip_code": "53355"
        },
        {
            "id": 68523,
            "name": "TUNJUNGMULI",
            "zip_code": "53355"
        }
    ]
}


##Endpoint for direct search method

1. Search Domestics Destination


✅ Real-time destination lookup
Instantly retrieve location data across Indonesia based on value params.

📍 Multi-level location support
Returns province, city, district, subdistrict, and zip code information in a single query.

🔎 Flexible search
Search using partial names or keywords - ideal for autocomplete fields.

⚡ Optimized for performance
Lightweight endpoint designed to be used on page loads or form interactions.

Send a POST request to the endpoint with a search payload:

This keyword may include city names like "jakarta" or "bandung", or subdistricts like "kemayoran".
The API returns a list of matched locations based on the keyword:

Each result includes id, label, province, city, district, subdistrict, and zip_code.
Use the returned id when calculating shipping cost.

#request body
curl --location 'https://rajaongkir.komerce.id/api/v1/destination/domestic-destination?search={{search_location}}&limit=999&offset=999' \
--header 'key: inputapikey'


#query parameters
- headers
Key	Type	Description
key
*
string
this Value contain an secret APIKEY identic for Shipping Cost API

- query params
Key	Type	Description
search
*
string
This parameter is used to search for the intended area, can use the search for city names, sub-districts, villages, and postal codes.
limit
int
The maximum number of rows (or records) to be returned by the query.
offset
int
This is often used with LIMIT to limit query results in "pages" or "sections".
Danger

For each header and parameter that has a * sign, it is a Required parameter when making a request, otherwise there will be a system error that will warn the user regarding the request made.


#response

Key	Value (Description)
meta.message
Response for searching address.
meta.code
Any response have different code.
meta.status
Boolean status for checking address.
data[].id
A uniqe
id
that is used as a parameter in the shipping cost.
data[].label
Full format for delivery location.
data[].province_name
Name of the search province
data[].city_name
Name of the search city
data[].district_name
Name of the search district
data[].subdistrict_name
Name of the search subdistrict
data[].zip_code
Name of the search zip code


#success-respons-for-search-domestics-destination

{
    "meta": {
        "message": "Success Get Domestic Destinations",
        "code": 200,
        "status": "success"
    },
    "data": [
        {
            "id": {{ id_location }},
            "label": "{{ label_location }}",
            "province_name": "{{ province_location }}",
            "city_name": "{{ city_location }}",
            "district_name": "{{ distric_location }}",
            "subdistrict_name": "{{ subdistrict_location }}",
            "zip_code": "{{ zipcode_location }}"
        }
    ]
}

#error-respons-for-search-domestic-destination
{
  "meta": {
    "message": "Domestic Destinations Data not found",
    "code": 404,
    "status": "error"
  },
  "data": null
}

#error code
Code	Status	Description	How to Fix
200
Success
404
Error
Domestic Destinations Data not found
Make sure the name of the city, sub-district, village, or zip code you are looking for is correct.
422
Error
Parameter Missing
Make sure the required parameters are given when requesting data.
500
Error
Server Error

#tips to avoid error
✅ Always validate the value input
Ensure it is a non-empty string. Avoid sending numeric or symbol-only strings.
🔁 Debounce user input on the frontend
If you're using this for search-as-you-type, add a debounce delay to reduce API calls.
📦 Cache popular destination results
For performance improvement, cache results for frequent searches (like "Jakarta").
❌ Avoid calling the endpoint without a request location
Requests with an empty or missing request will return an error or no data.
🔐 Set the Key header
Don't forget to include your APIKEY in the header.


2. search-international-destination
🌍 Supports Global Shipping
Search for international destinations in various countries worldwide.

🚚 Seamless Integration with Cost Calculation
Returned destination_code can be used directly with cost calculation endpoints.

📦 Ready for International Logistics
Helps users accurately fill shipping forms for overseas deliveries.

Make a POST request to the endpoint with a value:

Value can include country names (e.g., "japan").
The API returns a list of matched locations, including:

Country name, and a unique Country id for each.
Use the conutry_id in subsequent calls to the calculate/international-cost endpoint or when creating international shipment requests.


#request
curl --location --globoff 'https://rajaongkir.komerce.id/api/v1/destination/international-destination?search={{%20search_region%20}}&limit=99&offset=99' \
--header 'key: inputapikey'

Key	Type	Description
key
*
string
this Value contain an secret APIKEY identic for Shipping Cost API
Key	Type	Description
search
*
string
This parameter is used to search for the intended area, only can search the nation name.
limit
int
The maximum number of rows (or records) to be returned by the query.
offset
int
This is often used with LIMIT to limit query results in "pages" or "sections".
Danger

For each header and parameter that has a * sign, it is a Required parameter when making a request, otherwise there will be a system error that will warn the user regarding the request made.

Key	Value (Description)
meta.message
Response for searching address.
meta.code
Any response have different code.
meta.status
Boolean status for checking address.
data[].country_id
A uniqe
id
that is used as a parameter in the shipping cost.
data[].country_name
Name of the search nation
{
  "meta": {
    "message": "Success Get International Destination",
    "code": 200,
    "status": "success"
  },
  "data": [
    {
      "country_id": "{{ country_id }}",
      "country_name": "{{ country_name }}"
    }
  ]
}
{
  "meta": {
    "message": "International Destinations Data not found",
    "code": 404,
    "status": "error"
  },
  "data": null
}
Code	Status	Description	How to Fix
200
Success
404
Error
International Destinations Data not found
Make sure the nation name you are looking for is correct.
422
Error
Parameter Missing
Make sure the required parameters are given when requesting data.
500
Error
Server Error
✅ Provide a meaningful search
Avoid empty strings or irrelevant characters; use proper nation names.
🔐 Include valid authorization
Always add your key in the header.
⌨️ Implement frontend input validation
For best results, guide users to enter country names.
⚠️ Use debounce for live search
Prevent too many API calls by throttling or debouncing input.
🛠 Gracefully handle "no results"
Show friendly messages if the API returns an empty list due to unrecognized keywords.


3. calculate domestic cost

https://rajaongkir.komerce.id/api/v1/calculate/domestic-cost

📦 Multi-Courier Support
Supports a wide range of domestic couriers integrated with Komerce API.

🎯 Precise Cost Calculation
Returns real-time cost estimates based on origin, destination, and package weight/dimensions.

🔄 Flexible Input
Accepts both exact destination IDs and subdistrict level or zip_code granularity for more accurate pricing.

🧾 Courier Breakdown
Displays available services, estimated costs, and estimated delivery times.

Prepare the Required Data : You'll need the origin and destination IDs, courier code, and package details such as weight and optional dimensions.
Receive a detailed response containing available services, cost per service, and estimated delivery time.
Use the returned data to display cost options at checkout, or calculate total shipping charges for the order.
curl --location 'https://rajaongkir.komerce.id/api/v1/calculate/domestic-cost' \
--header 'key: inputapikey' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'origin={{ origin.id }}' \
--data-urlencode 'destination={{ destination.id }}' \
--data-urlencode 'weight={{ weight.grams }}' \
--data-urlencode 'courier={{ courier.code }}' \
--data-urlencode 'price={{ lowest/highest }}'
Key	Type	Description
key
*
string
this Value contain an secret APIKEY identic for Shipping Cost API
Key	Type	Description
origin
*
int
this Value containt an
id
during Search Domestics Destinations
destination
*
int
this Value containt an
id
during Search Domestics Destinations
weight
*
int
this Value containt an a package weight with grams estimated
courier
*
string
this Value contain an Courier Name
price
boolean
this Value Contain an boolean value, lowest or highest shipping cost
Danger

For each header and parameter that has a * sign, it is a Required parameter when making a request, otherwise there will be a system error that will warn the user regarding the request made.

Key	Value (Description)
meta.message
Response for searching address.
meta.code
Any response have different code.
meta.status
Boolean status for checking address.
data[].name
Information about availability Courier Name
data[].code
Information about availability Code of Courier
data[].service
Information about availability Service of Courier
data[].description
Description about Courier
data[].cost
Information about Courier Service Cost
data[].etd
Information about estimated time of courier delivery
{
    "meta": {
        "message": "Success Calculate Domestic Shipping cost",
        "code": 200,
        "status": "success"
    },
    "data": [
        {
            "name": "{{ courier.name }}",
            "code": "{{ courier.code }}",
            "service": "{{ courier.service }}",
            "description": "{{ courier.desc }}",
            "cost": {{ shipping.cost }},
            "etd": "{{ etd.info }}"
        },
    ]
}
{
    "meta": {
        "message": "{{ error.message }}",
        "code": {{ error.code }},
        "status": "{{ status }}"
    },
    "data": null
}
Code	Status	Description	How to Fix
200
Success
400
Error
Calculate Domestic Shipping Cost not found
This error is unavoidable because the courier may not be able to provide the desired data.
400
Error
Missing Params
Make sure the request parameters that are sent match the required parameters.
422
Error
Invalid Courier
Make sure the courier code entered is correct according to the courier code guide available for checking.
📌 Ensure subdistrict IDs are valid : Use the correct IDs from the Search Destination endpoint.
⚖️ Use appropriate weight : Weight must be in grams. 1kg = 1000g. Avoid using "0" or negative numbers.
🚚 Provide valid courier code : Supported courier codes include jne, jnt, sicepat, etc. Make sure the code matches supported ones from the 3PL list.
🔐 Include Authorization Header : Always attach your Bearer Token using the Authorization: Bearer YOUR_API_KEY format.
📉 Handle "no service available" gracefully : If no service is returned, inform the user that the route or courier may not be supported.


4. Calculate International Cost

🌍 Supports International Shipping Calculation
📦 Based on Weight, Origin City, and Destination Country
🚚 Courier Selection Flexibility
💰 Returns Pricing and Estimated Delivery Time
The client sends a POST request with required information
RajaOngkir API processes the request using international rate database.
A list of shipping options is returned.
curl --location 'https://rajaongkir.komerce.id/api/v1/calculate/international-cost' \
--header 'key: inputapikey' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'courier={{ courier }}' \
--data-urlencode 'origin={{ origin_id }}' \
--data-urlencode 'destination={{ destination_id }}' \
--data-urlencode 'weight={{ weight }}' \
--data-urlencode 'price={{ sort_price }}'
Key	Type	Description
key
*
string
this Value contain an secret APIKEY identic for Shipping Cost API
Key	Type	Description
origin
*
int
this Value containt an
id
during Search International Destinations
destination
*
int
this Value containt an
id
during Search International Destinations
weight
*
int
this Value containt an a package weight with grams estimated
courier
*
string
this Value contain an Courier Name
price
boolean
this Value Contain an boolean value, lowest or highest shipping cost
Danger

For each header and parameter that has a * sign, it is a Required parameter when making a request, otherwise there will be a system error that will warn the user regarding the request made.

Key	Value (Description)
meta.message
Response for searching address.
meta.code
Any response have different code.
meta.status
Boolean status for checking address.
data[].name
Information about availability Courier Name
data[].code
Information about availability Code of Courier
data[].service
Information about availability Service of Courier
data[].description
Description about Courier
data[].currency
Information about availability Currency of Courier
data[].cost
Information about Courier Service Cost
data[].etd
Information about estimated time of courier delivery
data[].currency_updated_at
Information about Updated time for Currency Value
data[].currency_value
Information about Currency Kurs Updated
{
    "meta": {
        "message": "Success Calculate International Shipping Cost",
        "code": 200,
        "status": "success"
    },
    "data": [
        {
            "name": "{{ courier.name }}",
            "code": "{{ courier.code }}",
            "service": "{{ courier.service }}",
            "description": "{{ courier.desc }}",
            "currency": "{{ availability.currency }}",
            "cost": {{ shipping_cost }},
            "etd": "{{ estimated_time_delivery }}",
            "currency_updated_at": "{{ information_updated_currency }}",
            "currency_value": {{ currency_kurs }}
        }
    ]
}
{
    "meta": {
        "message": "{{ message }}",
        "code": {{ code }},
        "status": "{{ status }}"
    },
    "data": null
}
Code	Status	Description	How to Fix
200
Success
400
Error
Calculate International Shipping Cost not found
This error is unavoidable because the courier may not be able to provide the desired data.
400
Error
Missing Params
Make sure the request parameters that are sent match the required parameters.
422
Error
Invalid Courier
Make sure the courier code entered is correct according to the courier code guide available for checking.
✅ Ensure the origin id is correct - use the RajaOngkir Search Destination endpoint to get a valid id.
🌐 Use a valid country code for the destination.
⚖️ Weight is mandatory and should be greater than zero (in grams).
🚫 Courier must support international shipments - not all couriers are available.
🛡️ Authenticate with the correct API Key or the request will be rejected.


## progress terakhir:


Jadi admin langsung tahu kurir mana yang harus dicentang di grid Kurir Aktif sebelum menyimpan — persis kebutuhan "user friendly untuk kelola API setting".

Status tugas

- Task #18 (Public UI) ditutup — semua route + UI terverifikasi.
- .env.local RAJAONGKIR_BASE_URL sudah diganti ke https://rajaongkir.komerce.id/api/v1 (selaras dengan DB).
- Typecheck bersih setelah semua edit.

Yang tinggal kamu lakukan di panel admin (/admin/settings/rajaongkir)

1. Uji Koneksi — lihat chip kurir mana yang ✓.
2. Uncheck kurir yang ✕ (jnt/sicepat bila key belum mendukung).
3. Atur Wilayah Asal via picker step-by-step (provinsi → kota → kecamatan → kelurahan) — origin sekarang masih 152 (id V1 lama) tanpa label.