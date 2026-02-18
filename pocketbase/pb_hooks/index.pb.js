/// <reference path="../pb_data/types.d.ts" />

routerAdd("GET", "/api/hello", (e) => {
    return e.json(200, { "message": "Hello from PocketBase!" })
})
