Development API quick test (login, upload logo, set logo)
=========================================================

Base URL
- https://siargaotradingroad.com/api

1) Login (get token)
- curl -X POST https://siargaotradingroad.com/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"<email>","password":"<password>"}'
- Copy the "token" from the response.

2) Upload logo image
- Use any image; example uses flutter/assets/sampleproduct.png
- curl -X POST https://siargaotradingroad.com/api/upload \
  -H "Authorization: Bearer <TOKEN>" \
  -F "file=@flutter/assets/sampleproduct.png"
- Response returns "url" and "key"; keep the "url".

3) Set logo on profile
- curl -X PUT https://siargaotradingroad.com/api/me \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"logo_url":"<UPLOAD_URL>"}'

4) Verify
- curl -X GET https://siargaotradingroad.com/api/me \
  -H "Authorization: Bearer <TOKEN>"
- Confirm "logo_url" matches the uploaded URL.
Development API quick test (login, upload logo, set logo)
=========================================================

Base URL
- https://siargaotradingroad.com/api

1) Login (get token)
- curl -X POST https://siargaotradingroad.com/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"<email>","password":"<password>"}'
- Copy the "token" value from the response.

2) Upload logo image
- Use any image; example uses flutter/assets/sampleproduct.png
- curl -X POST https://siargaotradingroad.com/api/upload \
  -H "Authorization: Bearer <TOKEN>" \
  -F "file=@flutter/assets/sampleproduct.png"
- Response returns "url" and "key"; keep the "url".

3) Set logo on profile
- curl -X PUT https://siargaotradingroad.com/api/me \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"logo_url":"<UPLOAD_URL>"}'

4) Verify
- curl -X GET https://siargaotradingroad.com/api/me \
  -H "Authorization: Bearer <TOKEN>"
- Confirm "logo_url" matches the uploaded URL.
