import Link from "next/link";
import MemoryGallery from "@/components/memory-gallery";

export const metadata = {
  title: "记忆切片",
  description: "popxiaoli 的十张照片记忆切片。",
};

export default function MemoriesPage() {
  return (
    <>
      <section className="detail-hero" data-enter>
        <div className="container detail-hero-grid">
          <div>
            <p className="eyebrow">Memory</p>
            <h1>记忆切片</h1>
          </div>
          <div className="detail-copy">
            <p>Ten photographs, kept between the lines.</p>
            <Link href="/" className="back-link">
              <span aria-hidden="true">←</span> 返回首页
            </Link>
          </div>
        </div>
      </section>
      <section className="section memories-page">
        <div className="container">
          <MemoryGallery />
        </div>
      </section>
    </>
  );
}
