// Grava o dados.json (Netlify Blobs). Sem login: a página /dados.html é de acesso direto.
import { getStore } from "@netlify/blobs";

// Dados fixos: mantenha igual ao PADRAO do atualizar.py.
const PADRAO = {
  premio: "Yamaha Fazer 250cc 2025/2025",
  totalNumeros: 999,
  valorNumero: 50,
  dataSorteio: "2026-12-20",
  atualizadoEm: null,
  contato: { telefone: "(91) 98563-0059", whatsapp: "5591985630059" },
  moto: {
    imagem: null,
    detalhes: [
      "Será entregue selada e transferida para o nome do novo proprietário",
      "Moto seminova, com apenas 6.000 km rodados",
      "Ano/modelo: 2025/2025",
      "Yamaha Fazer 250cc",
      "Combustível: gasolina",
      "Cor: branca",
    ],
  },
  loteria: { nome: "Loteria Federal", digitos: 3 },
  regras: [
    "Números só serão confirmados mediante a comprovação do pagamento.",
    "Informações e pagamentos serão apenas no número (91) 98563-0059. Não caia em golpes!",
    "Se todos os números forem comprados antes do dia 20/12/2026, faremos a antecipação do sorteio e divulgaremos a nova data no grupo.",
    "O sorteio será pela Loteria Federal: valem os 3 últimos números do 1º prêmio. Por exemplo, quem comprar o número 1.000 será válido pelo número 000.",
  ],
};

const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { "content-type": "application/json", "cache-control": "no-store" } });

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);
  try {
    const body = await req.json();
    // Revalida no servidor: 4 dígitos, 0001..0999, sem repetir, ordenado.
    const lista = [...new Set((Array.isArray(body.disponiveis) ? body.disponiveis : [])
      .map(String).filter((s) => /^\d{4}$/.test(s)).map(Number)
      .filter((n) => n >= 1 && n <= PADRAO.totalNumeros))]
      .sort((a, b) => a - b).map((n) => String(n).padStart(4, "0"));
    if (!lista.length) return json({ error: "Lista vazia: nada foi alterado" }, 400);

    const store = getStore({ name: "sorteio", consistency: "strong" });
    let atual = null;
    try { atual = JSON.parse(await store.get("dados")); } catch {}
    if (!atual) { try { atual = await (await fetch(new URL("/dados-inicial.json", req.url))).json(); } catch {} }

    const dados = structuredClone(PADRAO);
    dados.moto.imagem = atual?.moto?.imagem ?? null; // preserva a imagem cadastrada
    dados.atualizadoEm = new Date().toISOString();
    dados.disponiveis = lista;
    await store.set("dados", JSON.stringify(dados, null, 2) + "\n");
    return json({ ok: true, disponiveis: lista.length, atualizadoEm: dados.atualizadoEm });
  } catch (e) {
    console.error(e);
    return json({ error: "Erro interno" }, 500);
  }
};
