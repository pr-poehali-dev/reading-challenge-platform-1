import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

// ─── API ─────────────────────────────────────────────────────────────────────

const AUTH_URL = "https://functions.poehali.dev/2bdc6ba6-896b-4882-9dd2-854d3337c3c2";
const BOOKS_URL = "https://functions.poehali.dev/54c89388-603a-46f6-b18b-050836232b37";

async function apiAuth(action: string, method = "GET", body?: object, token?: string) {
  const url = AUTH_URL + (action ? `?action=${action}` : "");
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { "X-Session-Id": token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

async function apiBooks(action: string, method = "GET", body?: object, token?: string) {
  const url = BOOKS_URL + (action ? `?action=${action}` : "");
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { "X-Session-Id": token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

// ─── STATIC DATA ─────────────────────────────────────────────────────────────

const BADGES = [
  { id: 1, emoji: "📚", name: "Первая книга", desc: "Прочитана 1 книга", rarity: "common", require: (done: number) => done >= 1 },
  { id: 2, emoji: "🔥", name: "10 книг!", desc: "Прочитано 10 книг", rarity: "rare", require: (done: number) => done >= 10 },
  { id: 3, emoji: "⚡", name: "Скорочтец", desc: "Прочитано 5+ книг", rarity: "epic", require: (done: number) => done >= 5 },
  { id: 4, emoji: "🏆", name: "Чемпион", desc: "Прочитано 20 книг", rarity: "legendary", require: (done: number) => done >= 20 },
  { id: 5, emoji: "🌙", name: "Читатель", desc: "Первая запись книги", rarity: "common", require: (_: number, total: number) => total >= 1 },
  { id: 6, emoji: "🎯", name: "Снайпер", desc: "Прочитано 15 книг", rarity: "epic", require: (done: number) => done >= 15 },
  { id: 7, emoji: "🦋", name: "Трансформация", desc: "Прочитано 3 книги", rarity: "rare", require: (done: number) => done >= 3 },
  { id: 8, emoji: "💎", name: "Легенда", desc: "50+ книг", rarity: "legendary", require: (done: number) => done >= 50 },
];



const BOOK_COVERS = ["📕", "📘", "📗", "📙", "📒", "📓", "📔", "📖"];

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Page = "home" | "challenges" | "books" | "rating" | "friends" | "profile";

interface User { token: string; user_id: number; name: string; class: string; }

interface Book {
  id: number; title: string; author: string;
  pages: number; pages_read: number; status: string;
  rating: number | null; created_at: string;
}

interface Stats { total: number; done: number; reading: number; planned: number; total_pages_read: number; }

// ─── RARITY ──────────────────────────────────────────────────────────────────

const rarityStyle: Record<string, string> = {
  common: "from-slate-500 to-slate-600",
  rare: "from-blue-500 to-cyan-500",
  epic: "from-violet-500 to-purple-600",
  legendary: "from-amber-400 to-orange-500",
};
const rarityLabel: Record<string, string> = {
  common: "Обычный", rare: "Редкий", epic: "Эпический", legendary: "Легендарный",
};

// ─── REGISTRATION SCREEN ─────────────────────────────────────────────────────

function RegisterScreen({ onAuth }: { onAuth: (u: User) => void }) {
  const [name, setName] = useState("");
  const [klass, setKlass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!name.trim() || !klass.trim()) { setError("Заполни оба поля"); return; }
    setLoading(true);
    setError("");
    try {
      const data = await apiAuth("register", "POST", { name: name.trim(), class: klass.trim() });
      if (data.token) {
        localStorage.setItem("rc_token", data.token);
        localStorage.setItem("rc_user", JSON.stringify(data));
        onAuth(data as User);
      } else {
        setError(data.error || "Ошибка");
      }
    } catch {
      setError("Нет соединения");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-float inline-block">📚</div>
          <h1 className="font-display font-black text-3xl text-white mb-2">Reading<br />Challenge</h1>
          <p className="text-white/50 text-sm">Читай. Побеждай. Расти.</p>
        </div>

        {/* Card */}
        <div className="glass-strong rounded-3xl p-6 space-y-4">
          <h2 className="font-display font-bold text-white text-lg">Добро пожаловать!</h2>
          <p className="text-white/50 text-sm -mt-2">Введи своё имя и класс, чтобы начать</p>

          <div className="space-y-3">
            <div>
              <label className="text-white/60 text-xs font-medium mb-1.5 block">Имя и фамилия</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Алексей Иванов"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-violet-500/60 transition-colors"
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
              />
            </div>
            <div>
              <label className="text-white/60 text-xs font-medium mb-1.5 block">Класс</label>
              <input
                value={klass}
                onChange={e => setKlass(e.target.value)}
                placeholder="10А"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-violet-500/60 transition-colors"
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full grad-primary text-white font-bold py-3.5 rounded-xl text-base disabled:opacity-50 transition-opacity hover:opacity-90"
          >
            {loading ? "Вхожу..." : "Начать читать →"}
          </button>

          <p className="text-white/30 text-xs text-center">Если уже был аккаунт — просто введи те же данные</p>
        </div>
      </div>
    </div>
  );
}

// ─── ADD BOOK MODAL ───────────────────────────────────────────────────────────

function AddBookModal({ token, onAdded, onClose }: { token: string; onAdded: () => void; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [pages, setPages] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAdd = async () => {
    if (!title.trim() || !author.trim() || !pages) { setError("Заполни все поля"); return; }
    setLoading(true);
    setError("");
    try {
      const data = await apiBooks("", "POST", { title: title.trim(), author: author.trim(), pages: parseInt(pages) }, token);
      if (data.id) { onAdded(); onClose(); }
      else setError(data.error || "Ошибка");
    } catch {
      setError("Нет соединения");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md glass-strong rounded-3xl p-6 space-y-4 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-white text-lg">Добавить книгу</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-white/60 text-xs font-medium mb-1.5 block">Название книги</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Мастер и Маргарита"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-violet-500/60 transition-colors"
            />
          </div>
          <div>
            <label className="text-white/60 text-xs font-medium mb-1.5 block">Автор</label>
            <input
              value={author}
              onChange={e => setAuthor(e.target.value)}
              placeholder="Михаил Булгаков"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-violet-500/60 transition-colors"
            />
          </div>
          <div>
            <label className="text-white/60 text-xs font-medium mb-1.5 block">Количество страниц</label>
            <input
              value={pages}
              onChange={e => setPages(e.target.value.replace(/\D/g, ""))}
              placeholder="480"
              inputMode="numeric"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-violet-500/60 transition-colors"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-2.5 text-red-400 text-sm">{error}</div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 glass text-white/60 font-semibold py-3 rounded-xl">
            Отмена
          </button>
          <button
            onClick={handleAdd}
            disabled={loading}
            className="flex-1 grad-primary text-white font-bold py-3 rounded-xl disabled:opacity-50"
          >
            {loading ? "Добавляю..." : "Добавить"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── UPDATE PAGES MODAL ───────────────────────────────────────────────────────

function UpdatePagesModal({ book, token, onUpdated, onClose }: {
  book: Book; token: string; onUpdated: () => void; onClose: () => void;
}) {
  const [pagesRead, setPagesRead] = useState(String(book.pages_read));
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    await apiBooks("", "PUT", { book_id: book.id, pages_read: parseInt(pagesRead) || 0 }, token);
    onUpdated();
    onClose();
  };

  const pct = Math.min(100, Math.round((parseInt(pagesRead) || 0) / book.pages * 100));

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md glass-strong rounded-3xl p-6 space-y-4 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-white text-lg">Обновить прогресс</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><Icon name="X" size={20} /></button>
        </div>

        <div className="glass rounded-2xl p-4">
          <div className="font-semibold text-white">{book.title}</div>
          <div className="text-white/50 text-sm">{book.author} · {book.pages} стр.</div>
          <div className="mt-3 progress-bar h-2">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-1 text-white/40 text-xs">{pct}% прочитано</div>
        </div>

        <div>
          <label className="text-white/60 text-xs font-medium mb-1.5 block">Прочитано страниц</label>
          <input
            value={pagesRead}
            onChange={e => setPagesRead(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-violet-500/60 transition-colors text-xl font-bold"
          />
          <div className="text-white/30 text-xs mt-1 text-right">из {book.pages} страниц</div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 glass text-white/60 font-semibold py-3 rounded-xl">Отмена</button>
          <button onClick={handleSave} disabled={loading} className="flex-1 grad-primary text-white font-bold py-3 rounded-xl disabled:opacity-50">
            {loading ? "Сохраняю..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────

function HomePage({ user, books, stats, loading, setPage, token, onRefresh }: {
  user: User; books: Book[]; stats: Stats; loading: boolean;
  setPage: (p: Page) => void; token: string; onRefresh: () => void;
}) {
  const [updateBook, setUpdateBook] = useState<Book | null>(null);
  const readingBooks = books.filter(b => b.status === "reading");

  return (
    <div className="p-4 space-y-6 animate-fade-in-up">
      {updateBook && (
        <UpdatePagesModal book={updateBook} token={token} onUpdated={onRefresh} onClose={() => setUpdateBook(null)} />
      )}

      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden p-6 grad-primary">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full translate-y-10 -translate-x-10" />
        <div className="relative">
          <div className="text-white/70 text-sm font-medium mb-1">Привет, {user.name.split(" ")[0]} 👋</div>
          <h1 className="font-display text-2xl font-black text-white mb-1 leading-tight">
            Читай. Побеждай.<br />Расти.
          </h1>
          <div className="text-white/60 text-sm mb-3">{user.class} класс</div>
          <div className="flex items-center gap-3">
            <div className="glass rounded-2xl px-4 py-2 text-white text-sm font-semibold">
              📚 {stats.done} книг
            </div>
            <div className="glass rounded-2xl px-4 py-2 text-white text-sm font-semibold">
              📄 {stats.total_pages_read.toLocaleString()} стр.
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { val: String(stats.done), label: "Прочитано", icon: "BookOpen", grad: "from-violet-500/20 to-purple-600/20", border: "border-violet-500/30" },
          { val: String(stats.reading), label: "Читаю сейчас", icon: "Zap", grad: "from-pink-500/20 to-rose-500/20", border: "border-pink-500/30" },
          { val: String(stats.planned), label: "В планах", icon: "Clock", grad: "from-amber-500/20 to-orange-500/20", border: "border-amber-500/30" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl p-3 bg-gradient-to-br ${s.grad} border ${s.border} text-center`}>
            <Icon name={s.icon} size={20} className="mx-auto mb-1 text-white/80" />
            <div className="font-display font-black text-xl text-white">{loading ? "—" : s.val}</div>
            <div className="text-white/50 text-xs leading-tight">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Go to challenges CTA */}
      <button onClick={() => setPage("challenges")}
        className="w-full glass rounded-2xl p-4 flex items-center gap-4 hover-lift border border-violet-500/20">
        <div className="w-12 h-12 grad-primary rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🏁</div>
        <div className="text-left">
          <div className="font-semibold text-white">Мои челленджи</div>
          <div className="text-white/50 text-xs">Создай или войди по коду →</div>
        </div>
        <Icon name="ChevronRight" size={18} className="text-white/30 ml-auto flex-shrink-0" />
      </button>

      {/* Currently reading */}
      {readingBooks.length > 0 && (
        <section>
          <h2 className="font-display font-bold text-white text-lg mb-3">Сейчас читаю</h2>
          {readingBooks.map((book, bi) => (
            <div key={book.id} className="glass rounded-2xl p-4 flex items-center gap-4 hover-lift mb-3 cursor-pointer" onClick={() => setUpdateBook(book)}>
              <div className="text-4xl animate-float">{BOOK_COVERS[bi % BOOK_COVERS.length]}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white truncate">{book.title}</div>
                <div className="text-white/50 text-sm">{book.author}</div>
                <div className="mt-2 progress-bar h-1.5">
                  <div className="progress-fill" style={{ width: `${Math.round((book.pages_read / book.pages) * 100)}%` }} />
                </div>
                <div className="mt-1 text-white/40 text-xs">{book.pages_read} из {book.pages} стр.</div>
              </div>
              <Icon name="ChevronRight" size={16} className="text-white/30 flex-shrink-0" />
            </div>
          ))}
        </section>
      )}

      {books.length === 0 && !loading && (
        <div className="glass rounded-2xl p-6 text-center border border-violet-500/20">
          <div className="text-4xl mb-2">📖</div>
          <h3 className="font-display font-bold text-white mb-1">Начни читать!</h3>
          <p className="text-white/50 text-sm mb-4">Добавь первую книгу и начни отслеживать прогресс</p>
          <button onClick={() => setPage("books")} className="grad-primary text-white font-semibold px-6 py-2.5 rounded-xl text-sm">
            Добавить книгу
          </button>
        </div>
      )}
    </div>
  );
}

// ─── CHALLENGE TYPES ──────────────────────────────────────────────────────────

interface Challenge {
  id: number; title: string; books_goal: number; days: number;
  emoji: string; join_code: string; books_done: number;
  members: number; is_creator: boolean; created_at: string;
}

const CH_COLORS = [
  "from-pink-500 to-rose-500",
  "from-violet-500 to-purple-600",
  "from-cyan-500 to-blue-600",
  "from-orange-500 to-amber-500",
  "from-emerald-500 to-teal-600",
  "from-fuchsia-500 to-pink-600",
];

const CHALLENGES_URL = "https://functions.poehali.dev/d28955f1-c673-40c3-89e6-6c4b16687d30";

async function apiChallenges(action: string, method = "GET", body?: object, token?: string, extra?: string) {
  const url = CHALLENGES_URL + `?action=${action}` + (extra || "");
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { "X-Session-Id": token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

// ─── CREATE CHALLENGE MODAL ───────────────────────────────────────────────────

const EMOJI_OPTIONS = ["📚","🔥","⚡","🏆","🌸","🚀","🧠","🎯","🦋","💎","🌙","⭐"];

function CreateChallengeModal({ token, onCreated, onClose }: {
  token: string; onCreated: (code: string, title: string) => void; onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [booksGoal, setBooksGoal] = useState("5");
  const [days, setDays] = useState("30");
  const [emoji, setEmoji] = useState("📚");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!title.trim() || !booksGoal || !days) { setError("Заполни все поля"); return; }
    setLoading(true); setError("");
    try {
      const data = await apiChallenges("create", "POST",
        { title: title.trim(), books_goal: parseInt(booksGoal), days: parseInt(days), emoji },
        token
      );
      if (data.id) { onCreated(data.join_code, data.title); onClose(); }
      else setError(data.error || "Ошибка");
    } catch { setError("Нет соединения"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md glass-strong rounded-3xl p-6 space-y-4 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-white text-lg">Создать челлендж</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><Icon name="X" size={20} /></button>
        </div>

        {/* Emoji picker */}
        <div>
          <label className="text-white/60 text-xs font-medium mb-2 block">Иконка</label>
          <div className="flex flex-wrap gap-2">
            {EMOJI_OPTIONS.map(e => (
              <button key={e} onClick={() => setEmoji(e)}
                className={`w-10 h-10 rounded-xl text-xl transition-all ${emoji === e ? "grad-primary scale-110" : "glass"}`}>
                {e}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-white/60 text-xs font-medium mb-1.5 block">Название</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Летний марафон"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-violet-500/60 transition-colors" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-white/60 text-xs font-medium mb-1.5 block">Цель (книг)</label>
            <input value={booksGoal} onChange={e => setBooksGoal(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric" placeholder="5"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-violet-500/60 transition-colors" />
          </div>
          <div>
            <label className="text-white/60 text-xs font-medium mb-1.5 block">Срок (дней)</label>
            <input value={days} onChange={e => setDays(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric" placeholder="30"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-violet-500/60 transition-colors" />
          </div>
        </div>

        {error && <div className="bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-2.5 text-red-400 text-sm">{error}</div>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 glass text-white/60 font-semibold py-3 rounded-xl">Отмена</button>
          <button onClick={handleCreate} disabled={loading} className="flex-1 grad-primary text-white font-bold py-3 rounded-xl disabled:opacity-50">
            {loading ? "Создаю..." : "Создать"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── JOIN CHALLENGE MODAL ─────────────────────────────────────────────────────

function JoinChallengeModal({ token, onJoined, onClose }: {
  token: string; onJoined: () => void; onClose: () => void;
}) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const code = digits.join("");

  const handleDigit = (i: number, val: string) => {
    const d = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    if (d && i < 5) {
      const nextInput = document.getElementById(`digit-${i + 1}`);
      (nextInput as HTMLInputElement)?.focus();
    }
  };

  const handleKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      const prevInput = document.getElementById(`digit-${i - 1}`);
      (prevInput as HTMLInputElement)?.focus();
    }
  };

  const handleJoin = async () => {
    if (code.length < 6) { setError("Введи все 6 цифр"); return; }
    setLoading(true); setError("");
    try {
      const data = await apiChallenges("join", "POST", { join_code: code }, token);
      if (data.id) { onJoined(); onClose(); }
      else setError(data.error || "Ошибка");
    } catch { setError("Нет соединения"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md glass-strong rounded-3xl p-6 space-y-5 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-white text-lg">Войти по коду</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><Icon name="X" size={20} /></button>
        </div>

        <p className="text-white/50 text-sm">Попроси организатора поделиться 6-значным кодом челленджа</p>

        {/* 6-digit input */}
        <div className="flex gap-2 justify-center">
          {digits.map((d, i) => (
            <input
              key={i}
              id={`digit-${i}`}
              value={d}
              onChange={e => handleDigit(i, e.target.value)}
              onKeyDown={e => handleKey(i, e)}
              inputMode="numeric"
              maxLength={1}
              className={`w-12 h-14 text-center text-2xl font-display font-black rounded-xl border transition-all outline-none
                ${d ? "bg-violet-500/20 border-violet-500 text-white" : "bg-white/5 border-white/15 text-white/30"}
                focus:border-violet-400 focus:bg-violet-500/15`}
            />
          ))}
        </div>

        {error && <div className="bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-2.5 text-red-400 text-sm text-center">{error}</div>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 glass text-white/60 font-semibold py-3 rounded-xl">Отмена</button>
          <button onClick={handleJoin} disabled={loading || code.length < 6}
            className="flex-1 grad-primary text-white font-bold py-3 rounded-xl disabled:opacity-40">
            {loading ? "Ищу..." : "Войти"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SHARE CODE MODAL ─────────────────────────────────────────────────────────

function ShareCodeModal({ code, title, onClose }: { code: string; title: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm glass-strong rounded-3xl p-6 space-y-5 animate-scale-in text-center">
        <div className="text-4xl">🎉</div>
        <div>
          <h2 className="font-display font-bold text-white text-xl mb-1">Челлендж создан!</h2>
          <p className="text-white/50 text-sm">«{title}»</p>
        </div>
        <div>
          <p className="text-white/50 text-xs mb-3">Поделись кодом с друзьями</p>
          <div className="grad-primary rounded-2xl p-5">
            <div className="font-display font-black text-5xl text-white tracking-widest letter-spacing-wide">
              {code.split("").join(" ")}
            </div>
          </div>
        </div>
        <button onClick={copy} className={`w-full py-3 rounded-xl font-semibold transition-all ${copied ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "glass text-white"}`}>
          {copied ? "✓ Скопировано!" : "Скопировать код"}
        </button>
        <button onClick={onClose} className="w-full grad-primary text-white font-bold py-3 rounded-xl">Готово</button>
      </div>
    </div>
  );
}

// ─── CHALLENGES PAGE ──────────────────────────────────────────────────────────

function ChallengesPage({ token }: { token: string }) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [shareData, setShareData] = useState<{ code: string; title: string } | null>(null);

  const fetchChallenges = async () => {
    setLoading(true);
    try {
      const data = await apiChallenges("my", "GET", undefined, token);
      if (data.challenges) setChallenges(data.challenges);
    } catch (_e) { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchChallenges(); }, []);

  const handleCreated = (code: string, title: string) => {
    setShareData({ code, title });
    fetchChallenges();
  };

  const done = challenges.filter(c => c.books_done >= c.books_goal);
  const active = challenges.filter(c => c.books_done < c.books_goal);

  return (
    <div className="p-4 space-y-5 animate-fade-in-up">
      {showCreate && <CreateChallengeModal token={token} onCreated={handleCreated} onClose={() => setShowCreate(false)} />}
      {showJoin && <JoinChallengeModal token={token} onJoined={fetchChallenges} onClose={() => setShowJoin(false)} />}
      {shareData && <ShareCodeModal code={shareData.code} title={shareData.title} onClose={() => setShareData(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl text-white">Челленджи</h1>
          <p className="text-white/50 text-sm">{challenges.length} активных</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="grad-primary text-white w-10 h-10 rounded-xl flex items-center justify-center">
          <Icon name="Plus" size={18} />
        </button>
      </div>

      {/* Кнопки действий */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setShowCreate(true)}
          className="glass rounded-2xl p-4 flex flex-col items-center gap-2 hover-lift border border-violet-500/20 text-center">
          <div className="w-10 h-10 grad-primary rounded-xl flex items-center justify-center">
            <Icon name="Plus" size={20} className="text-white" />
          </div>
          <div className="text-white font-semibold text-sm">Создать</div>
          <div className="text-white/40 text-xs">свой челлендж</div>
        </button>
        <button onClick={() => setShowJoin(true)}
          className="glass rounded-2xl p-4 flex flex-col items-center gap-2 hover-lift border border-pink-500/20 text-center">
          <div className="w-10 h-10 grad-hot rounded-xl flex items-center justify-center">
            <Icon name="Hash" size={20} className="text-white" />
          </div>
          <div className="text-white font-semibold text-sm">Войти по коду</div>
          <div className="text-white/40 text-xs">6-значный код</div>
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="glass rounded-3xl h-40 animate-pulse" />)}
        </div>
      ) : challenges.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center border border-violet-500/20">
          <div className="text-4xl mb-3">🏁</div>
          <h3 className="font-display font-bold text-white mb-2">Нет челленджей</h3>
          <p className="text-white/50 text-sm mb-4">Создай свой или присоединись к чужому по коду</p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <section>
              <h2 className="font-semibold text-white/60 text-sm mb-3 uppercase tracking-wider">Активные</h2>
              <div className="space-y-4">
                {active.map((ch, i) => (
                  <ChallengeCard key={ch.id} ch={ch} idx={i} onShare={() => setShareData({ code: ch.join_code, title: ch.title })} />
                ))}
              </div>
            </section>
          )}
          {done.length > 0 && (
            <section>
              <h2 className="font-semibold text-white/60 text-sm mb-3 uppercase tracking-wider">Завершённые</h2>
              <div className="space-y-4">
                {done.map((ch, i) => (
                  <ChallengeCard key={ch.id} ch={ch} idx={i} onShare={() => setShareData({ code: ch.join_code, title: ch.title })} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function ChallengeCard({ ch, idx, onShare }: { ch: Challenge; idx: number; onShare: () => void }) {
  const pct = Math.min(100, Math.round((ch.books_done / ch.books_goal) * 100));
  const completed = ch.books_done >= ch.books_goal;
  const color = CH_COLORS[ch.id % CH_COLORS.length];

  return (
    <div className="glass rounded-3xl overflow-hidden hover-lift" style={{ animationDelay: `${idx * 0.08}s` }}>
      <div className={`bg-gradient-to-r ${color} p-5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{ch.emoji}</span>
            <div>
              <h3 className="font-display font-bold text-white text-lg leading-tight">{ch.title}</h3>
              <p className="text-white/70 text-sm">{ch.members} участников · {ch.days} дн.</p>
            </div>
          </div>
          {completed && <div className="glass rounded-xl px-3 py-1.5 text-white text-xs font-bold">✓ Готово</div>}
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-white/60 text-sm">Мой прогресс: {ch.books_done}/{ch.books_goal} книг</span>
          <span className="text-white/50 text-sm font-semibold">{pct}%</span>
        </div>
        <div className="progress-bar h-2.5">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        {/* Код и поделиться */}
        <div className="flex items-center justify-between pt-1">
          <button onClick={onShare} className="flex items-center gap-2 glass rounded-xl px-3 py-2 text-white/60 text-xs font-semibold hover:text-white transition-colors">
            <Icon name="Share2" size={14} />
            Код: <span className="text-violet-400 font-display font-bold tracking-wider">{ch.join_code}</span>
          </button>
          {ch.is_creator && (
            <span className="text-amber-400 text-xs font-medium flex items-center gap-1">
              <Icon name="Crown" size={12} />
              Автор
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── BOOKS PAGE ───────────────────────────────────────────────────────────────

function BooksPage({ books, stats, loading, token, onRefresh }: {
  books: Book[]; stats: Stats; loading: boolean; token: string; onRefresh: () => void;
}) {
  const [filter, setFilter] = useState<"all" | "reading" | "done" | "planned">("all");
  const [showAdd, setShowAdd] = useState(false);
  const [updateBook, setUpdateBook] = useState<Book | null>(null);

  const filtered = filter === "all" ? books : books.filter(b => b.status === filter);

  const statusDots: Record<string, string> = {
    reading: "bg-cyan-400", done: "bg-emerald-400", planned: "bg-amber-400",
  };
  const statusColors: Record<string, string> = {
    reading: "text-cyan-400", done: "text-emerald-400", planned: "text-amber-400",
  };
  const statusText: Record<string, string> = {
    reading: "Читаю", done: "Прочитано", planned: "Позже",
  };

  return (
    <div className="p-4 space-y-5 animate-fade-in-up">
      {showAdd && <AddBookModal token={token} onAdded={onRefresh} onClose={() => setShowAdd(false)} />}
      {updateBook && <UpdatePagesModal book={updateBook} token={token} onUpdated={onRefresh} onClose={() => setUpdateBook(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl text-white">Мои книги</h1>
          <p className="text-white/50 text-sm">{stats.total} книг в библиотеке</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="grad-primary text-white w-10 h-10 rounded-xl flex items-center justify-center">
          <Icon name="Plus" size={18} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Читаю", count: stats.reading, color: "text-cyan-400" },
          { label: "Прочитано", count: stats.done, color: "text-emerald-400" },
          { label: "Планирую", count: stats.planned, color: "text-amber-400" },
        ].map(s => (
          <div key={s.label} className="glass rounded-xl p-3 text-center">
            <div className={`font-display font-black text-xl ${s.color}`}>{loading ? "—" : s.count}</div>
            <div className="text-white/50 text-xs">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(["all", "reading", "done", "planned"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filter === f ? "grad-primary text-white" : "glass text-white/60"}`}>
            {{ all: "Все", reading: "Читаю", done: "Прочитано", planned: "Планирую" }[f]}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="glass rounded-2xl h-20 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center">
          <div className="text-4xl mb-2">📭</div>
          <p className="text-white/40">Нет книг в этой категории</p>
          <button onClick={() => setShowAdd(true)} className="mt-3 text-violet-400 text-sm font-medium">+ Добавить книгу</button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((book, i) => (
            <div key={book.id} className="glass rounded-2xl p-4 flex gap-4 hover-lift cursor-pointer"
              onClick={() => book.status !== "done" && setUpdateBook(book)}
              style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="text-4xl animate-float">{BOOK_COVERS[book.id % BOOK_COVERS.length]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-white truncate">{book.title}</div>
                    <div className="text-white/50 text-sm">{book.author}</div>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${statusDots[book.status]}`} />
                    <span className={`text-xs font-medium ${statusColors[book.status]}`}>{statusText[book.status]}</span>
                  </div>
                </div>
                {book.status === "reading" && (
                  <>
                    <div className="mt-2 progress-bar h-1.5">
                      <div className="progress-fill" style={{ width: `${Math.round((book.pages_read / book.pages) * 100)}%` }} />
                    </div>
                    <div className="mt-1 text-white/40 text-xs">{Math.round((book.pages_read / book.pages) * 100)}% · {book.pages_read}/{book.pages} стр.</div>
                  </>
                )}
                {book.status === "done" && (
                  <div className="mt-1 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, ri) => (
                      <span key={ri} className={ri < (book.rating || 0) ? "text-amber-400" : "text-white/20"}>★</span>
                    ))}
                  </div>
                )}
                <div className="mt-1 text-white/30 text-xs">{book.pages} стр.</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {books.length === 0 && !loading && (
        <button onClick={() => setShowAdd(true)}
          className="w-full glass rounded-2xl p-4 border-2 border-dashed border-violet-500/30 flex items-center justify-center gap-3 text-violet-400 font-semibold">
          <Icon name="Plus" size={20} />
          Добавить первую книгу
        </button>
      )}
    </div>
  );
}

// ─── FRIENDS TYPES ───────────────────────────────────────────────────────────

const FRIENDS_URL = "https://functions.poehali.dev/d57b2aed-d3f3-4b33-bb08-4df9ae82d937";

async function apiFriends(action: string, method = "GET", body?: object, token?: string) {
  const res = await fetch(`${FRIENDS_URL}?action=${action}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { "X-Session-Id": token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

interface FriendEntry {
  id: number; name: string; class: string;
  books_done: number; books_total?: number; pages_read?: number;
  rank?: number; is_me?: boolean;
}

// ─── AVATAR helpers ──────────────────────────────────────────────────────────

const AVATARS = ["📚","🌸","🚀","🦋","⭐","🎯","🔥","🌙","💎","🏆","🎮","🧠"];
function getAvatar(id: number) { return AVATARS[id % AVATARS.length]; }
function getInitials(name: string) {
  const parts = name.trim().split(" ");
  return parts.length >= 2 ? parts[0][0] + parts[1][0] : name.slice(0, 2);
}

// ─── RATING PAGE ──────────────────────────────────────────────────────────────

function RatingPage({ token }: { token: string }) {
  const [rating, setRating] = useState<FriendEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFriends("rating", "GET", undefined, token)
      .then(d => { if (d.rating) setRating(d.rating); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const top3 = rating.slice(0, 3);
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3.length === 2 ? [top3[1], top3[0]] : top3;

  return (
    <div className="p-4 space-y-6 animate-fade-in-up">
      <div>
        <h1 className="font-display font-black text-2xl text-white">Рейтинг</h1>
        <p className="text-white/50 text-sm">Среди твоих друзей</p>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="glass rounded-2xl h-16 animate-pulse" />)}</div>
      ) : rating.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center border border-violet-500/20">
          <div className="text-4xl mb-3">🏅</div>
          <h3 className="font-display font-bold text-white mb-2">Добавь друзей</h3>
          <p className="text-white/50 text-sm">Рейтинг появится, когда добавишь друзей в разделе «Друзья»</p>
        </div>
      ) : (
        <>
          {/* Podium */}
          {top3.length >= 2 && (
            <div className="glass rounded-3xl p-5">
              <div className="flex items-end justify-center gap-4">
                {podiumOrder.map((u, idx) => {
                  const isFirst = idx === 1 || (top3.length < 3 && idx === 1);
                  const actualRank = u.rank!;
                  return (
                    <div key={u.id} className={`flex flex-col items-center gap-2 ${isFirst ? "-translate-y-4" : ""}`}>
                      <div className={`${isFirst ? "text-4xl animate-float" : "text-3xl"}`}>{getAvatar(u.id)}</div>
                      <div className="text-white font-semibold text-xs text-center max-w-[72px] truncate">{u.name.split(" ")[0]}</div>
                      <div className={`text-xs ${isFirst ? "text-amber-400 font-semibold" : "text-white/50"}`}>{u.books_done} книг</div>
                      <div className={`rounded-2xl flex items-center justify-center ${
                        isFirst ? "w-20 h-20 grad-gold animate-pulse-glow" : "w-16 h-16 bg-white/10"
                      }`}>
                        <span className={`font-display font-black text-white ${isFirst ? "text-3xl" : "text-2xl opacity-60"}`}>
                          {actualRank}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Full list */}
          <div className="space-y-2">
            {rating.map((u) => (
              <div key={u.id} className={`rounded-2xl p-4 flex items-center gap-3 hover-lift ${u.is_me ? "grad-primary" : "glass"}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-display font-black text-sm ${
                  u.rank === 1 ? "bg-amber-400 text-white" : u.rank === 2 ? "bg-slate-400 text-white" : u.rank === 3 ? "bg-amber-700 text-white" : "bg-white/10 text-white/60"
                }`}>
                  {u.rank}
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/30 to-pink-500/30 flex items-center justify-center text-lg font-bold text-white flex-shrink-0">
                  {getInitials(u.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-sm flex items-center gap-1.5">
                    {u.name}
                    {u.is_me && <span className="text-white/60 text-xs font-normal">(ты)</span>}
                  </div>
                  <div className="text-white/50 text-xs">{u.class} класс</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-display font-bold text-white">{u.books_done}</div>
                  <div className="text-white/50 text-xs">книг</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── ADD FRIEND MODAL ─────────────────────────────────────────────────────────

function AddFriendModal({ token, onAdded, onClose }: {
  token: string; onAdded: () => void; onClose: () => void;
}) {
  const [friendId, setFriendId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleAdd = async () => {
    const id = friendId.trim().replace(/\D/g, "");
    if (!id) { setError("Введи ID друга"); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      const data = await apiFriends("add", "POST", { friend_user_id: parseInt(id) }, token);
      if (data.ok || data.already) {
        setSuccess(data.already ? `${data.name} уже в друзьях` : `${data.name} добавлен!`);
        setFriendId("");
        onAdded();
      } else {
        setError(data.error || "Ошибка");
      }
    } catch { setError("Нет соединения"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md glass-strong rounded-3xl p-6 space-y-4 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-white text-lg">Добавить друга</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><Icon name="X" size={20} /></button>
        </div>

        <div className="glass rounded-2xl p-4 flex items-start gap-3">
          <Icon name="Info" size={18} className="text-violet-400 flex-shrink-0 mt-0.5" />
          <p className="text-white/60 text-sm">Попроси друга открыть свой профиль и назвать ID — число под именем</p>
        </div>

        <div>
          <label className="text-white/60 text-xs font-medium mb-1.5 block">ID друга</label>
          <input
            value={friendId}
            onChange={e => setFriendId(e.target.value.replace(/\D/g, ""))}
            placeholder="Например: 42"
            inputMode="numeric"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xl font-display font-bold placeholder-white/20 focus:outline-none focus:border-violet-500/60 transition-colors"
            onKeyDown={e => e.key === "Enter" && handleAdd()}
          />
        </div>

        {error && <div className="bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-2.5 text-red-400 text-sm">{error}</div>}
        {success && <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl px-4 py-2.5 text-emerald-400 text-sm">✓ {success}</div>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 glass text-white/60 font-semibold py-3 rounded-xl">Закрыть</button>
          <button onClick={handleAdd} disabled={loading || !friendId}
            className="flex-1 grad-primary text-white font-bold py-3 rounded-xl disabled:opacity-40">
            {loading ? "Ищу..." : "Добавить"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── FRIENDS PAGE ─────────────────────────────────────────────────────────────

function FriendsPage({ token }: { token: string }) {
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const fetchFriends = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFriends("list", "GET", undefined, token);
      if (data.friends) setFriends(data.friends);
    } catch (_e) { /* ignore */ }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchFriends(); }, [fetchFriends]);

  const handleRemove = async (friendId: number) => {
    setRemovingId(friendId);
    await apiFriends("remove", "POST", { friend_user_id: friendId }, token);
    await fetchFriends();
    setRemovingId(null);
  };

  return (
    <div className="p-4 space-y-5 animate-fade-in-up">
      {showAdd && <AddFriendModal token={token} onAdded={fetchFriends} onClose={() => setShowAdd(false)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl text-white">Друзья</h1>
          <p className="text-white/50 text-sm">{loading ? "..." : `${friends.length} человек`}</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="grad-primary text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
          <Icon name="UserPlus" size={16} />
          Добавить
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="glass rounded-2xl h-20 animate-pulse" />)}</div>
      ) : friends.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center border border-violet-500/20">
          <div className="text-4xl mb-3">🤝</div>
          <h3 className="font-display font-bold text-white mb-2">Пока нет друзей</h3>
          <p className="text-white/50 text-sm mb-4">Добавь друга по его ID из профиля — читать вместе веселее!</p>
          <button onClick={() => setShowAdd(true)} className="grad-primary text-white font-semibold px-6 py-2.5 rounded-xl text-sm">
            Добавить первого друга
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {friends.map((friend, i) => (
            <div key={friend.id} className="glass rounded-2xl p-4 flex items-center gap-3 hover-lift"
              style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/30 to-pink-500/30 flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
                {getInitials(friend.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white truncate">{friend.name}</div>
                <div className="text-white/40 text-xs">{friend.class} класс · ID {friend.id}</div>
                <div className="flex gap-3 mt-1">
                  <span className="text-emerald-400 text-xs font-medium">{friend.books_done} прочитано</span>
                  <span className="text-white/30 text-xs">·</span>
                  <span className="text-white/40 text-xs">{friend.books_total} всего</span>
                </div>
              </div>
              <button
                onClick={() => handleRemove(friend.id)}
                disabled={removingId === friend.id}
                className="flex-shrink-0 glass w-9 h-9 rounded-xl flex items-center justify-center text-white/30 hover:text-red-400 transition-colors disabled:opacity-30">
                <Icon name={removingId === friend.id ? "Loader2" : "UserMinus"} size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Hint block */}
      {friends.length > 0 && (
        <div className="glass rounded-2xl p-4 flex items-start gap-3 border border-violet-500/15">
          <Icon name="Info" size={16} className="text-violet-400 flex-shrink-0 mt-0.5" />
          <p className="text-white/50 text-xs">Свой ID можно найти в разделе «Профиль» под именем. Поделись им с друзьями!</p>
        </div>
      )}
    </div>
  );
}

// ─── ID BADGE ────────────────────────────────────────────────────────────────

function IDbadge({ userId }: { userId: number }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(String(userId));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy}
      className="mt-2 flex items-center gap-2 glass rounded-xl px-3 py-1.5 transition-all hover:border-violet-500/40">
      <span className="text-white/50 text-xs">Мой ID:</span>
      <span className="font-display font-black text-white text-sm tracking-wide">#{userId}</span>
      <Icon name={copied ? "Check" : "Copy"} size={12} className={copied ? "text-emerald-400" : "text-white/40"} />
    </button>
  );
}

// ─── PROFILE PAGE ─────────────────────────────────────────────────────────────

function ProfilePage({ user, books, stats, onLogout }: {
  user: User; books: Book[]; stats: Stats; onLogout: () => void;
}) {
  const earnedBadges = BADGES.filter(b => b.require(stats.done, stats.total));
  const lockedBadges = BADGES.filter(b => !b.require(stats.done, stats.total));

  return (
    <div className="p-4 space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="relative rounded-3xl overflow-hidden">
        <div className="grad-primary p-6 pb-16">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display font-black text-2xl text-white">{user.name}</h1>
              <p className="text-white/70 text-sm">{user.class} класс</p>
              <IDbadge userId={user.user_id} />
            </div>
            <button onClick={onLogout} className="glass rounded-xl px-3 py-2 text-white/60 text-xs font-medium flex items-center gap-1.5">
              <Icon name="LogOut" size={14} />
              Выйти
            </button>
          </div>
        </div>
        <div className="absolute bottom-0 left-6 translate-y-1/2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-3xl animate-float border-4 border-background">
            📚
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="pt-6 grid grid-cols-4 gap-2">
        {[
          { val: String(stats.total), label: "Всего" },
          { val: String(stats.done), label: "Прочитано" },
          { val: String(stats.reading), label: "Читаю" },
          { val: String(earnedBadges.length), label: "Бейджей" },
        ].map(s => (
          <div key={s.label} className="glass rounded-xl p-3 text-center">
            <div className="font-display font-black text-lg text-white">{s.val}</div>
            <div className="text-white/50 text-xs">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Progress summary */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <h2 className="font-display font-bold text-white">Итог по книгам</h2>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
            <div className="font-display font-black text-2xl text-emerald-400">{stats.done}</div>
            <div className="text-white/60 text-xs">Книг прочитано</div>
          </div>
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3">
            <div className="font-display font-black text-2xl text-violet-400">{stats.total_pages_read.toLocaleString()}</div>
            <div className="text-white/60 text-xs">Страниц прочитано</div>
          </div>
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3">
            <div className="font-display font-black text-2xl text-cyan-400">{stats.reading}</div>
            <div className="text-white/60 text-xs">Читаю сейчас</div>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
            <div className="font-display font-black text-2xl text-amber-400">{stats.planned}</div>
            <div className="text-white/60 text-xs">В планах</div>
          </div>
        </div>

        {/* Books currently reading with progress */}
        {books.filter(b => b.status === "reading").length > 0 && (
          <div className="space-y-2">
            <div className="text-white/60 text-xs font-medium uppercase tracking-wider">Прогресс по текущим</div>
            {books.filter(b => b.status === "reading").map((book, bi) => (
              <div key={book.id} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-white text-sm truncate max-w-[200px]">{book.title}</span>
                  <span className="text-white/50 text-xs">{Math.round((book.pages_read / book.pages) * 100)}%</span>
                </div>
                <div className="progress-bar h-1.5">
                  <div className="progress-fill" style={{ width: `${Math.round((book.pages_read / book.pages) * 100)}%`, background: bi % 2 === 0 ? "var(--grad-primary)" : "var(--grad-cool)" }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Earned badges */}
      {earnedBadges.length > 0 && (
        <section>
          <h2 className="font-display font-bold text-white text-lg mb-3">
            Достижения <span className="text-violet-400">{earnedBadges.length}</span>
          </h2>
          <div className="grid grid-cols-4 gap-3">
            {earnedBadges.map(b => (
              <div key={b.id} className={`rounded-2xl p-3 bg-gradient-to-br ${rarityStyle[b.rarity]} badge-shine text-center hover-lift`}>
                <div className="text-2xl mb-1 animate-float">{b.emoji}</div>
                <div className="text-white text-xs font-semibold leading-tight">{b.name}</div>
                <div className="text-white/60 text-xs mt-0.5">{rarityLabel[b.rarity]}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Locked badges */}
      {lockedBadges.length > 0 && (
        <section>
          <h2 className="font-display font-bold text-white/50 text-lg mb-3">
            Заблокировано <span className="text-white/30">{lockedBadges.length}</span>
          </h2>
          <div className="grid grid-cols-4 gap-3">
            {lockedBadges.map(b => (
              <div key={b.id} className="rounded-2xl p-3 bg-white/5 text-center relative overflow-hidden">
                <div className="text-2xl mb-1 opacity-30">{b.emoji}</div>
                <div className="text-white/30 text-xs font-semibold leading-tight">{b.name}</div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Icon name="Lock" size={20} className="text-white/15" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Activity graph */}
      <section className="glass rounded-2xl p-5">
        <h2 className="font-display font-bold text-white mb-4">Активность</h2>
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 35 }).map((_, i) => {
            const vals = [0.8,0.2,0.9,0.0,0.5,0.7,0.1,0.6,0.3,0.8,0.9,0.4,0.0,0.7,0.2,0.8,0.5,0.9,0.3,0.6,0.1,0.7,0.4,0.8,0.0,0.9,0.5,0.3,0.7,0.2,0.8,0.6,0.9,0.1,0.4];
            const v = vals[i] ?? 0;
            const bg = v > 0.7 ? "bg-violet-500" : v > 0.4 ? "bg-violet-500/50" : v > 0.1 ? "bg-violet-500/20" : "bg-white/5";
            return <div key={i} className={`h-6 rounded-sm ${bg} hover:scale-110 transition-transform`} />;
          })}
        </div>
        <div className="flex items-center gap-2 mt-3 text-white/30 text-xs">
          <span>Менее</span>
          <div className="flex gap-1">
            {["bg-white/5","bg-violet-500/20","bg-violet-500/50","bg-violet-500"].map(c => (
              <div key={c} className={`w-3 h-3 rounded-sm ${c}`} />
            ))}
          </div>
          <span>Больше</span>
        </div>
      </section>
    </div>
  );
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────

const NAV_ITEMS: { id: Page; label: string; icon: string }[] = [
  { id: "home", label: "Главная", icon: "Home" },
  { id: "challenges", label: "Челленджи", icon: "Zap" },
  { id: "books", label: "Книги", icon: "BookOpen" },
  { id: "rating", label: "Рейтинг", icon: "Trophy" },
  { id: "friends", label: "Друзья", icon: "Users" },
  { id: "profile", label: "Профиль", icon: "User" },
];

function BottomNav({ active, setPage }: { active: Page; setPage: (p: Page) => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-white/5">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => setPage(item.id)}
            className={`flex flex-col items-center gap-1 py-1.5 px-2 rounded-xl transition-all ${active === item.id ? "text-white" : "text-white/35 hover:text-white/60"}`}>
            <div className={`relative p-1.5 rounded-xl transition-all ${active === item.id ? "grad-primary" : ""}`}>
              <Icon name={item.icon} size={18} />
            </div>
            <span className="text-xs font-medium leading-none">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [user, setUser] = useState<User | null>(() => {
    try { return JSON.parse(localStorage.getItem("rc_user") || "null"); } catch { return null; }
  });
  const [books, setBooks] = useState<Book[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, done: 0, reading: 0, planned: 0, total_pages_read: 0 });
  const [loadingBooks, setLoadingBooks] = useState(false);

  const fetchBooks = useCallback(async () => {
    if (!user) return;
    setLoadingBooks(true);
    try {
      const data = await apiBooks("", "GET", undefined, user.token);
      if (data.books) { setBooks(data.books); setStats(data.stats); }
    } catch (_e) { /* network error */ }
    finally { setLoadingBooks(false); }
  }, [user]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const handleAuth = (u: User) => setUser(u);

  const handleLogout = () => {
    localStorage.removeItem("rc_token");
    localStorage.removeItem("rc_user");
    setUser(null);
    setBooks([]);
    setStats({ total: 0, done: 0, reading: 0, planned: 0, total_pages_read: 0 });
  };

  if (!user) return <RegisterScreen onAuth={handleAuth} />;

  const renderPage = () => {
    switch (page) {
      case "home": return <HomePage user={user} books={books} stats={stats} loading={loadingBooks} setPage={setPage} token={user.token} onRefresh={fetchBooks} />;
      case "challenges": return <ChallengesPage token={user.token} />;
      case "books": return <BooksPage books={books} stats={stats} loading={loadingBooks} token={user.token} onRefresh={fetchBooks} />;
      case "rating": return <RatingPage token={user.token} />;
      case "friends": return <FriendsPage token={user.token} />;
      case "profile": return <ProfilePage user={user} books={books} stats={stats} onLogout={handleLogout} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto pb-24">{renderPage()}</div>
      <BottomNav active={page} setPage={setPage} />
    </div>
  );
}