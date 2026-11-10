import Image from "next/image";
import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export default async function Home() {
  const posts = await getAllPosts();
  const latestPost = posts[0];

  return (
    <section className="entry-hub" aria-labelledby="hub-title">
      <div className="container hub-intro">
        <div>
          <p className="eyebrow">popxiaoli&apos;s notebook</p>
          <h1 id="hub-title">Nothing is impossible.</h1>
        </div>
        <p>
          Code notes, photographs, and a place to ask questions. Everything begins
          here, without the long scroll.
        </p>
      </div>

      <div className="container entry-board">
        <div className="entry-grid">
          <Link href="/blog" className="entry-card entry-writing">
          <div className="entry-topline">
            <span>01</span>
            <span>Writing</span>
          </div>
          <div className="entry-writing-main">
            <h2>iOS notes and essays</h2>
            <p>
              Objective-C, launch performance and runtime details, written as
              long-form notes.
            </p>
          </div>
          {latestPost && (
            <div className="latest-note">
              <span>Latest</span>
              <strong>{latestPost.title}</strong>
              <span aria-hidden="true">↗</span>
            </div>
          )}
          </Link>

          <Link href="/memories" className="entry-card entry-memory">
          <Image
            src="/images/memories/memory-08.jpg"
            alt="树梢与蓝天下的建筑"
            fill
            sizes="(min-width: 1024px) 42vw, 100vw"
            data-source="client"
            data-subject="Blue sky and a cloud framed by trees and a building"
          />
          <div className="entry-memory-copy">
            <div className="entry-topline">
              <span>02</span>
              <span>Memory</span>
            </div>
            <div>
              <h2>记忆切片</h2>
              <p>Ten photographs, kept between the lines.</p>
            </div>
          </div>
          </Link>

          <Link href="/assistant" className="entry-card entry-assistant">
          <div className="entry-topline">
            <span>03</span>
            <span>Assistant</span>
          </div>
          <h2>Ask the notebook</h2>
          <div className="mini-chat" aria-hidden="true">
            <span>weak 和 SideTable 是什么关系？</span>
            <span>Runtime 通过 SideTable 管理对象与弱引用。</span>
          </div>
          </Link>

          <Link href="/about" className="entry-card entry-about">
          <div className="entry-topline">
            <span>04</span>
            <span>About</span>
          </div>
          <h2>popxiaoli</h2>
          <p>An iOS developer who likes to understand the layer below.</p>
          <span className="entry-arrow" aria-hidden="true">↗</span>
          </Link>

          <article className="entry-card entry-essay">
            <div className="entry-topline">
              <span>05</span>
              <span>随笔</span>
            </div>
            <blockquote>
              “死是一件不必急于求成的事，死是一个必然会降临的节日。”
            </blockquote>
            <footer>史铁生 ·《我与地坛》</footer>
          </article>
        </div>
      </div>
    </section>
  );
}
