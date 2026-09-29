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

    const text =
      String(
        body.text || ""
      ).trim();

    const allowedVoices = [
      "nova",
      "alloy",
      "echo",
      "fable",
      "onyx",
      "shimmer"
    ];

    let voice =
      String(
        body.voice || "nova"
      ).trim();

    if(
      !allowedVoices.includes(voice)
    ){
      voice = "nova";
    }

    if(!text){

      return new Response(
        "Seslendirilecek metin bulunamadı.",
        {
          status:400
        }
      );

    }

    const url =
      "https://gen.pollinations.ai/audio/" +
      encodeURIComponent(text) +
      "?voice=" +
      encodeURIComponent(voice);

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
        "Ses oluşturulamadı.",
        {
          status:response.status
        }
      );

    }

    const audio =
      await response.arrayBuffer();

    return new Response(
      audio,
      {
        status:200,
        headers:{
          "Content-Type":
            response.headers.get(
              "content-type"
            ) ||
            "audio/mpeg",

          "Cache-Control":
            "no-store"
        }
      }
    );

  }catch(error){

    return new Response(
      "Ses sunucusu hatası: " +
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
