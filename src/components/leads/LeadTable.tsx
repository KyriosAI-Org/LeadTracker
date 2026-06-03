import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Phone, CalendarCheck, XCircle, Star, Trash2, Filter, Search, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { STATUS_OPTIONS } from "@/lib/constants";
import type { Database } from "@/integrations/supabase/types";

type Lead = any;

interface LeadTableProps {
  leads: Lead[];
  onDelete: (id: string) => void;
}

export function LeadTable({ leads, onDelete }: LeadTableProps) {
  return (
    <Card className="border border-border/50 shadow-sm bg-card/50 backdrop-blur-xl rounded-2xl overflow-hidden">
      <CardHeader className="pb-6 border-b border-border/50 px-6 pt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold tracking-tight">Fluxo Operacional</CardTitle>
            <CardDescription className="text-xs font-medium text-muted-foreground/60">Log detalhado de todas as interações realizadas.</CardDescription>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
              <input 
                type="text" 
                placeholder="Buscar lead..." 
                className="w-full h-10 pl-9 pr-4 bg-background border border-border/50 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/10 outline-none transition-all"
              />
            </div>
            <Button variant="outline" size="icon" className="rounded-xl h-10 w-10 border-border/50 bg-background">
              <Filter className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/50">
                <TableHead className="py-4 pl-6 font-bold text-[10px] uppercase tracking-wider text-muted-foreground/80">Empresa / SDR</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground/80">Status</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground/80">Rating</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground/80">Desfecho</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground/80 text-right pr-6">Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-30">
                      <Search className="w-10 h-10" />
                      <p className="font-bold uppercase tracking-widest text-[10px]">Nenhum registro encontrado</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : leads.map((lead) => (
                <TableRow key={lead.id} className="group border-b border-border/30 hover:bg-muted/20 transition-colors">
                  <TableCell className="py-5 pl-6">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-foreground text-base tracking-tight">{lead.company}</span>
                      <div className="flex items-center gap-1.5 text-muted-foreground/60">
                        <Phone className="w-3 h-3" />
                        <span className="text-[11px] font-medium">{lead.phone || "Indisponível"}</span>
                        <span className="mx-1 opacity-20">•</span>
                        <span className="text-[10px] font-bold uppercase text-primary/70">{lead.profiles?.full_name || 'SDR'}</span>
                      </div>
                      {lead.tags && lead.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {lead.tags.map((tag: string) => (
                            <span key={tag} className="px-1.5 py-0.5 bg-muted text-[8px] font-bold uppercase rounded-md border border-border/50 text-muted-foreground">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider gap-1.5 ${
                      lead.status === STATUS_OPTIONS.SCHEDULED 
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                    }`}>
                      <div className={`w-1 h-1 rounded-full ${lead.status === STATUS_OPTIONS.SCHEDULED ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
                      {lead.status === STATUS_OPTIONS.SCHEDULED ? 'Agendada' : 'Perdida'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/5 flex items-center justify-center border border-amber-500/10">
                        <span className="text-xs font-bold text-amber-600 tabular-nums">{lead.performance_rating}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[280px]">
                    <div className="flex flex-col gap-1.5">
                      {lead.status === STATUS_OPTIONS.SCHEDULED ? (
                        <div className="flex items-center gap-1.5 text-emerald-600">
                          <CalendarCheck className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-bold">
                            {lead.scheduled_at ? format(new Date(lead.scheduled_at), "dd/MM 'às' HH:mm", { locale: ptBR }) : '-'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-rose-600">
                          <XCircle className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-bold uppercase tracking-wide">{lead.rejection_reason || "Sem Detalhes"}</span>
                        </div>
                      )}
                      {lead.notes && (
                        <p className="text-[11px] text-muted-foreground/70 line-clamp-1 italic font-medium" title={lead.notes}>
                          "{lead.notes}"
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-4">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-foreground tracking-tight">
                          {lead.created_at ? format(new Date(lead.created_at), 'dd MMM', { locale: ptBR }) : '-'}
                        </span>
                        <span className="text-[10px] text-muted-foreground/40 font-bold">
                          {lead.created_at ? format(new Date(lead.created_at), 'HH:mm') : '-'}
                        </span>
                      </div>
                      <div className="flex gap-0.5">
                        <button 
                          onClick={() => onDelete(lead.id)}
                          className="p-2.5 rounded-xl hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all text-muted-foreground/40"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
