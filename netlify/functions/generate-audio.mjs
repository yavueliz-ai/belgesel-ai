const TTS_BASE_URL = "https://turkish-tts.onrender.com";

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

export default async (request) => {
  if (request.method !== "POST") {
    return jsonResponse(
      { error: "Sadece POST isteği destekleniyor." },
      405
    );
  }

  try {
    const body = await request.json();

    // Hem eski frontend'i hem yeni tek-metin sistemini destekle.
    let text = "";

    if (typeof body.text === "string") {
      text = body.text.trim();
    }

    if (!text && Array.isArray(body.texts)) {
      text = body.texts
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .join(" ");
    }

    if (!text) {
      return jsonResponse(
        { error: "Seslendirilecek metin bulunamadı." },
        400
      );
    }

    // Aşırı uzun/bozuk girdilere karşı koruma.
    if (text.length > 8000) {
      return jsonResponse(
        { error: "Seslendirme metni çok uzun." },
        400
      );
    }

    /*
      Render Free servis uykuya geçmiş olabilir.
      Önce ana sayfaya kısa bir istek göndererek uyandırmayı deniyoruz.
      Başarısız olması TTS işlemini durdurmaz.
    */
    try {
      await fetch(TTS_BASE_URL + "/", {
        method: "GET",
        signal: AbortSignal.timeout(90000)
      });
    } catch (wakeError) {
      console.log("Render uyandırma isteği:", wakeError.message);
    }

    /*
      Tek TTS isteği.
      Böylece 6 sahne için 6 ayrı Render çağrısı yapmak yerine
      bütün anlatımı tek WAV dosyasına dönüştürebiliriz.
    */
    const ttsResponse = await fetch(
      TTS_BASE_URL + "/generate-speech",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "audio/wav"
        },

        body: JSON.stringify({
          text,
          language: "tr-TR",
          speaker: "dfki"
        }),

        signal: AbortSignal.timeout(240000)
      }
    );

    if (!ttsResponse.ok) {
      const detail = await ttsResponse.text();

      console.error(
        "Render TTS hatası:",
        ttsResponse.status,
        detail
      );

      return jsonResponse(
        {
          error: "Türkçe ses oluşturulamadı.",
          status: ttsResponse.status,
          detail
        },
        502
      );
    }

    const audioBuffer = await ttsResponse.arrayBuffer();

    if (!audioBuffer || audioBuffer.byteLength === 0) {
      return jsonResponse(
        { error: "TTS servisi boş ses dosyası döndürdü." },
        502
      );
    }

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Disposition":
          'inline; filename="belgesel-anlatim.wav"',
        "Content-Length": String(audioBuffer.byteLength),
        "Cache-Control": "no-store"
      }
    });

  } catch (error) {
    console.error("generate-audio hatası:", error);

    const timeout =
      error?.name === "TimeoutError" ||
      error?.name === "AbortError";

    return jsonResponse(
      {
        error: timeout
          ? "Seslendirme servisi zaman aşımına uğradı."
          : "Seslendirme sırasında sunucu hatası oluştu.",
        detail: error?.message || String(error)
      },
      timeout ? 504 : 500
    );
  }
};
