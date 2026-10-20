import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Bookmark,
  BookOpen,
  Sparkles,
  Heart,
  ArrowUpRight,
  LoaderCircle,
  X,
  LibraryBig,
} from "lucide-react";

const DEMO_BOOKS = [
  {
    googleBookId: "demo-atomic-habits",
    title: "Atomic Habits",
    authors: ["James Clear"],
    thumbnail: "",
    rating: 4.8,
    infoLink: "",
  },
  {
    googleBookId: "demo-psychology-money",
    title: "The Psychology of Money",
    authors: ["Morgan Housel"],
    thumbnail: "",
    rating: 4.7,
    infoLink: "",
  },
  {
    googleBookId: "demo-clean-code",
    title: "Clean Code",
    authors: ["Robert C. Martin"],
    thumbnail: "",
    rating: 4.6,
    infoLink: "",
  },
  {
    googleBookId: "demo-design-everyday",
    title: "The Design of Everyday Things",
    authors: ["Don Norman"],
    thumbnail: "",
    rating: 4.5,
    infoLink: "",
  },
];

function Stars({ rating }) {
  if (rating == null)
    return <span className="no-rating">Belum ada rating</span>;
  const rounded = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span className="rating" aria-label={`Rating ${rating} dari 5`}>
      <span className="stars">
        {"★".repeat(rounded)}
        <span className="empty-stars">{"★".repeat(5 - rounded)}</span>
      </span>
      <span className="rating-number">{rating.toFixed(1)}</span>
    </span>
  );
}

function BookCard({ book, saved, onToggle }) {
  return (
    <article className="book-card">
      <div className="cover-wrap">
        {book.thumbnail ? (
          <img
            className="book-cover"
            src={book.thumbnail}
            alt={`Sampul ${book.title}`}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none";
              event.currentTarget.nextElementSibling.style.display = "flex";
            }}
          />
        ) : null}
        <div
          className="cover-fallback"
          style={{ display: book.thumbnail ? "none" : "flex" }}
        >
          <BookOpen size={34} />
          <span>BOOK COVER</span>
        </div>
        <button
          className={`save-button ${saved ? "is-saved" : ""}`}
          onClick={() => onToggle(book)}
          aria-label={saved ? "Hapus dari wishlist" : "Simpan ke wishlist"}
          title={saved ? "Hapus dari wishlist" : "Simpan ke wishlist"}
        >
          <Heart size={18} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="book-info">
        <div className="book-meta">
          <span>BOOK</span>
          {book.rating != null && (
            <span className="rating-chip">★ {book.rating.toFixed(1)}</span>
          )}
        </div>
        <h3 className="book-title" title={book.title}>
          {book.title}
        </h3>
        <p className="book-author">
          {book.authors?.length
            ? book.authors.join(", ")
            : "Penulis tidak diketahui"}
        </p>
        <div className="book-bottom">
          <Stars rating={book.rating} />
          {book.infoLink && (
            <a
              href={book.infoLink}
              target="_blank"
              rel="noreferrer"
              className="preview-link"
              aria-label="Lihat detail buku"
            >
              <ArrowUpRight size={16} />
            </a>
          )}
        </div>
        <button
          className={`wishlist-link ${saved ? "saved" : ""}`}
          onClick={() => onToggle(book)}
        >
          {saved ? (
            <>
              <Bookmark size={15} fill="currentColor" /> Tersimpan
            </>
          ) : (
            <>
              <Bookmark size={15} /> Tambah ke wishlist
            </>
          )}
        </button>
      </div>
    </article>
  );
}

export default function App() {
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [books, setBooks] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [page, setPage] = useState("search");
  const [loading, setLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const savedIds = useMemo(
    () => new Set(wishlist.map((book) => book.googleBookId)),
    [wishlist],
  );

  async function loadWishlist() {
    setWishlistLoading(true);
    try {
      const response = await fetch("/api/wishlist");
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Wishlist gagal dimuat.");
      setWishlist(data.books || []);
    } catch (err) {
      setError(err.message || "Tidak dapat terhubung ke server.");
    } finally {
      setWishlistLoading(false);
    }
  }

  useEffect(() => {
    loadWishlist();
  }, []);

  async function searchBooks(event, term = query) {
    event?.preventDefault();
    const clean = term.trim();
    if (!clean) {
      setError("Masukkan judul buku, penulis, atau kata kunci.");
      return;
    }
    setLoading(true);
    setError("");
    setNotice("");
    setPage("search");
    setActiveQuery(clean);
    try {
      const response = await fetch(`/api/books?q=${encodeURIComponent(clean)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Pencarian gagal.");
      setBooks(data.books || []);
    } catch (err) {
      console.error("Pencarian Google Books gagal:", err.message);

      const keyword = clean.toLowerCase();

      const matchedBooks = DEMO_BOOKS.filter((book) => {
        const searchableText = [book.title, ...book.authors]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(keyword);
      });

      setBooks(matchedBooks.length ? matchedBooks : DEMO_BOOKS);

      setNotice(
        "Mode demo aktif: Google Books API sedang tidak tersedia. Buku yang ditampilkan adalah data contoh.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function toggleWishlist(book) {
    const alreadySaved = savedIds.has(book.googleBookId);
    setNotice("");
    setError("");
    try {
      const response = await fetch(
        alreadySaved
          ? `/api/wishlist/${encodeURIComponent(book.googleBookId)}`
          : "/api/wishlist",
        {
          method: alreadySaved ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
          ...(alreadySaved ? {} : { body: JSON.stringify(book) }),
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Wishlist gagal diperbarui.");
      setWishlist((current) =>
        alreadySaved
          ? current.filter((item) => item.googleBookId !== book.googleBookId)
          : [
              data.book,
              ...current.filter(
                (item) => item.googleBookId !== book.googleBookId,
              ),
            ],
      );
      setNotice(
        alreadySaved
          ? "Buku dihapus dari wishlist."
          : "Buku berhasil disimpan ke wishlist.",
      );
    } catch (err) {
      setError(err.message || "Wishlist gagal diperbarui.");
    }
  }

  const shownBooks = page === "wishlist" ? wishlist : books;

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" onClick={() => setPage("search")}>
          <span className="brand-mark">
            <BookOpen size={22} />
          </span>
          <span>
            bookly<span className="brand-dot">.</span>
            <small>YOUR NEXT CHAPTER</small>
          </span>
        </a>
        <nav className="nav-links">
          <button
            className={page === "search" ? "nav-item active" : "nav-item"}
            onClick={() => setPage("search")}
          >
            Explore books
          </button>
          <button
            className={page === "wishlist" ? "nav-item active" : "nav-item"}
            onClick={() => setPage("wishlist")}
          >
            <Bookmark size={16} /> My wishlist{" "}
            <span className="nav-count">{wishlist.length}</span>
          </button>
        </nav>
        <div className="topbar-note">
          <span className="live-dot" /> YOUR PERSONAL LIBRARY
        </div>
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="hero-copy">
            <div className="eyebrow">
              <Sparkles size={14} /> A LITTLE INSPIRATION GOES A LONG WAY
            </div>
            <h1>
              Find your next
              <br />
              <span>great read.</span>
            </h1>
            <p>
              Discover stories, ideas, and new perspectives.
              <br className="desktop-break" /> Your next favorite book is just a
              search away.
            </p>
            <form
              className="search-form"
              onSubmit={(event) => searchBooks(event)}
            >
              <Search size={20} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by title, author, or keyword..."
                aria-label="Cari buku"
              />
              <button type="submit" disabled={loading}>
                {loading ? (
                  <LoaderCircle className="spin" size={18} />
                ) : (
                  "Search books"
                )}
              </button>
            </form>
            <div className="popular-searches">
              <span>TRY SEARCHING</span>
              {["Atomic Habits", "Design", "Psychology"].map((term) => (
                <button
                  key={term}
                  onClick={() => {
                    setQuery(term);
                    searchBooks(null, term);
                  }}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="art-spark spark-one">✳</div>
            <div className="art-spark spark-two">✦</div>
            <div className="art-book book-back">
              <div className="fake-lines" />
              <span>
                THE ART OF
                <br />
                SLOW LIVING
              </span>
              <small>FIND YOUR RHYTHM</small>
            </div>
            <div className="art-book book-front">
              <div className="cover-sun" />
              <span>
                THE
                <br />
                CREATIVE
                <br />
                <b>MIND</b>
              </span>
              <small>Ideas worth exploring</small>
              <div className="cover-lines" />
            </div>
            <div className="art-caption">
              <span className="caption-icon">
                <BookOpen size={15} />
              </span>
              <span>
                <b>One page at a time</b>
                <small>Make room for wonder.</small>
              </span>
            </div>
          </div>
        </section>

        <section className="results-section">
          <div className="section-heading">
            <div>
              <div className="section-kicker">
                {page === "wishlist"
                  ? "YOUR COLLECTION"
                  : activeQuery
                    ? "SEARCH RESULTS"
                    : "START EXPLORING"}
              </div>
              <h2>
                {page === "wishlist" ? (
                  "Your wishlist"
                ) : activeQuery ? (
                  <>
                    Books for <span>“{activeQuery}”</span>
                  </>
                ) : (
                  "Curated for the curious"
                )}
              </h2>
              <p>
                {page === "wishlist"
                  ? "The books you want to come back to."
                  : activeQuery
                    ? `${books.length} book${books.length === 1 ? "" : "s"} found for your search`
                    : "Search for a book to see what catches your eye."}
              </p>
            </div>
            {page === "wishlist" && (
              <span className="collection-count">
                <LibraryBig size={16} />
                {wishlist.length} SAVED
              </span>
            )}
          </div>
          {error && (
            <div className="message error-message">
              <span>{error}</span>
              <button onClick={() => setError("")} aria-label="Tutup pesan">
                <X size={16} />
              </button>
            </div>
          )}
          {notice && (
            <div className="message success-message">
              <span>{notice}</span>
              <button onClick={() => setNotice("")} aria-label="Tutup pesan">
                <X size={16} />
              </button>
            </div>
          )}
          {loading || (page === "wishlist" && wishlistLoading) ? (
            <div className="state-panel">
              <LoaderCircle className="spin" size={30} />
              <p>Finding your next read...</p>
            </div>
          ) : shownBooks.length ? (
            <div className="book-grid">
              {shownBooks.map((book) => (
                <BookCard
                  key={book.googleBookId}
                  book={book}
                  saved={savedIds.has(book.googleBookId)}
                  onToggle={toggleWishlist}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                {page === "wishlist" ? (
                  <Bookmark size={28} />
                ) : (
                  <Search size={28} />
                )}
              </div>
              <h3>
                {page === "wishlist"
                  ? "Your wishlist is waiting"
                  : activeQuery
                    ? "No books found"
                    : "A world of books awaits"}
              </h3>
              <p>
                {page === "wishlist"
                  ? "Save books you love while exploring, and they’ll be collected here."
                  : activeQuery
                    ? "Try another keyword or search by an author’s name."
                    : "Enter a title, author, or topic above to discover your next favorite."}
              </p>
              {page === "wishlist" && (
                <button
                  className="outline-button"
                  onClick={() => setPage("search")}
                >
                  Explore books <ArrowUpRight size={16} />
                </button>
              )}
            </div>
          )}
        </section>
      </main>
      <footer className="footer">
        <div className="footer-brand">
          <BookOpen size={17} /> bookly<span>.</span>
        </div>
        <p>Made for the love of reading.</p>
        <span className="footer-credit">POWERED BY GOOGLE BOOKS API</span>
      </footer>
    </div>
  );
}
