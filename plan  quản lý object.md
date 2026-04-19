-- man quan  ly object su dụng api sau
-  create
  postman request POST 'http://127.0.0.1:9004/api/v1/objects' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyIiwidXNlcm5hbWUiOiJ0aHVvYyIsImVtYWlsIjoibm8tZW1haWwtMTc3NTcwNjAxODg5Ny1jMXRxdTVAbG9jYWxob3N0LmxvY2FsIiwiaWF0IjoxNzc1NzA2MDIyLCJleHAiOjE3NzgyOTgwMjJ9.Cvj8ixZjbUDsQBIoiB3JbGIrKJpdfXcbLTpnzKgAhjE' \
  --header 'Content-Type: application/json' \
  --body '{

    "name":"ds",
    "startDate":3

}' 

-api list

 postman request 'http://127.0.0.1:9004/api/v1/objects' \
  --header 'Content-Type: application/json' \
  --body '{

    "Username":"ds",
    "password":"password"

}'

data trả về như này 
{
    "statusCode": 200,
    "data": [
        {
            "id": "1",
            "name": "ds",
            "startDate": 3,
            "description": null
        },
        {
            "id": "2",
            "name": "ds",
            "startDate": 3,
            "description": null
        }
    ],
    "message": "SUCCESS"
}

- vào chi tiết object tạo task object

postman request POST 'http://127.0.0.1:9004/api/v1/object-tasks' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyIiwidXNlcm5hbWUiOiJ0aHVvYyIsImVtYWlsIjoibm8tZW1haWwtMTc3NTcwNjAxODg5Ny1jMXRxdTVAbG9jYWxob3N0LmxvY2FsIiwiaWF0IjoxNzc1NzA2MDIyLCJleHAiOjE3NzgyOTgwMjJ9.Cvj8ixZjbUDsQBIoiB3JbGIrKJpdfXcbLTpnzKgAhjE' \
  --header 'Content-Type: application/json' \
  --body '{

    "name":"task 1",
    "startDate":3,
    "endDate":4,
    "object_id":1

}'

- api list task

postman request 'http://127.0.0.1:9004/api/v1/object-tasks' \
  --header 'Content-Type: application/json' \
  --body '{

    "Username":"ds",
    "password":"password"

}'

- api list task

postman request 'http://127.0.0.1:9004/api/v1/object-tasks' \
  --header 'Content-Type: application/json' \
  --body '{

    "Username":"ds",
    "password":"password"

}'