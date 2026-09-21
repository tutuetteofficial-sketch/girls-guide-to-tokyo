"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type SaveType = "food" | "product" | "place";

type SaveButtonProps = {
  type: SaveType;
  itemId: string;
};

export default function SaveButton({
  type,
  itemId,
}: SaveButtonProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const column =
    type === "food"
      ? "food_id"
      : type === "product"
      ? "product_id"
      : "place_id";

  useEffect(() => {
    let mounted = true;

    async function loadSavedState() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        if (mounted) {
          setSaved(false);
          setLoading(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from("saved_items")
        .select("id")
        .eq("user_id", session.user.id)
        .eq(column, itemId)
        .maybeSingle();

      if (mounted) {
        setSaved(!error && !!data);
        setLoading(false);
      }
    }

    loadSavedState();

    return () => {
      mounted = false;
    };
  }, [column, itemId]);

  async function handleSave() {
    if (saving || loading) {
      return;
    }

    setSaving(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push(
        `/login?redirect=${encodeURIComponent(pathname)}`
      );
      setSaving(false);
      return;
    }

    if (saved) {
      const { error } = await supabase
        .from("saved_items")
        .delete()
        .eq("user_id", session.user.id)
        .eq(column, itemId);

      if (!error) {
        setSaved(false);
      }
    } else {
      const { data: existing } = await supabase
        .from("saved_items")
        .select("id")
        .eq("user_id", session.user.id)
        .eq(column, itemId)
        .maybeSingle();

      if (!existing) {
        const { error } = await supabase
          .from("saved_items")
          .insert({
            user_id: session.user.id,
            [column]: itemId,
          });

        if (!error) {
          setSaved(true);
        }
      } else {
        setSaved(true);
      }
    }

    setSaving(false);
  }

  return (
    <button
      type="button"
      onClick={handleSave}
      disabled={loading || saving}
      style={{
        ...styles.button,
        opacity: loading || saving ? 0.6 : 1,
      }}
    >
      <span style={styles.heart}>
        {saved ? "♥" : "♡"}
      </span>

      <span>
        {saved ? "Saved" : "Save to My List"}
      </span>
    </button>
  );
}

const styles = {
  button: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    height: "42px",
    padding: "0 17px",
    border: "1px solid #d9cfca",
    borderRadius: "999px",
    background: "#fff",
    color: "#444",
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.4px",
    cursor: "pointer",
  },

  heart: {
    fontSize: "17px",
    lineHeight: 1,
  },
};