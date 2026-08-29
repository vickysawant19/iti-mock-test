# Appwrite Storage Optimization Best Practices

## Bucket Configuration for Production

```typescript
import { Client, Storage, ID, Permission, Role, Compression } from 'node-appwrite'

// ✅ Production-ready bucket setup
await storage.createBucket(
  BUCKET_ID,                             // or ID.unique()
  'profile-avatars',                     // human-readable name
  [
    Permission.read(Role.any()),
    Permission.create(Role.users()),
  ],
  true,                                  // fileSecurity: per-file permissions
  true,                                  // enabled
  5 * 1024 * 1024,                       // maximumFileSize: 5MB
  ['jpg', 'jpeg', 'png', 'webp', 'gif'], // allowedFileExtensions
  Compression.Zstd,                      // compression: 'zstd' > 'gzip' for speed
  true,                                  // encryption
  true                                   // antivirus
)
```

### Compression Algorithm Guide

| Algorithm | Use Case | Trade-off |
|---|---|---|
| `zstd` | **Preferred** — high-performance apps | Faster decompress, better ratio than gzip |
| `gzip` | Wide compatibility needed | Slightly slower, universal support |
| `none` | Already-compressed formats (JPEG, MP4, ZIP) | No overhead on pre-compressed files |

> ⚠️ Files larger than **20MB are never compressed** regardless of setting.
> For large media, rely on CDN caching instead.

---

## Image Optimization with Preview API

```typescript
// ✅ Always serve images via Preview API — never raw file URL for images shown in UI
const ENDPOINT = 'https://cloud.appwrite.io/v1'

// Standard responsive image
const avatarUrl = `${ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${FILE_ID}/preview
  ?project=${PROJECT_ID}
  &width=400
  &height=400
  &gravity=center
  &quality=85
  &output=webp`    // WebP = ~30% smaller than JPEG at same quality

// Thumbnail
const thumbUrl = `${ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${FILE_ID}/preview
  ?project=${PROJECT_ID}
  &width=80
  &height=80
  &gravity=face    // smart face crop for avatars
  &quality=75
  &output=webp`

// Using the SDK
const previewUrl = storage.getFilePreview(
  BUCKET_ID,
  FILE_ID,
  400,      // width
  400,      // height
  'center', // gravity
  85,       // quality
  0,        // borderWidth
  '',       // borderColor
  0,        // borderRadius
  1,        // opacity
  0,        // rotation
  '',       // background
  'webp'    // output format: 'jpg' | 'png' | 'gif' | 'webp'
)
```

### Output Format Guide

| Format | Best For | Notes |
|---|---|---|
| `webp` | Photos, UI images | ~30% smaller than JPEG, excellent quality |
| `jpg` | Photos for legacy clients | Lossy, wide support |
| `png` | Transparency required | Lossless, larger files |
| `gif` | Animated images | Large, prefer MP4/WebM for video |

---

## File Upload Best Practices

### Validate Before Upload (Client-Side)
```typescript
interface FileValidationOptions {
  maxSizeMB: number
  allowedTypes: string[]
}

function validateFile(file: File, options: FileValidationOptions): void {
  const maxBytes = options.maxSizeMB * 1024 * 1024
  if (file.size > maxBytes) {
    throw new Error(`File too large. Maximum: ${options.maxSizeMB}MB`)
  }
  if (!options.allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed: ${options.allowedTypes.join(', ')}`)
  }
}

// Usage
validateFile(file, { maxSizeMB: 5, allowedTypes: ['image/jpeg', 'image/png', 'image/webp'] })

const response = await storage.createFile(
  BUCKET_ID,
  ID.unique(),
  InputFile.fromBlob(file, file.name),
  [
    Permission.read(Role.any()),
    Permission.delete(Role.user(userId)),
  ]
)
```

### Large File Chunking (>5MB)
```typescript
// Appwrite SDK handles chunking automatically with InputFile
// For Node.js server-side:
const fileStream = fs.createReadStream('./large-video.mp4')
const response = await storage.createFile(
  BUCKET_ID,
  ID.unique(),
  InputFile.fromStream(fileStream, 'large-video.mp4', fileSize),
  [Permission.read(Role.any())]
)
// SDK automatically splits into 5MB chunks and uploads sequentially
```

---

## Secure File Download Pattern

```typescript
// ✅ For private files — generate temporary download URL
// Only works if the requesting user has `read` permission on the file

// Get download URL (SDK)
const downloadUrl = storage.getFileDownload(BUCKET_ID, FILE_ID)
// Returns: https://cloud.appwrite.io/v1/storage/buckets/.../files/.../download

// ✅ For public files with CDN — serve via CDN-cached URL
// Point Cloudflare or similar CDN to your Appwrite endpoint
// Cache preview URLs at the CDN layer — they're deterministic and immutable
```

---

## CDN Integration Pattern

```
Architecture:
  Client → CDN (Cloudflare) → Appwrite Storage
           ↓ Cache Hit (fast)
           → Appwrite Storage (cache miss, cached at CDN)
```

```nginx
# Example: Cloudflare Page Rule for Appwrite Preview URLs
# Match: cloud.appwrite.io/v1/storage/buckets/*/files/*/preview*
# Action: Cache Level: Cache Everything, Edge Cache TTL: 1 month
```

```typescript
// ✅ Use CDN-prefixed URLs in your app
const CDN_BASE = 'https://cdn.yourapp.com' // Cloudflare proxy to Appwrite

const imageUrl = `${CDN_BASE}/v1/storage/buckets/${BUCKET_ID}/files/${FILE_ID}/preview`
  + `?project=${PROJECT_ID}&width=800&output=webp&quality=85`
// CDN serves from edge cache after first request — no Appwrite load
```

---

## Storage Cleanup Strategy

```typescript
// ✅ Clean up orphaned files when deleting related documents
async function deletePost(postId: string, imageFileId: string | null) {
  // Delete document first
  await databases.deleteDocument(DATABASE_ID, 'posts', postId)

  // Then clean up associated file
  if (imageFileId) {
    try {
      await storage.deleteFile(BUCKET_ID, imageFileId)
    } catch (err) {
      // Log but don't fail — file may already be deleted
      console.warn(`Could not delete file ${imageFileId}:`, err)
    }
  }
}
```

---

## File Storage Cost Optimization

| Strategy | Savings | Implementation |
|---|---|---|
| Use `zstd` compression | 20-70% on text/HTML/JSON | Set `compression: 'zstd'` on bucket |
| Serve `webp` via Preview API | 20-40% bandwidth vs JPEG | Add `&output=webp` to preview URLs |
| CDN caching for media | 60-90% Appwrite bandwidth | Cloudflare in front of Appwrite endpoint |
| Set strict `maximum_file_size` | Prevents storage abuse | Set appropriate limit per bucket |
| Delete unused files | Direct storage reduction | Implement cleanup on doc delete |
| Set `quality=75-85` for images | 30-50% smaller previews | Use Preview API with quality param |
| Resize images at upload | Smaller source files | Resize before upload with client-side canvas |

---

## Responsive Images Pattern (React)

```tsx
// ✅ Serve responsive images using Appwrite Preview API
interface AppwriteImageProps {
  bucketId: string
  fileId: string
  alt: string
  className?: string
}

const ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT
const PROJECT  = import.meta.env.VITE_APPWRITE_PROJECT_ID

function AppwriteImage({ bucketId, fileId, alt, className }: AppwriteImageProps) {
  const base = `${ENDPOINT}/storage/buckets/${bucketId}/files/${fileId}/preview?project=${PROJECT}`

  return (
    <img
      src={`${base}&width=800&quality=85&output=webp`}
      srcSet={[
        `${base}&width=400&quality=80&output=webp 400w`,
        `${base}&width=800&quality=85&output=webp 800w`,
        `${base}&width=1200&quality=85&output=webp 1200w`,
      ].join(', ')}
      sizes="(max-width: 600px) 400px, (max-width: 1024px) 800px, 1200px"
      alt={alt}
      className={className}
      loading="lazy"  // native lazy loading
    />
  )
}
```
