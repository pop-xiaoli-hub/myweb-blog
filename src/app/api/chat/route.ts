import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const SYSTEM_PROMPT = `你是 popxiaoli 个人博客里的 AI 助手。请友好、准确、简洁地回答问题。
你尤其擅长 iOS 开发、Objective-C、UIKit、调试和软件工程。如果不确定答案，请坦诚说明。`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI 服务尚未配置，请联系站点管理员。" },
      { status: 503 },
    );
  }

  let body: { messages?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式不正确。" }, { status: 400 });
  }

  if (!Array.isArray(body.messages)) {
    return NextResponse.json({ error: "消息不能为空。" }, { status: 400 });
  }

  const messages = body.messages
    .filter(
      (message): message is ChatMessage =>
        typeof message === "object" &&
        message !== null &&
        (message as ChatMessage).role !== undefined &&
        ["user", "assistant"].includes((message as ChatMessage).role) &&
        typeof (message as ChatMessage).content === "string",
    )
    .slice(-12)
    .map((message) => ({
      role: message.role,
      content: message.content.trim().slice(0, 4000),
    }))
    .filter((message) => message.content.length > 0);

  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return NextResponse.json({ error: "请输入有效的消息。" }, { status: 400 });
  }

  try {
    const deepSeekResponse = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        stream: true,
        max_tokens: 1200,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!deepSeekResponse.ok || !deepSeekResponse.body) {
      console.error("DeepSeek request failed:", deepSeekResponse.status);
      const status = deepSeekResponse.status === 401 ? 503 : 502;
      return NextResponse.json(
        { error: status === 503 ? "AI 服务配置无效，请联系站点管理员。" : "AI 服务暂时不可用，请稍后再试。" },
        { status },
      );
    }

    return new Response(deepSeekResponse.body, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("DeepSeek connection error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "连接 AI 服务超时，请稍后再试。" }, { status: 504 });
  }
}
