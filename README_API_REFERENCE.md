# SMM Panel Developer Sandbox - API Reference

Welcome to the API Reference for the **SMM Panel Developer Sandbox**. Use this guide to programmatically automate placing orders, retrieving service parameters, checking campaign progress, and auditing developer balances.

---

## Directives & Authentication

All requests to the SMM API must be submitted via **HTTP POST** to your configured endpoint, with authorization details passed in the request header.

### Required HTTP Headers

| Header | Value | Description |
| :--- | :--- | :--- |
| `Content-Type` | `application/json` | All API transactions accept and return standard JSON. |
| `Authorization` | `Bearer <YOUR_API_KEY>` | Developer token for authenticating workspace queries. |

> **Security Guard**: Never share your API keys or hardcode them in client-side script contexts. Always handle credential authentication server-side.

---

## Action: `balance`

Retrieve the current workspace profile metadata, current USD capital balance, and transaction currency parameter.

### Request Payload

```json
{
  "action": "balance"
}
```

### Example cURL Command

```bash
curl -X POST "https://your-smm-domain.com/api" \
  -H "Authorization: Bearer smm_api_key_your_hexadecimal_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "balance"
  }'
```

### Successful Response Format (`200 OK`)

```json
{
  "username": "maisieclarke506",
  "balance": "250.0000",
  "currency": "USD"
}
```

---

## Action: `services`

Retrieve the database catalog for all configured social platform services, including current rates per 1,000 units, volume boundaries, and descriptions.

### Request Payload

```json
{
  "action": "services"
}
```

### Example cURL Command

```bash
curl -X POST "https://your-smm-domain.com/api" \
  -H "Authorization: Bearer smm_api_key_your_hexadecimal_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "services"
  }'
```

### Successful Response Format (`200 OK`)

```json
[
  {
    "id": 1,
    "name": "Instagram Global Followers (High Conversion)",
    "rate": 0.85,
    "min": 100,
    "max": 100000,
    "description": "High retention real-profile follower growth.",
    "category": "Instagram Followers"
  },
  {
    "id": 2,
    "name": "YouTube Premium Genuine Views",
    "rate": 2.40,
    "min": 500,
    "max": 50000,
    "description": "Slow drip fed genuine duration video viewers.",
    "category": "YouTube Views"
  }
]
```

---

## Action: `add`

Submit a new campaign dispatch request. When approved, this immediately locks up order fees based on the service's rate map and initiates delivery queues.

### Request Parameters

| Attribute | Type | Requirement | Description |
| :--- | :--- | :--- | :--- |
| `action` | `string` | **Required** | Must be set strictly to `"add"`. |
| `service` | `number` | **Required** | The target SMM Service Catalog Unique Identifier. |
| `link` | `string` | **Required** | The HTTPS destination URL of the social resource (e.g. video, profile). |
| `quantity` | `number` | **Required** | Campaign unit volume bounds defined by service min/max. |

### Request Payload

```json
{
  "action": "add",
  "service": 1,
  "link": "https://instagram.com/p/Cxy8Z18xZ2/",
  "quantity": 2500
}
```

### Example cURL Command

```bash
curl -X POST "https://your-smm-domain.com/api" \
  -H "Authorization: Bearer smm_api_key_your_hexadecimal_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "add",
    "service": 1,
    "link": "https://instagram.com/p/Cxy8Z18xZ2/",
    "quantity": 2500
  }'
```

### Successful Response Format (`200 OK`)

```json
{
  "status": "success",
  "order": 142,
  "charge": "2.1250",
  "currency": "USD",
  "link": "https://instagram.com/p/Cxy8Z18xZ2/",
  "remains": 2500
}
```

### Standard Error Payloads

#### Selected Service Not Found (`400 Bad Request`)
Returned when the database cannot locate a catalog node for the given `service` ID.
```json
{
  "error": "Invalid SMM Service Selected ID."
}
```

#### Order Quantity Validation Failed (`420 Unprocessable Content`)
Returned when the requested quantity violates the min/max limits specified by the selected service.
```json
{
  "error": "Order volume validation failed. Volume boundary is min: 100, max: 100000."
}
```

#### Insufficient Capital Reserve (`402 Payment Required`)
Returned when the calculated order cost exceeds the current developer balance.
```json
{
  "error": "Developer credit is insufficient. Required charge: $2.1250, current wallet: $1.0500."
}
```

---

## Action: `status`

Query executing parameters for an active campaign, including delivery status, dynamic remain counts, and total charge deduction details.

### Request Parameters

| Attribute | Type | Requirement | Description |
| :--- | :--- | :--- | :--- |
| `action` | `string` | **Required** | Must be set strictly to `"status"`. |
| `order` | `number` / `string` | **Required** | The Campaign ID returned during the `add` dispatch call. |

### Request Payload

```json
{
  "action": "status",
  "order": 142
}
```

### Example cURL Command

```bash
curl -X POST "https://your-smm-domain.com/api" \
  -H "Authorization: Bearer smm_api_key_your_hexadecimal_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "status",
    "order": 142
  }'
```

### Successful Response Format (`200 OK`)

```json
{
  "id": 142,
  "status": "pending",
  "start_count": 0,
  "remains": 2500,
  "charge": "2.1250",
  "link": "https://instagram.com/p/Cxy8Z18xZ2/",
  "quantity": 2500
}
```

### Standard Error Payloads

#### Order Record Not Found (`404 Not Found`)
Returned when the requested tracking ID does not exist in the dashboard registries.
```json
{
  "error": "Order matching requested tracking ID was not found or belongs to another workspace."
}
```

---

## Standard API Response Code Matrix

| HTTP Code | Description | Next Steps |
| :--- | :--- | :--- |
| `200` | Successful Execution | Process request details returned inside JSON body parameters. |
| `400` | Invalid Parameter Value | Validate parameters, specifically ensuring target Service ID is correct. |
| `402` | Insufficient developer credits | Deposit/top-up capital reserves through the workspace dashboard. |
| `404` | Resource Not Found | Confirm Campaign ID value is correct and query is within key ownership. |
| `420` | Dynamic constraints failed | Adjust dispatch bounds to align with service min/max restrictions. |
