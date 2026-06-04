import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import { PageHeader, Card, Button, Input, Select, Label, Badge, EmptyState } from "@/components/ui-bits";
import {
  useProcedures, useCustomProcedureCategories, PROCEDURE_CATEGORIES, uid, type Procedure,
} from "@/lib/store";
import { BRL } from "@/lib/calc";
import { seedProcedures } from "@/lib/seed";
import { Plus, Trash2, Pencil, Copy, Search, X, Sparkles, Calculator } from "lucide-react";

export const Route = createFileRoute("/procedimentos")({
  head: () => ({ meta: [{ title: "Procedimentos — Oralit" }] }),
  component: ProceduresPage,
});

const empty = (): Omit<Procedure, "id"> => ({
  name: "", category: "Consulta", defaultMinutes: 30, labCost: 0, otherDirect: 0, note: "",
});

function ProceduresPage() {
  const [items, setItems] = useProcedures();
  const [customCats, setCustomCats] = useCustomProcedureCategories();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("todas");
  const [editing, setEditing] = useState<Procedure | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Omit<Procedure, "id">>(empty());

  const allCats = useMemo(() => [...PROCEDURE_CATEGORIES, ...customCats.filter(c => !PROCEDURE_CATEGORIES.includes(c))], [customCats]);
  const filtered = items.filter(p =>
    (cat === "todas" || p.category === cat) &&
    (!q || p.name.toLowerCase().includes(q.toLowerCase()))
  );

  function openCreate() { setDraft(empty()); setEditing(null); setOpen(true); }
  function openEdit(p: Procedure) { setDraft({ ...p }); setEditing(p); setOpen(true); }
  function close() { setOpen(false); setEditing(null); }
  function save() {
    if (!draft.name.trim()) return toast.error("Informe o nome do procedimento.");
    if (!draft.defaultMinutes || draft.defaultMinutes <= 0) return toast.error("Tempo deve ser maior que zero.");
    if (editing) {
      setItems(items.map(p => p.id === editing.id ? { ...editing, ...draft } : p));
      toast.success("Procedimento atualizado.");
    } else {
      setItems([...items, { id: uid(), ...draft }]);
      toast.success("Procedimento cadastrado.");
    }
    close();
  }
  function duplicate(p: Procedure) {
    setItems([...items, { ...p, id: uid(), name: p.name + " (cópia)" }]);
    toast.success("Procedimento duplicado.");
  }
  function remove(id: string) {
    if (!confirm("Excluir procedimento?")) return;
    setItems(items.filter(p => p.id !== id));
  }
  function addCat() {
    const n = prompt("Nome da nova categoria:")?.trim();
    if (!n) return;
    if (!customCats.includes(n)) setCustomCats([...customCats, n]);
    setDraft({ ...draft, category: n });
  }

  return (
    <AppLayout>
      <PageHeader
        title="Procedimentos"
        subtitle="Monte protocolos rápidos para precificar com consistência."
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setItems([...items, ...seedProcedures()]); toast.success("Exemplos carregados."); }}>
              <Sparkles className="h-3.5 w-3.5" /> Exemplo
            </Button>
            <Button variant="gold" size="sm" onClick={openCreate}><Plus className="h-4 w-4" /> Novo</Button>
          </div>
        }
      />

      {!items.length ? (
        <EmptyState
          title="Nenhum procedimento ainda"
          description="Cadastre seus protocolos clínicos para reutilizar na precificação."
          action={<Button variant="gold" onClick={openCreate}><Plus className="h-4 w-4" /> Cadastrar</Button>}
        />
      ) : (
        <Card>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar procedimento…" value={q} onChange={e => setQ(e.target.value)} />
            </div>
            <Select value={cat} onChange={e => setCat(e.target.value)} className="sm:w-56">
              <option value="todas">Todas as categorias</option>
              {allCats.map(c => <option key={c}>{c}</option>)}
            </Select>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {filtered.map(p => (
              <div key={p.id} className="rounded-xl border border-border bg-card p-4 hover:border-gold transition">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{p.name}</div>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Badge>{p.category}</Badge>
                      <Badge tone="gold">{p.defaultMinutes} min</Badge>
                    </div>
                  </div>
                  <div className="flex">
                    <button className="p-1.5 text-muted-foreground hover:text-gold" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></button>
                    <button className="p-1.5 text-muted-foreground hover:text-foreground" onClick={() => duplicate(p)}><Copy className="h-4 w-4" /></button>
                    <button className="p-1.5 text-muted-foreground hover:text-rose-500" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                {(p.labCost || p.otherDirect) ? (
                  <div className="mt-3 text-xs text-muted-foreground flex gap-3">
                    {!!p.labCost && <span>Lab: <b className="text-foreground">{BRL(p.labCost)}</b></span>}
                    {!!p.otherDirect && <span>Diretos: <b className="text-foreground">{BRL(p.otherDirect)}</b></span>}
                  </div>
                ) : null}
                <Link to="/precificar" search={{ p: p.id } as never} className="mt-3 block">
                  <Button variant="outline" size="sm" className="w-full"><Calculator className="h-3.5 w-3.5" /> Precificar</Button>
                </Link>
              </div>
            ))}
            {!filtered.length && (
              <div className="sm:col-span-2 py-10 text-center text-sm text-muted-foreground">Nenhum procedimento encontrado.</div>
            )}
          </div>
        </Card>
      )}

      {open && (
        <div className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4" onClick={close}>
          <div className="bg-card w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-border max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card">
              <h3 className="font-display font-bold text-lg">{editing ? "Editar procedimento" : "Novo procedimento"}</h3>
              <button onClick={close}><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <Label>Nome</Label>
                <Input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} placeholder="Ex.: Restauração em resina" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Categoria</Label>
                  <Select value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })}>
                    {allCats.map(c => <option key={c}>{c}</option>)}
                  </Select>
                  <button type="button" className="text-[11px] mt-1.5 text-gold-deep font-semibold hover:underline" onClick={addCat}>
                    + nova categoria
                  </button>
                </div>
                <div>
                  <Label>Tempo médio (min)</Label>
                  <Input type="number" value={draft.defaultMinutes} onChange={e => setDraft({ ...draft, defaultMinutes: +e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label hint="R$">Laboratório/terceiros</Label>
                  <Input type="number" step="0.01" value={draft.labCost || 0} onChange={e => setDraft({ ...draft, labCost: +e.target.value })} />
                </div>
                <div>
                  <Label hint="R$">Outros custos diretos</Label>
                  <Input type="number" step="0.01" value={draft.otherDirect || 0} onChange={e => setDraft({ ...draft, otherDirect: +e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Observações</Label>
                <Input value={draft.note || ""} onChange={e => setDraft({ ...draft, note: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2 p-5 border-t border-border sticky bottom-0 bg-card">
              <Button variant="ghost" onClick={close} className="flex-1">Cancelar</Button>
              <Button variant="gold" onClick={save} className="flex-1">{editing ? "Salvar" : "Cadastrar"}</Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
