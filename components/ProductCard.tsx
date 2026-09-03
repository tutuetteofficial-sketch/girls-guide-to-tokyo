import Link from "next/link";

type ProductCardProps = {
  id: string;
  name: string;
  brand?: string | null;
  imageUrl?: string | null;
  category?: string | null;
  price?: number | null;
  japanExclusive?: boolean | null;
  popularityNote?: string | null;
  editorPick?: number | null;
};

export default function ProductCard({
  id,
  name,
  brand,
  imageUrl,
  category,
  price,
  japanExclusive,
  popularityNote,
  editorPick,
}: ProductCardProps) {
  return (
    <Link
      href={`/products/${id}`}
      style={styles.card}
    >
      <div style={styles.imageWrap}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            style={styles.image}
          />
        ) : (
          <div style={styles.placeholder}>
            <span>TOKYO GUIDE</span>
          </div>
        )}

        {japanExclusive && (
          <span style={styles.badge}>
            JAPAN EXCLUSIVE
          </span>
        )}

        {editorPick !== null &&
          editorPick !== undefined &&
          editorPick > 0 && (
            <span style={styles.pick}>
              ★ Editor’s Pick
            </span>
          )}
      </div>

      <div style={styles.body}>
        <div style={styles.topMeta}>
          {brand && (
            <span style={styles.brand}>
              {brand}
            </span>
          )}

          {category && (
            <span style={styles.category}>
              {category}
            </span>
          )}
        </div>

        <h3 style={styles.name}>
          {name}
        </h3>

        {price !== null &&
          price !== undefined && (
            <p style={styles.price}>
              ¥{price.toLocaleString()}
            </p>
          )}

        {popularityNote && (
          <p style={styles.note}>
            {popularityNote}
          </p>
        )}
      </div>
    </Link>
  );
}

const styles = {
  card: {
    display: "block",
    background: "#fff",
    color: "#222",
    textDecoration: "none",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "#e7e0dc",
    borderRadius: "16px",
    overflow: "hidden",
  },

  imageWrap: {
    position: "relative" as const,
    width: "100%",
    aspectRatio: "1 / 1",
    overflow: "hidden",
    background: "#f3eeeb",
  },

  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
    display: "block",
  },

  placeholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f3eeeb",
    color: "#aaa",
    fontFamily: "Georgia, serif",
    fontSize: "11px",
    letterSpacing: "2px",
  },

  badge: {
    position: "absolute" as const,
    top: "12px",
    left: "12px",
    padding: "6px 8px",
    background: "#222",
    color: "#fff",
    fontSize: "8px",
    fontWeight: 700,
    letterSpacing: "1px",
  },

  pick: {
    position: "absolute" as const,
    right: "12px",
    bottom: "12px",
    padding: "6px 8px",
    background: "#fff",
    color: "#c8647b",
    fontSize: "8px",
    fontWeight: 700,
    letterSpacing: "0.5px",
  },

  body: {
    padding: "17px",
  },

  topMeta: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    marginBottom: "8px",
  },

  brand: {
    color: "#777",
    fontSize: "9px",
    fontWeight: 700,
    letterSpacing: "1.2px",
    textTransform: "uppercase" as const,
  },

  category: {
    color: "#aaa",
    fontSize: "9px",
  },

  name: {
    margin: 0,
    fontFamily: "Georgia, serif",
    fontSize: "19px",
    fontWeight: 400,
    lineHeight: 1.3,
  },

  price: {
    margin: "9px 0 0",
    color: "#333",
    fontSize: "12px",
    fontWeight: 600,
  },

  note: {
    margin: "8px 0 0",
    color: "#888",
    fontSize: "11px",
    lineHeight: 1.6,
  },
} as const;