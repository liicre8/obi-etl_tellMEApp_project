# Coles Locations API Notes

This document records sample Coles store locations (1–8) with their **initStoreId / storeId** and normalized metadata.  
Focus is on **key objects** needed to link products to specific stores.  

---

## 🔑 Key Points

- **GET Search Endpoint**  
https://www.coles.com.au/api/bff/locations/search?latitude=<LAT>&longitude=<LON>&distance=50&numberOfLocations=20

→ yields `fulfillmentStore.storeId` = **initStoreId**  

- **POST Delivery Endpoint**  
https://colessupermarketspty.tt.omtrdc.net/rest/v1/deliveryclient=colessupermarketspty&sessionId=<SESSION>&version=2.10.0

→ confirms the same `store_id` used in payload context  

- **Minimal schema**  
```json
{
  "storeId": "0728",
  "locationId": "0728CC0728",
  "name": "Coles Pyrmont",
  "address": "50-70 Union Street",
  "suburb": "Pyrmont",
  "postcode": "2009",
  "state": "NSW",
  "latitude": -33.869623,
  "longitude": 151.196403,
  "phone": "0466 726 976",
  "shoppingMethod": "CC"
}
```
🏪 Store Samples (1–8)
1. Pyrmont, NSW
```
{
  "storeId": "0728",
  "locationId": "0728CC0728",
  "name": "Coles Pyrmont",
  "address": "50-70 Union Street",
  "suburb": "Pyrmont",
  "postcode": "2009",
  "state": "NSW",
  "latitude": -33.869623,
  "longitude": 151.196403,
  "phone": "0466 726 976",
  "shoppingMethod": "CC"
}
```

2. Chadstone, VIC
```
{
  "storeId": "0643",
  "locationId": "0643CC1234",
  "name": "Coles Snow fruit collection",
  "address": "1341 Dandenong Rd",
  "suburb": "Chadstone",
  "postcode": "3148",
  "state": "VIC",
  "latitude": -37.88545,
  "longitude": 145.08436,
  "phone": "0466 456 677",
  "shoppingMethod": "CC"
}
```

3. Kedron, QLD
```
{
  "storeId": "4385",
  "locationId": "4385CC4385",
  "name": "Coles Kedron",
  "address": "346 Gympie Road",
  "suburb": "Kedron",
  "postcode": "4031",
  "state": "QLD",
  "latitude": -27.4035,
  "longitude": 153.031274,
  "phone": "0466 791 324",
  "shoppingMethod": "CC"
}
```

4. North Perth, WA
```
{
  "storeId": "0357",
  "locationId": "0357CC0357",
  "name": "Coles North Perth",
  "address": "Cnr View & Fitzgerald Sts",
  "suburb": "North Perth",
  "postcode": "6006",
  "state": "WA",
  "latitude": -31.932163,
  "longitude": 115.858187,
  "phone": "0466 726 960",
  "shoppingMethod": "CC"
}
```

5. Kilburn, SA
```
{
  "storeId": "4972",
  "locationId": "4972CC4972",
  "name": "Coles Churchill Centre",
  "address": "Churchill Centre, 380-408 Churchill Road",
  "suburb": "Kilburn",
  "postcode": "5084",
  "state": "SA",
  "latitude": -34.862891,
  "longitude": 138.581287,
  "phone": "0417 637 128",
  "shoppingMethod": "CC"
}
```

6. Sandy Bay, TAS
```
{
  "storeId": "7505",
  "locationId": "7505CC7505",
  "name": "Coles Sandy Bay",
  "address": "246 Sandy Bay Rd",
  "suburb": "Sandy Bay",
  "postcode": "7005",
  "state": "TAS",
  "latitude": -42.895824,
  "longitude": 147.327594,
  "phone": "0466 602 468",
  "shoppingMethod": "CC"
}
```
7. Dickson, ACT
```
{
  "storeId": "4814",
  "locationId": "4814CC4814",
  "name": "Coles Dickson",
  "address": "36 Badham Street",
  "suburb": "Dickson",
  "postcode": "2602",
  "state": "ACT",
  "latitude": -35.249082,
  "longitude": 149.135045,
  "phone": "0466 497 812",
  "shoppingMethod": "CC"
}
```

8. Casuarina, NT
```
{
  "storeId": "0404",
  "locationId": "0404CC0404",
  "name": "Coles Casuarina - Drive-through",
  "address": "Cnr Dripstone Rd and Trower Rd",
  "suburb": "Casuarina",
  "postcode": "0810",
  "state": "NT",
  "latitude": -12.376259,
  "longitude": 130.880433,
  "phone": "0413 317 072",
  "shoppingMethod": "CC"
}
```

📦 Storage Notes

- Save resolved store list in Bronze:
```bash
02_raw/coles/locations/partition_date=<YYYY-MM-DD>/stores.json
```

- Use storeId (initStoreId) as the foreign key when fetching product JSON for a specific store.

- Ignore telemetry fields:
   - tntId, marketingCloudVisitorId, telemetryServerToken
   - analytics / audienceManager
   - Session/tracking fields