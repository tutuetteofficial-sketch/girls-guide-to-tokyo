"use client";

import { useRef, useState } from "react";
import type {
  CSSProperties,
  ChangeEvent,
} from "react";
import { supabase } from "@/lib/supabase";

type ImageUploaderProps = {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
};

export default function ImageUploader({
  value,
  onChange,
  folder = "images",
  label = "Image",
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleFileChange(
    e: ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage("画像ファイルを選択してください。");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage("画像は10MB以下にしてください。");
      return;
    }

    setUploading(true);
    setMessage("アップロード中...");

    try {
      const extension =
        file.name.split(".").pop()?.toLowerCase() || "jpg";

      const fileName =
        `${Date.now()}-${crypto.randomUUID()}.${extension}`;

      const filePath =
        `${folder}/${fileName}`;

      const { error: uploadError } =
        await supabase.storage
          .from("media")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

      if (uploadError) {
        throw new Error(
          `アップロードに失敗しました: ${uploadError.message}`
        );
      }

      const { data } =
        supabase.storage
          .from("media")
          .getPublicUrl(filePath);

      onChange(data.publicUrl);
      setMessage("アップロードしました。");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "アップロードに失敗しました。"
      );
    } finally {
      setUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div style={styles.wrapper}>
      <label style={styles.label}>
        {label}
      </label>

      {value ? (
        <div style={styles.previewCard}>
          <img
            src={value}
            alt=""
            style={styles.preview}
          />

          <div style={styles.actions}>
            <button
              type="button"
              style={styles.button}
              onClick={() =>
                inputRef.current?.click()
              }
              disabled={uploading}
            >
              {uploading
                ? "Uploading..."
                : "Replace Image"}
            </button>

            <button
              type="button"
              style={styles.removeButton}
              onClick={() => {
                onChange("");
                setMessage("");
              }}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          style={styles.uploadArea}
          onClick={() =>
            inputRef.current?.click()
          }
          disabled={uploading}
        >
          <span style={styles.plus}>
            {uploading ? "..." : "+"}
          </span>

          <span>
            {uploading
              ? "Uploading..."
              : "Upload Image"}
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={styles.hiddenInput}
      />

      {message && (
        <p style={styles.message}>
          {message}
        </p>
      )}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  wrapper: {
    marginBottom: "16px",
  },

  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    marginBottom: "8px",
  },

  uploadArea: {
    width: "100%",
    minHeight: "150px",

    borderStyle: "dashed",
    borderWidth: "1px",
    borderColor: "#d8cfca",

    borderRadius: "12px",
    background: "#fcfaf9",

    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",

    color: "#777",
    cursor: "pointer",
    fontSize: "13px",
  },

  plus: {
    fontSize: "28px",
    lineHeight: 1,
    color: "#c8647b",
  },

  previewCard: {
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "#e7e0dc",

    borderRadius: "12px",
    overflow: "hidden",
    background: "#fff",
  },

  preview: {
    display: "block",
    width: "100%",
    maxHeight: "320px",
    objectFit: "cover",

    background: "#f4efec",
  },

  actions: {
    display: "flex",
    gap: "8px",
    padding: "10px",
  },

  button: {
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "#ddd5d1",

    background: "#fff",
    borderRadius: "8px",
    padding: "8px 11px",
    cursor: "pointer",
    fontSize: "11px",
  },

  removeButton: {
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "#e3cccc",

    background: "#fff",
    color: "#a44",
    borderRadius: "8px",
    padding: "8px 11px",
    cursor: "pointer",
    fontSize: "11px",
  },

  hiddenInput: {
    display: "none",
  },

  message: {
    color: "#c8647b",
    fontSize: "11px",
    marginTop: "7px",
  },
};