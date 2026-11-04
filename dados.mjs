// Serve o dados.json atual (guardado no Netlify Blobs). Se ainda não houve atualização
// pelo admin, usa o dados.json que acompanha o site.
import { getStore } from "@netlify/blobs";

export default async (req) => {
  try {
    const store = getStore({ name: "sorteio", consistency: "strong" });
    let body = await store.get("dados");
    if (!body) {
      const r = await fetch(new URL("/dados.json", req.url));
      if (!r.ok) throw new Error("dados.json não encontrado");
      body = await r.text();
    }
    return new Response(body, { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Falha ao ler os dados" }), { status: 500, headers: { "content-type": "application/json" } });
  }
};
