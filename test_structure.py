
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import re

url = "https://hvdic.thivien.net/hv/s/hi%E1%BB%87p"

r = requests.get(
    url,
    headers={"User-Agent": "Mozilla/5.0"},
    timeout=30
)

r.raise_for_status()
r.encoding = r.apparent_encoding

soup = BeautifulSoup(r.text, "html.parser")

print("HTTP:", r.status_code)
print("HTML size:", len(r.content))

# Kiểm tra tiêu đề Từ ghép
for text in soup.find_all(string=re.compile("Từ ghép")):
    print("\nMARKER:", repr(text))

# Kiểm tra tất cả link whv
links = soup.find_all(
    "a",
    href=re.compile(r"whv", re.I)
)

print("\nTỔNG LINK WHV:", len(links))

for a in links:
    print(
        "TEXT:", repr(a.get_text(" ", strip=True)),
        "| HREF:", urljoin(url, a.get("href", ""))
    )
