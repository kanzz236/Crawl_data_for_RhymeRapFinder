import re
import time
import wikipediaapi

# Khởi tạo Wikipedia API với user-agent chuẩn
wiki = wikipediaapi.Wikipedia(
    user_agent='RapRhymeFinderBot/1.0 (contact@example.com)',
    language='vi'
)

DATASET_CONFIG = {
    "danh_nhan.txt": {
        "categories": [
            "Anh hùng dân tộc Việt Nam", 
            "Vua Việt Nam", 
            "Danh tướng Việt Nam", 
            "Trạng nguyên Việt Nam"
        ],
        "pages": [
            "Danh sách hoàng đế nhà Nguyễn",
            "Danh sách trạng nguyên Việt Nam"
        ]
    },
    "nhan_vat_van_hoc.txt": {
        "categories": [
            "Nhân vật Tam quốc diễn nghĩa",
            "Nhân vật kiếm hiệp Kim Dung"
        ],
        "pages": [
            "Danh sách nhân vật Tam Quốc",
            "Danh sách nhân vật trong Thủy hủ",
            "Danh sách nhân vật trong Tây Du Ký",
            "Danh sách nhân vật trong tiểu thuyết của Kim Dung"
        ]
    },
    "dia_diem.txt": {
        "categories": [
            "Đường phố Hà Nội",
            "Danh lam thắng cảnh Việt Nam"
        ],
        "pages": [
            "Thăng Long tứ trấn",
            "Hồ Hoàn Kiếm",
            "Hồ Tây",
            "Phố cổ Hà Nội",
            "Văn Miếu - Quốc Tử Giám",
            "Hoàng thành Thăng Long",
            "Chùa Một Cột",
            "Nhà tù Hỏa Lò",
            "Cầu Long Biên",
            "Hoàn Kiếm (quận)",
            "Ba Đình (quận)",
            "Đống Đa (quận)",
            "Hai Bà Trưng (quận)",
            "Tây Hồ (quận)",
            "Hoàng Mai (quận)",
            "Bắc Từ Liêm (quận)",
            "Nam Từ Liêm (quận)",
            "Trương Gia Giới",
            "Cửu Trại Câu",
            "Phượng Hoàng cổ trấn",
            "Bạch Đằng Giang",
            "Phố cổ Hội An",
            "Vịnh Hạ Long",
            "Phong Nha Kẻ Bàng"
        ]
    },
    "van_hoa_than_thoai.txt": {
        "categories": [
            "Thần thoại Việt Nam"
        ],
        "pages": [
            "Tứ đại danh tác"
        ]
    }
}

def clean_title(title):
    if ":" in title:
        return None
    
    # 1. Cắt bỏ phần ngoặc đơn chú thích ở cuối: "Hàng Mã (phố)" -> "Hàng Mã"
    cleaned = re.sub(r'\s*\(.*?\)\s*$', '', title).strip()
    
    # 2. Xóa các tiền tố chỉ loại hình đường xá, hành chính ở đầu câu (không phân biệt hoa thường)
    prefix_pattern = r'^(Đường|Phố|Ngõ|Ngách|Hẻm|Phường|Quận|Thành phố|Tỉnh)\s+'
    cleaned = re.sub(prefix_pattern, '', cleaned, flags=re.IGNORECASE).strip()
    
    # 3. Xóa từ "Hà Nội" nếu xuất hiện bên trong chuỗi
    cleaned = re.sub(r'\bHà Nội\b', '', cleaned, flags=re.IGNORECASE).strip()
    
    # Dọn dẹp lại khoảng trắng thừa sau khi xóa từ
    cleaned = re.sub(r'\s+', ' ', cleaned)

    # 4. Bỏ qua nếu chứa ký tự số hoặc dấu gạch chéo
    if re.search(r'[0-9/\\]', cleaned):
        return None

    # 5. Cho phép từ 1 đến 5 từ (để bắt cả các địa danh 1 âm tiết như "Huế", "Đức",...)
    words = cleaned.split()
    if 1 <= len(words) <= 5:
        return cleaned
    return None

def get_category_members(category_name):
    cat = wiki.page(f"Thể loại:{category_name}")
    if not cat.exists():
        print(f"[!] Không tìm thấy thể loại: Thể loại:{category_name}")
        return set()
    
    results = set()
    try:
        members = cat.categorymembers
        for title, page in members.items():
            if page.ns == wikipediaapi.Namespace.MAIN:
                cleaned = clean_title(title)
                if cleaned:
                    results.add(cleaned)
    except Exception as e:
        print(f"[!] Lỗi khi quét thể loại {category_name}: {e}")
    return results

def get_links_from_page(page_title):
    page = wiki.page(page_title)
    if not page.exists():
        print(f"[!] Không tìm thấy trang: {page_title}")
        return set()
    
    results = set()
    try:
        links = page.links
        for link_title, link_page in links.items():
            if link_page.ns == wikipediaapi.Namespace.MAIN:
                cleaned = clean_title(link_title)
                if cleaned:
                    results.add(cleaned)
    except Exception as e:
        print(f"[!] Lỗi khi quét trang {page_title}: {e}")
    return results

def main():
    print("=== BẮT ĐẦU QUÉT VÀ LỌC SẠCH DỮ LIỆU RAP ===")
    
    for filename, config in DATASET_CONFIG.items():
        print(f"\n----------------------------------------")
        print(f"[*] Đang xử lý nhóm file: {filename}")
        print(f"----------------------------------------")
        
        group_entities = set()
        
        for cat in config["categories"]:
            items = get_category_members(cat)
            print(f"  + Thể loại '{cat}': thu được {len(items)} từ")
            group_entities.update(items)
            time.sleep(0.1)

        for page_title in config["pages"]:
            items = get_links_from_page(page_title)
            print(f"  + Trang '{page_title}': thu được {len(items)} từ")
            group_entities.update(items)
            time.sleep(0.1)

        final_cleaned_set = {clean_title(item) for item in group_entities if clean_title(item)}
        sorted_entities = sorted(list(final_cleaned_set))
        
        with open(filename, "w", encoding="utf-8") as f:
            for item in sorted_entities:
                f.write(item + "\n")
                
        print(f"[✓] Hoàn tất! Đã lưu {len(sorted_entities)} từ sạch vào '{filename}'.")

    print("\n=== HOÀN THÀNH TẤT CẢ CÁC FILE DATASET! ===")

if __name__ == "__main__":
    main()