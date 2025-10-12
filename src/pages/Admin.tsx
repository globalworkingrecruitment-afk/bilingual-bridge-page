import { useEffect, useState } from "react";
import {
  ADMIN_PASSWORD,
  ADMIN_USERNAME,
  PortalAccessLog,
  PortalUser,
  addPortalUser,
  clearAdminSession,
  getAdminSession,
  getPortalAccessLogs,
  getPortalUsers,
  removePortalUser,
  setAdminSession,
} from "@/lib/portalAuth";
import { ALLOW_DOMAIN_FALLBACK, ADMIN_DOMAIN, APP_DOMAIN, getCurrentHost } from "@/lib/domainConfig";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const Admin = () => {
  const [currentHost, setCurrentHost] = useState<string>("");
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(getAdminSession());
  const [users, setUsers] = useState<PortalUser[]>([]);
  const [logs, setLogs] = useState<PortalAccessLog[]>([]);
  const [newUser, setNewUser] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    setCurrentHost(getCurrentHost());
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    setUsers(getPortalUsers());
    setLogs(getPortalAccessLogs());
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const syncState = () => {
      setUsers(getPortalUsers());
      setLogs(getPortalAccessLogs());
    };

    window.addEventListener("storage", syncState);

    return () => {
      window.removeEventListener("storage", syncState);
    };
  }, [isAuthenticated]);

  const domainMatches = currentHost === ADMIN_DOMAIN;
  const publicDomain = ADMIN_DOMAIN.startsWith("admin.")
    ? ADMIN_DOMAIN.replace(/^admin\./, "")
    : ADMIN_DOMAIN;
  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.protocol}//${APP_DOMAIN}/#/auth`
      : `https://${APP_DOMAIN}/#/auth`;

  const handleAdminLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (adminUser !== ADMIN_USERNAME || adminPass !== ADMIN_PASSWORD) {
      toast.error("Credenciales de administrador incorrectas.");
      return;
    }

    setAdminSession(true);
    setIsAuthenticated(true);
    toast.success("Has accedido al panel de administración.");
  };

  const handleAdminLogout = () => {
    clearAdminSession();
    setIsAuthenticated(false);
    setAdminUser("");
    setAdminPass("");
  };

  const handleCreateUser = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      addPortalUser(newUser, newPassword);
      setUsers(getPortalUsers());
      setNewUser("");
      setNewPassword("");
      toast.success("Nuevo acceso creado correctamente.");
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo crear el acceso.");
    }
  };

  const handleRemoveUser = (username: string) => {
    try {
      removePortalUser(username);
      setUsers(getPortalUsers());
      toast.success(`El usuario ${username} ha sido eliminado.`);
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo eliminar el usuario.");
    }
  };

  const domainHelper = !domainMatches ? (
    !ALLOW_DOMAIN_FALLBACK ? (
      <Alert variant="destructive" className="mb-4">
        <AlertTitle>Dominio incorrecto</AlertTitle>
        <AlertDescription>
          Debes abrir este panel desde <strong>{ADMIN_DOMAIN}</strong>. Estás usando
          <strong> {currentHost || "un dominio desconocido"}</strong>.
        </AlertDescription>
      </Alert>
    ) : (
      <Alert className="mb-4">
        <AlertTitle>Dominio recomendado</AlertTitle>
        <AlertDescription>
          Este panel está pensado para ejecutarse en <strong>{ADMIN_DOMAIN}</strong>. Actualmente estás usando
          <strong> {currentHost || "un dominio desconocido"}</strong>. Configura el DNS o tu archivo hosts para
          separar el dominio de administración.
        </AlertDescription>
      </Alert>
    )
  ) : null;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950/90 p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Panel de Administración</CardTitle>
            <CardDescription>Accede con las credenciales de administrador.</CardDescription>
          </CardHeader>
          <CardContent>
            {domainHelper}
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-user">Usuario</Label>
                <Input
                  id="admin-user"
                  value={adminUser}
                  onChange={(event) => setAdminUser(event.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-pass">Contraseña</Label>
                <Input
                  id="admin-pass"
                  type="password"
                  value={adminPass}
                  onChange={(event) => setAdminPass(event.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Entrar como administrador
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950/90 text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Panel de Administración</h1>
            <p className="text-slate-300">
              Gestiona los accesos al portal principal y revisa la actividad de inicio de sesión.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Dominio actual: {currentHost || "desconocido"}</Badge>
            <Button variant="outline" onClick={handleAdminLogout}>
              Cerrar sesión
            </Button>
            <Button variant="secondary" onClick={() => window.open(publicUrl, "_blank")}>Abrir portal principal</Button>
          </div>
        </header>

        {domainHelper}

        <section>
          <Card>
            <CardHeader>
              <CardTitle>Crear acceso para la página principal</CardTitle>
              <CardDescription>
                Introduce un nombre de usuario y contraseña que usarán en el dominio público ({publicDomain}).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="new-user">Usuario</Label>
                  <Input
                    id="new-user"
                    value={newUser}
                    onChange={(event) => setNewUser(event.target.value)}
                    autoComplete="off"
                    placeholder="usuario.ejemplo"
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="new-pass">Contraseña</Label>
                  <Input
                    id="new-pass"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    autoComplete="new-password"
                    placeholder="Contraseña segura"
                    required
                  />
                </div>
                <div className="flex items-end md:col-span-1">
                  <Button type="submit" className="w-full">
                    Guardar acceso
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Accesos disponibles</CardTitle>
              <CardDescription>Usuarios autorizados para el portal principal.</CardDescription>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aún no has creado accesos. Genera al menos un usuario para que puedan iniciar sesión.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Creado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.username}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleString(undefined, {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveUser(user.username)}
                          >
                            Eliminar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Últimos accesos</CardTitle>
              <CardDescription>Historial de usuarios que han entrado en la página principal.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 max-h-80 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aún no hay registros de acceso. Cuando un usuario inicie sesión desde el dominio público aparecerá
                  aquí.
                </p>
              ) : (
                logs.map((log, index) => (
                  <div key={`${log.username}-${log.accessedAt}-${index}`} className="p-3 rounded-lg bg-slate-800">
                    <p className="font-medium">{log.username}</p>
                    <p className="text-sm text-slate-300">
                      {new Date(log.accessedAt).toLocaleString(undefined, {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default Admin;
