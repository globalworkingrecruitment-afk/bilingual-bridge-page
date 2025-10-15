import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AppUser, AccessLog, CandidateViewLog } from "@/types/auth";
import { ScheduleRequestLog } from "@/types/schedule";
import {
  addUser,
  getAccessLogs,
  getUsers,
  toggleUserStatus,
  getCandidateViewsByUser,
  getScheduleRequests,
} from "@/lib/localDb";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
  const [meetingRequests, setMeetingRequests] = useState<ScheduleRequestLog[]>([]);
  const [hoveredUserId, setHoveredUserId] = useState<string | null>(null);

  useEffect(() => {
    setUsers(getUsers());
    setLogs(getAccessLogs());
    setCandidateViews(getCandidateViewsByUser());
    setMeetingRequests(getScheduleRequests());
  }, []);

  const activeUsers = useMemo(() => users.filter((user) => user.isActive).length, [users]);

  const getViewsForUser = useCallback(
    (username: string): CandidateViewLog[] => {
      const key = username.trim().toLowerCase();
      return candidateViews[key] ?? [];
    },
    [candidateViews],
  );

  const meetingRequestsByUser = useMemo(() => {
    return meetingRequests.reduce<Record<string, ScheduleRequestLog[]>>((accumulator, request) => {
      const key = request.employerUsername.trim().toLowerCase();

      if (!accumulator[key]) {
        accumulator[key] = [];
      }

      accumulator[key].push(request);
      return accumulator;
    }, {});
  }, [meetingRequests]);

  const getRequestsForUser = useCallback(
    (username: string): ScheduleRequestLog[] => {
      const key = username.trim().toLowerCase();
      return meetingRequestsByUser[key] ?? [];
    },
    [meetingRequestsByUser],
  );

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
    setMeetingRequests(getScheduleRequests());
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
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Usuarios registrados</CardTitle>
              <CardDescription>
                Habilita o deshabilita accesos según las necesidades del negocio y consulta sus actividades recientes.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefreshData}>
              Actualizar datos
            </Button>
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
                    <TableHead>Solicitudes de reunión</TableHead>
                    <TableHead>Creado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const views = getViewsForUser(user.username);
                    const requests = getRequestsForUser(user.username);

                    return (
                      <Fragment key={user.id}>
                        <TableRow
                          onMouseEnter={() => setHoveredUserId(user.id)}
                          onMouseLeave={() =>
                            setHoveredUserId((previous) => (previous === user.id ? null : previous))
                          }
                          onFocusCapture={() => setHoveredUserId(user.id)}
                          onBlurCapture={() =>
                            setHoveredUserId((previous) => (previous === user.id ? null : previous))
                          }
                          className="cursor-pointer"
                        >
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
                            <Badge variant="outline" className="font-semibold">
                              {views.length}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {requests.length === 0 ? (
                            <span className="text-sm text-muted-foreground">Sin solicitudes</span>
                          ) : (
                            <Badge variant="outline" className="font-semibold">
                              {requests.length}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleToggleUser(user.id)}>
                              {user.isActive ? "Deshabilitar" : "Habilitar"}
                            </Button>
                          </TableCell>
                        </TableRow>
                        {hoveredUserId === user.id && (
                          <TableRow className="bg-slate-50/70">
                            <TableCell colSpan={8} className="p-6">
                              <div className="grid gap-6 md:grid-cols-2">
                                <div>
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold text-foreground">Candidatos vistos</p>
                                    {views.length > 0 && (
                                      <span className="text-xs text-muted-foreground">
                                        Última visita {new Date(views[0].viewedAt).toLocaleString()}
                                      </span>
                                    )}
                                  </div>
                                  {views.length === 0 ? (
                                    <p className="mt-2 text-sm text-muted-foreground">Sin vistas registradas.</p>
                                  ) : (
                                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                                      {views.map((view) => (
                                        <li key={view.id} className="flex flex-col gap-0.5">
                                          <span className="font-medium text-foreground">{view.candidateName}</span>
                                          <span className="text-xs text-muted-foreground">
                                            {new Date(view.viewedAt).toLocaleString()}
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold text-foreground">Solicitudes de reunión</p>
                                    {requests.length > 0 && (
                                      <span className="text-xs text-muted-foreground">
                                        Última solicitud {new Date(requests[0].requestedAt).toLocaleString()}
                                      </span>
                                    )}
                                  </div>
                                  {requests.length === 0 ? (
                                    <p className="mt-2 text-sm text-muted-foreground">Sin solicitudes registradas.</p>
                                  ) : (
                                    <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                                      {requests.map((request) => (
                                        <li
                                          key={request.id}
                                          className="flex flex-col gap-1 rounded border border-slate-200/80 p-3"
                                        >
                                          <span className="font-medium text-foreground">{request.candidateName}</span>
                                          <span className="text-xs text-muted-foreground">
                                            {new Date(request.requestedAt).toLocaleString()}
                                          </span>
                                          <span className="whitespace-pre-wrap text-xs leading-snug text-muted-foreground">
                                            {request.availability}
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white/90 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle>Registro de accesos</CardTitle>
            <CardDescription>Consulta quién ingresó a la aplicación y cuándo lo hizo.</CardDescription>
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

      </div>
    </div>
  );
};

export default AdminDashboard;
