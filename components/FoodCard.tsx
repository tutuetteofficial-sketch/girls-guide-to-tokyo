import Link from "next/link";

type FoodCardProps = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  categoryName?: string | null;
  editorPick?: number | null;
};

export default function FoodCard({
  id,
  name,
  description,
  imageUrl,
  categoryName,
  editorPick = 0,
}: FoodCardProps) {
  const pickCount = Math.min(
    Math.max(editorPick ?? 0, 0),
    5
  );

  return (
    <Link
      href={`/food/${id}`}
      style={styles.card}
    >
      <div style={styles.image}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            style={styles.imageElement}
          />
        ) : (
          <span style={styles.placeholder}>
            TOKYO GUIDE
          </span>
        )}

        {pickCount > 0 && (
          <span style={styles.pickBadge}>
            PICK
          </span>
        )}
      </div>

      <div style={styles.cardBody}>
        {categoryName && (
          <p style={styles.category}>
            {categoryName}
          </p>
        )}

        <h2 style={styles.foodName}>
          {name}
        </h2>

        {description && (
          <p style={styles.description}>
            {description}
          </p>
        )}

        {pickCount > 0 && (
          <div style={styles.pick}>
            {"★".repeat(pickCount)}
            {"☆".repeat(5 - pickCount)}
          </div>
        )}
      </div>
    </Link>
  );
}

const styles = {
  card: {
    display: "block",
    color: "#222",
    textDecoration: "none",
  },

  image: {
    position: "relative" as const,
    aspectRatio: "1 / 1",
    background: "#f2e7e2",
    borderRadius: "14px",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  imageElement: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
    display: "block",
  },

  placeholder: {
    color: "#987a73",
    fontFamily: "Georgia, serif",
    fontSize: "10px",
    letterSpacing: "2px",
  },

  pickBadge: {
    position: "absolute" as const,
    right: "10px",
    top: "10px",
    background: "#222",
    color: "#fff",
    padding: "6px 8px",
    borderRadius: "999px",
    fontSize: "8px",
    letterSpacing: "1px",
  },

  cardBody: {
    paddingTop: "12px",
  },

  category: {
    color: "#999",
    fontSize: "9px",
    margin: 0,
  },

  foodName: {
    fontFamily: "Georgia, serif",
    fontSize: "20px",
    fontWeight: 400,
    margin: "4px 0 0",
  },

  description: {
    color: "#777",
    fontSize: "11px",
    lineHeight: 1.6,
    margin: "7px 0 0",
  },

  pick: {
    color: "#c8647b",
    fontSize: "10px",
    marginTop: "7px",
  },
};