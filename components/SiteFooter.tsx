import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        <div style={styles.top}>
          <div>
            <Link href="/" style={styles.logo}>
              TOKYO GUIDE
            </Link>

            <p style={styles.tagline}>
              Discover Japan, one place at a time.
            </p>
          </div>

          <nav style={styles.nav}>
            <Link href="/places" style={styles.link}>
              PLACES
            </Link>

            <Link href="/products" style={styles.link}>
              PRODUCTS
            </Link>

            <Link href="/articles" style={styles.link}>
              GUIDES
            </Link>

            <Link href="/my-list" style={styles.link}>
              MY LIST
            </Link>
          </nav>
        </div>

        <div style={styles.bottom}>
          <span>© {new Date().getFullYear()} TOKYO GUIDE</span>

          <div style={styles.bottomLinks}>
            <Link href="/privacy" style={styles.smallLink}>
              Privacy
            </Link>

            <Link href="/contact" style={styles.smallLink}>
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

const styles = {
  footer: {
    marginTop: "80px",
    background: "#222",
    color: "#fff",
  },

  container: {
    maxWidth: "1180px",
    margin: "0 auto",
    padding: "54px 24px 24px",
  },

  top: {
    display: "flex",
    justifyContent: "space-between",
    gap: "40px",
    paddingBottom: "50px",
  },

  logo: {
    color: "#fff",
    textDecoration: "none",
    fontFamily: "Georgia, serif",
    fontSize: "17px",
    letterSpacing: "2.5px",
  },

  tagline: {
    margin: "12px 0 0",
    color: "#aaa",
    fontSize: "12px",
    lineHeight: 1.7,
  },

  nav: {
    display: "flex",
    alignItems: "flex-start",
    gap: "28px",
  },

  link: {
    color: "#fff",
    textDecoration: "none",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "1.8px",
  },

  bottom: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    paddingTop: "20px",
    borderTop: "1px solid #444",
    color: "#888",
    fontSize: "10px",
    letterSpacing: "0.5px",
  },

  bottomLinks: {
    display: "flex",
    gap: "20px",
  },

  smallLink: {
    color: "#888",
    textDecoration: "none",
  },
} as const;