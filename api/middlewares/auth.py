from fastapi import Header, HTTPException
import os

API_TOKEN = os.getenv("API_TOKEN")

async def verify_token(x_token: str = Header(None)):
    if x_token != API_TOKEN:
        raise HTTPException(status_code=401, detail="Token inválido")
