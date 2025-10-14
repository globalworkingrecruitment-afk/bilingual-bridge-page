import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AppUser, AccessLog, CandidateViewLog } from "@/types/auth";
import {
  addUser,
  getAccessLogs,
  getUsers,
  toggleUserStatus,
  getCandidateViewsByUser,
  updateUserEmail,
} from "@/lib/localDb";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mockCandidates } from "@/data/mockCandidates";

type ScheduleStep = "email" | "availability" | "confirm";

interface ScheduleCandidateOption {
  id: string;
  name: string;
  email?: string;
}

const SCHEDULE_WEBHOOK_URL =
  "https://primary-production-cdb3.up.railway.app/webhook-test/6669a30e-b24c-46ac-a0d3-20859ffe133c";

const AdminDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [users, setUsers] = useState<AppUser[]>([]);
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [candidateViews, setCandidateViews] = useState<Record<string, CandidateViewLog[]>>({});
  const [newUserUsername, setNewUserUsername] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [scheduleStep, setScheduleStep] = useState<ScheduleStep>("email");
  const [scheduleEmployerEmail, setScheduleEmployerEmail] = useState("");
  const [scheduleAvailability, setScheduleAvailability] = useState("");
  const [scheduleCandidateId, setScheduleCandidateId] = useState<string | null>(null);
  const [scheduleCandidateName, setScheduleCandidateName] = useState("");
  const [scheduleCandidateEmail, setScheduleCandidateEmail] = useState("");
  const [scheduleUser, setScheduleUser] = useState<AppUser | null>(null);
  const [scheduleCandidates, setScheduleCandidates] = useState<ScheduleCandidateOption[]>([]);
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);

  const resetScheduleDialog = () => {
    setScheduleStep("email");
    setScheduleEmployerEmail("");
    setScheduleAvailability("");
    setScheduleCandidateId(null);
    setScheduleCandidateName("");
    setScheduleCandidateEmail("");
    setScheduleUser(null);
    setScheduleCandidates([]);
    setIsSubmittingSchedule(false);
  };

  useEffect(() => {
    setUsers(getUsers());
    setLogs(getAccessLogs());
    setCandidateViews(getCandidateViewsByUser());
  }, []);

  const activeUsers = useMemo(() => users.filter((user) => user.isActive).length, [users]);

  const getViewsForUser = useCallback(
    (username: string): CandidateViewLog[] => {
      const key = username.trim().toLowerCase();
      return candidateViews[key] ?? [];
    },
    [candidateViews],
  );

  const closeScheduleDialog = () => {
    setIsScheduleDialogOpen(false);
    resetScheduleDialog();
  };

  const handleOpenScheduleDialog = (user: AppUser) => {
    const views = getViewsForUser(user.username);

    if (views.length === 0) {
      toast({
        title: "Sin candidatos registrados",
        description: "Este empleador aún no ha visitado candidatos para agendar una reunión.",
      });
      return;
    }

    const candidateOptions = views.reduce<ScheduleCandidateOption[]>((accumulator, view) => {
      if (accumulator.some((option) => option.id === view.candidateId)) {
        return accumulator;
      }

      const candidateDetails = mockCandidates.find((candidate) => candidate.id === view.candidateId);
      accumulator.push({
        id: view.candidateId,
        name: view.candidateName,
        email: candidateDetails?.email,
      });
      return accumulator;
    }, []);

    if (candidateOptions.length === 0) {
      toast({
        title: "No hay candidatos disponibles",
        description: "No se encontraron candidatos válidos para agendar la reunión.",
        variant: "destructive",
      });
      return;
    }

    resetScheduleDialog();
    setScheduleUser(user);
    setScheduleCandidates(candidateOptions);
    const defaultCandidate = candidateOptions[0];
    setScheduleCandidateId(defaultCandidate?.id ?? null);
    setScheduleCandidateName(defaultCandidate?.name ?? "");
    setScheduleCandidateEmail(defaultCandidate?.email ?? "");
    setScheduleEmployerEmail(user.email ?? "");
    setScheduleStep(user.email ? "availability" : "email");
    setIsScheduleDialogOpen(true);
  };

  const handleCandidateChange = (candidateId: string) => {
    setScheduleCandidateId(candidateId);
    const selectedCandidate = scheduleCandidates.find((candidate) => candidate.id === candidateId);
    if (selectedCandidate) {
      setScheduleCandidateName(selectedCandidate.name);
      setScheduleCandidateEmail(selectedCandidate.email ?? "");
    } else {
      setScheduleCandidateName("");
      setScheduleCandidateEmail("");
    }
  };

  const handleEmployerEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!scheduleUser) return;

    const normalizedEmail = scheduleEmployerEmail.trim();
    if (!normalizedEmail) {
      toast({
        title: "Correo requerido",
        description: "Necesitamos un correo electrónico para continuar con la solicitud.",
        variant: "destructive",
      });
      return;
    }

    try {
      const updatedUser = updateUserEmail(scheduleUser.id, normalizedEmail);
      if (updatedUser) {
        setUsers((previous) => previous.map((user) => (user.id === updatedUser.id ? updatedUser : user)));
        setScheduleUser(updatedUser);
        setScheduleEmployerEmail(updatedUser.email ?? "");
      }
      setScheduleStep("availability");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "No se pudo guardar el correo electrónico del empleador.";
      toast({ title: "Error al guardar", description: message, variant: "destructive" });
    }
  };

  const handleAvailabilitySubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!scheduleCandidateId) {
      toast({
        title: "Selecciona un candidato",
        description: "Debes elegir un candidato para continuar.",
        variant: "destructive",
      });
      return;
    }

    const normalizedCandidateEmail = scheduleCandidateEmail.trim();
    const normalizedAvailability = scheduleAvailability.trim();

    if (!normalizedCandidateEmail) {
      toast({
        title: "Correo del candidato requerido",
        description: "Incluye un correo de contacto para el candidato.",
        variant: "destructive",
      });
      return;
    }

    if (!normalizedAvailability) {
      toast({
        title: "Disponibilidad requerida",
        description: "Describe la disponibilidad propuesta para la reunión.",
        variant: "destructive",
      });
      return;
    }

    setScheduleCandidateEmail(normalizedCandidateEmail);
    setScheduleAvailability(normalizedAvailability);
    setScheduleStep("confirm");
  };

  const handleConfirmSchedule = async () => {
    if (!scheduleUser || !scheduleCandidateId) {
      return;
    }

    const payload = {
      emailEmpleador: scheduleEmployerEmail.trim(),
      emailCandidato: scheduleCandidateEmail.trim(),
      NombreCandidato: scheduleCandidateName,
      disponibilidad: scheduleAvailability.trim(),
    };

    setIsSubmittingSchedule(true);

    try {
      const response = await fetch(SCHEDULE_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "El servicio de agenda respondió con un error.");
      }

      toast({
        title: "Solicitud enviada",
        description: "La disponibilidad fue enviada para coordinar la reunión.",
      });
      closeScheduleDialog();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "No se pudo completar la solicitud de reunión.";
      toast({ title: "Error al agendar", description: message, variant: "destructive" });
    } finally {
      setIsSubmittingSchedule(false);
    }
  };

  const handleAddUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsCreatingUser(true);

    try {
      const createdUser = addUser(newUserUsername, newUserPassword, newUserName, newUserEmail);
      setUsers((previous) => [...previous, createdUser]);
      setLogs(getAccessLogs());
      setCandidateViews(getCandidateViewsByUser());
      toast({
        title: "Usuario creado correctamente",
        description: `${createdUser.username} ahora puede iniciar sesión en la plataforma.`,
      });
      setNewUserUsername("");
      setNewUserPassword("");
      setNewUserName("");
      setNewUserEmail("");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "No se pudo crear el usuario.";
      toast({ title: "Error al crear usuario", description: message, variant: "destructive" });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleToggleUser = (userId: string) => {
    const updated = toggleUserStatus(userId);
    if (!updated) return;

    setUsers((previous) => previous.map((user) => (user.id === updated.id ? updated : user)));
    toast({
      title: updated.isActive ? "Usuario habilitado" : "Usuario deshabilitado",
      description: updated.isActive
        ? "El usuario podrá iniciar sesión nuevamente."
        : "El usuario ya no podrá iniciar sesión hasta ser habilitado.",
    });
  };

  const handleRefreshData = () => {
    setLogs(getAccessLogs());
    setCandidateViews(getCandidateViewsByUser());
    toast({ title: "Registros actualizados" });
  };

  const handleLogout = () => {
    logout();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pt-12 text-slate-900">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Panel de control del administrador</h1>
            <p className="text-muted-foreground">
              Gestiona usuarios autorizados y revisa los accesos recientes a la plataforma.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right text-sm text-muted-foreground">
              <p className="font-medium">{currentUser?.username}</p>
              <p className="text-xs uppercase tracking-wide">Administrador</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Cerrar sesión
            </Button>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-3">
          <Card className="border-slate-200 bg-white/90 shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle>Usuarios activos</CardTitle>
              <CardDescription>Usuarios autorizados actualmente para ingresar.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{activeUsers}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white/90 shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle>Usuarios registrados</CardTitle>
              <CardDescription>Total de usuarios creados por el administrador.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{users.length}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white/90 shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle>Último acceso</CardTitle>
              <CardDescription>Fecha del último inicio de sesión registrado.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">
                {logs[0] ? new Date(logs[0].loggedAt).toLocaleString() : "Sin registros"}
              </p>
            </CardContent>
          </Card>
        </section>

        <Card className="border-slate-200 bg-white/90 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle>Crear nuevo usuario</CardTitle>
            <CardDescription>
              Genera credenciales validadas para otorgar acceso a colaboradores y clientes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-4" onSubmit={handleAddUser}>
              <div className="space-y-2">
                <Label htmlFor="new-user-name">Nombre completo</Label>
                <Input
                  id="new-user-name"
                  placeholder="Nombre de la persona"
                  value={newUserName}
                  onChange={(event) => setNewUserName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-user-username">Nombre de usuario</Label>
                <Input
                  id="new-user-username"
                  placeholder="usuario.ejemplo"
                  value={newUserUsername}
                  onChange={(event) => setNewUserUsername(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-user-email">Correo electrónico (opcional)</Label>
                <Input
                  id="new-user-email"
                  type="email"
                  placeholder="empleador@empresa.com"
                  value={newUserEmail}
                  onChange={(event) => setNewUserEmail(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-user-password">Contraseña temporal</Label>
                <Input
                  id="new-user-password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={newUserPassword}
                  onChange={(event) => setNewUserPassword(event.target.value)}
                  required
                />
              </div>
              <div className="md:col-span-4 flex justify-end">
                <Button type="submit" disabled={isCreatingUser}>
                  {isCreatingUser ? "Creando..." : "Guardar usuario"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white/90 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle>Usuarios registrados</CardTitle>
            <CardDescription>Habilita o deshabilita accesos según las necesidades del negocio.</CardDescription>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aún no se han creado usuarios.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Candidatos vistos</TableHead>
                    <TableHead>Creado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const views = getViewsForUser(user.username);

                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.fullName ?? "Sin especificar"}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email ?? "Sin email"}</TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? "default" : "secondary"}>
                            {user.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {views.length === 0 ? (
                            <span className="text-sm text-muted-foreground">Sin vistas</span>
                          ) : (
                            <HoverCard>
                              <HoverCardTrigger asChild>
                                <Badge variant="outline" className="cursor-default font-semibold">
                                  {views.length}
                                </Badge>
                              </HoverCardTrigger>
                              <HoverCardContent
                                side="bottom"
                                align="start"
                                sideOffset={8}
                                className="space-y-2"
                              >
                                <div>
                                  <p className="text-sm font-semibold text-foreground">Candidatos vistos</p>
                                  <p className="text-xs text-muted-foreground">
                                    Última visita el {new Date(views[0].viewedAt).toLocaleString()}
                                  </p>
                                </div>
                                <ul className="space-y-1 text-sm text-muted-foreground">
                                  {views.map((view) => (
                                    <li key={view.id}>{view.candidateName}</li>
                                  ))}
                                </ul>
                              </HoverCardContent>
                            </HoverCard>
                          )}
                        </TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              size="icon"
                              className="h-9 w-9 bg-emerald-500 text-white hover:bg-emerald-600"
                              onClick={() => handleOpenScheduleDialog(user)}
                              aria-label="Agendar reunión con candidato"
                              title="Agendar reunión"
                              disabled={views.length === 0}
                            >
                              <Calendar className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleToggleUser(user.id)}>
                              {user.isActive ? "Deshabilitar" : "Habilitar"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white/90 shadow-sm backdrop-blur">
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>Registro de accesos</CardTitle>
              <CardDescription>Consulta quién ingresó a la aplicación y cuándo lo hizo.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefreshData}>
              Actualizar
            </Button>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aún no existen accesos registrados.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Fecha de ingreso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.username}</TableCell>
                      <TableCell className="capitalize">{log.role}</TableCell>
                      <TableCell>{new Date(log.loggedAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog
          open={isScheduleDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              closeScheduleDialog();
            }
          }}
        >
          <DialogContent>
            {scheduleStep === "email" && (
              <form className="space-y-6" onSubmit={handleEmployerEmailSubmit}>
                <DialogHeader>
                  <DialogTitle>Agendar reunión</DialogTitle>
                  <DialogDescription>
                    Necesitamos un correo electrónico del empleador para compartir los detalles con el candidato seleccionado.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="schedule-employer-email">Correo del empleador</Label>
                  <Input
                    id="schedule-employer-email"
                    type="email"
                    placeholder="empleador@empresa.com"
                    value={scheduleEmployerEmail}
                    onChange={(event) => setScheduleEmployerEmail(event.target.value)}
                    required
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={closeScheduleDialog}>
                    Cancelar
                  </Button>
                  <Button type="submit">Continuar</Button>
                </DialogFooter>
              </form>
            )}

            {scheduleStep === "availability" && (
              <form className="space-y-6" onSubmit={handleAvailabilitySubmit}>
                <DialogHeader>
                  <DialogTitle>Definir disponibilidad</DialogTitle>
                  <DialogDescription>
                    Selecciona al candidato que quieres contactar y comparte los horarios sugeridos para la reunión.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="schedule-candidate">Candidato</Label>
                    <Select value={scheduleCandidateId ?? undefined} onValueChange={handleCandidateChange}>
                      <SelectTrigger id="schedule-candidate">
                        <SelectValue placeholder="Selecciona un candidato" />
                      </SelectTrigger>
                      <SelectContent>
                        {scheduleCandidates.map((candidate) => (
                          <SelectItem key={candidate.id} value={candidate.id}>
                            {candidate.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schedule-candidate-email">Correo del candidato</Label>
                    <Input
                      id="schedule-candidate-email"
                      type="email"
                      placeholder="candidato@correo.com"
                      value={scheduleCandidateEmail}
                      onChange={(event) => setScheduleCandidateEmail(event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schedule-availability">Disponibilidad propuesta</Label>
                    <Textarea
                      id="schedule-availability"
                      placeholder="Indica fechas y horarios que propones para la reunión"
                      value={scheduleAvailability}
                      onChange={(event) => setScheduleAvailability(event.target.value)}
                      rows={4}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={closeScheduleDialog}>
                    Cancelar
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setScheduleStep("email")}>
                    Modificar correo
                  </Button>
                  <Button type="submit">Continuar</Button>
                </DialogFooter>
              </form>
            )}

            {scheduleStep === "confirm" && (
              <div className="space-y-6">
                <DialogHeader>
                  <DialogTitle>Confirmar solicitud</DialogTitle>
                  <DialogDescription>
                    Revisa la información y confirma para enviar la disponibilidad al candidato.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="font-semibold text-foreground">Empleador</p>
                    <p className="text-muted-foreground">
                      {scheduleUser?.fullName || scheduleUser?.username || "Sin nombre"}
                    </p>
                    <p className="text-muted-foreground">{scheduleEmployerEmail}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Candidato</p>
                    <p className="text-muted-foreground">{scheduleCandidateName || "Sin candidato"}</p>
                    <p className="text-muted-foreground">{scheduleCandidateEmail}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Disponibilidad propuesta</p>
                    <p className="whitespace-pre-wrap text-muted-foreground">{scheduleAvailability}</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setScheduleStep("availability")}
                    disabled={isSubmittingSchedule}
                  >
                    Volver
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeScheduleDialog}
                    disabled={isSubmittingSchedule}
                  >
                    Cancelar
                  </Button>
                  <Button type="button" onClick={handleConfirmSchedule} disabled={isSubmittingSchedule}>
                    {isSubmittingSchedule ? "Enviando..." : "Confirmar y enviar"}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminDashboard;
