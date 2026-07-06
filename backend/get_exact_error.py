import requests

url_login = "http://127.0.0.1:8000/api/users/login/"
data_login = {"username": "zodiac", "password": "wrongpassword"}
try:
    r = requests.post(url_login, json=data_login)
    print("Login Response Status:", r.status_code)
    print("Login Response Length:", len(r.content))
    print("Login Response Body:", r.text)
except Exception as e:
    print("Login request failed:", e)

url_register = "http://127.0.0.1:8000/api/users/register/"
data_register = {"username": "zodiac", "email": "zodiac@gmail.com", "password": "password", "role": "student"}
try:
    r = requests.post(url_register, json=data_register)
    print("\nRegister Response Status:", r.status_code)
    print("Register Response Length:", len(r.content))
    print("Register Response Body:", r.text)
except Exception as e:
    print("Register request failed:", e)
