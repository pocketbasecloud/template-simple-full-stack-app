- Start the server: set -a && source .env && set +a && ./pocketbase_mac_silicon
  serve
- Create/update table/collection: gennerate new migration file.
- IMPORTANT: never edit migration file.
- IMPORTANT: In hook files (pb_hooks/*.pb.js):
  - Never use global variables or constants at file level
  - Always place `require()` statements inside each hook/route handler, not at
    the top of the file
  - Define constants inside functions where they are used
  - Must export functions in helper .js files to use elsewhere (e.g.,
    `module.exports = { functionName }`)

# PocketBase Backend

## Overview

This is a PocketBase backend application. PocketBase is an open-source backend
consisting of an embedded SQLite database with realtime subscriptions, built-in
auth management, convenient dashboard UI, and a simple REST API.

## Tech Stack

- **Runtime**: PocketBase (Go-based, single binary)
- **Database**: SQLite (embedded)
- **API**: REST + Realtime subscriptions
- **Auth**: Built-in (email/password, OAuth2)

## Project Structure

```
/
├── pb_data/              # Database and storage (do not commit)
│   ├── data.db           # SQLite database
│   ├── storage/          # File uploads
│   └── logs.db           # Request logs
├── pb_migrations/        # Database migrations (JavaScript)
│   └── *.js              # Migration files
├── pb_hooks/             # Custom JavaScript hooks (optional)
│   └── *.pb.js           # Hook files
├── pb_public/            # Static files served at /
└── pocketbase            # PocketBase executable
```

## Running the Server

Depend on OS:

Example for Mac Silicon:

```bash
# Start server (default port 8090)
./pocketbase_mac_silicon serve

# Start with custom host/port
./pocketbase_mac_silicon serve --http="0.0.0.0:8080"

# Access admin dashboard
# http://127.0.0.1:8090/_/
```

## Collections

Collections are the database tables. Define them via:

1. Admin UI at `/_/`
2. Migration files in `pb_migrations/`

### Collection Types

- **Base**: Standard data collection
- **Auth**: User authentication collection (has email, password, etc.)
- **View**: Read-only SQL view collection

## API Conventions

### Base URL

```
http://127.0.0.1:8090/api/
```

### Authentication

```bash
# Get auth token
POST /api/collections/{collection}/auth-with-password
{
  "identity": "user@example.com",
  "password": "password123"
}

# Use token in requests
Authorization: Bearer {token}
```

### CRUD Operations

```bash
# List records
GET /api/collections/{collection}/records

# Get single record
GET /api/collections/{collection}/records/{id}

# Create record
POST /api/collections/{collection}/records
Content-Type: application/json
{
  "field": "value"
}

# Update record
PATCH /api/collections/{collection}/records/{id}

# Delete record
DELETE /api/collections/{collection}/records/{id}
```

### Query Parameters

```bash
# Pagination
?page=1&perPage=20

# Sorting
?sort=-created,title    # - prefix for DESC

# Filtering
?filter=(status='active' && created>'2024-01-01')

# Expand relations
?expand=author,comments

# Select fields
?fields=id,title,author
```

## Migrations

### Creating Migrations

```bash
./pocketbase migrate create "migration_name"
```

### Migration File Structure

```javascript
// pb_migrations/1234567890_create_posts.js
// Creating a new collection
migrate((app) => {
  const collection = new Collection({
    "name": "posts",
    "type": "base",
    "fields": [
      {
        "name": "title",
        "type": "text",
        "required": true,
      },
      {
        "name": "content",
        "type": "editor",
      },
    ],
  });
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("posts");
  return app.delete(collection);
});
```

### Adding Fields to Existing Collection

```javascript
// pb_migrations/1234567890_add_fields_to_posts.js
migrate((app) => {
  const collection = app.findCollectionByNameOrId("posts");

  collection.fields.add(
    new Field({
      "hidden": false,
      "name": "status",
      "presentable": false,
      "required": false,
      "system": false,
      "type": "select",
      "maxSelect": 1,
      "values": ["draft", "published"],
    }),
  );

  collection.fields.add(
    new Field({
      "hidden": false,
      "name": "view_count",
      "presentable": false,
      "required": false,
      "system": false,
      "type": "number",
      "min": 0,
      "onlyInt": true,
    }),
  );

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("posts");

  collection.fields.removeByName("status");
  collection.fields.removeByName("view_count");

  return app.save(collection);
});
```

## Hooks (pb_hooks)

Custom server-side JavaScript logic. Files must end with `.pb.js`.

**IMPORTANT**: Never use global variables or `require()` at file level. Always
place them inside each hook/route handler.

### Available Hooks

```javascript
// pb_hooks/main.pb.js
/// <reference path="../pb_data/types.d.ts" />

// Before create - require helpers inside the handler
onRecordCreate((e) => {
  const { slugify } = require(`${__hooks}/helpers.js`);

  // e.record, e.app
  e.record.set("slug", slugify(e.record.get("title")));
}, "posts");

// After create
onRecordAfterCreateSuccess((e) => {
  const { sendNotification } = require(`${__hooks}/helpers.js`);

  sendNotification(e.record);
}, "posts");

// Before update
onRecordUpdate((e) => {
  const { validateUpdate } = require(`${__hooks}/helpers.js`);

  validateUpdate(e.record);
  e.record.set("updatedBy", e.requestInfo?.auth?.id);
}, "posts");

// Custom API routes
routerAdd("GET", "/api/custom/stats", (e) => {
  const { getStats } = require(`${__hooks}/helpers.js`);

  const stats = getStats();
  return e.json(200, stats);
});
```

## Field Types

| Type       | Description           |
| ---------- | --------------------- |
| `text`     | Plain text            |
| `editor`   | Rich text (HTML)      |
| `number`   | Integer or float      |
| `bool`     | Boolean               |
| `email`    | Email with validation |
| `url`      | URL with validation   |
| `date`     | Date/datetime         |
| `select`   | Single/multi select   |
| `file`     | File upload           |
| `relation` | Foreign key reference |
| `json`     | JSON data             |
| `autodate` | Auto-set timestamps   |

## API Rules

Define access rules per collection using filter syntax:

```javascript
// Anyone can read published posts
listRule: "status = 'published'";

// Only authenticated users can create
createRule: "@request.auth.id != ''";

// Only owner can update/delete
updateRule: "@request.auth.id = author.id";
deleteRule: "@request.auth.id = author.id";

// Admin only
listRule: "@request.auth.role = 'admin'";
```

### Rule Variables

- `@request.auth.*` - Current authenticated user
- `@request.body.*` - Request body data
- `@request.query.*` - Query parameters
- `@request.headers.*` - Request headers
- `@collection.*` - Reference other collections

## Realtime Subscriptions

```javascript
// JavaScript SDK example
import PocketBase from "pocketbase";

const pb = new PocketBase("http://127.0.0.1:8090");

// Subscribe to collection changes
pb.collection("posts").subscribe("*", (e) => {
  console.log(e.action); // create, update, delete
  console.log(e.record);
});

// Subscribe to specific record
pb.collection("posts").subscribe("RECORD_ID", (e) => {
  console.log(e.record);
});

// Unsubscribe
pb.collection("posts").unsubscribe("*");
```

## File Uploads

```bash
# Upload via multipart form
POST /api/collections/{collection}/records
Content-Type: multipart/form-data

# File URL format
/api/files/{collectionId}/{recordId}/{filename}

# With thumb (for images)
/api/files/{collectionId}/{recordId}/{filename}?thumb=100x100
```

## Environment Variables

```bash
# Custom data directory
export PB_DATA_DIR=/path/to/pb_data

# SMTP settings (for emails)
export PB_SMTP_HOST=smtp.example.com
export PB_SMTP_PORT=587
export PB_SMTP_USERNAME=user
export PB_SMTP_PASSWORD=pass
```

## Development Commands

```bash
# Serve with auto-reload (development)
./pocketbase serve --dev

# Run migrations
./pocketbase migrate up

# Revert last migration
echo "y" | ./pocketbase migrate down

# Create admin
./pocketbase admin create admin@example.com password123

# Backup database
cp pb_data/data.db backup.db
```

## Best Practices

1. **Never commit pb_data/**: Add to `.gitignore`
2. **Use migrations**: Track schema changes in version control
3. **Set proper API rules**: Default to restrictive, open as needed
4. **Use relations**: Leverage PocketBase's relational features
5. **Index frequently queried fields**: Improve performance
6. **Use hooks sparingly**: Keep business logic simple
7. **Validate on both ends**: Client and server validation

## Common Patterns

### Soft Delete

```javascript
// Add 'deleted' field, filter in listRule
listRule: "deleted = false";
```

### Audit Trail

```javascript
// Auto-set created/updated timestamps
{
  name: "created",
  type: "autodate",
  onCreate: true,
}
```

### Slug Generation

```javascript
onRecordCreate((e) => {
  if (!e.record.get("slug")) {
    const title = e.record.get("title");
    e.record.set("slug", title.toLowerCase().replace(/\s+/g, "-"));
  }
}, "posts");
```

## Troubleshooting

| Issue                   | Solution                         |
| ----------------------- | -------------------------------- |
| Port in use             | Use `--http="0.0.0.0:8081"`      |
| Migration failed        | Check `pb_migrations/` syntax    |
| Auth not working        | Verify collection is type "auth" |
| Files not uploading     | Check `maxSize` in schema        |
| Realtime not connecting | Check CORS settings              |

## Resources

- [Documentation](https://pocketbase.io/docs/)
- [PocketBase hooks type](https://pocketbase.io/jsvm/)
- [JavaScript SDK](https://github.com/pocketbase/js-sdk)
- [Dart SDK](https://github.com/pocketbase/dart-sdk)
