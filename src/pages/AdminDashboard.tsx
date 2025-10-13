import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AppUser, AccessLog } from "@/types/auth";
import { addUser, getAccessLogs, getUsers, toggleUserStatus } from "@/lib/localDb";
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
  const [newUserUsername, setNewUserUsername] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  useEffect(() => {
    setUsers(getUsers());
    setLogs(getAccessLogs());
  }, []);

  const activeUsers = useMemo(() => users.filter((user) => user.isActive).length, [users]);

  const handleAddUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsCreatingUser(true);

    try {
      const createdUser = addUser(newUserUsername, newUserPassword, newUserName);
      setUsers((previous) => [...previous, createdUser]);
      setLogs(getAccessLogs());
      toast({
        title: "Usuario creado correctamente",
        description: `${createdUser.username} ahora puede iniciar sesión en la plataforma.`,
      });
      setNewUserUsername("");
      setNewUserPassword("");
      setNewUserName("");
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

  const handleRefreshLogs = () => {
    setLogs(getAccessLogs());
    toast({ title: "Registros actualizados" });
  };

  const handleLogout = () => {
    logout();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pt-12 text-foreground">
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
          <Card className="border-primary/30 bg-background/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Usuarios activos</CardTitle>
              <CardDescription>Usuarios autorizados actualmente para ingresar.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{activeUsers}</p>
            </CardContent>
          </Card>
          <Card className="border-primary/30 bg-background/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Usuarios registrados</CardTitle>
              <CardDescription>Total de usuarios creados por el administrador.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{users.length}</p>
            </CardContent>
          </Card>
          <Card className="border-primary/30 bg-background/80 backdrop-blur">
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

        <Card className="border-primary/30 bg-background/80 backdrop-blur">
          <CardHeader>
            <CardTitle>Crear nuevo usuario</CardTitle>
            <CardDescription>
              Genera credenciales validadas para otorgar acceso a colaboradores y clientes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-3" onSubmit={handleAddUser}>
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
              <div className="md:col-span-3 flex justify-end">
                <Button type="submit" disabled={isCreatingUser}>
                  {isCreatingUser ? "Creando..." : "Guardar usuario"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-background/80 backdrop-blur">
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
                    <TableHead>Estado</TableHead>
                    <TableHead>Creado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.fullName ?? "Sin especificar"}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? "default" : "secondary"}>
                          {user.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleToggleUser(user.id)}>
                          {user.isActive ? "Deshabilitar" : "Habilitar"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-background/80 backdrop-blur">
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>Registro de accesos</CardTitle>
              <CardDescription>Consulta quién ingresó a la aplicación y cuándo lo hizo.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefreshLogs}>
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
      </div>
    </div>
  );
};

export default AdminDashboard;
