import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Play } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { midiaQuery, isVideoPath, type MidiaItem } from "@/lib/queries";
import type { CategoriaRow, PecaRow } from "@/lib/collection";

async function abrirFichaTecnica(path: string) {
  const { data, error } = await supabase.storage.from("documentos").createSignedUrl(path, 600);
  if (error || !data?.signedUrl) {
    toast.error("Não foi possível abrir o documento.");
    return;
  }
  window.open(data.signedUrl, "_blank", "noopener");
}

function Campo({ rotulo, valor }: { rotulo: string; valor?: string | null }) {
  if (!valor) return null;
  return (
    <div className="border-b border-border/60 py-3 last:border-b-0">
      <dt className="label-caps">{rotulo}</dt>
      <dd className="mt-1 text-sm whitespace-pre-line text-foreground">{valor}</dd>
    </div>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="plate p-5 sm:p-6">
      <h2 className="text-xl">{titulo}</h2>
      <hr className="gilt-rule my-4" />
      <dl>{children}</dl>
    </section>
  );
}

const rotuloEstado: Record<string, string> = {
  excelente: "Excelente",
  bom: "Bom",
  razoavel: "Razoável",
  fragil: "Frágil",
  danificado: "Danificado",
  restaurado: "Restaurado",
};

const rotuloRaridade: Record<string, string> = {
  comum: "Comum",
  incomum: "Incomum",
  raro: "Raro",
  muito_raro: "Muito raro",
  unico: "Peça única",
};

const rotuloAutenticidade: Record<string, string> = {
  por_avaliar: "Por avaliar",
  autenticada: "Autenticada",
  atribuida: "Atribuída",
  replica: "Réplica",
  duvidosa: "Duvidosa",
};

function humanizar(mapa: Record<string, string>, valor?: string | null) {
  if (!valor) return null;
  return mapa[valor] ?? valor.replace(/_/g, " ");
}

function dimensoesLegiveis(peca: PecaRow) {
  if (peca.dimensoes) return peca.dimensoes;
  const partes = [
    peca.altura_cm ? `A ${peca.altura_cm} cm` : null,
    peca.largura_cm ? `L ${peca.largura_cm} cm` : null,
    peca.profundidade_cm ? `P ${peca.profundidade_cm} cm` : null,
  ].filter(Boolean);
  return partes.length ? partes.join(" × ") : null;
}

function datacaoLegivel(peca: PecaRow) {
  if (peca.datacao) return peca.datacao;
  if (peca.ano_inicio && peca.ano_fim) return `${peca.ano_inicio}–${peca.ano_fim}`;
  if (peca.ano_inicio) return String(peca.ano_inicio);
  return peca.periodo ?? null;
}

function Destaque({ item }: { item: MidiaItem | undefined }) {
  if (!item?.url) {
    return (
      <div className="frame-art flex aspect-4/3 items-center justify-center rounded-lg">
        <span className="label-caps">Sem fotografia</span>
      </div>
    );
  }
  if (isVideoPath(item.storage_path)) {
    return (
      <video
        src={item.url}
        controls
        className="frame-art aspect-4/3 w-full rounded-lg object-contain"
      />
    );
  }
  return (
    <img
      src={item.url}
      alt={item.legenda ?? "Fotografia da peça"}
      loading="lazy"
      className="frame-art aspect-4/3 w-full rounded-lg object-contain"
    />
  );
}

export function FichaMuseologica({
  peca,
  categorias = [],
}: {
  peca: PecaRow;
  categorias?: CategoriaRow[];
}) {
  const { data: midia = [] } = useQuery(midiaQuery(peca.id));
  const [ativoId, setAtivoId] = useState<string | null>(null);

  const ordenada = useMemo(
    () => [...midia].sort((a, b) => Number(b.principal) - Number(a.principal)),
    [midia],
  );

  useEffect(() => {
    if (ordenada.length && !ordenada.some((m) => m.id === ativoId)) {
      setAtivoId(ordenada[0]?.id ?? null);
    }
  }, [ordenada, ativoId]);

  const ativo = ordenada.find((m) => m.id === ativoId) ?? ordenada[0];
  const categoria = categorias.find((c) => c.id === peca.categoria_id)?.nome ?? null;

  const valor =
    peca.valor_estimado != null
      ? new Intl.NumberFormat("pt-PT", {
          style: "currency",
          currency: peca.moeda || "EUR",
          maximumFractionDigits: 0,
        }).format(Number(peca.valor_estimado))
      : null;

  return (
    <div className="fade-up grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-start">
      {/* Fotografia principal + galeria */}
      <div className="lg:sticky lg:top-24">
        <Destaque item={ativo} />
        {ordenada.length > 1 ? (
          <ul className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-5">
            {ordenada.map((m) => {
              const video = isVideoPath(m.storage_path);
              const selecionado = m.id === ativo?.id;
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => setAtivoId(m.id)}
                    aria-label={m.legenda ?? "Ver ficheiro"}
                    aria-current={selecionado}
                    className={`frame-art relative block aspect-square w-full rounded-sm transition-all duration-200 hover:opacity-100 ${
                      selecionado ? "border-accent opacity-100" : "opacity-70"
                    }`}
                  >
                    {video ? (
                      <>
                        <video src={m.url ?? undefined} className="size-full object-cover" muted />
                        <Play
                          className="absolute inset-0 m-auto size-5 text-accent"
                          aria-hidden
                        />
                      </>
                    ) : (
                      <img
                        src={m.url ?? undefined}
                        alt={m.legenda ?? ""}
                        loading="lazy"
                        className="size-full object-cover"
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
        {ativo?.legenda ? (
          <p className="mt-3 text-xs text-muted-foreground italic">{ativo.legenda}</p>
        ) : null}
      </div>

      {/* Ficha */}
      <div className="grid gap-6">
        {peca.ficha_tecnica || peca.ficha_tecnica_path ? (
          <section className="plate p-5 sm:p-6">
            <h2 className="text-xl">Ficha técnica</h2>
            <hr className="gilt-rule my-4" />
            {peca.ficha_tecnica ? (
              <p className="text-sm whitespace-pre-line text-foreground">{peca.ficha_tecnica}</p>
            ) : null}
            {peca.ficha_tecnica_path ? (
              <PreviewFichaTecnica
                path={peca.ficha_tecnica_path}
                nome={peca.ficha_tecnica_nome}
              />
            ) : null}

          </section>
        ) : null}
        <header className="plate-gilt p-5 sm:p-6">

          <p className="label-caps">{peca.inventario ?? "Sem número de inventário"}</p>
          <h2 className="mt-2 text-3xl leading-tight sm:text-4xl">{peca.titulo}</h2>
          {peca.autor ? (
            <p className="mt-2 font-display text-lg text-accent italic">{peca.autor}</p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              categoria,
              humanizar(rotuloRaridade, peca.raridade),
              humanizar(rotuloAutenticidade, peca.autenticidade),
              peca.publico ? "Em exibição pública" : "Coleção reservada",
            ]
              .filter(Boolean)
              .map((etiqueta) => (
                <span
                  key={etiqueta as string}
                  className="rounded-sm border border-border px-2.5 py-1 text-[0.7rem] tracking-wide text-muted-foreground uppercase"
                >
                  {etiqueta}
                </span>
              ))}
          </div>
        </header>

        <Bloco titulo="Identificação">
          <Campo rotulo="Título" valor={peca.titulo} />
          <Campo rotulo="Autor / Fabricante" valor={peca.autor} />
          <Campo rotulo="Escola / Oficina" valor={peca.escola} />
          <Campo rotulo="Datação" valor={datacaoLegivel(peca)} />
          <Campo rotulo="Período" valor={peca.periodo} />
          <Campo rotulo="Categoria" valor={categoria} />
        </Bloco>

        <Bloco titulo="Descrição material">
          <Campo rotulo="Materiais" valor={peca.materiais} />
          <Campo rotulo="Técnica" valor={peca.tecnica} />
          <Campo rotulo="Dimensões" valor={dimensoesLegiveis(peca)} />
          <Campo rotulo="Peso" valor={peca.peso_g ? `${peca.peso_g} g` : null} />
          <Campo rotulo="Descrição" valor={peca.descricao} />
        </Bloco>

        <Bloco titulo="Proveniência e conservação">
          <Campo rotulo="Proveniência" valor={peca.proveniencia} />
          <Campo rotulo="Histórico" valor={peca.historico} />
          <Campo rotulo="Estado de conservação" valor={humanizar(rotuloEstado, peca.estado)} />
          <Campo
            rotulo="Data de aquisição"
            valor={
              peca.data_aquisicao
                ? new Date(peca.data_aquisicao).toLocaleDateString("pt-PT")
                : null
            }
          />
          <Campo rotulo="Localização" valor={peca.localizacao} />
          <Campo rotulo="Valor estimado" valor={valor} />
        </Bloco>

        {peca.bibliografia ? (
          <Bloco titulo="Investigação">
            <Campo rotulo="Bibliografia" valor={peca.bibliografia} />
          </Bloco>
        ) : null}
      </div>
    </div>
  );
}
