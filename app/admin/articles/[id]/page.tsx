"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import ArticleForm, {
  type ArticleFormData,
} from "@/components/article-folder/ArticleForm";

import { supabase } from "@/lib/supabase";

type InitialData = ArticleFormData;

export default function EditArticlePage() {
  const params = useParams();

  const id =
    typeof params.id === "string"
      ? params.id
      : params.id?.[0];

  const [initialData, setInitialData] =
    useState<InitialData | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!id) return;

    async function loadArticle() {
      setLoading(true);

      const { data: article, error } = await supabase
        .from("articles")
        .select(
          `
          id,
          title,
          category,
          cover_image,
          content,
          status,
          article_places(place_id),
          article_products(product_id)
        `
        )
        .eq("id", id)
        .single();

      if (error || !article) {
        setMessage(
          error?.message ??
            "Articleが見つかりません。"
        );

        setLoading(false);
        return;
      }

      setInitialData({
        title: article.title ?? "",
        category: article.category ?? "",
        coverImage: article.cover_image ?? "",
        content: article.content ?? "",
        status: article.status,
        selectedPlaceIds:
          article.article_places?.map(
            (item: { place_id: string }) =>
              item.place_id
          ) ?? [],
        selectedProductIds:
          article.article_products?.map(
            (item: { product_id: string }) =>
              item.product_id
          ) ?? [],
      });

      setLoading(false);
    }

    loadArticle();
  }, [id]);

  async function handleSubmit(
    data: ArticleFormData
  ) {
    if (!id) return;

    setSaving(true);
    setMessage("");

    try {
      const { error: articleError } = await supabase
        .from("articles")
        .update({
          title: data.title,
          category: data.category || null,
          cover_image: data.coverImage || null,
          content: data.content,
          status: data.status,
        })
        .eq("id", id);

      if (articleError) {
        throw articleError;
      }

      const { error: deletePlacesError } =
        await supabase
          .from("article_places")
          .delete()
          .eq("article_id", id);

      if (deletePlacesError) {
        throw deletePlacesError;
      }

      if (data.selectedPlaceIds.length > 0) {
        const { error } = await supabase
          .from("article_places")
          .insert(
            data.selectedPlaceIds.map((placeId) => ({
              article_id: id,
              place_id: placeId,
            }))
          );

        if (error) throw error;
      }

      const { error: deleteProductsError } =
        await supabase
          .from("article_products")
          .delete()
          .eq("article_id", id);

      if (deleteProductsError) {
        throw deleteProductsError;
      }

      if (data.selectedProductIds.length > 0) {
        const { error } = await supabase
          .from("article_products")
          .insert(
            data.selectedProductIds.map(
              (productId) => ({
                article_id: id,
                product_id: productId,
              })
            )
          );

        if (error) throw error;
      }

      setMessage("Saved successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "保存に失敗しました。"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main style={styles.loading}>
        Loading...
      </main>
    );
  }

  if (!initialData) {
    return (
      <main style={styles.loading}>
        {message || "Article not found."}
      </main>
    );
  }

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <Link
          href="/admin/articles"
          style={styles.back}
        >
          ← Articles
        </Link>

        <header style={styles.header}>
          <p style={styles.eyebrow}>
            CONTENT / ARTICLES
          </p>

          <h1 style={styles.title}>
            Edit Article
          </h1>
        </header>

        <ArticleForm
          initialData={initialData}
          submitLabel="Save Changes"
          saving={saving}
          message={message}
          onSubmit={handleSubmit}
        />
      </div>
    </main>
  );
}

const styles = {
  main: {
    minHeight: "100vh",
    padding: "35px 24px 100px",
    background: "#faf8f6",
    color: "#222",
  },

  container: {
    maxWidth: "1000px",
    margin: "0 auto",
  },

  loading: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#faf8f6",
    color: "#888",
  },

  back: {
    color: "#777",
    textDecoration: "none",
    fontSize: "13px",
  },

  header: {
    padding: "35px 0 25px",
  },

  eyebrow: {
    margin: "0 0 8px",
    color: "#c8647b",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "3px",
  },

  title: {
    margin: 0,
    fontFamily: "Georgia, serif",
    fontSize: "48px",
    fontWeight: 400,
  },
};