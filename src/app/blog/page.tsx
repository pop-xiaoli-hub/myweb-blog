import Link from "next/link";
import { formatDate, getAllPosts } from "@/lib/posts";

export const metadata = {
  title: "博客",
  description: "iOS、Objective-C、启动优化与 Runtime 的长文笔记。",
};

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <>
      <section className="page-hero" data-enter>
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">All writing</p>
            <h1>iOS development, written down.</h1>
          </div>
          <p className="page-lead">
            {posts.length} 篇长文，记录 Objective-C、启动优化和 iOS Runtime
            的底层细节。
          </p>
        </div>
      </section>

      <section className="section archive-section">
        <div className="container">
          <div className="archive-grid">
            {posts.map((post, index) => (
              <article className="archive-card" key={post.slug}>
                <div className="archive-card-top">
                  <span className="archive-index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="post-meta">
                    <span>{formatDate(post.date)}</span>
                    <span>{post.readingTime}</span>
                  </div>
                </div>
                <h2>
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>
                <p>{post.description}</p>
                <div className="tag-row">
                  {post.tags.map((tag) => (
                    <span className="tag" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
                <Link href={`/blog/${post.slug}`} className="text-link">
                  Read essay
                  <span aria-hidden="true">↗</span>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
