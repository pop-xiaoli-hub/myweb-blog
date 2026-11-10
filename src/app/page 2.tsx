import Image from "next/image";
import Link from "next/link";
import AIChat from "@/components/ai-chat";
import MemoryGallery from "@/components/memory-gallery";
import { formatDate, getAllPosts } from "@/lib/posts";

const topics = [
  {
    number: "01",
    title: "Launch performance",
    description:
      "How an app gets from a tap on the icon to its first useful frame.",
    tag: "Mach-O · dyld",
  },
  {
    number: "02",
    title: "Runtime details",
    description:
      "Objective-C internals explained from the structures that make them work.",
    tag: "weak · SideTable",
  },
  {
    number: "03",
    title: "Working notes",
    description:
      "Small engineering decisions that make an app calmer to build and use.",
    tag: "Craft · Process",
  },
];

export default async function Home() {
  const posts = await getAllPosts();

  return (
    <>
      <section className="hero" data-enter aria-labelledby="hero-title">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="hero-kicker">
              <span className="status-dot" aria-hidden="true" />
              An iOS notebook · 2 long-form essays
            </p>
            <h1 id="hero-title">iOS development notes by popxiaoli</h1>
            <p className="hero-lead">
              Long-form notes on Objective-C, app launch performance and the
              details that make iOS software feel finished.
            </p>
            <div className="btn-row">
              <Link href="/blog" className="btn btn--primary">
                Read the blog
                <svg className="m-arrow" viewBox="0 0 12 12" aria-hidden="true">
                  <path className="m-arrow__stem" d="M1 6h8" />
                  <path className="m-arrow__head" d="M4.5 2.5 8 6l-3.5 3.5" />
                </svg>
              </Link>
              <Link href="/about" className="btn btn--secondary">
                About popxiaoli
              </Link>
            </div>
            <dl className="hero-facts">
              <div>
                <dt>Focus</dt>
                <dd>iOS</dd>
              </div>
              <div>
                <dt>Language</dt>
                <dd>Objective-C</dd>
              </div>
              <div>
                <dt>Latest</dt>
                <dd>weak 底层实现</dd>
              </div>
            </dl>
          </div>

          <figure className="hero-visual" style={{ position: "relative" }}>
            <Image
              src="/images/site-background.jpg"
              alt="暮色中的城市天际线与河面倒影"
              fill
              priority
              sizes="(min-width: 1024px) 48vw, 92vw"
              data-source="client"
              data-subject="City skyline at sunset beside a river"
            />
            <div className="hero-note">
              <span>Now reading</span>
              <strong>weak 底层实现</strong>
              <small>10 min read</small>
            </div>
          </figure>
        </div>
      </section>

      <section className="section writing-section" id="writing">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Essays</p>
              <h2>Recent writing</h2>
            </div>
            <p className="section-aside">
              Two essays on startup time and the Objective-C runtime.
            </p>
          </div>

          <div className="post-list">
            {posts.map((post, index) => (
              <article className="post-row" key={post.slug}>
                <span className="post-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="post-row-main">
                  <div className="post-meta">
                    <span>{formatDate(post.date)}</span>
                    <span>{post.readingTime}</span>
                  </div>
                  <h3>
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h3>
                  <p>{post.description}</p>
                </div>
                <div className="post-row-end">
                  <div className="tag-row">
                    {post.tags.slice(0, 2).map((tag) => (
                      <span className="tag" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Link href={`/blog/${post.slug}`} className="text-link">
                    Read essay
                    <span aria-hidden="true">↗</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section topics-section">
        <div className="container topics-grid">
          <div className="topics-intro">
            <p className="eyebrow">The notebook</p>
            <h2>Code, runtime and the work around it.</h2>
            <p>
              The writing follows the parts of iOS development that reward a
              closer look: how the system loads an app, how the runtime keeps
              objects alive, and how small decisions accumulate in a product.
            </p>
          </div>

          <div className="code-visual" aria-label="Objective-C weak reference example">
            <div className="code-visual-top">
              <span />
              <span />
              <span />
              <small>weak.m</small>
            </div>
            <pre>
              <code>
                <span className="code-muted">
                  {"// A weak reference, kept alive by the runtime."}
                </span>
                {"\n"}
                <span className="code-blue">__weak</span>{" id owner = "}
                <span className="code-string">[[Owner alloc] init]</span>;{"\n\n"}
                <span className="code-muted">
                  {"// The object lives in SideTable."}
                </span>
                {"\n"}
                <span className="code-blue">weak_register_no_lock</span>
                {"(&table, owner, &location);"}
              </code>
            </pre>
          </div>

          <div className="topic-list">
            {topics.map((topic) => (
              <div className="topic-row" key={topic.number}>
                <span className="topic-number">{topic.number}</span>
                <div>
                  <h3>{topic.title}</h3>
                  <p>{topic.description}</p>
                </div>
                <span className="topic-tag">{topic.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section memories-section" id="memories">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Fragments of memory</p>
              <h2>记忆切片</h2>
            </div>
            <p className="section-aside">
              Ten photographs collected away from the screen.
            </p>
          </div>
          <MemoryGallery />
        </div>
      </section>

      <section className="section assistant-section" id="assistant">
        <div className="container assistant-grid">
          <div className="assistant-copy">
            <p className="eyebrow">Ask the notebook</p>
            <h2>Questions about iOS and Objective-C?</h2>
            <p>
              The assistant is built into this site. Ask about launch time,
              runtime internals or a problem you are working through.
            </p>
            <div className="assistant-note">
              <span className="status-dot" aria-hidden="true" />
              Powered by DeepSeek
            </div>
          </div>
          <div className="chat-shell">
            <AIChat />
          </div>
        </div>
      </section>
    </>
  );
}
