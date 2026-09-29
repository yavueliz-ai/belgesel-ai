export default async (request) => {
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Sadece POST isteği destekleniyor." }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  try {
    const body = await request.json();

    const text = String(body.text || "").trim();

    if (!text) {
      return new Response(
        JSON.stringify({ error: "Seslendirilecek metin bulunamadı." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const TTS_URL =
      "https://turkish-tts.onrender.com/generate-speech";

    const response = await fetch(TTS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: text,
        language: "tr-TR",
        speaker: "dfki"
      })
    });

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        "Render TTS hatası:",
        response.status,
        errorText
      );

      return new Response(
        JSON.stringify({
          error: "Türkçe ses oluşturulamadı.",
          status: response.status,
          detail: errorText
        }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Disposition": 'inline; filename="belgesel-ses.wav"',
        "Cache-Control": "no-store"
      }
    });

  } catch (error) {
    console.error("generate-audio hatası:", error);

    return new Response(
      JSON.stringify({
        error: "Seslendirme sırasında sunucu hatası oluştu.",
        detail: error.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
