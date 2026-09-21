"use client";

import Link from "next/link";

export default function AdminMyListPage() {
  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <p style={styles.eyebrow}>ADMIN</p>
            <h1 style={styles.title}>MY LIST</h1>
            <p style={styles.description}>
              Manage and monitor user-saved items.
            </p>
          </div>

          <Link href="/admin" style={styles.backLink}>
            ← Admin
          </Link>
        </div>

        <section style={styles.cardGrid}>
          <div style={styles.card}>
            <p style={styles.cardLabel}>SAVED ITEMS</p>
            <p style={styles.cardValue}>—</p>
            <p style={styles.cardDescription}>
              Total items saved by users
            </p>
          </div>

          <div style={styles.card}>
            <p style={styles.cardLabel}>USERS</p>
            <p style={styles.cardValue}>—</p>
            <p style={styles.cardDescription}>
              Users with saved items
            </p>
          </div>

          <div style={styles.card}>
            <p style={styles.cardLabel}>MAP LOCATIONS</p>
            <p style={styles.cardValue}>—</p>
            <p style={styles.cardDescription}>
              Saved items with map locations
            </p>
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <div>
              <p style={styles.sectionEyebrow}>FUTURE MANAGEMENT</p>
              <h2 style={styles.sectionTitle}>
                Saved items
              </h2>
            </div>
          </div>

          <div style={styles.emptyBox}>
            <p style={styles.emptyTitle}>
              No saved items yet
            </p>

            <p style={styles.emptyText}>
              User saved items will appear here after the
              MY LIST feature is connected.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "calc(100vh - 72px)",
    background: "#faf8f6",
    padding: "60px 24px 100px",
  },

  container: {
    width: "100%",
    maxWidth: "1180px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "30px",
    marginBottom: "50px",
  },

  eyebrow: {
    margin: "0 0 10px",
    color: "#c8647b",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "2px",
  },

  title: {
    margin: 0,
    color: "#222",
    fontFamily: "Georgia, serif",
    fontSize: "42px",
    fontWeight: 400,
    letterSpacing: "1px",
  },

  description: {
    margin: "14px 0 0",
    color: "#888",
    fontSize: "13px",
  },

  backLink: {
    color: "#777",
    textDecoration: "none",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "1.5px",
    whiteSpace: "nowrap",
  },

  cardGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "18px",
    marginBottom: "60px",
  },

  card: {
    padding: "28px",
    background: "#fff",
    border: "1px solid #e7e0dc",
  },

  cardLabel: {
    margin: 0,
    color: "#999",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "1.8px",
  },

  cardValue: {
    margin: "18px 0 8px",
    color: "#222",
    fontFamily: "Georgia, serif",
    fontSize: "32px",
  },

  cardDescription: {
    margin: 0,
    color: "#999",
    fontSize: "12px",
    lineHeight: 1.6,
  },

  section: {
    background: "#fff",
    border: "1px solid #e7e0dc",
  },

  sectionHeader: {
    padding: "28px 30px",
    borderBottom: "1px solid #e7e0dc",
  },

  sectionEyebrow: {
    margin: "0 0 8px",
    color: "#aaa",
    fontSize: "9px",
    fontWeight: 700,
    letterSpacing: "1.8px",
  },

  sectionTitle: {
    margin: 0,
    color: "#222",
    fontFamily: "Georgia, serif",
    fontSize: "24px",
    fontWeight: 400,
  },

  emptyBox: {
    padding: "70px 30px",
    textAlign: "center" as const,
  },

  emptyTitle: {
    margin: "0 0 10px",
    color: "#444",
    fontFamily: "Georgia, serif",
    fontSize: "18px",
  },

  emptyText: {
    maxWidth: "420px",
    margin: "0 auto",
    color: "#999",
    fontSize: "12px",
    lineHeight: 1.8,
  },
};