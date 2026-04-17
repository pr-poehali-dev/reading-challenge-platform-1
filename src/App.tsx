import { useState } from "react";
import Icon from "@/components/ui/icon";

// ─── DATA ───────────────────────────────────────────────────────────────────

const BADGES = [
  { id: 1, emoji: "📚", name: "Первая книга", desc: "Прочитана 1 книга", earned: true, rarity: "common" },
  { id: 2, emoji: "🔥", name: "10 книг!", desc: "Прочитано 10 книг", earned: true, rarity: "rare" },
  { id: 3, emoji: "⚡", name: "Скорочтец", desc: "5 книг за месяц", earned: true, rarity: "epic" },
  { id: 4, emoji: "🏆", name: "Чемпион", desc: "1 место в рейтинге", earned: false, rarity: "legendary" },
  { id: 5, emoji: "🌙", name: "Ночной читатель", desc: "Читал после 23:00", earned: true, rarity: "common" },
  { id: 6, emoji: "🎯", name: "Снайпер", desc: "30-дневная серия", earned: false, rarity: "epic" },
  { id: 7, emoji: "🦋", name: "Трансформация", desc: "3 разных жанра", earned: true, rarity: "rare" },
  { id: 8, emoji: "💎", name: "Легенда", desc: "50 книг за год", earned: false, rarity: "legendary" },
];

const CHALLENGES = [
  { id: 1, title: "Майский марафон", books: 5, done: 3, days: 14, emoji: "🌸", color: "from-pink-500 to-rose-500", participants: 234 },
  { id: 2, title: "Классика навсегда", books: 3, done: 1, days: 30, emoji: "📖", color: "from-violet-500 to-purple-600", participants: 156 },
  { id: 3, title: "Фантастический апрель", books: 4, done: 4, days: 0, emoji: "🚀", color: "from-cyan-500 to-blue-600", participants: 89, completed: true },
  { id: 4, title: "Нон-фикшн неделя", books: 2, done: 0, days: 7, emoji: "🧠", color: "from-orange-500 to-amber-500", participants: 312 },
];

const MY_BOOKS = [
  { id: 1, title: "Мастер и Маргарита", author: "М. Булгаков", pages: 480, read: 480, status: "done", cover: "📕", genre: "Классика", rating: 5 },
  { id: 2, title: "Дюна", author: "Ф. Херберт", pages: 688, read: 320, status: "reading", cover: "📘", genre: "Фантастика", rating: null },
  { id: 3, title: "Атомные привычки", author: "Дж. Клир", pages: 320, read: 0, status: "planned", cover: "📗", genre: "Саморазвитие", rating: null },
  { id: 4, title: "1984", author: "Дж. Оруэлл", pages: 328, read: 328, status: "done", cover: "📙", genre: "Антиутопия", rating: 5 },
  { id: 5, title: "Гарри Поттер и ФК", author: "Дж. Роулинг", pages: 636, read: 636, status: "done", cover: "📒", genre: "Фэнтези", rating: 4 },
  { id: 6, title: "Краткие ответы", author: "С. Хокинг", pages: 256, read: 100, status: "reading", cover: "📓", genre: "Наука", rating: null },
];

const RATING = [
  { rank: 1, name: "Александра К.", avatar: "👑", books: 47, streak: 92, points: 4720 },
  { rank: 2, name: "Михаил В.", avatar: "🥈", books: 38, streak: 45, points: 3950 },
  { rank: 3, name: "Дарья П.", avatar: "🥉", books: 31, streak: 67, points: 3210 },
  { rank: 4, name: "Иван С.", avatar: "📚", books: 27, streak: 22, points: 2830 },
  { rank: 5, name: "Ты", avatar: "⭐", books: 23, streak: 15, points: 2340, isMe: true },
  { rank: 6, name: "Елена М.", avatar: "🌟", books: 21, streak: 31, points: 2180 },
  { rank: 7, name: "Олег Т.", avatar: "📖", books: 19, streak: 8, points: 1970 },
];

const FRIENDS = [
  { id: 1, name: "Маша Иванова", avatar: "🌸", books: 18, streak: 12, status: "Читает: Война и мир", online: true },
  { id: 2, name: "Петя Сидоров", avatar: "🎮", books: 9, streak: 5, status: "Последний онлайн: вчера", online: false },
  { id: 3, name: "Аня Козлова", avatar: "🦋", books: 31, streak: 40, status: "Завершила челлендж!", online: true },
  { id: 4, name: "Дима Новиков", avatar: "🚀", books: 14, streak: 7, status: "Читает: Дюна", online: false },
];

// ─── TYPES ──────────────────────────────────────────────────────────────────

type Page = "home" | "challenges" | "books" | "rating" | "friends" | "profile";

// ─── NAV ────────────────────────────────────────────────────────────────────

const NAV_ITEMS: { id: Page; label: string; icon: string }[] = [
  { id: "home", label: "Главная", icon: "Home" },
  { id: "challenges", label: "Челленджи", icon: "Zap" },
  { id: "books", label: "Книги", icon: "BookOpen" },
  { id: "rating", label: "Рейтинг", icon: "Trophy" },
  { id: "friends", label: "Друзья", icon: "Users" },
  { id: "profile", label: "Профиль", icon: "User" },
];

// ─── RARITY COLORS ──────────────────────────────────────────────────────────

const rarityStyle: Record<string, string> = {
  common: "from-slate-500 to-slate-600",
  rare: "from-blue-500 to-cyan-500",
  epic: "from-violet-500 to-purple-600",
  legendary: "from-amber-400 to-orange-500",
};
const rarityLabel: Record<string, string> = {
  common: "Обычный",
  rare: "Редкий",
  epic: "Эпический",
  legendary: "Легендарный",
};

// ─── HOME PAGE ───────────────────────────────────────────────────────────────

function HomePage({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <div className="p-4 space-y-6 animate-fade-in-up">
      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden p-6 grad-primary">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full translate-y-10 -translate-x-10" />
        <div className="relative">
          <div className="text-white/70 text-sm font-medium mb-1">Привет, Алексей 👋</div>
          <h1 className="font-display text-2xl font-black text-white mb-3 leading-tight">
            Читай.<br />Побеждай.<br />Расти.
          </h1>
          <div className="flex items-center gap-3">
            <div className="glass rounded-2xl px-4 py-2 text-white text-sm font-semibold">
              🔥 15 дней подряд
            </div>
            <div className="glass rounded-2xl px-4 py-2 text-white text-sm font-semibold">
              📚 23 книги
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { val: "23", label: "Книг прочитано", icon: "BookOpen", grad: "from-violet-500/20 to-purple-600/20", border: "border-violet-500/30" },
          { val: "4", label: "Активных чел.", icon: "Zap", grad: "from-pink-500/20 to-rose-500/20", border: "border-pink-500/30" },
          { val: "7", label: "Достижений", icon: "Award", grad: "from-amber-500/20 to-orange-500/20", border: "border-amber-500/30" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl p-3 bg-gradient-to-br ${s.grad} border ${s.border} text-center`}>
            <Icon name={s.icon} size={20} className="mx-auto mb-1 text-white/80" />
            <div className="font-display font-black text-xl text-white">{s.val}</div>
            <div className="text-white/50 text-xs leading-tight">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Active challenges */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-white text-lg">Активные челленджи</h2>
          <button onClick={() => setPage("challenges")} className="text-violet-400 text-sm font-medium">Все →</button>
        </div>
        <div className="space-y-3">
          {CHALLENGES.filter(c => !c.completed).slice(0, 2).map(ch => (
            <div key={ch.id} className="glass rounded-2xl p-4 hover-lift">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${ch.color} flex items-center justify-center text-xl`}>
                    {ch.emoji}
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">{ch.title}</div>
                    <div className="text-white/40 text-xs">{ch.participants} участников</div>
                  </div>
                </div>
                <div className="text-white/60 text-xs">{ch.days} дн.</div>
              </div>
              <div className="progress-bar h-2">
                <div className="progress-fill" style={{ width: `${(ch.done / ch.books) * 100}%` }} />
              </div>
              <div className="mt-1.5 text-white/40 text-xs">{ch.done} из {ch.books} книг</div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent badges */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-white text-lg">Последние достижения</h2>
          <button onClick={() => setPage("profile")} className="text-violet-400 text-sm font-medium">Все →</button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {BADGES.filter(b => b.earned).slice(0, 5).map(b => (
            <div key={b.id} className={`flex-shrink-0 w-20 rounded-2xl p-3 bg-gradient-to-br ${rarityStyle[b.rarity]} badge-shine text-center`}>
              <div className="text-2xl mb-1 animate-float">{b.emoji}</div>
              <div className="text-white text-xs font-semibold leading-tight">{b.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Currently reading */}
      <section>
        <h2 className="font-display font-bold text-white text-lg mb-3">Сейчас читаю</h2>
        {MY_BOOKS.filter(b => b.status === "reading").map(book => (
          <div key={book.id} className="glass rounded-2xl p-4 flex items-center gap-4 hover-lift mb-3">
            <div className="text-4xl animate-float">{book.cover}</div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white truncate">{book.title}</div>
              <div className="text-white/50 text-sm">{book.author}</div>
              <div className="mt-2 progress-bar h-1.5">
                <div className="progress-fill" style={{ width: `${(book.read / book.pages) * 100}%` }} />
              </div>
              <div className="mt-1 text-white/40 text-xs">{book.read} из {book.pages} стр.</div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

// ─── CHALLENGES PAGE ─────────────────────────────────────────────────────────

function ChallengesPage() {
  const [tab, setTab] = useState<"active" | "done">("active");

  return (
    <div className="p-4 space-y-6 animate-fade-in-up">
      <div>
        <h1 className="font-display font-black text-2xl text-white">Челленджи</h1>
        <p className="text-white/50 text-sm mt-1">Соревнуйся и побеждай</p>
      </div>

      {/* Tabs */}
      <div className="glass rounded-2xl p-1 flex">
        {(["active", "done"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${tab === t ? "grad-primary text-white" : "text-white/40"}`}
          >
            {t === "active" ? "Активные" : "Завершённые"}
          </button>
        ))}
      </div>

      {/* Challenge cards */}
      <div className="space-y-4">
        {CHALLENGES.filter(c => tab === "active" ? !c.completed : c.completed).map((ch, i) => (
          <div
            key={ch.id}
            className="glass rounded-3xl overflow-hidden hover-lift"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className={`bg-gradient-to-r ${ch.color} p-5`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{ch.emoji}</span>
                  <div>
                    <h3 className="font-display font-bold text-white text-lg">{ch.title}</h3>
                    <p className="text-white/70 text-sm">{ch.participants} участников</p>
                  </div>
                </div>
                {ch.completed && (
                  <div className="glass rounded-xl px-3 py-1.5 text-white text-xs font-bold">✓ Выполнен</div>
                )}
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/60 text-sm">Прогресс: {ch.done}/{ch.books} книг</span>
                {!ch.completed && <span className="text-amber-400 text-sm font-semibold">⏰ {ch.days} дней</span>}
              </div>
              <div className="progress-bar h-3">
                <div className="progress-fill" style={{ width: `${(ch.done / ch.books) * 100}%` }} />
              </div>
              <div className="mt-4 flex gap-2">
                <button className="flex-1 grad-primary text-white font-semibold py-2.5 rounded-xl text-sm transition-opacity hover:opacity-90">
                  {ch.completed ? "Смотреть результат" : "Добавить книгу"}
                </button>
                {!ch.completed && (
                  <button className="glass text-white/60 px-4 py-2.5 rounded-xl text-sm">
                    Поделиться
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Join new challenge */}
      {tab === "active" && (
        <button className="w-full glass rounded-2xl p-4 border-2 border-dashed border-violet-500/30 flex items-center justify-center gap-3 text-violet-400 font-semibold hover:border-violet-500/60 transition-colors">
          <Icon name="Plus" size={20} />
          Присоединиться к новому челленджу
        </button>
      )}
    </div>
  );
}

// ─── BOOKS PAGE ───────────────────────────────────────────────────────────────

function BooksPage() {
  const [filter, setFilter] = useState<"all" | "reading" | "done" | "planned">("all");

  const filtered = filter === "all" ? MY_BOOKS : MY_BOOKS.filter(b => b.status === filter);

  const statusLabels: Record<string, string> = {
    all: "Все", reading: "Читаю", done: "Прочитано", planned: "Планирую"
  };
  const statusDots: Record<string, string> = {
    reading: "bg-cyan-400",
    done: "bg-emerald-400",
    planned: "bg-amber-400",
  };
  const statusColors: Record<string, string> = {
    reading: "text-cyan-400",
    done: "text-emerald-400",
    planned: "text-amber-400",
  };
  const statusText: Record<string, string> = {
    reading: "Читаю",
    done: "Прочитано",
    planned: "Позже",
  };

  return (
    <div className="p-4 space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl text-white">Мои книги</h1>
          <p className="text-white/50 text-sm">{MY_BOOKS.length} книг в библиотеке</p>
        </div>
        <button className="grad-primary text-white w-10 h-10 rounded-xl flex items-center justify-center">
          <Icon name="Plus" size={18} />
        </button>
      </div>

      {/* Stats mini */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Читаю", count: MY_BOOKS.filter(b => b.status === "reading").length, color: "text-cyan-400" },
          { label: "Прочитано", count: MY_BOOKS.filter(b => b.status === "done").length, color: "text-emerald-400" },
          { label: "Планирую", count: MY_BOOKS.filter(b => b.status === "planned").length, color: "text-amber-400" },
        ].map(s => (
          <div key={s.label} className="glass rounded-xl p-3 text-center">
            <div className={`font-display font-black text-xl ${s.color}`}>{s.count}</div>
            <div className="text-white/50 text-xs">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(["all", "reading", "done", "planned"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filter === f ? "grad-primary text-white" : "glass text-white/60"}`}
          >
            {statusLabels[f]}
          </button>
        ))}
      </div>

      {/* Book list */}
      <div className="space-y-3">
        {filtered.map((book, i) => (
          <div key={book.id} className="glass rounded-2xl p-4 flex gap-4 hover-lift" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="text-4xl animate-float">{book.cover}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-white truncate">{book.title}</div>
                  <div className="text-white/50 text-sm">{book.author}</div>
                </div>
                <div className="flex-shrink-0 flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${statusDots[book.status]}`} />
                  <span className={`text-xs font-medium ${statusColors[book.status]}`}>
                    {statusText[book.status]}
                  </span>
                </div>
              </div>
              {book.status === "reading" && (
                <>
                  <div className="mt-2 progress-bar h-1.5">
                    <div className="progress-fill" style={{ width: `${(book.read / book.pages) * 100}%` }} />
                  </div>
                  <div className="mt-1 text-white/40 text-xs">{Math.round((book.read / book.pages) * 100)}% прочитано</div>
                </>
              )}
              {book.status === "done" && book.rating && (
                <div className="mt-1.5 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, ri) => (
                    <span key={ri} className={ri < book.rating! ? "text-amber-400" : "text-white/20"}>★</span>
                  ))}
                </div>
              )}
              <div className="mt-1 flex gap-2">
                <span className="text-white/30 text-xs">{book.genre}</span>
                <span className="text-white/30 text-xs">·</span>
                <span className="text-white/30 text-xs">{book.pages} стр.</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── RATING PAGE ─────────────────────────────────────────────────────────────

function RatingPage() {
  return (
    <div className="p-4 space-y-6 animate-fade-in-up">
      <div>
        <h1 className="font-display font-black text-2xl text-white">Рейтинг</h1>
        <p className="text-white/50 text-sm">Апрель 2026</p>
      </div>

      {/* Top 3 podium */}
      <div className="glass rounded-3xl p-5">
        <div className="flex items-end justify-center gap-4">
          {/* 2nd */}
          <div className="flex flex-col items-center gap-2">
            <div className="text-3xl">{RATING[1].avatar}</div>
            <div className="text-white font-semibold text-sm text-center">{RATING[1].name}</div>
            <div className="text-white/50 text-xs">{RATING[1].books} книг</div>
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
              <span className="font-display font-black text-2xl text-white/60">2</span>
            </div>
          </div>
          {/* 1st */}
          <div className="flex flex-col items-center gap-2 -translate-y-4">
            <div className="animate-float text-4xl">{RATING[0].avatar}</div>
            <div className="text-white font-bold text-sm text-center">{RATING[0].name}</div>
            <div className="text-amber-400 text-xs font-semibold">{RATING[0].books} книг</div>
            <div className="w-20 h-20 rounded-2xl grad-gold flex items-center justify-center animate-pulse-glow">
              <span className="font-display font-black text-3xl text-white">1</span>
            </div>
          </div>
          {/* 3rd */}
          <div className="flex flex-col items-center gap-2">
            <div className="text-3xl">{RATING[2].avatar}</div>
            <div className="text-white font-semibold text-sm text-center">{RATING[2].name}</div>
            <div className="text-white/50 text-xs">{RATING[2].books} книг</div>
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center">
              <span className="font-display font-black text-xl text-amber-500/60">3</span>
            </div>
          </div>
        </div>
      </div>

      {/* Full list */}
      <div className="space-y-2">
        {RATING.map((user, i) => (
          <div
            key={user.rank}
            className={`rounded-2xl p-4 flex items-center gap-3 hover-lift ${user.isMe ? "grad-primary" : "glass"}`}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-display font-black text-sm ${
              user.rank === 1 ? "bg-amber-400 text-white" : "bg-white/10 text-white/60"
            }`}>
              {user.rank}
            </div>
            <div className="text-2xl">{user.avatar}</div>
            <div className="flex-1">
              <div className="font-semibold text-white text-sm">{user.name}</div>
              <div className="text-white/50 text-xs">🔥 {user.streak} дней · {user.books} книг</div>
            </div>
            <div className="text-right">
              <div className="font-display font-bold text-white">{user.points.toLocaleString()}</div>
              <div className="text-white/50 text-xs">очков</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── FRIENDS PAGE ─────────────────────────────────────────────────────────────

function FriendsPage() {
  return (
    <div className="p-4 space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl text-white">Друзья</h1>
          <p className="text-white/50 text-sm">{FRIENDS.length} друга читают</p>
        </div>
        <button className="grad-primary text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
          <Icon name="UserPlus" size={16} />
          Добавить
        </button>
      </div>

      {/* Online */}
      <div>
        <h2 className="font-semibold text-white/60 text-sm mb-3 uppercase tracking-wider">Онлайн сейчас</h2>
        <div className="space-y-3">
          {FRIENDS.filter(f => f.online).map((friend, i) => (
            <div key={friend.id} className="glass rounded-2xl p-4 flex items-center gap-3 hover-lift" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/30 to-pink-500/30 flex items-center justify-center text-2xl">{friend.avatar}</div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-background" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-white">{friend.name}</div>
                <div className="text-emerald-400 text-xs">{friend.status}</div>
              </div>
              <div className="text-right">
                <div className="text-white font-semibold">{friend.books}</div>
                <div className="text-white/40 text-xs">книг</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Offline */}
      <div>
        <h2 className="font-semibold text-white/60 text-sm mb-3 uppercase tracking-wider">Были недавно</h2>
        <div className="space-y-3">
          {FRIENDS.filter(f => !f.online).map((friend, i) => (
            <div key={friend.id} className="glass rounded-2xl p-4 flex items-center gap-3 opacity-70" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center text-2xl">{friend.avatar}</div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-white/20 rounded-full border-2 border-background" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-white">{friend.name}</div>
                <div className="text-white/40 text-xs">{friend.status}</div>
              </div>
              <div className="text-right">
                <div className="text-white font-semibold">{friend.books}</div>
                <div className="text-white/40 text-xs">книг</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite */}
      <div className="glass rounded-2xl p-5 text-center border border-violet-500/20">
        <div className="text-3xl mb-2">🤝</div>
        <h3 className="font-display font-bold text-white mb-1">Позови друзей!</h3>
        <p className="text-white/50 text-sm mb-4">Читать вместе веселее. Пригласи друга и получи 100 очков.</p>
        <button className="grad-primary text-white font-semibold px-6 py-2.5 rounded-xl text-sm w-full">
          Отправить приглашение
        </button>
      </div>
    </div>
  );
}

// ─── PROFILE PAGE ─────────────────────────────────────────────────────────────

function ProfilePage() {
  const earnedBadges = BADGES.filter(b => b.earned);
  const notEarnedBadges = BADGES.filter(b => !b.earned);

  return (
    <div className="p-4 space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="relative rounded-3xl overflow-hidden">
        <div className="grad-primary p-6 pb-16">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display font-black text-2xl text-white">Алексей М.</h1>
              <p className="text-white/70 text-sm">Читатель с марта 2024</p>
            </div>
            <button className="glass rounded-xl p-2">
              <Icon name="Settings" size={18} className="text-white/60" />
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
          { val: "23", label: "Книг" },
          { val: "2340", label: "Очков" },
          { val: "15", label: "Серия" },
          { val: "7", label: "Бейджей" },
        ].map(s => (
          <div key={s.label} className="glass rounded-xl p-3 text-center">
            <div className="font-display font-black text-lg text-white">{s.val}</div>
            <div className="text-white/50 text-xs">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Year progress */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-white">Цель на год</h2>
          <span className="text-violet-400 font-semibold">23 / 50</span>
        </div>
        <div className="progress-bar h-3">
          <div className="progress-fill" style={{ width: "46%" }} />
        </div>
        <p className="text-white/40 text-sm mt-2">46% выполнено · осталось 27 книг</p>
      </div>

      {/* Earned badges */}
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

      {/* Locked badges */}
      <section>
        <h2 className="font-display font-bold text-white/50 text-lg mb-3">
          Заблокировано <span className="text-white/30">{notEarnedBadges.length}</span>
        </h2>
        <div className="grid grid-cols-4 gap-3">
          {notEarnedBadges.map(b => (
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

      {/* Activity graph */}
      <section className="glass rounded-2xl p-5">
        <h2 className="font-display font-bold text-white mb-4">Активность</h2>
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 35 }).map((_, i) => {
            const vals = [0.8, 0.2, 0.9, 0.0, 0.5, 0.7, 0.1, 0.6, 0.3, 0.8, 0.9, 0.4, 0.0, 0.7, 0.2, 0.8, 0.5, 0.9, 0.3, 0.6, 0.1, 0.7, 0.4, 0.8, 0.0, 0.9, 0.5, 0.3, 0.7, 0.2, 0.8, 0.6, 0.9, 0.1, 0.4];
            const v = vals[i] ?? 0;
            const bg = v > 0.7 ? "bg-violet-500" : v > 0.4 ? "bg-violet-500/50" : v > 0.1 ? "bg-violet-500/20" : "bg-white/5";
            return <div key={i} className={`h-6 rounded-sm ${bg} transition-all hover:scale-110`} />;
          })}
        </div>
        <div className="flex items-center gap-2 mt-3 text-white/30 text-xs">
          <span>Менее</span>
          <div className="flex gap-1">
            {["bg-white/5", "bg-violet-500/20", "bg-violet-500/50", "bg-violet-500"].map(c => (
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

function BottomNav({ active, setPage }: { active: Page; setPage: (p: Page) => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-white/5">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            className={`flex flex-col items-center gap-1 py-1.5 px-2 rounded-xl transition-all ${
              active === item.id ? "text-white" : "text-white/35 hover:text-white/60"
            }`}
          >
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

  const renderPage = () => {
    switch (page) {
      case "home": return <HomePage setPage={setPage} />;
      case "challenges": return <ChallengesPage />;
      case "books": return <BooksPage />;
      case "rating": return <RatingPage />;
      case "friends": return <FriendsPage />;
      case "profile": return <ProfilePage />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto pb-24">
        {renderPage()}
      </div>
      <BottomNav active={page} setPage={setPage} />
    </div>
  );
}
