from __future__ import annotations

import json

import requests
from requests.exceptions import ConnectionError, Timeout


API_URL = "http://localhost:8000/generate-content"


def main():
    try:
        response = requests.post(
            API_URL,
            json={
                "productName": "Tai nghe Bluetooth Sony WH-1000XM5",
                "maxSources": 3,
                "generateImage": False,
            },
            timeout=180,
        )
        response.raise_for_status()
    except ConnectionError:
        print("AI service chua chay o http://localhost:8000.")
        print("Hay mo terminal rieng va chay:")
        print("  cd /d D:\\Chuyen_nganh\\Dang_hoc\\TMDT\\ai_service")
        print("  python -m uvicorn app:app --reload --port 8000")
        return
    except Timeout:
        print("Request qua lau. Lan dau tai/chay model co the mat nhieu thoi gian.")
        return

    data = response.json()
    print(json.dumps(data, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
