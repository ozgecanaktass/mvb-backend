# DB Şeması 

## Azure SQL 
### users
-id: bigint PRIMARY KEY IDENTITY
-email: nvarchar(255) NOT NULL UNIQUE
-password_hash: nvarchar(512) NOT NULL
-name: nvarchar(255) NULL
-role: nvarchar(50) DEFAULT 'producer' -- 'producer', 'admin'
-dealer_limit: int DEFAULT 10 
-is_active: bit DEFAULT 1 -- Soft delete için
-created_at: datetimeoffset DEFAULT SYSUTCDATETIME()
-updated_at: datetimeoffset DEFAULT SYSUTCDATETIME()

### dealers
-id: bigint PRIMARY KEY IDENTITY
-name: nvarchar(255) NOT NULL
-link_hash: nvarchar(128) NOT NULL UNIQUE -- Güvenlik için kritik
-is_active: bit DEFAULT 1 -- Bayiyi pasife almak için
-created_at: datetimeoffset DEFAULT SYSUTCDATETIME()
-updated_at: datetimeoffset DEFAULT SYSUTCDATETIME()

### orders
- id: bigint PRIMARY KEY IDENTITY
- dealer_id: bigint NOT NULL REFERENCES dealers(id)
- customer_name: nvarchar(255)
- configuration: nvarchar(max) -- JSON
- status: nvarchar(50) DEFAULT 'pending'
- created_at: datetimeoffset DEFAULT SYSUTCDATETIME()
- updated_at: datetimeoffset DEFAULT SYSUTCDATETIME()

## CosmosDB 
### visits (partitionKey: /linkHash)
{
  "id": "uuid",
  "linkHash": "abc123",
  "dealerId": 123,
  "ip": "1.2.3.4",
  "userAgent": "...",
  "timestamp": "2025-11-25T12:34:56Z",
  "meta": { "step": "configurator", "payload": {} }
}

### order_events (partitionKey: /orderId)
{
  "id": "uuid",
  "orderId": "456",
  "event": "CREATED",
  "timestamp": "2025-11-25T12:34:56Z",
  "details": { ... }
}
