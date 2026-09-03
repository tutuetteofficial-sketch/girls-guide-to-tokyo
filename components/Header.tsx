"use client";

import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header" style={styles.header}>
      <div style={styles.inner}>
        <Link
          href="/"
          style={styles.logo}
          onClick={() => setMenuOpen(false)}
        >
          Girls&apos; Guide to TOKYO
        </Link>

        {/* PC */}
        <nav className="desktop-nav" style={styles.nav}>
          <Link href="/places" style={styles.navLink}>
            Places
          </Link>

          <Link href="/foods" style={styles.navLink}>
            Food
          </Link>

          <Link href="/products" style={styles.navLink}>
            Products
          </Link>

          <Link href="/articles" style={styles.navLink}>
            Articles
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button
          className="mobile-menu-button"
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Open menu"
          style={styles.menuButton}
        >
          {menuOpen ? "×" : "☰"}
        </button>
      </div>

      {/* Mobile */}
      {menuOpen && (
        <nav className="mobile-nav">
          <Link
            href="/places"
            onClick={() => setMenuOpen(false)}
          >
            Places
          </Link>

          <Link
            href="/foods"
            onClick={() => setMenuOpen(false)}
          >
            Food
          </Link>

          <Link
            href="/products"
            onClick={() => setMenuOpen(false)}
          >
            Products
          </Link>

          <Link
            href="/articles"
            onClick={() => setMenuOpen(false)}
          >
            Articles
          </Link>
        </nav>
      )}
    </header>
  );
}

const styles = {
  header: {
    width: "100%",
    background: "#fffaf8",
    borderBottom: "1px solid #e7e0dc",
  },

  inner: {
    maxWidth: "1150px",
    margin: "0 auto",
    padding: "20px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "30px",
  },

  logo: {
    color: "#222",
    textDecoration: "none",
    fontFamily: "Georgia, serif",
    fontSize: "20px",
    fontWeight: 400,
    whiteSpace: "nowrap" as const,
  },

  nav: {
    display: "flex",
    alignItems: "center",
    gap: "28px",
  },

  navLink: {
    color: "#555",
    textDecoration: "none",
    fontSize: "12px",
    whiteSpace: "nowrap" as const,
  },

  menuButton: {
    display: "none",
    border: "none",
    background: "transparent",
    color: "#222",
    fontSize: "26px",
    cursor: "pointer",
    padding: "4px",
    lineHeight: 1,
  },
};