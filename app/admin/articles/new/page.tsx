"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import ArticleForm, {
  type ArticleFormData,
} from "@/components/article-folder/ArticleForm";

import { supabase } from "@/lib/supabase";

export default function NewArticlePage() {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(
    data: ArticleFormData
  ) {
    setSaving(true);
    setMessage("");

    try {
      const {
        data: article,
        error: articleError,
      } = await supabase
        .from("articles")
        .insert({
          title: data.title,
          category: data.category || null,
          cover_image: data.coverImage || null,
          content: data.content,
          status: data.status,
        })
        .select("id")
        .single();

      if (articleError || !article) {
        throw new Error(
          articleError?.message ??
            "Articleの保存に失敗しました。"
        );
      }

      if (data.selectedPlaceIds.length > 0) {
        const { error } = await supabase
          .from("article_places")
          .insert(
            data.selectedPlaceIds.map((placeId) => ({
              article_id: article.id,
              place_id: placeId,
            }))
          );

        if (error) throw error;
      }

      if (data.selectedProductIds.length > 0) {
        const { error } = await supabase
          .from("article_products")
          .insert(
            data.selectedProductIds.map(
              (productId) => ({
                article_id: article.id,
                product_id: productId,
              })
            )
          );

        if (error) throw error;
      }

      router.push(
        `/admin/articles/${article.id}`
      );
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
            New Article
          </h1>
        </header>

        <ArticleForm
          submitLabel="Create Article"
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