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
      toast.error("Incorrect administrator credentials.");
      return;
    }

    setAdminSession(true);
    setIsAuthenticated(true);
    toast.success("Administrator access granted.");
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
      toast.success("New portal credential saved.");
    } catch (error: any) {
      toast.error(error.message ?? "We could not create the credential.");
    }
  };

  const handleRemoveUser = (username: string) => {
    removePortalUser(username);
    setUsers(getPortalUsers());
    toast.success(`The user ${username} has been removed.`);
  };

  const domainHelper = !domainMatches ? (
    !ALLOW_DOMAIN_FALLBACK ? (
      <Alert variant="destructive" className="mb-4">
        <AlertTitle>Incorrect domain</AlertTitle>
        <AlertDescription>
          Open the admin panel from <strong>{ADMIN_DOMAIN}</strong>. You are currently using
          <strong> {currentHost || "an unknown domain"}</strong>.
        </AlertDescription>
      </Alert>
    ) : (
      <Alert className="mb-4">
        <AlertTitle>Recommended domain</AlertTitle>
        <AlertDescription>
          This panel is intended to run on <strong>{ADMIN_DOMAIN}</strong>. You are currently using
          <strong> {currentHost || "an unknown domain"}</strong>. Configure DNS or your hosts file to separate the
          admin domain.
        </AlertDescription>
      </Alert>
    )
  ) : null;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950/90 p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Administration Panel</CardTitle>
            <CardDescription>Sign in with the administrator credentials.</CardDescription>
          </CardHeader>
          <CardContent>
            {domainHelper}
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-user">Username</Label>
                <Input
                  id="admin-user"
                  value={adminUser}
                  onChange={(event) => setAdminUser(event.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-pass">Password</Label>
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
                Sign in as administrator
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
            <h1 className="text-3xl font-bold">Administration Panel</h1>
            <p className="text-slate-300">
              Manage portal credentials and review who accessed the main page.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Current domain: {currentHost || "unknown"}</Badge>
            <Button variant="outline" onClick={handleAdminLogout}>
              Sign out
            </Button>
            <Button variant="secondary" onClick={() => window.open(publicUrl, "_blank")}>Open main portal</Button>
          </div>
        </header>

        {domainHelper}

        <section>
          <Card>
            <CardHeader>
              <CardTitle>Create access for the main portal</CardTitle>
              <CardDescription>
                Add a username and password that your partners will use on the public domain ({publicDomain}).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="new-user">Username</Label>
                  <Input
                    id="new-user"
                    value={newUser}
                    onChange={(event) => setNewUser(event.target.value)}
                    autoComplete="off"
                    placeholder="user.example"
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="new-pass">Password</Label>
                  <Input
                    id="new-pass"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    autoComplete="new-password"
                    placeholder="Secure password"
                    required
                  />
                </div>
                <div className="flex items-end md:col-span-1">
                  <Button type="submit" className="w-full">
                    Save credential
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Available credentials</CardTitle>
              <CardDescription>Users allowed to reach the main portal.</CardDescription>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  There are no credentials yet. Create at least one user so they can sign in.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
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
                            Remove
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
              <CardTitle>Recent access</CardTitle>
              <CardDescription>Activity log for users entering the main page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 max-h-80 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  There are no access records yet. Once a user signs in from the public domain you will see it here.
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
