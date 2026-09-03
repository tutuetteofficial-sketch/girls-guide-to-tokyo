"use client";

import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export type GalleryImage = {
  id?: string;
  image_url: string;
  alt_text: string;
  sort_order: number;
};

type Props = {
  images: GalleryImage[];
  onChange: (images: GalleryImage[]) => void;
  folder?: string;
};

export default function ImageGalleryUploader({
  images,
  onChange,
  folder = "places",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function uploadFiles(
    files: FileList | null
  ) {
    if (!files || files.length === 0) {
      return;
    }

    setUploading(true);
    setMessage("アップロード中...");

    try {
      const uploaded: GalleryImage[] = [];

      for (
        let i = 0;
        i < files.length;
        i++
      ) {
        const file = files[i];

        if (!file.type.startsWith("image/")) {
          continue;
        }

        if (file.size > 10 * 1024 * 1024) {
          throw new Error(
            "1枚10MB以下の画像を選択してください。"
          );
        }

        const extension =
          file.name
            .split(".")
            .pop()
            ?.toLowerCase() || "jpg";

        const filename =
          `${Date.now()}-${crypto.randomUUID()}.${extension}`;

        const path =
          `${folder}/${filename}`;

        const {
          error: uploadError,
        } = await supabase.storage
          .from("media")
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(
            uploadError.message
          );
        }

        const {
          data: publicData,
        } = supabase.storage
          .from("media")
          .getPublicUrl(path);

        uploaded.push({
          image_url:
            publicData.publicUrl,
          alt_text: "",
          sort_order:
            images.length + uploaded.length,
        });
      }

      onChange([
        ...images,
        ...uploaded,
      ]);

      setMessage(
        uploaded.length > 0
          ? `${uploaded.length}枚追加しました。`
          : "画像を追加できませんでした。"
      );
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

  function removeImage(index: number) {
    const next =
      images.filter(
        (_, i) => i !== index
      ).map((image, i) => ({
        ...image,
        sort_order: i,
      }));

    onChange(next);
  }

  function moveImage(
    index: number,
    direction: -1 | 1
  ) {
    const target =
      index + direction;

    if (
      target < 0 ||
      target >= images.length
    ) {
      return;
    }

    const next = [...images];

    [next[index], next[target]] =
      [next[target], next[index]];

    onChange(
      next.map((image, i) => ({
        ...image,
        sort_order: i,
      }))
    );
  }

  function updateAlt(
    index: number,
    value: string
  ) {
    const next = [...images];

    next[index] = {
      ...next[index],
      alt_text: value,
    };

    onChange(next);
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div>
          <p style={styles.title}>
            Photos
          </p>

          <p style={styles.helper}>
            複数枚追加できます。表示順も変更できます。
          </p>
        </div>

        <button
          type="button"
          style={styles.addButton}
          onClick={() =>
            inputRef.current?.click()
          }
          disabled={uploading}
        >
          {uploading
            ? "Uploading..."
            : "+ Add Photos"}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) =>
          uploadFiles(e.target.files)
        }
        style={styles.hidden}
      />

      {images.length === 0 ? (
        <button
          type="button"
          style={styles.empty}
          onClick={() =>
            inputRef.current?.click()
          }
          disabled={uploading}
        >
          <span style={styles.plus}>
            +
          </span>

          <span>
            Upload place photos
          </span>
        </button>
      ) : (
        <div style={styles.grid}>
          {images.map(
            (image, index) => (
              <div
                key={
                  image.id ??
                  `${image.image_url}-${index}`
                }
                style={styles.card}
              >
                <img
                  src={image.image_url}
                  alt=""
                  style={styles.image}
                />

                <div style={styles.cardBody}>
                  <div
                    style={
                      styles.cardTop
                    }
                  >
                    <span
                      style={
                        styles.number
                      }
                    >
                      {index + 1}
                    </span>

                    <div
                      style={
                        styles.moveButtons
                      }
                    >
                      <button
                        type="button"
                        style={
                          styles.smallButton
                        }
                        onClick={() =>
                          moveImage(
                            index,
                            -1
                          )
                        }
                        disabled={
                          index === 0
                        }
                      >
                        ←
                      </button>

                      <button
                        type="button"
                        style={
                          styles.smallButton
                        }
                        onClick={() =>
                          moveImage(
                            index,
                            1
                          )
                        }
                        disabled={
                          index ===
                          images.length - 1
                        }
                      >
                        →
                      </button>
                    </div>
                  </div>

                  <input
                    style={styles.altInput}
                    value={
                      image.alt_text
                    }
                    onChange={(e) =>
                      updateAlt(
                        index,
                        e.target.value
                      )
                    }
                    placeholder="Image description"
                  />

                  <button
                    type="button"
                    style={
                      styles.removeButton
                    }
                    onClick={() =>
                      removeImage(index)
                    }
                  >
                    Remove
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {message && (
        <p style={styles.message}>
          {message}
        </p>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    marginTop: "5px",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "15px",
    marginBottom: "13px",
  },

  title: {
    margin: 0,
    fontSize: "13px",
    fontWeight: 600,
  },

  helper: {
    margin: "5px 0 0",
    color: "#888",
    fontSize: "11px",
  },

  addButton: {
    border: "1px solid #ddd5d1",
    background: "#fff",
    borderRadius: "8px",
    padding: "8px 11px",
    cursor: "pointer",
    fontSize: "11px",
    whiteSpace: "nowrap" as const,
  },

  hidden: {
    display: "none",
  },

  empty: {
    width: "100%",
    minHeight: "180px",
    border: "1px dashed #d8cfca",
    borderRadius: "12px",
    background: "#fcfaf9",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    color: "#777",
    cursor: "pointer",
  },

  plus: {
    fontSize: "28px",
    color: "#c8647b",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "12px",
  },

  card: {
    border: "1px solid #e7e0dc",
    borderRadius: "12px",
    overflow: "hidden",
    background: "#fff",
  },

  image: {
    width: "100%",
    aspectRatio: "4 / 3",
    objectFit: "cover" as const,
    display: "block",
    background: "#f4efec",
  },

  cardBody: {
    padding: "10px",
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },

  number: {
    fontSize: "11px",
    color: "#888",
  },

  moveButtons: {
    display: "flex",
    gap: "4px",
  },

  smallButton: {
    width: "28px",
    height: "28px",
    border: "1px solid #ddd5d1",
    background: "#fff",
    borderRadius: "6px",
    cursor: "pointer",
  },

  altInput: {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "8px",
    border: "1px solid #e0d9d5",
    borderRadius: "7px",
    fontSize: "11px",
    marginBottom: "7px",
  },

  removeButton: {
    border: "0",
    background: "transparent",
    color: "#a44",
    padding: 0,
    cursor: "pointer",
    fontSize: "10px",
  },

  message: {
    color: "#c8647b",
    fontSize: "11px",
    marginTop: "8px",
  },
};