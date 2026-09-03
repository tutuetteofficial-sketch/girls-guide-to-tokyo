import Link from "next/link";

type PlaceCardProps = {
  id: string;
  name: string;
  imageUrl?: string | null;
  category?: string | null;
  region?: string | null;
  area?: string | null;
  description?: string | null;
  editorNote?: string | null;
};

export default function PlaceCard({
  id,
  name,
  imageUrl,
  category,
  region,
  area,
  description,
  editorNote,
}: PlaceCardProps) {
  return (
    <Link
      href={`/places/${id}`}
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
          <div style={styles.imagePlaceholder}>
            <span>TOKYO GUIDE</span>
          </div>
        )}
      </div>

      <div style={styles.body}>
        <div style={styles.meta}>
          {category && (
            <span style={styles.category}>
              {category}
            </span>
          )}

          {region && (
            <span style={styles.location}>
              {region}
              {area ? ` · ${area}` : ""}
            </span>
          )}
        </div>

        <h3 style={styles.name}>
          {name}
        </h3>

        {description && (
          <p style={styles.description}>
            {description}
          </p>
        )}

        {editorNote && (
          <div style={styles.editorNote}>
            <span style={styles.noteLabel}>
              Editor's note
            </span>

            <p style={styles.noteText}>
              {editorNote}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}

const styles = {
  card: {
    display: "block",
    height: "100%",
    background: "#fff",
    color: "#222",
    textDecoration: "none",
    border: "1px solid #e7e0dc",
    borderRadius: "16px",
    overflow: "hidden",
    transition:
      "transform 0.2s ease, box-shadow 0.2s ease",
  },

  imageWrap: {
    width: "100%",
    aspectRatio: "4 / 3",
    overflow: "hidden",
    background: "#f3eeeb",
  },

  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
    display: "block",
  },

  imagePlaceholder: {
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

  body: {
    padding: "16px 17px 18px",
  },

  meta: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    marginBottom: "9px",
  },

  category: {
    color: "#c8647b",
    fontSize: "9px",
    fontWeight: 700,
    letterSpacing: "1.5px",
    textTransform: "uppercase" as const,
  },

  location: {
    color: "#999",
    fontSize: "10px",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  name: {
    margin: 0,
    fontFamily: "Georgia, serif",
    fontSize: "21px",
    fontWeight: 400,
    lineHeight: 1.25,
  },

  description: {
    margin: "8px 0 0",
    color: "#777",
    fontSize: "11px",
    lineHeight: 1.7,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden",
  },

  editorNote: {
    marginTop: "13px",
    paddingTop: "11px",
    borderTop: "1px solid #eee8e4",
  },

  noteLabel: {
    display: "block",
    marginBottom: "4px",
    color: "#c8647b",
    fontSize: "9px",
    fontWeight: 700,
    letterSpacing: "1px",
    textTransform: "uppercase" as const,
  },

  noteText: {
    margin: 0,
    color: "#666",
    fontSize: "10px",
    lineHeight: 1.6,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden",
  },
} as const;