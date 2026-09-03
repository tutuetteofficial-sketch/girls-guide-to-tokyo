"use client";

import { useEffect, useState } from "react";

export type VariantCarouselItem = {
  id: string;
  name: string;
  imageUrl: string | null;
  description: string | null;
  price: number | null;
};

type VariantCarouselProps = {
  variants: VariantCarouselItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export default function VariantCarousel({
  variants,
  selectedId,
  onSelect,
}: VariantCarouselProps) {
  if (variants.length === 0) {
    return null;
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div>
          <p style={styles.eyebrow}>VARIANTS</p>
          <h3 style={styles.title}>Choose a variant</h3>
        </div>

        <span style={styles.count}>
          {variants.length} options
        </span>
      </div>

      <div style={styles.scroller}>
        {variants.map((variant) => {
          const selected =
            selectedId === variant.id;

          return (
            <button
              key={variant.id}
              type="button"
              onClick={() =>
                onSelect(variant.id)
              }
              style={{
                ...styles.item,
                ...(selected
                  ? styles.itemSelected
                  : {}),
              }}
              aria-pressed={selected}
            >
              <div style={styles.itemImageWrap}>
                {variant.imageUrl ? (
                  <img
                    src={variant.imageUrl}
                    alt={variant.name}
                    style={styles.itemImage}
                  />
                ) : (
                  <div style={styles.placeholder}>
                    TOKYO GUIDE
                  </div>
                )}
              </div>

              <div style={styles.itemBody}>
                <span
                  style={{
                    ...styles.itemName,
                    ...(selected
                      ? styles.itemNameSelected
                      : {}),
                  }}
                >
                  {variant.name}
                </span>

                {variant.price !== null && (
                  <span style={styles.itemPrice}>
                    ¥
                    {variant.price.toLocaleString()}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <style jsx global>{`
        .variant-carousel-scroller {
          scrollbar-width: thin;
        }

        .variant-carousel-scroller::-webkit-scrollbar {
          height: 5px;
        }

        .variant-carousel-scroller::-webkit-scrollbar-thumb {
          background: #d8d0cb;
          border-radius: 10px;
        }

        @media (max-width: 520px) {
          .variant-carousel-item {
            width: 118px !important;
            min-width: 118px !important;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  wrapper: {
    marginTop: "40px",
  },

  header: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "16px",
  },

  eyebrow: {
    margin: 0,
    color: "#c8647b",
    fontSize: "9px",
    fontWeight: 700,
    letterSpacing: "2px",
  },

  title: {
    margin: "6px 0 0",
    fontFamily: "Georgia, serif",
    fontSize: "24px",
    fontWeight: 400,
  },

  count: {
    color: "#999",
    fontSize: "10px",
  },

  scroller: {
    display: "flex",
    gap: "12px",
    overflowX: "auto" as const,
    paddingBottom: "8px",
  },

  item: {
    flex: "0 0 140px",
    width: "140px",
    minWidth: "140px",
    padding: 0,
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "#e7e0dc",
    borderRadius: "12px",
    background: "#fff",
    overflow: "hidden",
    textAlign: "left" as const,
    cursor: "pointer",
    transition:
      "border-color 0.2s ease, transform 0.2s ease",
  },

  itemSelected: {
    borderColor: "#c8647b",
  },

  itemImageWrap: {
    width: "100%",
    aspectRatio: "1 / 1",
    overflow: "hidden",
    background: "#f3eeeb",
  },

  itemImage: {
    width: "100%",
    height: "100%",
    display: "block",
    objectFit: "cover" as const,
  },

  placeholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#aaa",
    fontFamily: "Georgia, serif",
    fontSize: "9px",
    letterSpacing: "1.5px",
  },

  itemBody: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "5px",
    padding: "11px",
  },

  itemName: {
    color: "#444",
    fontSize: "11px",
    lineHeight: 1.4,
  },

  itemNameSelected: {
    color: "#c8647b",
    fontWeight: 700,
  },

  itemPrice: {
    color: "#777",
    fontSize: "10px",
  },
} as const;