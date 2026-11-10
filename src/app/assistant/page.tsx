import Link from "next/link";
import AIChat from "@/components/ai-chat";

export const metadata = {
  title: "AI 助手",
  description: "向 popxiaoli 的 AI 助手提问 iOS、Objective-C 与 Runtime 问题。",
};

export default function AssistantPage() {
  return (
    <>
      <section className="detail-hero" data-enter>
        <div className="container detail-hero-grid">
          <div>
            <p className="eyebrow">Assistant</p>
            <h1>Ask the notebook.</h1>
          </div>
          <div className="detail-copy">
            <p>
              Ask about an article, a runtime detail, or a problem you are working
              through.
            </p>
            <Link href="/" className="back-link">
              <span aria-hidden="true">←</span> 返回首页
            </Link>
          </div>
        </div>
      </section>
      <section className="section assistant-page">
        <div className="container assistant-page-grid">
          <div className="assistant-page-notes">
            <p className="eyebrow">Try asking</p>
            <p>weak 对象的生命周期是如何管理的？</p>
            <p>启动优化应该先从 pre-main 还是 main 阶段开始？</p>
            <p>Objective-C 的 SideTable 为什么需要分片？</p>
          </div>
          <div className="chat-shell chat-shell--page">
            <AIChat />
          </div>
        </div>
      </section>
    </>
  );
}
