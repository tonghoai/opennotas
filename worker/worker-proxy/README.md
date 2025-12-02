# OpenNotas Image Proxy Worker

A Cloudflare Worker that proxies image uploads to S3-compatible storage. This worker acts as a CORS bypass proxy - it receives S3 credentials from the client and forwards requests to the user's own S3-compatible storage.

## Features

- **Stateless**: No credentials stored on the worker
- **CORS Bypass**: Allows browser clients to upload directly to S3
- **S3-Compatible**: Works with AWS S3, Cloudflare R2, MinIO, DigitalOcean Spaces, etc.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Deploy (no secrets needed):
```bash
npm run deploy
```

## How It Works

1. Client sends upload request with:
   - Image file
   - Image ID
   - S3 configuration (endpoint, access key, secret key, bucket)

2. Worker receives the request and forwards it to the user's S3 storage

3. Worker returns the public URL of the uploaded image

## API Endpoints

### Health Check
```
GET /health
```
Returns `{ "status": "ok" }` if the worker is running.

### Upload Image
```
POST /upload
Content-Type: multipart/form-data

file: <image file>
imageId: <unique image id>
s3Config: <JSON string> {
  "endpoint": "https://s3.amazonaws.com",
  "accessKey": "AKIAIOSFODNN7EXAMPLE",
  "secretKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  "bucket": "my-bucket"
}
```

Response:
```json
{
  "success": true,
  "url": "https://s3.amazonaws.com/my-bucket/images/xxx.jpg",
  "imageId": "xxx"
}
```

### Get Image (Proxy)
```
POST /get
Content-Type: application/json

{
  "imageUrl": "https://s3.amazonaws.com/my-bucket/images/xxx.jpg",
  "s3Config": {
    "endpoint": "https://s3.amazonaws.com",
    "accessKey": "...",
    "secretKey": "...",
    "bucket": "my-bucket"
  }
}
```

Response: Binary image data with appropriate Content-Type header.

This endpoint proxies image fetching from S3, bypassing CORS restrictions. The response is cached for 1 year.

### Delete Image
```
POST /delete
Content-Type: application/json

{
  "imageId": "xxx",
  "s3Config": {
    "endpoint": "https://s3.amazonaws.com",
    "accessKey": "...",
    "secretKey": "...",
    "bucket": "my-bucket"
  }
}
```

Response:
```json
{
  "success": true,
  "deleted": true,
  "imageId": "xxx"
}
```

## Compatible Storage Services

- AWS S3
- Cloudflare R2
- MinIO
- DigitalOcean Spaces
- Backblaze B2
- Any S3-compatible storage

## Security Notes

- S3 credentials are transmitted per-request and not stored
- Use HTTPS for all communications
- Consider adding rate limiting for production use
- The worker URL can be self-hosted for additional security
