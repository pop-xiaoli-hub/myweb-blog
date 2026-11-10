import Link from "next/link";

export const metadata = {
  title: "关于",
  description: "关于 popxiaoli：一位专注 iOS 与 Objective-C 的开发者。",
};

const principles = [
  {
    number: "01",
    title: "Understand the layer below",
    body: "从 Mach-O 到 Runtime，先把系统真正如何工作弄清楚，再谈优化。",
  },
  {
    number: "02",
    title: "Write down the useful parts",
    body: "把踩过的坑、读过的源码和最后形成的判断，整理成可以回看的笔记。",
  },
  {
    number: "03",
    title: "Keep the interface calm",
    body: "好的软件不应该让人紧张。清晰的结构、稳定的节奏和轻量的交互更重要。",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="page-hero about-hero" data-enter>
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">About the author</p>
            <h1>An iOS developer&apos;s notebook.</h1>
          </div>
          <p className="page-lead">
            popxiaoli 关注 Objective-C、iOS
            启动性能和运行时实现，也在持续整理那些值得反复阅读的工程细节。
          </p>
        </div>
      </section>

      <section className="section about-section">
        <div className="container about-grid">
          <div className="about-statement">
            <p>
              这个站点是一本持续更新的工程笔记。内容从系统底层开始，最后回到真实产品里那些容易被忽略的选择。
            </p>
            <p>
              如果你也喜欢把问题追到源码、把复杂概念讲清楚，欢迎从文章开始读起。
            </p>
            <Link href="/blog" className="btn btn--primary">
              Read the blog
            </Link>
          </div>

          <div className="principle-list">
            {principles.map((item) => (
              <div className="principle" key={item.number}>
                <span>{item.number}</span>
                <div>
                  <h2>{item.title}</h2>
                  <p>{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
