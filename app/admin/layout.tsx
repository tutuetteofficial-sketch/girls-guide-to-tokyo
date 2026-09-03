"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkAdminAccess() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      // ログインしていない場合
      if (userError || !user) {
        router.replace("/login");
        return;
      }

      // admin_usersに登録されているか確認
      const { data: adminData, error: adminError } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      // 管理者ではない場合
      if (adminError || !adminData) {
        await supabase.auth.signOut();
        router.replace("/login");
        return;
      }

      // 管理者の場合
      if (mounted) {
        setAuthorized(true);
        setLoading(false);
      }
    }

    checkAdminAccess();

    return () => {
      mounted = false;
    };
  }, [router]);

  // 管理者確認中
  if (loading) {
    return (
      <main style={styles.loadingPage}>
        <div style={styles.loadingBox}>
          <p style={styles.loadingLabel}>
            TOKYO GUIDE
          </p>

          <p style={styles.loadingText}>
            Checking administrator access...
          </p>
        </div>
      </main>
    );
  }

  // 管理者以外は何も表示しない
  if (!authorized) {
    return null;
  }

  // 管理者だけ中のページを表示
  return <>{children}</>;
}

const styles = {
  loadingPage: {
    minHeight: "70vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
  },

  loadingBox: {
    textAlign: "center" as const,
  },

  loadingLabel: {
    fontFamily: "Georgia, serif",
    letterSpacing: "2px",
    fontSize: "14px",
    marginBottom: "14px",
    color: "#222",
  },

  loadingText: {
    color: "#888",
    fontSize: "13px",
  },
};