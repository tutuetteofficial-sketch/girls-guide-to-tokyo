import Link from "next/link";

export default function Header() {
  return (
    <header style={styles.header}>
      <div style={styles.inner}>
        <Link href="/" style={styles.logo}>
          <span style={styles.logoMain}>TOKYO</span>
          <span style={styles.logoSub}>GUIDE</span>
        </Link>

        <nav style={styles.nav}>
          <Link href="/foods" style={styles.link}>
            Food
          </Link>

          <Link href="/products" style={styles.link}>
            Products
          </Link>

          <Link href="/places" style={styles.link}>
            Places
          </Link>

          <Link href="/articles" style={styles.link}>
            Articles
          </Link>

          <Link href="/search" style={styles.searchLink}>
            Search
          </Link>
        </nav>
      </div>
    </header>
  );
}

const styles = {
  header: {
    width: "100%",
    background: "#fffaf8",
    borderBottom: "1px solid #e9e1dd",
    position: "sticky" as const,
    top: 0,
    zIndex: 50,
  },

  inner: {
    maxWidth: "1150px",
    margin: "0 auto",
    padding: "17px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "30px",
  },

  logo: {
    color: "#222",
    textDecoration: "none",
    fontFamily: "Georgia, serif",
    display: "flex",
    alignItems: "baseline",
    gap: "7px",
    whiteSpace: "nowrap" as const,
  },

  logoMain: {
    fontSize: "18px",
    letterSpacing: "2px",
  },

  logoSub: {
    fontSize: "10px",
    letterSpacing: "2px",
    color: "#c8647b",
  },

  nav: {
    display: "flex",
    alignItems: "center",
    gap: "28px",
  },

  link: {
    color: "#555",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: 500,
    whiteSpace: "nowrap" as const,
  },

  searchLink: {
    color: "#fff",
    background: "#222",
    textDecoration: "none",
    fontSize: "12px",
    fontWeight: 600,
    padding: "9px 16px",
    borderRadius: "999px",
    whiteSpace: "nowrap" as const,
  },
};