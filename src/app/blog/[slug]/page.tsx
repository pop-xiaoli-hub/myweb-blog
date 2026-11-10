import type { Metadata } from "next";
import Link from "next/link";
import { formatDate, getAllPosts, getPostBySlug } from "@/lib/posts";

type PostPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  return {
    title: post.title,
    description: post.description,
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  return (
    <article className="article-shell">
      <Link href="/blog" className="back-link">
        <span aria-hidden="true">←</span> 返回文章列表
      </Link>

      <header className="article-header" data-enter>
        <p className="article-meta">
          {formatDate(post.date)} · {post.readingTime}
        </p>
        <h1 className="article-title">{post.title}</h1>
        <p className="hero-copy">{post.description}</p>
        <div className="tag-row mt-5">
          {post.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      </header>

      <section className="article-content">
        <div
          className="prose"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </section>
    </article>
  );
}
