# tests/integration/lab-9-s3.hurl
# Complete CRUD cycle test for fragments with S3 storage

# Step 1: POST a new text fragment
POST http://localhost:8080/v1/fragments
# We're sending a plain text fragment
Content-Type: text/plain
# Include HTTP Basic Auth credentials
[BasicAuth]
user1@email.com:password1
# Body of the request goes in ```...``` when it's a string
`This is a fragment!`

# Step 2: Confirm 201 response and capture Location header
HTTP/1.1 201
[Captures]
url: header "Location"

[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "text/plain"
jsonpath "$.fragment.size" == 19

# Step 3: GET the fragment using the captured URL
GET {{url}}
[BasicAuth]
user1@email.com:password1

# Step 4: Confirm 200 response and verify content
HTTP/1.1 200
Content-Type: text/plain

[Asserts]
body == "This is a fragment!"

# Step 5: DELETE the fragment using the captured URL
DELETE {{url}}
[BasicAuth]
user1@email.com:password1

# Step 6: Confirm 200 response for successful deletion
HTTP/1.1 200

[Asserts]
jsonpath "$.status" == "ok"

# Step 7: Try to GET the deleted fragment again
GET {{url}}
[BasicAuth]
user1@email.com:password1

# Step 8: Confirm 404 response since fragment should be deleted
HTTP/1.1 404

[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.message" == "Fragment not found"
jsonpath "$.error.code" == 404
