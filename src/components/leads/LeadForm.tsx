import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/profile-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  PhoneCall,
  PhoneOff,
  CalendarCheck,
  CalendarX,
  Loader2,
  Building2,
  Phone,
  MessageSquare,
  Star,
  Calendar,
  ArrowRight,
  Hash,
  Plus,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
  OBJECTION_REASONS,
  NO_ANSWER_REASONS,
  STATUS_OPTIONS,
  type LeadStatus,
} from "@/lib/constants";

const SEGMENT_SUGGESTIONS = ["Clínica", "Salão de beleza", "Spa", "Barbearia", "Pet Shop", "Imobiliária"];

export function LeadForm({ onSaved }: { onSaved?: () => void }) {
  const { profile } = useProfile();
  const [loading, setLoading] = useState(false);

  // Identificação
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");

  // Funil
  const [answered, setAnswered] = useState<boolean | null>(null);
  const [scheduled, setScheduled] = useState<boolean | null>(null);

  // Detalhes
  const [noAnswerReason, setNoAnswerReason] = useState("");
  const [objectionReason, setObjectionReason] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        const form = document.querySelector("form");
        if (form) form.requestSubmit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const resetForm = useCallback(() => {
    setCompany("");
    setPhone("");
    setAnswered(null);
    setScheduled(null);
    setNoAnswerReason("");
    setObjectionReason("");
    setScheduledAt("");
    setRating(5);
    setTags([]);
    setCurrentTag("");
    setNotes("");
  }, []);

  const chooseAnswered = (value: boolean) => {
    setAnswered(value);
    setScheduled(null);
    setObjectionReason("");
    setNoAnswerReason("");
    setScheduledAt("");
  };

  const resolveStatus = (): LeadStatus | null => {
    if (answered === false) return STATUS_OPTIONS.NO_ANSWER;
    if (answered === true && scheduled === true) return STATUS_OPTIONS.SCHEDULED;
    if (answered === true && scheduled === false) return STATUS_OPTIONS.NOT_SCHEDULED;
    return null;
  };

  const addTag = (tag: string) => {
    const t = tag.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setCurrentTag("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!company.trim()) return toast.error("O nome da empresa é obrigatório");
    if (answered === null) return toast.error("A ligação foi atendida?");

    if (answered === true) {
      if (scheduled === null) return toast.error("Informe se conseguiu agendar");
      if (scheduled === true) {
        if (!scheduledAt) return toast.error("Informe a data e hora da reunião");
        if (new Date(scheduledAt) < new Date()) return toast.error("A data da reunião não pode ser no passado");
      }
      if (scheduled === false && !objectionReason) return toast.error("Selecione o motivo de não ter agendado");
    }

    const status = resolveStatus();
    if (!status) return toast.error("Preencha o resultado da call");

    if (!profile?.id) return toast.error("Perfil não carregado. Recarregue a página.");

    const rejection_reason =
      answered === false ? noAnswerReason || "Não atendeu" : scheduled === false ? objectionReason : null;

    setLoading(true);
    try {
      const { error } = await supabase.from("leads").insert([
        {
          company: company.trim(),
          phone: phone.trim(),
          notes: notes.trim(),
          status,
          rejection_reason,
          scheduled_at: scheduled === true && scheduledAt ? scheduledAt : null,
          performance_rating: answered ? rating : null,
          company_id: profile.company_id,
          sdr_id: profile.id,
          tags: answered ? tags : [],
        },
      ]);

      if (error) throw error;

      toast.success("Call registrada com sucesso!");
      resetForm();
      onSaved?.();
    } catch (error: any) {
      console.error("Submit Error:", error);
      toast.error("Erro ao registrar: " + (error.message || "Erro de conexão"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border border-border/50 shadow-sm bg-card rounded-3xl overflow-hidden max-w-2xl mx-auto">
      <CardContent className="p-0">
        <form onSubmit={handleSubmit}>
          <div className="p-6 md:p-8 space-y-8">
            {/* 1. Identificação */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="company" className="text-xs font-semibold text-muted-foreground ml-1 flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 opacity-60" />
                  Empresa Alvo
                </Label>
                <Input
                  id="company"
                  placeholder="Nome da empresa..."
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                  className="h-12 bg-background border-border/50 rounded-xl focus:ring-2 focus:ring-primary/10 transition-all text-sm font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-semibold text-muted-foreground ml-1 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 opacity-60" />
                  Telefone / WhatsApp
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-12 bg-background border-border/50 rounded-xl focus:ring-2 focus:ring-primary/10 transition-all text-sm font-medium"
                />
              </div>
            </div>

            {/* 2. Atendeu? */}
            <div className="space-y-4">
              <Label className="text-xs font-semibold text-muted-foreground ml-1 block">A ligação foi atendida?</Label>
              <div className="grid grid-cols-2 gap-4">
                <ChoiceButton
                  active={answered === true}
                  tone="primary"
                  icon={<PhoneCall className="w-6 h-6" />}
                  label="Atendeu"
                  onClick={() => chooseAnswered(true)}
                />
                <ChoiceButton
                  active={answered === false}
                  tone="neutral"
                  icon={<PhoneOff className="w-6 h-6" />}
                  label="Não Atendeu"
                  onClick={() => chooseAnswered(false)}
                />
              </div>
            </div>

            {/* 3a. Não atendeu → motivo */}
            {answered === false && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
                <Label className="text-xs font-semibold text-muted-foreground ml-1">Motivo (opcional)</Label>
                <ReasonChips options={NO_ANSWER_REASONS} value={noAnswerReason} onChange={setNoAnswerReason} tone="neutral" />
              </div>
            )}

            {/* 3b. Atendeu → agendou? */}
            {answered === true && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <Label className="text-xs font-semibold text-muted-foreground ml-1 block">Conseguiu agendar uma reunião?</Label>
                <div className="grid grid-cols-2 gap-4">
                  <ChoiceButton
                    active={scheduled === true}
                    tone="success"
                    icon={<CalendarCheck className="w-6 h-6" />}
                    label="Agendou"
                    onClick={() => setScheduled(true)}
                  />
                  <ChoiceButton
                    active={scheduled === false}
                    tone="destructive"
                    icon={<CalendarX className="w-6 h-6" />}
                    label="Não Agendou"
                    onClick={() => setScheduled(false)}
                  />
                </div>
              </div>
            )}

            {/* 4. Agendou → data/hora */}
            {answered === true && scheduled === true && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-300">
                <Label htmlFor="scheduledAt" className="text-xs font-semibold text-primary ml-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Data e Hora da Reunião
                </Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="h-12 bg-primary/5 border-primary/20 rounded-xl focus:ring-primary focus:border-primary text-sm font-semibold"
                  required
                />
              </div>
            )}

            {/* 4. Não agendou → motivo (obrigatório) */}
            {answered === true && scheduled === false && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
                <Label className="text-xs font-semibold text-destructive ml-1">Por que não agendou?</Label>
                <ReasonChips options={OBJECTION_REASONS} value={objectionReason} onChange={setObjectionReason} tone="destructive" />
              </div>
            )}

            {/* 5. Performance — sempre que atendeu */}
            {answered === true && scheduled !== null && (
              <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-semibold text-muted-foreground ml-1 flex items-center gap-2">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                    Sua Performance na call (1-10)
                  </Label>
                  <span className="text-2xl font-bold text-amber-600 tracking-tight">{rating}</span>
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setRating(num)}
                      className={`min-w-[40px] h-10 flex-1 rounded-xl text-xs font-bold transition-all border ${
                        rating === num
                          ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20 scale-105"
                          : "bg-background border-border/50 text-muted-foreground hover:border-amber-500/30 hover:bg-amber-500/5"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 6. Segmento — quando atendeu */}
            {answered === true && scheduled !== null && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <Label className="text-xs font-semibold text-muted-foreground ml-1 flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5 opacity-60" />
                  Segmento / Tags
                </Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {SEGMENT_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => addTag(suggestion)}
                      className="px-3 py-1 bg-muted hover:bg-primary/10 hover:text-primary text-[10px] font-bold rounded-full transition-all border border-border/50"
                    >
                      + {suggestion}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Adicionar tag customizada..."
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    className="h-10 rounded-xl"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag(currentTag);
                      }
                    }}
                  />
                  <Button type="button" variant="outline" className="rounded-xl h-10 w-10 p-0" onClick={() => addTag(currentTag)}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full flex items-center gap-2 border border-primary/20 animate-in zoom-in duration-300">
                      {tag}
                      <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))} className="hover:text-destructive transition-colors">×</button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 7. Observação — aparece após escolher um caminho */}
            {answered !== null && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-300">
                <Label htmlFor="notes" className="text-xs font-semibold text-muted-foreground ml-1 flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 opacity-60" />
                  Observações e Objeções
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Detalhe o que foi conversado..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[110px] bg-background border-border/50 rounded-2xl resize-none focus:ring-2 focus:ring-primary/10 text-sm font-medium p-4"
                />
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-14 text-sm font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all bg-primary flex items-center justify-center gap-2 group"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <>
                  Salvar Registro de Call
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

type Tone = "primary" | "success" | "destructive" | "neutral";

const TONE: Record<Tone, { on: string; iconOn: string; off: string }> = {
  primary: {
    on: "bg-primary/5 border-primary shadow-lg shadow-primary/10",
    iconOn: "bg-primary text-primary-foreground",
    off: "hover:border-primary/30 hover:bg-primary/5",
  },
  success: {
    on: "bg-green-50 border-green-500 shadow-lg shadow-green-500/10 dark:bg-green-500/10",
    iconOn: "bg-green-500 text-white",
    off: "hover:border-green-500/30 hover:bg-green-500/5",
  },
  destructive: {
    on: "bg-destructive/5 border-destructive shadow-lg shadow-destructive/10",
    iconOn: "bg-destructive text-destructive-foreground",
    off: "hover:border-destructive/30 hover:bg-destructive/5",
  },
  neutral: {
    on: "bg-muted border-foreground/40 shadow-sm",
    iconOn: "bg-foreground/80 text-background",
    off: "hover:border-foreground/20 hover:bg-muted",
  },
};

function ChoiceButton({
  active,
  tone,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  tone: Tone;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  const t = TONE[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex flex-col items-center justify-center gap-3 h-28 rounded-3xl transition-all duration-300 border-2 ${
        active ? t.on : `bg-background border-border/50 text-muted-foreground ${t.off}`
      }`}
    >
      <div className={`p-3 rounded-2xl transition-all ${active ? t.iconOn : "bg-muted text-muted-foreground"}`}>{icon}</div>
      <span className={`text-xs font-bold uppercase tracking-wider ${active ? "text-foreground" : ""}`}>{label}</span>
    </button>
  );
}

function ReasonChips({
  options,
  value,
  onChange,
  tone,
}: {
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  tone: "destructive" | "neutral";
}) {
  const activeCls =
    tone === "destructive"
      ? "bg-destructive text-destructive-foreground border-destructive"
      : "bg-foreground/80 text-background border-foreground/80";
  const hoverCls =
    tone === "destructive"
      ? "hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
      : "hover:bg-muted hover:border-foreground/30";
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {options.map((r) => (
        <Button
          key={r}
          type="button"
          variant="outline"
          className={`justify-center h-10 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all border-border/50 ${
            value === r ? activeCls : hoverCls
          }`}
          onClick={() => onChange(r)}
        >
          {r}
        </Button>
      ))}
    </div>
  );
}
