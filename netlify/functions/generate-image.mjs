export default async (req) => {

  try{

    if(req.method !== "POST"){

      return new Response(
        "Sadece POST isteği kabul edilir.",
        {
          status:405
        }
      );

    }

    const apiKey =
      Netlify.env.get(
        "POLLINATIONS_API_KEY"
      );

    if(!apiKey){

      return new Response(
        "Pollinations API anahtarı bulunamadı.",
        {
          status:500
        }
      );

    }

    const body =
      await req.json();

    const topic =
      String(
        body.topic || ""
      ).trim();

    const scene =
      String(
        body.scene || ""
      ).trim();

    if(!scene){

      return new Response(
        "Sahne açıklaması bulunamadı.",
        {
          status:400
        }
      );

    }

    const prompt = `
${scene}

Topic: ${topic}.

Photorealistic cinematic documentary still.
Historically believable environment when applicable.
Historically inspired accurate clothing when applicable.
Realistic human anatomy.
Natural facial expressions.
Natural cinematic lighting.
Rich environmental detail.
Professional documentary cinematography.
Dramatic depth and atmosphere.
Vertical YouTube Shorts framing.
Portrait composition.
9:16 aspect ratio.
No text.
No subtitles.
No letters.
No logo.
No watermark.
`.trim();

    const url =
      "https://gen.pollinations.ai/image/" +
      encodeURIComponent(prompt) +
      "?model=flux" +
      "&width=768" +
      "&height=1365" +
      "&nologo=true";

    const response =
      await fetch(
        url,
        {
          headers:{
            Authorization:
              `Bearer ${apiKey}`
          }
        }
      );

    if(!response.ok){

      const error =
        await response.text();

      return new Response(
        error ||
        "Görsel üretilemedi.",
        {
          status:response.status
        }
      );

    }

    const image =
      await response.arrayBuffer();

    return new Response(
      image,
      {
        status:200,
        headers:{
          "Content-Type":
            response.headers.get(
              "content-type"
            ) ||
            "image/jpeg",

          "Cache-Control":
            "no-store"
        }
      }
    );

  }catch(error){

    return new Response(
      "Sunucu hatası: " +
      (
        error?.message ||
        "Bilinmeyen hata"
      ),
      {
        status:500
      }
    );

  }

};
