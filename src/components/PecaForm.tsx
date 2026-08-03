import { useState } from "react";
import type { CategoriaRow, PecaRow } from "@/lib/collection";
import { autenticidadeLabel, estadoLabel, raridadeLabel, slugify } from "@/lib/collection";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export interface PecaFormValues {
  titulo: string;
  slug: string;
  inventario: string | null;
  autor: string | null;
  periodo: string | null;
  categoria_id: string | null;
  materiais: string | null;
  tecnica: string | null;
  dimensoes: string | null;
  proveniencia: string | null;
  descricao: string | null;
  notas_privadas: string | null;
  estado: string;
  raridade: string;
  autenticidade: string;
  valor_estimado: number | null;
  data_aquisicao: string | null;
  localizacao: string | null;
  publico: boolean;
}

function Campo({ id, rotulo, children }: { id: string; rotulo: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{rotulo}</Label>
      {children}
    </div>
  );
}

const selectCls =
  "h-9 w-full border border-input bg-background px-3 text-sm outline-none focus-visible:border-accent";

export function PecaForm({
  peca,
  categorias,
  ocupado,
  onSubmit,
  onDelete,
}: {
  peca?: PecaRow;
  categorias: CategoriaRow[];
  ocupado: boolean;
  onSubmit: (values: PecaFormValues) => void;
  onDelete?: () => void;
}) {
  const [v, setV] = useState<PecaFormValues>({
    titulo: peca?.titulo ?? "",
    slug: peca?.slug ?? "",
    inventario: peca?.inventario ?? "",
    autor: peca?.autor ?? "",
    periodo: peca?.periodo ?? "",
    categoria_id: peca?.categoria_id ?? "",
    materiais: peca?.materiais ?? "",
    tecnica: peca?.tecnica ?? "",
    dimensoes: peca?.dimensoes ?? "",
    proveniencia: peca?.proveniencia ?? "",
    descricao: peca?.descricao ?? "",
    notas_privadas: peca?.notas_privadas ?? "",
    estado: peca?.estado ?? "bom",
    raridade: peca?.raridade ?? "comum",
    autenticidade: peca?.autenticidade ?? "por_avaliar",
    valor_estimado: peca?.valor_estimado ?? null,
    data_aquisicao: peca?.data_aquisicao ?? "",
    localizacao: peca?.localizacao ?? "",
    publico: peca?.publico ?? false,
  });

  function set<K extends keyof PecaFormValues>(k: K, value: PecaFormValues[K]) {
    setV((prev) => ({ ...prev, [k]: value }));
  }

  return (
    <form
      className="plate space-y-8 p-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ ...v, slug: v.slug.trim() || slugify(v.titulo) || crypto.randomUUID() });
      }}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Campo id="titulo" rotulo="Título *">
          <Input
            id="titulo"
            required
            value={v.titulo}
            onChange={(e) => set("titulo", e.target.value)}
          />
        </Campo>
        <Campo id="inventario" rotulo="Nº de inventário">
          <Input
            id="inventario"
            value={v.inventario ?? ""}
            onChange={(e) => set("inventario", e.target.value)}
          />
        </Campo>
        <Campo id="autor" rotulo="Autoria">
          <Input id="autor" value={v.autor ?? ""} onChange={(e) => set("autor", e.target.value)} />
        </Campo>
        <Campo id="periodo" rotulo="Período / datação">
          <Input
            id="periodo"
            value={v.periodo ?? ""}
            onChange={(e) => set("periodo", e.target.value)}
          />
        </Campo>
        <Campo id="categoria" rotulo="Categoria">
          <select
            id="categoria"
            className={selectCls}
            value={v.categoria_id ?? ""}
            onChange={(e) => set("categoria_id", e.target.value)}
          >
            <option value="">Sem categoria</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </Campo>
        <Campo id="localizacao" rotulo="Localização">
          <Input
            id="localizacao"
            value={v.localizacao ?? ""}
            onChange={(e) => set("localizacao", e.target.value)}
          />
        </Campo>
        <Campo id="materiais" rotulo="Materiais">
          <Input
            id="materiais"
            value={v.materiais ?? ""}
            onChange={(e) => set("materiais", e.target.value)}
          />
        </Campo>
        <Campo id="tecnica" rotulo="Técnica">
          <Input
            id="tecnica"
            value={v.tecnica ?? ""}
            onChange={(e) => set("tecnica", e.target.value)}
          />
        </Campo>
        <Campo id="dimensoes" rotulo="Dimensões">
          <Input
            id="dimensoes"
            value={v.dimensoes ?? ""}
            onChange={(e) => set("dimensoes", e.target.value)}
          />
        </Campo>
        <Campo id="valor" rotulo="Valor estimado (EUR)">
          <Input
            id="valor"
            type="number"
            min={0}
            value={v.valor_estimado ?? ""}
            onChange={(e) => set("valor_estimado", e.target.value ? Number(e.target.value) : null)}
          />
        </Campo>
        <Campo id="estado" rotulo="Estado de conservação">
          <select
            id="estado"
            className={selectCls}
            value={v.estado}
            onChange={(e) => set("estado", e.target.value)}
          >
            {Object.entries(estadoLabel).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </Campo>
        <Campo id="raridade" rotulo="Raridade">
          <select
            id="raridade"
            className={selectCls}
            value={v.raridade}
            onChange={(e) => set("raridade", e.target.value)}
          >
            {Object.entries(raridadeLabel).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </Campo>
        <Campo id="autenticidade" rotulo="Autenticidade">
          <select
            id="autenticidade"
            className={selectCls}
            value={v.autenticidade}
            onChange={(e) => set("autenticidade", e.target.value)}
          >
            {Object.entries(autenticidadeLabel).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </Campo>
        <Campo id="aquisicao" rotulo="Data de aquisição">
          <Input
            id="aquisicao"
            type="date"
            value={v.data_aquisicao ?? ""}
            onChange={(e) => set("data_aquisicao", e.target.value)}
          />
        </Campo>
      </div>

      <Campo id="proveniencia" rotulo="Proveniência">
        <Textarea
          id="proveniencia"
          rows={3}
          value={v.proveniencia ?? ""}
          onChange={(e) => set("proveniencia", e.target.value)}
        />
      </Campo>
      <Campo id="descricao" rotulo="Descrição">
        <Textarea
          id="descricao"
          rows={4}
          value={v.descricao ?? ""}
          onChange={(e) => set("descricao", e.target.value)}
        />
      </Campo>
      <Campo id="notas" rotulo="Notas privadas (nunca públicas)">
        <Textarea
          id="notas"
          rows={3}
          value={v.notas_privadas ?? ""}
          onChange={(e) => set("notas_privadas", e.target.value)}
        />
      </Campo>

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={v.publico}
          onChange={(e) => set("publico", e.target.checked)}
          className="size-4 accent-[var(--color-accent)]"
        />
        Tornar esta peça visível publicamente (partilha por slug)
      </label>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={ocupado}>
          Guardar peça
        </Button>
        {onDelete ? (
          <Button type="button" variant="outline" disabled={ocupado} onClick={onDelete}>
            Eliminar
          </Button>
        ) : null}
      </div>
    </form>
  );
}
