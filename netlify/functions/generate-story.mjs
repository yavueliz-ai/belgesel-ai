export default async (request) => {
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Sadece POST isteği kabul edilir." }),
      {
        status: 405,
        headers: { "content-type": "application/json; charset=utf-8" }
      }
    );
  }

  try {
    const body = await request.json();
    const topic = String(body.topic || "").trim();
    const sceneCount = Math.min(
      8,
      Math.max(3, Number(body.sceneCount) || 6)
    );

    if (!topic) {
      return new Response(
        JSON.stringify({ error: "Konu girilmedi." }),
        {
          status: 400,
          headers: { "content-type": "application/json; charset=utf-8" }
        }
      );
    }

    const apiKey = Netlify.env.get("POLLINATIONS_API_KEY");

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "POLLINATIONS_API_KEY bulunamadı."
        }),
        {
          status: 500,
          headers: { "content-type": "application/json; charset=utf-8" }
        }
      );
    }

    const prompt = `
Sen profesyonel bir Türkçe kısa belgesel senaristisin.

Konu:
"${topic}"

YouTube Shorts için yaklaşık 45-60 saniyelik,
merak uyandırıcı ve akıcı bir mini belgesel hazırla.

Toplam ${sceneCount} sahne oluştur.

Kurallar:
- Türkçe yaz.
- İlk sahne güçlü bir giriş cümlesiyle izleyiciyi yakalasın.
- Anlatım kısa, doğal ve seslendirmeye uygun olsun.
- Gereksiz tekrar kullanma.
- Tarihsel konuysa uydurma kesin bilgiler ekleme.
- Her sahnenin anlatımı yaklaşık 1-2 kısa cümle olsun.
- Her sahne için ayrıca AI görsel üretimine uygun İngilizce görsel komutu oluştur.
- Görseller dikey 9:16 Shorts kompozisyonuna uygun olsun.
- Görsel komutlarında yazı, logo veya filigran isteme.

SADECE geçerli JSON döndür.
Markdown veya açıklama ekleme.

Şu yapıyı kullan:

{
  "title": "Belgesel başlığı",
  "scenes": [
    {
      "scene": 1,
      "narration": "Türkçe seslendirme metni",
      "imagePrompt": "English cinematic image generation prompt"
    }
  ]
}
`;

    const response = await fetch(
      "https://gen.pollinations.ai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai",
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      return new Response(
        JSON.stringify({
          error: "Metin üretme servisi hata verdi.",
          detail: errorText
        }),
        {
          status: response.status,
          headers: { "content-type": "application/json; charset=utf-8" }
        }
      );
    }

    const data = await response.json();

    let text =
      data?.choices?.[0]?.message?.content || "";

    text = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let story;

    try {
      story = JSON.parse(text);
     } catch (parseError) {
    return new Response(
      JSON.stringify({
        error: "Hikaye verisi okunamadı.",
        detail: text
      }),
      {
        status: 500,
        headers: { "content-type": "application/json; charset=utf-8" }
      }
    );
  }

  return new Response(
    JSON.stringify(story),
    {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8" }
    }
  );

} catch (error) {
  return new Response(
    JSON.stringify({
      error: "Hikaye oluşturulurken hata oluştu.",
      detail: error.message
    }),
    {
      status: 500,
      headers: { "content-type": "application/json; charset=utf-8" }
    }
  );
}
};
