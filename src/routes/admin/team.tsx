import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useProfile } from "@/lib/profile-context";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, MoreHorizontal, Loader2, KeyRound, Pencil, Power, Trash2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getTeam, createSdr, updateSdr, setSdrActive, deleteSdr } from "@/lib/api/team.functions";
import { getAccessToken } from "@/lib/session";

type Member = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: "admin" | "sdr";
  is_active: boolean;
  created_at: string | null;
};

function TeamManagement() {
  const { profile } = useProfile();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [deleting, setDeleting] = useState<Member | null>(null);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["team"],
    queryFn: async () => getTeam({ data: { accessToken: await getAccessToken() } }),
    staleTime: 30_000,
    enabled: !!profile?.company_id,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["team"] });

  const activeMut = useMutation({
    mutationFn: async (m: Member) =>
      setSdrActive({ data: { accessToken: await getAccessToken(), userId: m.id, isActive: !m.is_active } }),
    onSuccess: (_d, m) => { toast.success(m.is_active ? "Membro desativado" : "Membro reativado"); invalidate(); },
    onError: (e: any) => toast.error(e.message ?? "Erro ao atualizar status"),
  });

  const deleteMut = useMutation({
    mutationFn: async (m: Member) => deleteSdr({ data: { accessToken: await getAccessToken(), userId: m.id } }),
    onSuccess: () => { toast.success("Membro removido"); setDeleting(null); invalidate(); },
    onError: (e: any) => toast.error(e.message ?? "Erro ao remover"),
  });

  return (
    <AdminLayout userProfile={profile}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Equipe</h1>
            <p className="text-muted-foreground text-sm mt-1">Gerencie os membros, acessos e credenciais da sua equipe</p>
          </div>
          <Button size="sm" className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" />
            Novo SDR
          </Button>
        </div>

        <div className="bg-card border rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : members.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground text-sm">
              <p className="font-medium">Nenhum membro ainda</p>
              <p className="mt-1">Clique em "Novo SDR" para adicionar alguém.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Desde</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.id} className={m.is_active ? "" : "opacity-60"}>
                    <TableCell className="font-medium">{m.full_name || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{m.email || "—"}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                        {m.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${m.is_active ? "text-green-600" : "text-muted-foreground"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${m.is_active ? "bg-green-500" : "bg-muted-foreground"}`} />
                        {m.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {m.created_at ? new Date(m.created_at).toLocaleDateString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditing(m)}>
                            <Pencil className="w-4 h-4 mr-2" /> Editar dados
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditing(m)}>
                            <KeyRound className="w-4 h-4 mr-2" /> E-mail / senha
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={m.id === profile?.id}
                            onClick={() => activeMut.mutate(m)}
                          >
                            <Power className="w-4 h-4 mr-2" />
                            {m.is_active ? "Desativar" : "Reativar"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            disabled={m.id === profile?.id}
                            onClick={() => setDeleting(m)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <CreateSdrDialog open={createOpen} onOpenChange={setCreateOpen} onDone={invalidate} />
      {editing && (
        <EditSdrDialog member={editing} onClose={() => setEditing(null)} onDone={invalidate} />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover {deleting?.full_name || "membro"}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é permanente. O acesso e a conta de {deleting?.email} serão excluídos. O histórico de leads é preservado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleting && deleteMut.mutate(deleting)}
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}

function CreateSdrDialog({ open, onOpenChange, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; onDone: () => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const mut = useMutation({
    mutationFn: async () =>
      createSdr({ data: { accessToken: await getAccessToken(), fullName, email, password } }),
    onSuccess: () => {
      toast.success("SDR criado com sucesso");
      setFullName(""); setEmail(""); setPassword("");
      onOpenChange(false);
      onDone();
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao criar SDR"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo SDR</DialogTitle>
          <DialogDescription>O membro poderá entrar imediatamente com o e-mail e senha definidos.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}
        >
          <div className="space-y-2">
            <Label htmlFor="c-name">Nome completo</Label>
            <Input id="c-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="João Silva" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-email">E-mail</Label>
            <Input id="c-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="joao@empresa.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-pass">Senha provisória</Label>
            <Input id="c-pass" type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="mínimo 6 caracteres" required />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={mut.isPending}>
              {mut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar SDR"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditSdrDialog({ member, onClose, onDone }: { member: Member; onClose: () => void; onDone: () => void }) {
  const [fullName, setFullName] = useState(member.full_name ?? "");
  const [email, setEmail] = useState(member.email ?? "");
  const [password, setPassword] = useState("");

  const mut = useMutation({
    mutationFn: async () =>
      updateSdr({
        data: {
          accessToken: await getAccessToken(),
          userId: member.id,
          fullName: fullName.trim() || undefined,
          email: email.trim() && email.trim() !== member.email ? email.trim() : undefined,
          password: password.trim() || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Dados atualizados");
      onClose();
      onDone();
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao atualizar"),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar {member?.full_name || "membro"}</DialogTitle>
          <DialogDescription>Altere os dados de acesso. Deixe a senha em branco para mantê-la.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}>
          <div className="space-y-2">
            <Label htmlFor="e-name">Nome completo</Label>
            <Input id="e-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="e-email" className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> E-mail</Label>
            <Input id="e-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="e-pass" className="flex items-center gap-1.5"><KeyRound className="w-3.5 h-3.5" /> Nova senha</Label>
            <Input id="e-pass" type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="deixe em branco para não alterar" />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={mut.isPending}>
              {mut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export const Route = createFileRoute("/admin/team")({
  component: () => (
    <RoleGuard requiredRole="admin" fallbackPath="/sdr">
      <TeamManagement />
    </RoleGuard>
  ),
});
