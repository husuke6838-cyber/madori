import { NextResponse, type NextRequest } from "next/server";

/**
 * GET /api/og?url=https://example.com
 * 指定 URL の HTML を取得して OGP メタタグを抽出する。
 * - サーバ側fetchなので CORS の影響を受けない
 * - 5秒タイムアウト・1MB 上限・テキスト系MIMEのみ
 * - 取得失敗時はエラーではなく空フィールドで 200 を返す
 *   （クライアントは "プレーンリンク" として登録すればよい）
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "missing url" }, { status: 400 });
  }
  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }

  try {
    const ac = new AbortController();
    const to = setTimeout(() => ac.abort(), 5000);
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; IezukuriNoteBot/1.0; +https://example.com/bot)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: ac.signal,
      redirect: "follow",
    }).finally(() => clearTimeout(to));

    if (!res.ok) {
      return NextResponse.json({ url, title: null, image: null, description: null });
    }
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("text/html") && !ct.includes("xhtml")) {
      return NextResponse.json({ url, title: null, image: null, description: null });
    }

    // 上限 1MB だけ読む
    const reader = res.body?.getReader();
    if (!reader) {
      return NextResponse.json({ url, title: null, image: null, description: null });
    }
    const decoder = new TextDecoder("utf-8", { fatal: false });
    let html = "";
    let received = 0;
    while (received < 1_000_000) {
      const { value, done } = await reader.read();
      if (done) break;
      received += value.length;
      html += decoder.decode(value, { stream: true });
      if (html.includes("</head>")) break; // head さえあれば十分
    }

    const og = parseOg(html, url);
    return NextResponse.json(og);
  } catch {
    return NextResponse.json({
      url,
      title: null,
      image: null,
      description: null,
    });
  }
}

function parseOg(html: string, baseUrl: string) {
  const meta = (key: string) => {
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["']${escapeRe(key)}["'][^>]*>`,
      "i"
    );
    const m = html.match(re);
    if (!m) return null;
    const content = m[0].match(/content=["']([^"']*)["']/i);
    return content ? decodeEntities(content[1]) : null;
  };
  const titleTag = (() => {
    const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    return m ? decodeEntities(m[1].trim()) : null;
  })();

  const title = meta("og:title") || meta("twitter:title") || titleTag;
  let image = meta("og:image") || meta("twitter:image");
  if (image && !image.startsWith("http")) {
    try {
      image = new URL(image, baseUrl).toString();
    } catch {
      image = null;
    }
  }
  const description =
    meta("og:description") || meta("twitter:description") || meta("description");

  let host = "";
  try {
    host = new URL(baseUrl).hostname.replace(/^www\./, "");
  } catch {}

  return {
    url: baseUrl,
    title: title || host || baseUrl,
    image: image || null,
    description: description || null,
    site: host,
  };
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function decodeEntities(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
}
