import fs from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";

const postsDirectory = path.join(process.cwd(), "content", "posts");

export type PostMeta = {
  slug: string;
  title: string;
  description: string;
  date: string;
  readingTime: string;
  tags: string[];
};

type RawPost = PostMeta & {
  content: string;
};

type PostFile = {
  data: Omit<PostMeta, "slug">;
  body: string;
};

function unquote(value: string) {
  return value.trim().replace(/^["']|["']$/g, "");
}

function parsePostFile(source: string): PostFile {
  const normalized = source.replace(/\r\n?/g, "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);

  if (!match) {
    return {
      data: {
        title: "Untitled",
        description: "",
        date: "1970-01-01",
        readingTime: "",
        tags: [],
      },
      body: normalized,
    };
  }

  const fields: Record<string, string | string[]> = {};
  let currentKey = "";

  for (const line of match[1].split("\n")) {
    const item = line.match(/^\s*-\s+(.+)$/);
    if (item && currentKey) {
      const current = fields[currentKey];
      fields[currentKey] = [
        ...(Array.isArray(current) ? current : []),
        unquote(item[1]),
      ];
      continue;
    }

    const entry = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (!entry) continue;
    currentKey = entry[1];
    fields[currentKey] = entry[2] ? unquote(entry[2]) : [];
  }

  return {
    data: {
      title: String(fields.title ?? "Untitled"),
      description: String(fields.description ?? ""),
      date: String(fields.date ?? "1970-01-01"),
      readingTime: String(fields.readingTime ?? ""),
      tags: Array.isArray(fields.tags) ? fields.tags.map(String) : [],
    },
    body: match[2],
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderInline(value: string) {
  let output = escapeHtml(value);

  output = output.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img src="$2" alt="$1" loading="lazy" />',
  );
  output = output.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noreferrer">$1</a>',
  );
  output = output.replace(/`([^`]+)`/g, "<code>$1</code>");
  output = output.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  return output;
}

function markdownToHtml(markdown: string) {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const output: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    const fence = line.match(/^```([\w-]*)\s*$/);
    if (fence) {
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !/^```\s*$/.test(lines[index])) {
        code.push(lines[index]);
        index += 1;
      }
      index += 1;
      output.push(
        `<pre><code class="language-${escapeHtml(fence[1] || "text")}">${escapeHtml(code.join("\n"))}</code></pre>`,
      );
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      output.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quote.push(lines[index].replace(/^>\s?/, ""));
        index += 1;
      }
      output.push(`<blockquote>${renderInline(quote.join(" "))}</blockquote>`);
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index])) {
        items.push(`<li>${renderInline(lines[index].replace(/^[-*]\s+/, ""))}</li>`);
        index += 1;
      }
      output.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index])) {
        items.push(
          `<li>${renderInline(lines[index].replace(/^\d+\.\s+/, ""))}</li>`,
        );
        index += 1;
      }
      output.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    const paragraph: string[] = [line];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^(#{1,6})\s+|^```|^>\s?|^[-*]\s+|^\d+\.\s+/.test(lines[index])
    ) {
      paragraph.push(lines[index]);
      index += 1;
    }
    output.push(`<p>${paragraph.map(renderInline).join("<br />")}</p>`);
  }

  return output.join("\n");
}

async function readPostFile(slug: string) {
  const fullPath = path.join(postsDirectory, `${slug}.md`);
  const source = await fs.readFile(fullPath, "utf8");
  return parsePostFile(source);
}

export async function getAllPosts(): Promise<PostMeta[]> {
  const files = await fs.readdir(postsDirectory);
  const posts = await Promise.all(
    files
      .filter((file) => file.endsWith(".md"))
      .map(async (file) => {
        const slug = file.replace(/\.md$/, "");
        const { data } = await readPostFile(slug);
        return { slug, ...data } satisfies PostMeta;
      }),
  );

  return posts.sort(
    (first, second) => +new Date(second.date) - +new Date(first.date),
  );
}

export async function getPostBySlug(slug: string) {
  try {
    const { data, body } = await readPostFile(slug);
    return {
      slug,
      ...data,
      content: markdownToHtml(body),
    } satisfies RawPost;
  } catch {
    notFound();
  }
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}
