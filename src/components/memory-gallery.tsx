"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

const memories = Array.from({ length: 10 }, (_, index) => ({
  src: `/images/memories/memory-${String(index + 1).padStart(2, "0")}.jpg`,
  alt: `记忆切片 ${index + 1}`,
}));

export default function MemoryGallery() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const previewIndexes = [7, 8, 3];

  const showPrevious = useCallback(() => {
    setActiveIndex((current) => current === null ? 0 : (current - 1 + memories.length) % memories.length);
  }, []);

  const showNext = useCallback(() => {
    setActiveIndex((current) => current === null ? 0 : (current + 1) % memories.length);
  }, []);

  useEffect(() => {
    if (activeIndex === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveIndex(null);
      if (event.key === "ArrowLeft") showPrevious();
      if (event.key === "ArrowRight") showNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, showNext, showPrevious]);

  return (
    <>
      <div className="memory-gallery" aria-label="记忆相册预览">
        {previewIndexes.map((memoryIndex, position) => {
          const memory = memories[memoryIndex];
          return (
          <button
            type="button"
            className={`memory-frame ${
              position === 0
                ? "memory-frame-main"
                : position === 1
                  ? "memory-frame-tall"
                  : "memory-frame-wide"
            }`}
            data-moment={position === 0 ? "picture-develops" : undefined}
            data-moment-opts={
              position === 0
                ? '{"look":"film","duration":1600,"focus":[0.62,0.48]}'
                : undefined
            }
            onClick={() => setActiveIndex(memoryIndex)}
            aria-label={`打开相册，从第 ${memoryIndex + 1} 张开始查看`}
            key={memory.src}
            style={{ position: "relative" }}
          >
            <Image
              src={memory.src}
              alt={memory.alt}
              fill
              sizes="100vw"
              data-source="client"
              data-subject={memory.alt}
            />
            <span className="memory-open" aria-hidden="true">
              ↗
            </span>
          </button>
          );
        })}
      </div>

      {activeIndex !== null && createPortal(
        <div className="memory-lightbox" role="dialog" aria-modal="true" aria-label="记忆切片相册" onMouseDown={() => setActiveIndex(null)}>
          <div className="memory-lightbox-panel" onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className="memory-close" onClick={() => setActiveIndex(null)} aria-label="关闭相册">×</button>

            <div className="memory-lightbox-media">
              <Image
                src={memories[activeIndex].src}
                alt={memories[activeIndex].alt}
                width={1920}
                height={1280}
                sizes="(min-width: 1024px) 72vw, 92vw"
                priority
              />
            </div>

            <button type="button" className="memory-nav memory-nav-left" onClick={showPrevious} aria-label="上一张">‹</button>
            <button type="button" className="memory-nav memory-nav-right" onClick={showNext} aria-label="下一张">›</button>

            <p className="memory-lightbox-count">{String(activeIndex + 1).padStart(2, "0")} / {String(memories.length).padStart(2, "0")}</p>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
