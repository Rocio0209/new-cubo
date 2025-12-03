import os
from dotenv import load_dotenv

load_dotenv()

OLAP_USER = os.getenv("OLAP_USER")
OLAP_PASSWORD = os.getenv("OLAP_PASSWORD")
OLAP_SERVER = os.getenv("OLAP_SERVER", "pwidgis03.salud.gob.mx")
OLAP_PROVIDER = os.getenv("OLAP_PROVIDER", "MSOLAP.8")

def get_connection_string(catalog=None):
    base = (
        f"Provider={OLAP_PROVIDER};"
        f"Data Source={OLAP_SERVER};"
        f"User ID={OLAP_USER};"
        f"Password={OLAP_PASSWORD};"
        "Persist Security Info=True;"
        "Connect Timeout=60;"
    )
    if catalog:
        base += f"Initial Catalog={catalog};"
    return base
