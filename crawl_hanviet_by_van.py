# -*- coding: utf-8 -*-
"""Crawl cac muc tu da am tiet tu Dai tu dien Han Viet - Rong Mo Tam Hon.

Cach lam: dung form duyet van (tra_van), khong con gioi han 16 am tiet.
Chi luu phien am tieng Viet; khong dua chu Han vao truong word.
"""

import json
import logging
import os
import re
import time
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

BASE_PAGE = "https://rongmotamhon.net/tu-dien_han-viet_none_rong-mo-tam-hon.html"
OUTPUT_JSON = "han_viet_compounds_full.json"
OUTPUT_TXT = "han_viet_compounds_full.txt"
CHECKPOINT = "han_viet_compounds_full.checkpoint.json"
DEBUG_DIR = "debug_hanviet_by_van"
LOG_FILE = "han_viet_full_crawl.log"
TIMEOUT = 35
DELAY = 1.2
RETRIES = 3

# Cac dau van/chinh am dau duoc trang huong dan nhap: A, B, C, CH...
VANS = [
    "A", "Ă", "Â", "B", "C", "CH", "D", "Đ", "E", "Ê", "F", "G", "GH",
    "GI", "H", "I", "K", "KH", "L", "M", "N", "NG", "NGH", "NH",
    "O", "Ô", "Ơ", "P", "PH", "Q", "QU", "R", "S", "T", "TH", "TR",
    "U", "Ư", "V", "X", "Y", 
]

HAN_RE = re.compile(r"[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]")
SPACE_RE = re.compile(r"\s+")


def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(message)s",
        handlers=[logging.FileHandler(LOG_FILE, encoding="utf-8"), logging.StreamHandler()],
    )


def create_session():
    s = requests.Session()
    s.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8",
    })
    return s


def get_form(session):
    r = session.get(BASE_PAGE, timeout=TIMEOUT)
    r.raise_for_status()
    r.encoding = r.apparent_encoding or "utf-8"
    soup = BeautifulSoup(r.text, "html.parser")
    field = soup.find("input", attrs={"name": "tra_van"})
    if not field:
        os.makedirs(DEBUG_DIR, exist_ok=True)
        open(os.path.join(DEBUG_DIR, "main_page_no_tra_van.html"), "w", encoding="utf-8").write(r.text)
        raise RuntimeError("Khong tim thay input tra_van tren trang tu dien.")
    form = field.find_parent("form")
    if not form:
        raise RuntimeError("Tim thay tra_van nhung khong tim thay form cha.")

    action = urljoin(r.url, form.get("action") or r.url)
    data = {}
    # Lay cac hidden/input/select trong form de giu day du tham so an.
    for el in form.find_all(["input", "select", "textarea"]):
        name = el.get("name")
        if not name or el.has_attr("disabled"):
            continue
        typ = (el.get("type") or "").lower()
        if typ in ("submit", "button", "image", "reset", "file"):
            continue
        if el.name == "select":
            opt = el.find("option", selected=True) or el.find("option")
            if opt:
                data[name] = opt.get("value", opt.get_text(strip=True))
        elif typ in ("checkbox", "radio"):
            if el.has_attr("checked"):
                data[name] = el.get("value", "on")
        else:
            data[name] = el.get("value", "")

    # Submit control can be input OR button. Preserve its actual name/value.
    submit = form.find(lambda tag: tag.name in ("input", "button") and
                       ((tag.name == "input" and (tag.get("type") or "").lower() == "submit") or
                        (tag.name == "button" and (tag.get("type") or "submit").lower() == "submit")))
    if submit and submit.get("name"):
        data[submit["name"]] = submit.get("value", submit.get_text(" ", strip=True))

    data["tra_van"] = "__VAN__"
    logging.info("Form duyet van: POST %s; fields=%s; submit=%s", action, list(data),
                 {k: v for k, v in data.items() if k != "tra_van"})
    return action, data, r.url


def clean_vietnamese(text):
    text = SPACE_RE.sub(" ", text or "").strip()
    # Neu khong co strong rieng, tach phan chu Han va dau gach noi.
    text = HAN_RE.sub(" ", text)
    text = re.sub(r"[\-–—:：]+", " ", text)
    text = SPACE_RE.sub(" ", text).strip(" \t\r\n-–—:：")
    return text


def is_vietnamese_phrase(word):
    parts = word.split()
    if len(parts) < 2:
        return False
    # Chi chap nhan chu cai tieng Viet, dau thanh, khoang trang va dau nhay.
    return bool(re.fullmatch(r"[A-Za-zÀ-ỹĐđƠơƯưÂâĂăÊêÔô]+(?:[ '\u2019-][A-Za-zÀ-ỹĐđƠơƯưÂâĂăÊêÔô]+)*", word))


def parse_entries(html, page_url):
    soup = BeautifulSoup(html, "html.parser")
    # #hienthi la vung ket qua cua mot so trang; trang duyet van co the dung wrapper khac.
    root = soup.find(id="hienthi")
    search_roots = [root] if root else []
    if not search_roots:
        # Chi quet cac anchor co URL thuoc tu dien Han Viet, tranh menu/footer.
        search_roots = [soup]

    found = {}
    for container in search_roots:
        for a in container.find_all("a", href=True):
            href = a.get("href", "")
            if "tu-dien_han-viet" not in href.lower():
                continue
            strong = a.find("strong")
            if strong:
                word = clean_vietnamese(strong.get_text(" ", strip=True))
            else:
                word = clean_vietnamese(a.get_text(" ", strip=True))
            if not is_vietnamese_phrase(word):
                continue
            url = urljoin(page_url, href)
            key = word.casefold()
            found[key] = {"word": word, "url": url}
    return list(found.values()), soup


def load_checkpoint():
    if not os.path.exists(CHECKPOINT):
        return {"completed_vans": [], "results": {}}
    try:
        with open(CHECKPOINT, "r", encoding="utf-8") as f:
            obj = json.load(f)
        if isinstance(obj, dict) and isinstance(obj.get("results"), dict):
            obj.setdefault("completed_vans", [])
            return obj
    except Exception as e:
        logging.warning("Khong doc duoc checkpoint: %s", e)
    return {"completed_vans": [], "results": {}}


def save(checkpoint):
    with open(CHECKPOINT, "w", encoding="utf-8") as f:
        json.dump(checkpoint, f, ensure_ascii=False, indent=2)
    results = checkpoint["results"]
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    with open(OUTPUT_TXT, "w", encoding="utf-8") as f:
        for key in sorted(results, key=str.casefold):
            f.write(results[key]["word"] + "\n")


def crawl():
    os.makedirs(DEBUG_DIR, exist_ok=True)
    session = create_session()
    action, template_data, referer = get_form(session)
    session.headers["Referer"] = referer
    cp = load_checkpoint()
    done = set(cp["completed_vans"])
    logging.info("Bat dau: %d van; %d van da xong; checkpoint co %d muc tu.",
                 len(VANS), len(done), len(cp["results"]))

    for van in VANS:
        if van in done:
            continue
        success = False
        for attempt in range(1, RETRIES + 1):
            try:
                data = dict(template_data)
                data["tra_van"] = van
                r = session.post(action, data=data, timeout=TIMEOUT, allow_redirects=True)
                r.raise_for_status()
                r.encoding = r.apparent_encoding or "utf-8"
                entries, soup = parse_entries(r.text, r.url)

                # Luu HTML de kiem tra khi website thay doi cau truc.
                safe = re.sub(r"[^A-Za-z0-9_-]", "_", van)
                with open(os.path.join(DEBUG_DIR, f"van_{safe}.html"), "w", encoding="utf-8") as f:
                    f.write(r.text)

                # Neu khong co ket qua, khong tu dong coi la thanh cong: co the form POST sai.
                if not entries:
                    title = soup.title.get_text(" ", strip=True) if soup.title else "NO TITLE"
                    body = SPACE_RE.sub(" ", soup.get_text(" ", strip=True))[:700]
                    raise RuntimeError(f"Khong trich duoc muc tu. HTTP={r.status_code}; title={title!r}; body={body!r}; final_url={r.url}")

                added = 0
                for item in entries:
                    key = item["word"].casefold()
                    if key not in cp["results"]:
                        cp["results"][key] = item
                        added += 1
                cp["completed_vans"].append(van)
                save(cp)
                logging.info("Van %s: %d muc tu da am tiet; them moi %d; tong %d",
                             van, len(entries), added, len(cp["results"]))
                success = True
                break
            except Exception as e:
                logging.exception("Loi van %s (lan %d/%d): %s", van, attempt, RETRIES, e)
                time.sleep(2 * attempt)
        if not success:
            logging.error("Van %s chua hoan tat; se thu lai khi chay tiep.", van)
        time.sleep(DELAY)

    save(cp)
    logging.info("KET THUC: %d/%d van; tong %d cum tu.", len(cp["completed_vans"]), len(VANS), len(cp["results"]))
    logging.info("File: %s | %s | %s", OUTPUT_JSON, OUTPUT_TXT, CHECKPOINT)


if __name__ == "__main__":
    setup_logging()
    try:
        crawl()
    except KeyboardInterrupt:
        logging.warning("Nguoi dung dung chuong trinh; checkpoint da duoc luu sau moi van.")
    except Exception:
        logging.exception("Loi nghiem trong")
