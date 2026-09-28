export default async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Sadece POST isteği kabul edilir.", {
        status: 405
      });
    }

    const apiKey = process.env.POLLINATIONS_API_KEY;

    if (!apiKey) {
      return new Response("Pollinations API anahtarı bulunamadı.", {
        status: 500
      });
    }

    const { topic = "", scene = "" } = await req.json();

    const prompt = `
Photorealistic cinematic historical documentary.
Topic: ${topic}
Scene: ${scene}
Historically inspired clothing and environment.
Natural lighting, realistic details, no text, no watermark.
Vertical composition for YouTube Shorts, 9:16.
`.trim();

    const url =
      "https://gen.pollinations.ai/image/" +
      encodeURIComponent(prompt) +
      "?model=flux&width=768&height=1365&nologo=true";

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      const error = await response.text();
      return new Response(error || "Görsel üretilemedi.", {
        status: response.status
      });
    }

    const image = await response.arrayBuffer();

    return new Response(image, {
      status: 200,
      headers: {
        "Content-Type":
          response.headers.get("content-type") || "image/jpeg",
        "Cache-Control": "no-store"
      }
    });

  } catch (error) {
    return new Response(
      "Sunucu hatası: " + (error?.message || "Bilinmeyen hata"),
      { status: 500 }
    );
  }
};
