import React, { useState, useMemo } from 'react';
import { buildDatabase, searchRhymes, analyzeWord } from './utils/rhymeEngine';
import { RAW_DICTIONARY } from './data/vietnameseWords';
export default function App() {
  const [query, setQuery] = useState('cố gắng');
  const [lengthType, setLengthType] = useState('2'); // '2' hoặc '3'
  const [searchMode, setSearchMode] = useState('perfect_tone_free'); // 'perfect', 'perfect_tone_free', 'slant'
  const [scratchpad, setScratchpad] = useState([]);

  // Build database trong RAM (cực nhanh)
  const db = useMemo(() => buildDatabase(RAW_DICTIONARY), []);

  // Thực hiện tìm kiếm khi state thay đổi
  const results = useMemo(() => {
    if (!query.trim()) return { direct: [], combined: [] };
    return searchRhymes(query, lengthType, searchMode, db);
  }, [query, lengthType, searchMode, db]);

  const queryInfo = analyzeWord(query);

  const addToScratchpad = (word) => {
    if (!scratchpad.includes(word)) {
      setScratchpad([...scratchpad, word]);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between bg-zinc-900/50 backdrop-blur">
        <div className="flex items-center space-x-3">
          <span className="text-2xl font-black tracking-wider bg-gradient-to-r from-amber-500 to-rose-500 bg-clip-text text-transparent">
            DATARIUS RHYME
          </span>
          <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-700">Rap Engine v1.0</span>
        </div>
        <div className="text-sm text-zinc-400">
          Kho vần: <strong className="text-zinc-200">{RAW_DICTIONARY.length}</strong> từ chuẩn hóa
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Cột trái & giữa: Công cụ tìm kiếm & Kết quả ( chiếm 2 cột ) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Ô nhập liệu & Options */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Nhập từ / Cụm từ cần tìm vần
              </label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ví dụ: cố gắng, không lối thoát..."
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-lg text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Phân tích nhanh từ nhập */}
            {queryInfo.count > 0 && (
              <div className="flex items-center space-x-2 text-xs text-zinc-400 bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/80">
                <span className="font-semibold text-amber-400">Phân tích:</span>
                <span>{queryInfo.count} âm tiết</span>
                <span>•</span>
                <span>Vần: [{queryInfo.rimes.join(' - ')}]</span>
                <span>•</span>
                <span>Dấu: [{queryInfo.tones.join(' - ')}]</span>
              </div>
            )}

            {/* Các tùy chọn Option */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Chọn độ dài vần */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Độ dài vần
                </label>
                <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                  <button
                    onClick={() => setLengthType('2')}
                    className={`py-2 rounded-lg text-sm font-medium transition-all ${
                      lengthType === '2' ? 'bg-amber-500 text-zinc-950 font-bold shadow' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Vần Đôi (2 tiếng)
                  </button>
                  <button
                    onClick={() => setLengthType('3')}
                    className={`py-2 rounded-lg text-sm font-medium transition-all ${
                      lengthType === '3' ? 'bg-amber-500 text-zinc-950 font-bold shadow' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Vần Ba (3 tiếng)
                  </button>
                </div>
              </div>

              {/* Chọn chế độ tìm kiếm */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Chế độ gieo vần
                </label>
                <select
                  value={searchMode}
                  onChange={(e) => setSearchMode(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="perfect">Vần hoàn hảo (Cùng vần, cùng dấu)</option>
                  <option value="perfect_tone_free">Vần hoàn hảo (Cùng vần, tự do dấu)</option>
                  <option value="slant">Vần không hoàn hảo (Slant Rhyme)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Khu vực hiển thị kết quả */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                Kết quả tìm kiếm ({results.direct.length + results.combined.length})
              </h2>
            </div>

            {results.direct.length === 0 && results.combined.length === 0 ? (
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-12 text-center text-zinc-500">
                Không tìm thấy cụm từ khớp vần. Hãy thử đổi từ khóa hoặc bật chế độ Vần không hoàn hảo!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Kết quả trực tiếp từ từ điển */}
                {results.direct.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 rounded-xl p-4 flex items-center justify-between transition-all group"
                  >
                    <div>
                      <div className="text-base font-bold text-zinc-100 group-hover:text-amber-400 transition-colors">
                        {item.word}
                      </div>
                      <div className="text-xs text-zinc-500 mt-0.5">
                        Vần: {item.rimes.join(' - ')}
                      </div>
                    </div>
                    <button
                      onClick={() => addToScratchpad(item.word)}
                      className="text-xs bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 px-3 py-1.5 rounded-lg font-medium transition-colors border border-zinc-700"
                    >
                      + Lưu
                    </button>
                  </div>
                ))}

                {/* Kết quả ghép từ tự động (chỉ hiện khi tìm vần 3) */}
                {results.combined.map((item, idx) => (
                  <div
                    key={`comb-${idx}`}
                    className="bg-zinc-900/60 border border-dashed border-zinc-700 hover:border-amber-500/50 rounded-xl p-4 flex items-center justify-between transition-all group"
                  >
                    <div>
                      <div className="text-base font-medium text-amber-200/90 group-hover:text-amber-400 transition-colors">
                        {item.word} <span className="text-[10px] bg-amber-950 text-amber-300 px-1.5 py-0.5 rounded ml-1 border border-amber-800">Ghép</span>
                      </div>
                      <div className="text-xs text-zinc-500 mt-0.5">Tổ hợp gợi ý tự động</div>
                    </div>
                    <button
                      onClick={() => addToScratchpad(item.word)}
                      className="text-xs bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 px-3 py-1.5 rounded-lg font-medium transition-colors border border-zinc-700"
                    >
                      + Lưu
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Cột phải: Scratchpad (Sổ tay viết lời bài hát) */}
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl sticky top-6 flex flex-col h-[calc(100vh-6rem)]">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h2 className="text-sm font-bold uppercase tracking-wider text-amber-500">
                Sổ Tay Viết Lyrics
              </h2>
              <button
                onClick={() => setScratchpad([])}
                className="text-xs text-zinc-500 hover:text-rose-400 transition-colors"
              >
                Xóa tất cả
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-2">
              {scratchpad.length === 0 ? (
                <div className="text-center text-zinc-600 text-sm mt-20">
                  Bấm "+ Lưu" các vần hay ở bên trái để gom vào đây gieo câu viết rap.
                </div>
              ) : (
                scratchpad.map((word, idx) => (
                  <div
                    key={idx}
                    className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl flex items-center justify-between text-sm group"
                  >
                    <span className="font-semibold text-zinc-200">{word}</span>
                    <button
                      onClick={() => setScratchpad(scratchpad.filter((_, i) => i !== idx))}
                      className="text-zinc-600 hover:text-rose-400 text-xs px-2"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-zinc-800">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(scratchpad.join('\n'));
                  alert('Đã copy toàn bộ lyrics vào clipboard!');
                }}
                disabled={scratchpad.length === 0}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-bold py-3 rounded-xl transition-colors text-sm shadow-lg"
              >
                Copy Toàn Bộ Lyrics
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}