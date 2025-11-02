# Mera Dost API Documentation

## Base URL

```
http://localhost:3000/api
```

## Authentication

No authentication required. All endpoints are publicly accessible.

## Endpoints

### Upload File

**POST** `/upload`

Upload a file for processing.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` (file)

**Response:**
```json
{
  "fileId": "uuid-string",
  "pages": 10,
  "metadata": {
    "size": 123456,
    "name": "document.pdf",
    "type": "application/pdf"
  }
}
```

**Status Codes:**
- `200` - Success
- `400` - No file uploaded
- `413` - File too large
- `500` - Server error

---

### Download File

**GET** `/download/:fileId`

Download a processed file.

**Response:**
- Content-Type: Based on file type
- Content-Disposition: Attachment with filename

**Status Codes:**
- `200` - Success
- `404` - File not found
- `500` - Server error

---

### Merge PDFs

**POST** `/merge`

Merge multiple PDFs into one.

**Request:**
```json
{
  "fileIds": ["uuid-1", "uuid-2"],
  "options": {
    "order": [0, 1]
  }
}
```

**Response:**
```json
{
  "fileId": "new-uuid"
}
```

---

### Split PDF

**POST** `/split`

Split a PDF by page ranges.

**Request:**
```json
{
  "fileId": "uuid",
  "ranges": [
    { "start": 0, "end": 4 }
  ]
}
```

**Response:**
```json
{
  "fileId": "new-uuid"
}
```

---

### Compress PDF

**POST** `/compress`

Compress a PDF.

**Request:**
```json
{
  "fileId": "uuid",
  "quality": "high" | "medium" | "low"
}
```

**Response:**
```json
{
  "fileId": "new-uuid"
}
```

---

### Add Signature

**POST** `/sign`

Add a signature to a PDF.

**Request:**
```json
{
  "fileId": "uuid",
  "signature": "base64-encoded-image",
  "page": 0,
  "x": 100,
  "y": 100,
  "scale": 1.0
}
```

**Response:**
```json
{
  "fileId": "new-uuid"
}
```

---

### Redact PDF

**POST** `/redact`

Redact (blackout) areas in a PDF.

**Request:**
```json
{
  "fileId": "uuid",
  "redactions": [
    {
      "page": 0,
      "x": 100,
      "y": 100,
      "width": 200,
      "height": 50
    }
  ]
}
```

**Response:**
```json
{
  "fileId": "new-uuid"
}
```

---

### Protect PDF

**POST** `/protect`

Add or remove password protection.

**Request:**
```json
{
  "fileId": "uuid",
  "action": "encrypt" | "decrypt",
  "password": "user-password"
}
```

**Response:**
```json
{
  "fileId": "new-uuid"
}
```

---

### Fill Form

**POST** `/form/fill`

Fill form fields in a PDF.

**Request:**
```json
{
  "fileId": "uuid",
  "fields": {
    "fieldName1": "value1",
    "fieldName2": "value2"
  }
}
```

**Response:**
```json
{
  "fileId": "new-uuid"
}
```

---

### OCR

**POST** `/ocr`

Extract text using OCR.

**Request:**
```json
{
  "fileId": "uuid",
  "options": {
    "language": "eng"
  }
}
```

**Response:**
```json
{
  "text": "Extracted text content..."
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message"
}
```

## File Limits

- Max file size: 50MB (configurable via `MAX_FILE_SIZE` env var)
- Supported formats:
  - PDF (`application/pdf`)
  - Word (`application/vnd.openxmlformats-officedocument.wordprocessingml.document`)
  - PowerPoint (`application/vnd.openxmlformats-officedocument.presentationml.presentation`)
  - Images (`image/jpeg`, `image/png`)
  - HTML (`text/html`)

## File Retention

Files are automatically deleted after 2 hours (configurable via `CLEANUP_INTERVAL` env var).

## Health Check

**GET** `/health`

Returns server status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Admin Endpoint

**GET** `/admin/stats`

Get server statistics (requires `X-Admin-Secret` header).

**Request Headers:**
```
X-Admin-Secret: your-secret-key
```

**Response:**
```json
{
  "uptime": 3600,
  "memory": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

