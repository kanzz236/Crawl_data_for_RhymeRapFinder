import json
import os

# Tên file txt (đổi lại nếu tên khác)
input_file = "Viet74K.txt"
output_file = "src/data/vietnameseWords.js"

if not os.path.exists(input_file):
    print(f"Không tìm thấy file {input_file}! Hãy kiểm tra lại tên file.")
else:
    # Đọc từng dòng, loại bỏ khoảng trắng thừa và dòng trống
    with open(input_file, "r", encoding="utf-8") as f:
        words = [line.strip() for line in f if line.strip()]

    # Lọc bỏ các từ bị trùng lặp
    words = list(set(words))

    # Tạo thư mục src/data nếu chưa có
    os.makedirs(os.path.dirname(output_file), exist_ok=True)

    # Ghi ra file JS chuẩn để app import
    with open(output_file, "w", encoding="utf-8") as f:
        f.write("// Kho từ điển tự động sinh từ file txt\n")
        f.write("export const RAW_DICTIONARY = ")
        json.dump(words, f, ensure_ascii=False, indent=2)
        f.write(";\n")

    print(f"Thành công! Đã nạp {len(words)} từ từ file txt vào {output_file}")