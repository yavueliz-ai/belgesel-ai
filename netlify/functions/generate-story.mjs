export default async (request) => {

  const jsonHeaders = {
    "content-type":
      "application/json; charset=utf-8"
  };

  if(request.method !== "POST"){

    return new Response(
      JSON.stringify({
        error:"Sadece POST isteği kabul edilir."
      }),
      {
        status:405,
        headers:jsonHeaders
      }
    );

  }

  try{

    const body =
      await request.json();

    const topic =
      String(body.topic || "").trim();

    const sceneCount =
      Math.min(
        8,
        Math.max(
          3,
          Number(body.sceneCount) || 6
        )
      );

    if(!topic){

      return new Response(
        JSON.stringify({
          error:"Konu girilmedi."
        }),
        {
          status:400,
          headers:jsonHeaders
        }
      );

    }

    const apiKey =
      Netlify.env.get(
        "POLLINATIONS_API_KEY"
      );

    if(!apiKey){

      return new Response(
        JSON.stringify({
          error:
            "POLLINATIONS_API_KEY bulunamadı."
        }),
        {
          status:500,
          headers:jsonHeaders
        }
      );

    }

    const prompt = `
Sen profesyonel bir Türkçe kısa belgesel senaristisin.

KONU:
"${topic}"

YouTube Shorts için yaklaşık 45-60 saniyelik,
merak uyandırıcı, sürükleyici ve anlaşılır
bir mini belgesel oluştur.

Toplam ${sceneCount} sahne hazırla.

ÇOK ÖNEMLİ KURALLAR:

- Türkçe anlatım kullan.
- İlk sahne güçlü bir merak cümlesiyle başlasın.
- İzleyiciyi ilk birkaç saniyede yakala.
- Her sahne yaklaşık 1-2 kısa cümle olsun.
- Cümleler Türkçe seslendirmeye uygun olsun.
- Gereksiz tekrar yapma.
- Son sahne güçlü bir kapanış olsun.
- Tarihsel olaylarda bilinen gerçeklerle çelişen
  uydurma ayrıntıları kesin gerçekmiş gibi yazma.
- Efsane veya tartışmalı bir bilgi varsa bunu
  kesin tarihsel gerçek gibi sunma.
- Şiddet varsa belgesel bağlamında ve grafik
  olmayan biçimde anlat.
- Her sahne için İngilizce görsel üretim promptu yaz.
- Aynı tarihsel kişinin farklı sahnelerde
  görünmesi durumunda görünüş ve kıyafet
  tutarlılığını korumaya çalış.
- Görsel promptu sahnedeki olayı açıkça anlatsın.
- Cinematic documentary görünümü kullan.
- Dikey 9:16 kompozisyon iste.
- Görsellerde yazı, altyazı, logo ve filigran olmasın.

SADECE geçerli JSON döndür.

Markdown kullanma.
Kod bloğu kullanma.
JSON dışında hiçbir açıklama yazma.

ŞEMA:

{
  "title":"Belgesel başlığı",
  "scenes":[
    {
      "scene":1,
      "narration":"Türkçe seslendirme metni",
      "imagePrompt":"English detailed cinematic documentary image prompt"
    }
  ]
}
`.trim();

    const response =
      await fetch(
        "https://gen.pollinations.ai/v1/chat/completions",
        {
          method:"POST",
          headers:{
            "Authorization":
              `Bearer ${apiKey}`,
            "Content-Type":
              "application/json"
          },
          body:JSON.stringify({
            model:"openai",
            messages:[
              {
                role:"user",
                content:prompt
              }
            ],
            temperature:0.65
          })
        }
      );

    if(!response.ok){

      const errorText =
        await response.text();

      return new Response(
        JSON.stringify({
          error:
            "Metin üretme servisi hata verdi.",
          detail:errorText
        }),
        {
          status:response.status,
          headers:jsonHeaders
        }
      );

    }

    const data =
      await response.json();

    let text =
      data?.choices?.[0]?.message?.content || "";

    text =
      text
      .replace(/```json/gi,"")
      .replace(/```/g,"")
      .trim();

    const firstBrace =
      text.indexOf("{");

    const lastBrace =
      text.lastIndexOf("}");

    if(
      firstBrace !== -1 &&
      lastBrace !== -1
    ){

      text =
        text.slice(
          firstBrace,
          lastBrace+1
        );

    }

    let story;

    try{

      story =
        JSON.parse(text);

    }catch{

      return new Response(
        JSON.stringify({
          error:
            "Hikaye verisi okunamadı.",
          detail:text
        }),
        {
          status:500,
          headers:jsonHeaders
        }
      );

    }

    if(
      !story ||
      !Array.isArray(story.scenes)
    ){

      return new Response(
        JSON.stringify({
          error:
            "AI geçerli sahne listesi döndürmedi."
        }),
        {
          status:500,
          headers:jsonHeaders
        }
      );

    }

    story.scenes =
      story.scenes
      .slice(0,sceneCount)
      .map(
        (scene,index)=>({
          scene:index+1,
          narration:
            String(
              scene.narration || ""
            ).trim(),
          imagePrompt:
            String(
              scene.imagePrompt || ""
            ).trim()
        })
      );

    return new Response(
      JSON.stringify(story),
      {
        status:200,
        headers:jsonHeaders
      }
    );

  }catch(error){

    return new Response(
      JSON.stringify({
        error:
          "Hikaye oluşturulurken hata oluştu.",
        detail:
          error?.message ||
          "Bilinmeyen hata"
      }),
      {
        status:500,
        headers:jsonHeaders
      }
    );

  }

};
