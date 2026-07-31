# Google Apps Script API examples

After deploying `Code.gs` as a Web app, replace `WEB_APP_URL` below with the deployment URL ending in `/exec`.

## Read endpoints

```text
GET WEB_APP_URL?resource=health
GET WEB_APP_URL?resource=categories
GET WEB_APP_URL?resource=restaurants
GET WEB_APP_URL?resource=restaurants&category=thai&popular=true
GET WEB_APP_URL?resource=restaurants&search=กะเพรา
GET WEB_APP_URL?resource=restaurant&id=RES001
GET WEB_APP_URL?resource=menu&restaurant_id=RES001
GET WEB_APP_URL?resource=order&order_id=ORD00000001
GET WEB_APP_URL?resource=order&order_number=2026073112304501
```

## Create customer

```js
await fetch(WEB_APP_URL, {
  method: "POST",
  headers: { "Content-Type": "text/plain;charset=utf-8" },
  body: JSON.stringify({
    action: "create_customer",
    full_name: "สมชาย ใจดี",
    phone: "0812345678",
    email: "somchai@example.com"
  })
}).then(r => r.json());
```

## Save address

```js
await fetch(WEB_APP_URL, {
  method: "POST",
  headers: { "Content-Type": "text/plain;charset=utf-8" },
  body: JSON.stringify({
    action: "save_address",
    customer_id: "CUS000001",
    label: "บ้าน",
    recipient_name: "สมชาย ใจดี",
    phone: "0812345678",
    address_line: "123/45 หมู่บ้านแสนสุข ซอย 5",
    subdistrict: "ลาดยาว",
    district: "จตุจักร",
    province: "กรุงเทพมหานคร",
    postal_code: "10900",
    is_default: true
  })
}).then(r => r.json());
```

## Create order

The server ignores prices sent by the browser. It recalculates menu prices and customization prices from the database.

```js
await fetch(WEB_APP_URL, {
  method: "POST",
  headers: { "Content-Type": "text/plain;charset=utf-8" },
  body: JSON.stringify({
    action: "create_order",
    customer_id: "CUS000001",
    restaurant_id: "RES001",
    address_id: "ADR000001",
    payment_method: "QR PromptPay",
    note: "โทรก่อนถึง",
    items: [
      {
        menu_item_id: "MENU101",
        quantity: 2,
        option_ids: ["OPT003", "OPT005"],
        special_note: "ไม่ใส่ถั่วฝักยาว"
      }
    ]
  })
}).then(r => r.json());
```

## Update order status

```js
await fetch(WEB_APP_URL, {
  method: "POST",
  headers: { "Content-Type": "text/plain;charset=utf-8" },
  body: JSON.stringify({
    action: "update_order_status",
    order_id: "ORD00000001",
    status: "preparing",
    changed_by_type: "restaurant",
    changed_by_id: "RES001",
    note: "ร้านรับออเดอร์แล้ว"
  })
}).then(r => r.json());
```

Allowed transitions:

```text
received -> preparing | cancelled
preparing -> delivering | cancelled
delivering -> delivered
```

## Update payment status

```js
await fetch(WEB_APP_URL, {
  method: "POST",
  headers: { "Content-Type": "text/plain;charset=utf-8" },
  body: JSON.stringify({
    action: "update_payment_status",
    order_id: "ORD00000001",
    status: "paid",
    transaction_ref: "PROMPTPAY-123456"
  })
}).then(r => r.json());
```

## Deployment settings

1. In the spreadsheet, open **Extensions > Apps Script**.
2. Paste `Code.gs`, save, and run `setup()` once.
3. Open **Deploy > New deployment > Web app**.
4. Set **Execute as** to yourself.
5. Choose access appropriate for the project.
6. Copy the `/exec` URL into the React app's environment configuration.

Do not publish an unauthenticated production API without adding authentication, authorization, rate limiting, and request signing.
