"use client";
import Image from "next/image";
import { useState } from "react";

export type GalleryItem = { id: string; title: string; url: string; formLabel: string };

function kind(url: string) {
  const path = new URL(url, "http://local.invalid").pathname.toLowerCase();
  if (/\.(png|jpe?g|webp|gif|svg)$/.test(path)) return "image";
  if (/\.(mp3|wav|ogg)$/.test(path)) return "audio";
  if (/\.(mp4|webm)$/.test(path)) return "video";
  return "link";
}

export function PortfolioGallery({ items, hi }: { items: GalleryItem[]; hi: boolean }) {
  const [index, setIndex] = useState(0);
  if (!items.length) return null;
  const current = items[Math.min(index, items.length - 1)];
  const media = kind(current.url);
  const move = (step: number) => setIndex((value) => (value + step + items.length) % items.length);
  return (
    <div className="portfolio-gallery">
      <div className="portfolio-stage">
        {media === "image" ? (
          <Image src={current.url} alt={current.title} width={960} height={640} unoptimized />
        ) : media === "audio" ? (
          <div className="portfolio-media"><span aria-hidden="true">♫</span><audio controls src={current.url}>{hi ? "ऑडियो उपलब्ध नहीं है।" : "Audio is unavailable."}</audio></div>
        ) : media === "video" ? (
          <video controls src={current.url} />
        ) : (
          <div className="portfolio-media"><span aria-hidden="true">↗</span><a href={current.url} target="_blank" rel="noreferrer noopener">{hi ? "कार्य देखें" : "Open portfolio work"}</a></div>
        )}
      </div>
      <div className="portfolio-caption">
        <div><strong>{current.title}</strong><small>{current.formLabel}</small></div>
        {items.length > 1 && (
          <div className="gallery-controls">
            <button type="button" onClick={() => move(-1)} aria-label={hi ? "पिछला कार्य" : "Previous work"}>←</button>
            <span>{index + 1} / {items.length}</span>
            <button type="button" onClick={() => move(1)} aria-label={hi ? "अगला कार्य" : "Next work"}>→</button>
          </div>
        )}
      </div>
      {items.length > 1 && (
        <div className="portfolio-thumbs" aria-label={hi ? "पोर्टफ़ोलियो कार्य" : "Portfolio works"}>
          {items.map((item, i) => (
            <button key={item.id} type="button" className={i === index ? "selected" : ""} onClick={() => setIndex(i)} aria-label={item.title} aria-current={i === index ? "true" : undefined}>
              {kind(item.url) === "image" ? <Image src={item.url} alt="" width={88} height={66} unoptimized /> : <span>{kind(item.url) === "audio" ? "♫" : kind(item.url) === "video" ? "▶" : "↗"}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
