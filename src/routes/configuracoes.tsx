import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import { PageHeader, Card, Button, Input, Label, Select } from "@/components/ui-bits";
import { useSettings, DEFAULT_SETTINGS, clearAll } from "@/lib/store";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — Oralit" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [s, set] = useSettings();
  const totalTaxes = s.taxPct + s.cardFeePct;
  const invalid = totalTaxes >= 100;

  return (
    <AppLayout>
      <PageHeader
        title="Configurações financeiras"
        subtitle="Defina margem, impostos, taxas e tempo útil mensal."
      />

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <h2 className="font-display font-bold mb-3">Margem e impostos</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label hint="%">Margem de lucro</Label>
              <Input type="number" step="0.1" value={s.marginPct} onChange={e => set({ ...s, marginPct: +e.target.value })} />
            </div>
            <div>
              <Label hint="%">Reserva técnica</Label>
              <Input type="number" step="0.1" value={s.reservePct} onChange={e => set({ ...s, reservePct: +e.target.value })} />
            </div>
            <div>
              <Label hint="%">Impostos</Label>
              <Input type="number" step="0.1" value={s.taxPct} onChange={e => set({ ...s, taxPct: +e.target.value })} />
            </div>
            <div>
              <Label hint="%">Taxa de cartão</Label>
              <Input type="number" step="0.1" value={s.cardFeePct} onChange={e => set({ ...s, cardFeePct: +e.target.value })} />
            </div>
          </div>
          {invalid && (
            <div className="mt-3 rounded-lg bg-rose-50 text-rose-700 px-3 py-2 text-xs font-semibold">
              A taxa total (impostos + cartão = {totalTaxes.toFixed(1)}%) não pode chegar a 100%.
            </div>
          )}
        </Card>

        <Card>
          <h2 className="font-display font-bold mb-3">Tempo clínico mensal</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Dias trabalhados/mês</Label>
              <Input type="number" value={s.daysPerMonth} onChange={e => set({ ...s, daysPerMonth: +e.target.value })} />
            </div>
            <div>
              <Label>Horas clínicas/dia</Label>
              <Input type="number" value={s.hoursPerDay} onChange={e => set({ ...s, hoursPerDay: +e.target.value })} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Esse tempo é a base para distribuir o custo fixo por minuto clínico.
          </p>
        </Card>

        <Card>
          <h2 className="font-display font-bold mb-3">Arredondamento</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Modo</Label>
              <Select value={[0, 5, 10, 50, 100].includes(s.rounding) ? String(s.rounding) : "custom"} onChange={e => {
                const v = e.target.value;
                if (v === "custom") set({ ...s, rounding: 1 });
                else set({ ...s, rounding: +v });
              }}>
                <option value="0">Sem arredondamento</option>
                <option value="5">R$ 5</option>
                <option value="10">R$ 10</option>
                <option value="50">R$ 50</option>
                <option value="100">R$ 100</option>
                <option value="custom">Personalizado</option>
              </Select>
            </div>
            <div>
              <Label>Múltiplo de R$</Label>
              <Input type="number" step="0.01" value={s.rounding} onChange={e => set({ ...s, rounding: +e.target.value })} />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="font-display font-bold mb-3">Dados</h2>
          <p className="text-xs text-muted-foreground mb-3">Todos os dados são salvos localmente no dispositivo.</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => { set(DEFAULT_SETTINGS); toast.success("Configurações restauradas."); }}>
              Restaurar padrão
            </Button>
            <Button variant="danger" onClick={() => {
              if (!confirm("Apagar TODOS os dados do Oralit neste dispositivo?")) return;
              clearAll();
              toast.success("Dados apagados.");
            }}>
              Apagar tudo
            </Button>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
