// Bảng quy đổi thanh điệu tiếng Việt
const TONE_MAP = {
  'a': 1, 'à': 2, 'ả': 3, 'ã': 4, 'á': 5, 'ạ': 6,
  'ă': 1, 'ằ': 2, 'ẳ': 3, 'ẵ': 4, 'ắ': 5, 'ặ': 6,
  'â': 1, 'ầ': 2, 'ẩ': 3, 'ẫ': 4, 'ấ': 5, 'ậ': 6,
  'e': 1, 'è': 2, 'ẻ': 3, 'ẽ': 4, 'é': 5, 'ẹ': 6,
  'ê': 1, 'ề': 2, 'ể': 3, 'ễ': 4, 'ế': 5, 'ệ': 6,
  'i': 1, 'ì': 2, 'ỉ': 3, 'ĩ': 4, 'í': 5, 'ị': 6,
  'o': 1, 'ò': 2, 'ỏ': 3, 'õ': 4, 'ó': 5, 'ọ': 6,
  'ô': 1, 'ồ': 2, 'ổ': 3, 'ỗ': 4, 'ố': 5, 'ộ': 6,
  'ơ': 1, 'ờ': 2, 'ở': 3, 'ỡ': 4, 'ớ': 5, 'ợ': 6,
  'u': 1, 'ù': 2, 'ủ': 3, 'ũ': 4, 'ú': 5, 'ụ': 6,
  'ư': 1, 'ừ': 2, 'ử': 3, 'ữ': 4, 'ứ': 5, 'ự': 6,
  'y': 1, 'ỳ': 2, 'ỷ': 3, 'ỹ': 4, 'ý': 5, 'ỵ': 6,
};

// Nhóm vần không hoàn hảo (Slant Rhyme Groups) cho rap
const SLANT_GROUPS = {
  // Nhóm tắc (t, c, p, ch)
  'át': 'GROUP_TAC_A', 'ác': 'GROUP_TAC_A', 'ắc': 'GROUP_TAC_A', 'ất': 'GROUP_TAC_A', 'ắt': 'GROUP_TAC_A', 'ắp': 'GROUP_TAC_A', 'ấp': 'GROUP_TAC_A', 'ách': 'GROUP_TAC_A',
  'ét': 'GROUP_TAC_E', 'éc': 'GROUP_TAC_E', 'ết': 'GROUP_TAC_E', 'ếc': 'GROUP_TAC_E', 'ếp': 'GROUP_TAC_E', 'ẹp': 'GROUP_TAC_E', 'ếch': 'GROUP_TAC_E', 'ích': 'GROUP_TAC_E', 'ít': 'GROUP_TAC_E', 'ịp': 'GROUP_TAC_E',
  'ót': 'GROUP_TAC_O', 'óc': 'GROUP_TAC_O', 'ốt': 'GROUP_TAC_O', 'ốc': 'GROUP_TAC_O', 'ớt': 'GROUP_TAC_O', 'ớc': 'GROUP_TAC_O', 'úc': 'GROUP_TAC_O', 'út': 'GROUP_TAC_O', 'ụp': 'GROUP_TAC_O',

  // Nhóm mũi (n, ng, nh, m)
  'an': 'GROUP_NASAL_A', 'ang': 'GROUP_NASAL_A', 'ăn': 'GROUP_NASAL_A', 'ăng': 'GROUP_NASAL_A', 'ân': 'GROUP_NASAL_A', 'âng': 'GROUP_NASAL_A', 'anh': 'GROUP_NASAL_A', 'am': 'GROUP_NASAL_A', 'ăm': 'GROUP_NASAL_A', 'âm': 'GROUP_NASAL_A',
  'ên': 'GROUP_NASAL_E', 'ênh': 'GROUP_NASAL_E', 'êm': 'GROUP_NASAL_E', 'in': 'GROUP_NASAL_E', 'inh': 'GROUP_NASAL_E', 'im': 'GROUP_NASAL_E', 'en': 'GROUP_NASAL_E', 'eng': 'GROUP_NASAL_E', 'em': 'GROUP_NASAL_E',
  'on': 'GROUP_NASAL_O', 'ong': 'GROUP_NASAL_O', 'ôn': 'GROUP_NASAL_O', 'ông': 'GROUP_NASAL_O', 'ơn': 'GROUP_NASAL_O', 'ơm': 'GROUP_NASAL_O', 'om': 'GROUP_NASAL_O', 'ôm': 'GROUP_NASAL_O', 'un': 'GROUP_NASAL_O', 'ung': 'GROUP_NASAL_O', 'um': 'GROUP_NASAL_O',
};

// Hàm tách chuẩn 1 âm tiết tiếng Việt thành phần vần (rime) và thanh điệu (tone)
export function parseSyllable(syllable) {
  const lower = syllable.toLowerCase().trim();
  let tone = 1;

  // 1. Tìm thanh điệu
  for (let char of lower) {
    if (TONE_MAP[char]) {
      tone = TONE_MAP[char];
    }
  }

  // 2. Xử lý chuẩn hóa vần (Loại bỏ các âm đệm / âm đầu nhiễu để lấy phần lõi vần)
  let cleanSyllable = lower;

  // Xử lý các trường hợp bắt đầu bằng "gi" hoặc "qu" (âm i, u ở đây là âm đệm, không tính vào phần vần chính nếu đi kèm nguyên âm khác)
  if (cleanSyllable.startsWith('gi') && cleanSyllable.length > 2) {
    cleanSyllable = cleanSyllable.slice(1); // bỏ chữ g, giữ lại từ i... (ví dụ: gian -> ian -> an)
  } else if (cleanSyllable.startsWith('qu') && cleanSyllable.length > 2) {
    cleanSyllable = cleanSyllable.slice(2); // bỏ qu
  }

  // Tìm nguyên âm chính thực sự để cắt lấy phần vần (Rime)
  // Trong tiếng Việt, nếu có các tổ hợp iê, yê, uô, ươ thì phần vần bắt đầu từ đó.
  const complexRimes = ['iên', 'iêng', 'iêt', 'iêc', 'iêm', 'iêp', 'iêu', 'iên', 'iêt', 'ươu', 'ươn', 'ương', 'ươt', 'ước', 'ươm', 'ươp', 'uôn', 'uông', 'uôt', 'uôc', 'uôm', 'uôp', 'uôi', 'oan', 'oang', 'oat', 'oac', 'oam', 'oap', 'oay', 'oeo', 'uyn', 'uynh', 'uýt', 'uỵch'];
  
  let foundRime = null;
  for (let cr of complexRimes) {
    if (cleanSyllable.endsWith(cr)) {
      foundRime = cr;
      break;
    }
  }

  if (!foundRime) {
    // Nếu không khớp vần kép đặc biệt, tìm nguyên âm chính đơn từ trái sang phải
    // Bỏ qua chữ 'i' hoặc 'y' đứng đầu nếu sau nó còn nguyên âm khác (vd: 'ian' -> bỏ 'i' lấy 'an')
    if ((cleanSyllable.startsWith('i') || cleanSyllable.startsWith('y')) && cleanSyllable.length > 1) {
      const secondChar = cleanSyllable[1];
      const pureVowels = "aăâeêioôơuưáàảãạắằẳẵặấầẩẫấéèẻẽẹếềểễếíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ";
      if (pureVowels.includes(secondChar)) {
        cleanSyllable = cleanSyllable.slice(1);
      }
    }
    foundRime = cleanSyllable;
    // Bỏ phần phụ âm đầu đơn giản (b, c, d, đ, g, h, k, l, m, n, p, q, r, s, t, v, x, gh, kh, nh, ph, th, tr, ch, gi, ng, ngh, th...)
    // Cách nhanh nhất là lọc từ nguyên âm đầu tiên xuất hiện
    const vowels = "aăâeêioôơuưyáàảãạắằẳẵặấầẩẫấéèẻẽẹếềểễếíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ";
    for (let i = 0; i < cleanSyllable.length; i++) {
      if (vowels.includes(cleanSyllable[i])) {
        foundRime = cleanSyllable.slice(i);
        break;
      }
    }
  }

  let rime = foundRime;
  // Chuẩn hóa ký tự y thành i ở cuối vần (ví dụ: thay vì phân biệt 'ay' và 'ai' hoặc 'ây' nếu muốn gom)
  if (rime.endsWith('y') && rime.length > 1) {
    rime = rime.slice(0, -1) + 'i';
  }

  const group = SLANT_GROUPS[rime] || rime;
  return { rime, tone, group };
}

// Phân tích toàn bộ cụm từ
export function analyzeWord(phrase) {
  const syllables = phrase.trim().split(/\s+/);
  const rimes = [];
  const tones = [];
  const groups = [];

  for (let syl of syllables) {
    const parsed = parseSyllable(syl);
    rimes.push(parsed.rime);
    tones.push(parsed.tone);
    groups.push(parsed.group);
  }

  return {
    word: phrase,
    count: syllables.length,
    rimes,
    tones,
    groups
  };
}

// Từ điển mẫu (Mày có thể bổ sung hàng nghìn từ vào đây hoặc fetch JSON bên ngoài)
export const RAW_DICTIONARY = [
  "cố gắng", "số phận", "lối thoát", "bố thắng", "đổi khác", "nổi bạt", "tối mát", "gói ghém",
  "không thể nào", "trong thế nào", "bóng tối mát", "trong đống cát", "sóng xô dạt", "mong mỏi sao",
  "bay cao", "ngày nào", "thực tại", "tương lai", "sai trái", "chông gai", "đêm dài", "âm thanh",
  "vần thơ", "bơ vơ", "mong chờ", "cơn mơ", "tình cờ", "bất khả thi", "hành vi", "suy nghĩ",
  "đường đi", "khó khăn", "bâng khuâng", "xa xăm", "âm thầm", "lặng câm", "tâm can", "gian nan",
  "trái tim", "đứng im", "kiếm tìm", "bình yên", "ưu phiền", "triền miên", "thuyền quyên"
];

// Xây dựng Database đã Index sẵn
export function buildDatabase(wordList) {
  const dict1 = [];
  const dict2 = [];
  const dict3 = [];

  for (let w of wordList) {
    const analyzed = analyzeWord(w);
    if (analyzed.count === 1) dict1.push(analyzed);
    else if (analyzed.count === 2) dict2.push(analyzed);
    else if (analyzed.count === 3) dict3.push(analyzed);
  }
  return { dict1, dict2, dict3 };
}

// Hàm tìm kiếm chính
export function searchRhymes(queryPhrase, lengthType, searchMode, db) {
  const query = analyzeWord(queryPhrase);
  if (query.count === 0) return { direct: [], combined: [] };

  // Lấy N âm tiết cuối (N = 2 hoặc 3)
  const targetCount = parseInt(lengthType);
  
  // Nếu từ khóa nhập vào ngắn hơn số âm tiết cần tìm, lấy hết từ khóa
  const effectiveCount = Math.min(query.rimes.length, targetCount);
  
  const targetRimes = query.rimes.slice(-effectiveCount);
  const targetTones = query.tones.slice(-effectiveCount);
  const targetGroups = query.groups.slice(-effectiveCount);

  let directResults = [];

  // Chọn kho dữ liệu phù hợp
  let targetDict = targetCount === 2 ? db.dict2 : db.dict3;
  // Mở rộng tìm kiếm sang cả dict khác nếu cần
  const allEntries = [...db.dict2, ...db.dict3];

  for (let entry of allEntries) {
    if (entry.rimes.length < targetCount) continue;
    
    // Lấy N âm tiết cuối của từ trong từ điển để so sánh
    const entryRimes = entry.rimes.slice(-targetCount);
    const entryTones = entry.tones.slice(-targetCount);
    const entryGroups = entry.groups.slice(-targetCount);

    let isMatch = false;

    if (searchMode === 'perfect') {
      // Vần hoàn hảo: Khớp 100% phần vần VÀ thanh điệu
      isMatch = arrayEquals(entryRimes, targetRimes) && arrayEquals(entryTones, targetTones);
    } else if (searchMode === 'perfect_tone_free') {
      // Vần hoàn hảo (Tự do dấu): Chỉ khớp phần vần, bỏ qua dấu
      isMatch = arrayEquals(entryRimes, targetRimes);
    } else {
      // Vần không hoàn hảo: Khớp theo nhóm ngữ âm (Slant rhyme)
      let groupMatch = true;
      for (let i = 0; i < targetCount; i++) {
        if (entryGroups[i] !== targetGroups[i]) {
          groupMatch = false;
          break;
        }
      }
      isMatch = groupMatch;
    }

    if (isMatch && entry.word.toLowerCase() !== queryPhrase.toLowerCase()) {
      directResults.push(entry);
    }
  }

  // Nếu tìm vần 3, thực hiện thuật toán ghép từ (Dict1 + Dict2) nếu kết quả trực tiếp ít
  let combinedResults = [];
  if (targetCount === 3) {
    // Ghép 1 từ 1 tiếng (vần R1) + 1 từ 2 tiếng (vần R2-R3)
    const r1 = targetRimes[0];
    const r2 = targetRimes[1];
    const r3 = targetRimes[2];
    
    const g1 = targetGroups[0];
    const g2 = targetGroups[1];
    const g3 = targetGroups[2];

    const match1 = db.dict1.filter(e => searchMode.includes('perfect') ? e.rimes[0] === r1 : e.groups[0] === g1);
    const match2 = db.dict2.filter(e => {
      const er = e.rimes.slice(-2);
      const eg = e.groups.slice(-2);
      if (searchMode.includes('perfect')) {
        return er[0] === r2 && er[1] === r3;
      } else {
        return eg[0] === g2 && eg[1] === g3;
      }
    });

    for (let d1 of match1.slice(0, 10)) {
      for (let d2 of match2.slice(0, 10)) {
        const combinedWord = `${d1.word} ${d2.word}`;
        if (!directResults.some(r => r.word === combinedWord)) {
          combinedResults.push({ word: combinedWord, type: 'combined' });
        }
      }
    }
  }

  return { direct: directResults, combined: combinedResults };
}

function arrayEquals(a, b) {
  return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((val, index) => val === b[index]);
}