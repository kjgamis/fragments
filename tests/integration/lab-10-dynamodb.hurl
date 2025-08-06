# tests/integration/lab-10-dynamodb.hurl
# Complete CRUD cycle test for fragments with DynamoDB storage

# Step 1: POST a new JSON fragment
POST http://localhost:8080/v1/fragments
Content-Type: application/json
[BasicAuth]
user1@email.com:password1
`{ "service": "DynamoDB" }`

# Step 2: Confirm 201 response and capture Location header and fragment id
HTTP/1.1 201
[Captures]
fragment1_url: header "Location"
fragment1_id: jsonpath "$.fragment.id"

[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "application/json"
jsonpath "$.fragment.size" == 25

# Step 3: GET the fragment info for the first fragment
GET {{fragment1_url}}/info
[BasicAuth]
user1@email.com:password1

# Step 4: Confirm 200 response and verify metadata
HTTP/1.1 200
Content-Type: application/json; charset=utf-8

[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" == "{{fragment1_id}}"
jsonpath "$.fragment.ownerId" isString
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.type" == "application/json"
jsonpath "$.fragment.size" == 25

# Step 5: POST a second Markdown fragment
POST http://localhost:8080/v1/fragments
Content-Type: text/markdown
[BasicAuth]
user1@email.com:password1
`DynamoDB is **great**.`

# Step 6: Confirm 201 response and capture Location header and fragment id
HTTP/1.1 201
[Captures]
fragment2_url: header "Location"
fragment2_id: jsonpath "$.fragment.id"

[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "text/markdown"
jsonpath "$.fragment.size" == 22

# Step 7: GET the fragment info for the second fragment
GET {{fragment2_url}}/info
[BasicAuth]
user1@email.com:password1

# Step 8: Confirm 200 response and verify metadata
HTTP/1.1 200
Content-Type: application/json; charset=utf-8

[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" == "{{fragment2_id}}"
jsonpath "$.fragment.ownerId" isString
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.type" == "text/markdown"
jsonpath "$.fragment.size" == 22

# Step 9: GET all fragments for the user (IDs only)
GET http://localhost:8080/v1/fragments
[BasicAuth]
user1@email.com:password1

# Step 10: Confirm 200 response and verify both IDs are included
HTTP/1.1 200
Content-Type: application/json; charset=utf-8

[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragments" count >= 2
jsonpath "$.fragments" contains "{{fragment1_id}}"
jsonpath "$.fragments" contains "{{fragment2_id}}"

# Step 11: DELETE the first fragment
DELETE {{fragment1_url}}
[BasicAuth]
user1@email.com:password1

# Step 12: Confirm 200 response for successful deletion
HTTP/1.1 200

[Asserts]
jsonpath "$.status" == "ok"

# Step 13: Try to GET the deleted fragment again
GET {{fragment1_url}}
[BasicAuth]
user1@email.com:password1

# Step 14: Confirm 404 response since fragment should be deleted
HTTP/1.1 404

[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.message" == "Fragment not found"
jsonpath "$.error.code" == 404

# Step 15: GET all fragments for the user again (IDs only)
GET http://localhost:8080/v1/fragments
[BasicAuth]
user1@email.com:password1

# Step 16: Confirm 200 response and verify first ID is NOT included but second ID is
HTTP/1.1 200
Content-Type: application/json; charset=utf-8

[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragments" count >= 1
jsonpath "$.fragments" contains "{{fragment2_id}}"
jsonpath "$.fragments" not contains "{{fragment1_id}}"
