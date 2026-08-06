import { useRef, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, FileText, Loader2, Upload, X } from "lucide-react";
import type { CategoriaRow, PecaRow } from "@/lib/collection";
import { lerFichaFicheiros, type FichaFicheiro } from "@/lib/ficha";
import { autenticidadeLabel, estadoLabel, raridadeLabel, slugify } from "@/lib/collection";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const TIPOS_FICHA =
  ".pdf,.doc,.docx,.txt,.md,.csv,.rtf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,text/csv,application/rtf";

function FichaTecnicaCampo({
  texto,
  ficheiros,
  soLeitura,
  erro,
  onTexto,
  onFicheiros,
}: {
  texto: string;
  ficheiros: FichaFicheiro[];
  soLeitura: boolean;
  erro?: string | undefined;
  onTexto: (t: string) => void;
  onFicheiros: (lista: FichaFicheiro[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [aEnviar, setAEnviar] = useState(false);

  async function enviar(files: File[]) {
    setAEnviar(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Sessão expirada.");
      const novos: FichaFicheiro[] = [];
      for (const file of files) {
        if (file.size > 50 * 1024 * 1024) {
          toast.error(`"${file.name}" excede 50 MB.`);
          continue;
        }
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
        const destino = `${uid}/fichas-tecnicas/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("documentos").upload(destino, file);
        if (error) throw error;
        novos.push({ path: destino, nome: file.name });
      }
      if (novos.length) {
        onFicheiros([...ficheiros, ...novos]);
        toast.success(
          novos.length === 1 ? "Ficheiro carregado." : `${novos.length} ficheiros carregados.`,
        );
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível carregar o ficheiro.");
    } finally {
      setAEnviar(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function abrir(path: string) {
    const { data, error } = await supabase.storage.from("documentos").createSignedUrl(path, 600);
    if (error || !data?.signedUrl) {
      toast.error("Não foi possível abrir o ficheiro.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  }

  function mover(indice: number, delta: number) {
    const destino = indice + delta;
    if (destino < 0 || destino >= ficheiros.length) return;
    const copia = [...ficheiros];
    const [item] = copia.splice(indice, 1);
    if (item) copia.splice(destino, 0, item);
    onFicheiros(copia);
  }

  return (
    <section className="space-y-3 border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Label htmlFor="ficha_tecnica" className="label-caps">
          Ficha técnica
        </Label>
        {!soLeitura ? (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              id="ficha_tecnica_ficheiro"
              type="file"
              multiple
              accept={TIPOS_FICHA}
              className="hidden"
              onChange={(e) => {
                const fs = Array.from(e.target.files ?? []);
                if (fs.length) void enviar(fs);
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={aEnviar}
              onClick={() => inputRef.current?.click()}
            >
              {aEnviar ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Upload className="size-4" aria-hidden />
              )}
              Carregar PDF / Word
            </Button>
          </div>
        ) : null}
      </div>

      <Textarea
        id="ficha_tecnica"
        rows={4}
        placeholder="Escreva aqui a ficha técnica da peça…"
        value={texto}
        onChange={(e) => onTexto(e.target.value)}
      />
      {erro ? (
        <p role="alert" className="text-xs text-destructive">
          {erro}
        </p>
      ) : null}

      {ficheiros.length ? (
        <ul className="space-y-2">
          {ficheiros.map((f, i) => (
            <li key={f.path} className="flex items-center gap-2 text-sm">
              <span className="w-5 text-xs text-muted-foreground tabular-nums">{i + 1}.</span>
              <button
                type="button"
                onClick={() => void abrir(f.path)}
                className="inline-flex flex-1 items-center gap-2 text-left text-accent hover:underline"
              >
                <FileText className="size-4 shrink-0" aria-hidden />
                {f.nome}
              </button>
              {!soLeitura ? (
                <span className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Mover para cima"
                    onClick={() => mover(i, -1)}
                    disabled={i === 0}
                    className="text-muted-foreground hover:text-accent disabled:opacity-30"
                  >
                    <ChevronUp className="size-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label="Mover para baixo"
                    onClick={() => mover(i, 1)}
                    disabled={i === ficheiros.length - 1}
                    className="text-muted-foreground hover:text-accent disabled:opacity-30"
                  >
                    <ChevronDown className="size-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label={`Remover ${f.nome}`}
                    onClick={() => onFicheiros(ficheiros.filter((_, idx) => idx !== i))}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export interface PecaFormValues {
  ficha_tecnica: string | null;
  ficha_tecnica_path: string | null;
  ficha_tecnica_nome: string | null;
  ficha_tecnica_ficheiros: FichaFicheiro[];
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

function Campo({
  id,
  rotulo,
  erro,
  children,
}: {
  id: string;
  rotulo: string;
  erro?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{rotulo}</Label>
      {children}
      {erro ? (
        <p role="alert" className="text-xs text-destructive">
          {erro}
        </p>
      ) : null}
    </div>
  );
}

const texto = (max: number, rotulo: string) =>
  z
    .string()
    .trim()
    .max(max, { message: `${rotulo}: máximo ${max} caracteres.` })
    .nullable()
    .optional();

const pecaSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(1, { message: "O título é obrigatório." })
    .max(200, { message: "O título deve ter menos de 200 caracteres." }),
  slug: z
    .string()
    .trim()
    .max(200, { message: "O slug deve ter menos de 200 caracteres." })
    .regex(/^[a-z0-9-]*$/, { message: "O slug só aceita letras minúsculas, números e hífenes." }),
  inventario: texto(60, "Nº de inventário"),
  ficha_tecnica: texto(20000, "Ficha técnica"),
  autor: texto(160, "Autoria"),
  periodo: texto(120, "Período"),
  materiais: texto(240, "Materiais"),
  tecnica: texto(240, "Técnica"),
  dimensoes: texto(160, "Dimensões"),
  localizacao: texto(160, "Localização"),
  proveniencia: texto(2000, "Proveniência"),
  descricao: texto(5000, "Descrição"),
  notas_privadas: texto(5000, "Notas privadas"),
  valor_estimado: z
    .number({ message: "Valor estimado inválido." })
    .min(0, { message: "O valor estimado não pode ser negativo." })
    .max(1_000_000_000, { message: "Valor estimado demasiado elevado." })
    .nullable(),
  data_aquisicao: z
    .string()
    .trim()
    .refine((d) => !d || !Number.isNaN(Date.parse(d)), { message: "Data de aquisição inválida." })
    .refine((d) => !d || Date.parse(d) <= Date.now(), {
      message: "A data de aquisição não pode ser futura.",
    })
    .nullable()
    .optional(),
});

const selectCls =
  "h-9 w-full border border-input bg-background px-3 text-sm outline-none focus-visible:border-accent";


export function PecaForm({
  peca,
  categorias,
  ocupado,
  onSubmit,
  onDelete,
  soLeitura = false,
}: {
  peca?: PecaRow;
  categorias: CategoriaRow[];
  ocupado: boolean;
  onSubmit: (values: PecaFormValues) => void;
  onDelete?: () => void;
  soLeitura?: boolean;
}) {
  const [v, setV] = useState<PecaFormValues>({
    ficha_tecnica: peca?.ficha_tecnica ?? "",
    ficha_tecnica_path: peca?.ficha_tecnica_path ?? null,
    ficha_tecnica_nome: peca?.ficha_tecnica_nome ?? null,
    ficha_tecnica_ficheiros: peca ? lerFichaFicheiros(peca) : [],
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

  const [erros, setErros] = useState<Partial<Record<keyof PecaFormValues, string>>>({});

  function set<K extends keyof PecaFormValues>(k: K, value: PecaFormValues[K]) {
    setV((prev) => ({ ...prev, [k]: value }));
    setErros((prev) => (prev[k] ? { ...prev, [k]: undefined } : prev));
  }

  function submeter(e: React.FormEvent) {
    e.preventDefault();
    if (soLeitura) return;
    const slug = (v.slug.trim() || slugify(v.titulo)).trim();
    const candidato = { ...v, slug };
    const r = pecaSchema.safeParse(candidato);
    if (!r.success) {
      const novos: Partial<Record<keyof PecaFormValues, string>> = {};
      for (const issue of r.error.issues) {
        const chave = issue.path[0] as keyof PecaFormValues;
        if (chave && !novos[chave]) novos[chave] = issue.message;
      }
      setErros(novos);
      const primeiro = document.getElementById(String(Object.keys(novos)[0]));
      primeiro?.focus();
      return;
    }
    setErros({});
    onSubmit({ ...candidato, slug: slug || crypto.randomUUID() });
  }

  return (
    <form className="plate space-y-8 p-6" onSubmit={submeter} noValidate>
      <fieldset disabled={soLeitura} className="space-y-8 disabled:opacity-90">

      <FichaTecnicaCampo
        texto={v.ficha_tecnica ?? ""}
        ficheiros={v.ficha_tecnica_ficheiros}
        soLeitura={soLeitura}
        erro={erros.ficha_tecnica}
        onTexto={(t) => set("ficha_tecnica", t)}
        onFicheiros={(lista) => {
          setV((prev) => ({
            ...prev,
            ficha_tecnica_ficheiros: lista,
            ficha_tecnica_path: lista[0]?.path ?? null,
            ficha_tecnica_nome: lista[0]?.nome ?? null,
          }));
        }}
      />


      <div className="grid gap-5 md:grid-cols-2">
        <Campo id="titulo" rotulo="Título *" erro={erros.titulo}>
          <Input
            id="titulo"
            required
            value={v.titulo}
            onChange={(e) => set("titulo", e.target.value)}
          />
        </Campo>
        <Campo id="inventario" rotulo="Nº de inventário" erro={erros.inventario}>
          <Input
            id="inventario"
            value={v.inventario ?? ""}
            onChange={(e) => set("inventario", e.target.value)}
          />
        </Campo>
        <Campo id="autor" rotulo="Autoria" erro={erros.autor}>
          <Input id="autor" value={v.autor ?? ""} onChange={(e) => set("autor", e.target.value)} />
        </Campo>
        <Campo id="periodo" rotulo="Período / datação" erro={erros.periodo}>
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
        <Campo id="localizacao" rotulo="Localização" erro={erros.localizacao}>
          <Input
            id="localizacao"
            value={v.localizacao ?? ""}
            onChange={(e) => set("localizacao", e.target.value)}
          />
        </Campo>
        <Campo id="materiais" rotulo="Materiais" erro={erros.materiais}>
          <Input
            id="materiais"
            value={v.materiais ?? ""}
            onChange={(e) => set("materiais", e.target.value)}
          />
        </Campo>
        <Campo id="tecnica" rotulo="Técnica" erro={erros.tecnica}>
          <Input
            id="tecnica"
            value={v.tecnica ?? ""}
            onChange={(e) => set("tecnica", e.target.value)}
          />
        </Campo>
        <Campo id="dimensoes" rotulo="Dimensões" erro={erros.dimensoes}>
          <Input
            id="dimensoes"
            value={v.dimensoes ?? ""}
            onChange={(e) => set("dimensoes", e.target.value)}
          />
        </Campo>
        <Campo id="valor" rotulo="Valor estimado (EUR)" erro={erros.valor_estimado}>
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
        <Campo id="aquisicao" rotulo="Data de aquisição" erro={erros.data_aquisicao}>
          <Input
            id="aquisicao"
            type="date"
            value={v.data_aquisicao ?? ""}
            onChange={(e) => set("data_aquisicao", e.target.value)}
          />
        </Campo>
      </div>

      <Campo id="proveniencia" rotulo="Proveniência" erro={erros.proveniencia}>
        <Textarea
          id="proveniencia"
          rows={3}
          value={v.proveniencia ?? ""}
          onChange={(e) => set("proveniencia", e.target.value)}
        />
      </Campo>
      <Campo id="descricao" rotulo="Descrição" erro={erros.descricao}>
        <Textarea
          id="descricao"
          rows={4}
          value={v.descricao ?? ""}
          onChange={(e) => set("descricao", e.target.value)}
        />
      </Campo>
      <Campo id="notas" rotulo="Notas privadas (nunca públicas)" erro={erros.notas_privadas}>
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
      </fieldset>

      {soLeitura ? (
        <p className="text-sm text-muted-foreground">
          Consulta apenas — só administradores podem editar ou eliminar peças.
        </p>
      ) : (
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
      )}
    </form>

  );
}
