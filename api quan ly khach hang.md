postman request POST 'http://127.0.0.1:9004/api/v1/customers' \
  --header 'Content-Type: application/json' \
  --body '{

    "fullName":"trtr",
    "phone":["0245444"]

}'


postman request 'http://127.0.0.1:9004/api/v1/customers' \
  --header 'Content-Type: application/json' \
  --body '{

    "Username":"ds",
    "password":"password"

}'

response
{
    "statusCode": 200,
    "data": [
        {
            "id": "3",
            "fullName": "trtr",
            "email": null,
            "latitude": null,
            "longitude": null,
            "phone": [
                "0245444423"
            ],
            "address": null
        }
    ],
    "message": "SUCCESS"
}



// api update customer

{{url}}/api/v1/customers/3