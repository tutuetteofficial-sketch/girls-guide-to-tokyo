import FoodCard from "@/components/FoodCard";
import { supabase } from "@/lib/supabase";

type Food = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  editor_pick: number | null;
  category_id: number | null;
};

type FoodCategory = {
  id: number;
  name: string;
  parent_id: number | null;
};

export default async function FoodsPage() {
  const [
    foodsResult,
    categoriesResult,
  ] = await Promise.all([
    supabase
      .from("foods")
      .select(`
        id,
        name,
        description,
        image_url,
        editor_pick,
        category_id
      `)
      .eq("status", "active")
      .order("name"),

    supabase
      .from("food_categories")
      .select(
        "id, name, parent_id"
      )
      .eq("is_active", true)
      .order("sort_order")
      .order("name"),
  ]);

  const foods =
    (foodsResult.data ?? []) as Food[];

  const categories =
    (categoriesResult.data ?? []) as FoodCategory[];

  const categoryMap = new Map(
    categories.map((category) => [
      String(category.id),
      category,
    ])
  );

  const error =
    foodsResult.error ??
    categoriesResult.error;

  return (
    <main style={styles.main}>


      <div style={styles.container}>
        {/* =========================
            HEADER
        ========================= */}

        <header style={styles.header}>
          <p style={styles.eyebrow}>
            WHAT TO EAT
          </p>

          <h1 style={styles.title}>
            Food
          </h1>

          <p style={styles.description}>
            Japanese food worth trying in Tokyo.
          </p>
        </header>

        {/* =========================
            ERROR
        ========================= */}

        {error ? (
          <div style={styles.error}>
            <strong>
              データを取得できませんでした。
            </strong>

            <p style={styles.errorMessage}>
              {error.message}
            </p>
          </div>
        ) : foods.length === 0 ? (
          /* =========================
              EMPTY
          ========================= */

          <div style={styles.empty}>
            <p style={styles.emptyTitle}>
              No food yet.
            </p>

            <p style={styles.emptyText}>
              Food recommendations will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* =========================
                COUNT
            ========================= */}

            <div style={styles.topBar}>
              <p style={styles.count}>
                {foods.length}{" "}
                {foods.length === 1
                  ? "food"
                  : "foods"}
              </p>
            </div>

            {/* =========================
                FOOD GRID
            ========================= */}

            <div style={styles.grid}>
              {foods.map((food) => {
                const category =
                  food.category_id !== null
                    ? categoryMap.get(
                        String(
                          food.category_id
                        )
                      )
                    : null;

                return (
                  <FoodCard
                    key={food.id}
                    id={food.id}
                    name={food.name}
                    description={
                      food.description
                    }
                    imageUrl={
                      food.image_url
                    }
                    categoryName={
                      category?.name ?? null
                    }
                    editorPick={
                      food.editor_pick
                    }
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

const styles = {
  main: {
    minHeight: "100vh",
    background: "#fffaf8",
    color: "#222",
  },

  container: {
    maxWidth: "1150px",
    margin: "0 auto",
    padding: "0 24px 100px",
  },

  header: {
    padding: "45px 0 38px",
  },

  eyebrow: {
    color: "#c8647b",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "3px",
    margin: "0 0 8px",
  },

  title: {
    fontFamily: "Georgia, serif",
    fontSize: "52px",
    fontWeight: 400,
    margin: 0,
    lineHeight: 1.1,
  },

  description: {
    color: "#777",
    margin: "12px 0 0",
    fontSize: "14px",
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: "18px",
    borderBottom: "1px solid #eee6e2",
    marginBottom: "25px",
  },

  count: {
    margin: 0,
    color: "#999",
    fontSize: "11px",
    letterSpacing: "0.5px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "28px 22px",
  },

  error: {
    padding: "20px",
    background: "#fff0f0",
    border: "1px solid #edcaca",
    borderRadius: "12px",
    color: "#a44",
  },

  errorMessage: {
    margin: "8px 0 0",
    fontSize: "12px",
    lineHeight: 1.6,
  },

  empty: {
    padding: "70px 30px",
    textAlign: "center" as const,
    background: "#fff",
    border: "1px solid #e7e0dc",
    borderRadius: "15px",
  },

  emptyTitle: {
    fontFamily: "Georgia, serif",
    fontSize: "24px",
    margin: 0,
    color: "#333",
  },

  emptyText: {
    color: "#999",
    fontSize: "13px",
    margin: "10px 0 0",
  },
};