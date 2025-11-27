# Cloudflare R2 Setup Guide

## How to configure Cloudflare R2

### 1. Create a Cloudflare account (free)
- Go to https://dash.cloudflare.com/sign-up
- Complete registration

### 2. Create an R2 bucket
1. Go to the Cloudflare dashboard
2. Click on **R2** in the sidebar
3. Click on **Create bucket**
4. Bucket name: `participium-reports` (or your preference)
5. Click **Create bucket**

### 3. Get API credentials
1. On the R2 page, click **Manage R2 API Tokens**
2. Click **Create API token**
3. Configure:
   - **Token name**: `participium-backend`
   - **Permissions**: `Object Read & Write`
   - **TTL**: (leave empty for no expiration)
   - **Specify bucket(s)**: Select `participium-reports`
4. Click **Create API token**
5. **IMPORTANT**: Copy and save:
   - Access Key ID
   - Secret Access Key
   - Endpoint URL (e.g., `https://abc123.r2.cloudflarestorage.com`)

### 4. Configure environment variables

In the `.env` file:

```env
# Change provider from 'local' to 'r2'
STORAGE_PROVIDER=r2

# Add R2 credentials (uncomment)
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=participium-reports
```

### 5. (Optional) Configure public domain
To have public URLs for photos:

1. In the R2 dashboard, go to your bucket
2. Click **Settings** → **Public access**
3. Click **Connect domain**
4. Configure a domain (e.g., `cdn.participium.com`)
5. Add to `.env`:
   ```env
   R2_PUBLIC_URL=https://cdn.participium.com
   ```

## How it works

### Local development (default)
```env
STORAGE_PROVIDER=local
```
Photos are saved in `server/uploads/reports/`

### Production (Cloudflare R2)
```env
STORAGE_PROVIDER=r2
```
Photos are uploaded to Cloudflare R2

## Free tier limits
- 0 GB storage
- 10 million requests/month (Class A)
- 10 million requests/month (Class B)
- Free egress (no download costs)

## Test the configuration

After configuring the variables:

1. Restart the server:
   ```bash
   npm run dev
   ```

2. You should see in the logs:
   ```
   Storage initialized: Cloudflare R2
   ```

3. Try creating a report with photos to test the upload!

## Security notes

- **NEVER commit** credentials to the repository
- The `.env` file is already in `.gitignore`
- In production, use server/hosting environment variables
