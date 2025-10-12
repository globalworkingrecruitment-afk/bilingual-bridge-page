import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { englishContent } from "@/content/english";
import {
  ADMIN_PASSWORD,
  ADMIN_USERNAME,
  getActivePortalUser,
  getAdminSession,
  getPortalUsers,
  logPortalAccess,
  setActivePortalUser,
  setAdminSession,
import { norwegianContent } from "@/content/norwegian";
import {
  getActivePortalUser,
  getPortalUsers,
  logPortalAccess,
  setActivePortalUser,
  validatePortalUser,
} from "@/lib/portalAuth";
import { ALLOW_DOMAIN_FALLBACK, APP_DOMAIN, getCurrentHost } from "@/lib/domainConfig";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Auth = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<"en" | "no">("en");
  const [currentHost, setCurrentHost] = useState<string>("");
  const [hasUsers, setHasUsers] = useState<boolean>(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const content = englishContent;

  useEffect(() => {
    const updateUsers = () => setHasUsers(getPortalUsers().length > 0);

    setCurrentHost(getCurrentHost());
    updateUsers();

    window.addEventListener("storage", updateUsers);

    return () => {
      window.removeEventListener("storage", updateUsers);
    };
  }, []);

  useEffect(() => {
    const adminActive = getAdminSession();
    if (adminActive) {
      navigate("/admin", { replace: true });
      return;
    }

    const activeUser = getActivePortalUser();
    if (activeUser) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const domainMatches = currentHost === APP_DOMAIN;

  const domainHelper = !domainMatches ? (
    !ALLOW_DOMAIN_FALLBACK ? (
      <Alert variant="destructive" className="mb-4">
        <AlertTitle>{content.auth.domainErrorTitle}</AlertTitle>
        <AlertDescription>
          {content.auth.domainErrorMessage
            .replace("{{domain}}", APP_DOMAIN)
            .replace("{{current}}", currentHost || "")}
        </AlertDescription>
      </Alert>
    ) : (
      <Alert className="mb-4">
        <AlertTitle>{content.auth.domainWarningTitle}</AlertTitle>
        <AlertDescription>
          {content.auth.domainWarningMessage
            .replace("{{domain}}", APP_DOMAIN)
            .replace("{{current}}", currentHost || "")}
        </AlertDescription>
      </Alert>
    )
  ) : null;
  const content = language === "en" ? englishContent : norwegianContent;

  useEffect(() => {
    let isMounted = true;

    const handleRedirectSession = async () => {
      const hash = window.location.hash;

      if (hash.includes("access_token")) {
        const { error } = await supabase.auth.getSessionFromUrl({ storeSession: true });

        if (error) {
          toast({
            title: content.auth.error,
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        if (!isMounted) return;

        window.history.replaceState(
          {},
          document.title,
          `${window.location.origin}/#/`
        );

        navigate("/", { replace: true });
        return;
      }

      const { data } = await supabase.auth.getSession();

      if (isMounted && data.session) {
        navigate("/", { replace: true });
      }
    };

    handleRedirectSession();

    return () => {
      isMounted = false;
    };
  }, [content.auth.error, navigate, toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const normalizedUsername = username.trim();
      const normalizedPassword = password.trim();

      const isAdmin =
        normalizedUsername === ADMIN_USERNAME && normalizedPassword === ADMIN_PASSWORD;

      if (isAdmin) {
        setAdminSession(true);
        toast({
          title: content.auth.adminSuccessTitle,
          description: content.auth.adminSuccessDescription,
        });

        navigate("/admin", { replace: true });
        return;
      }

      if (!validatePortalUser(normalizedUsername, normalizedPassword)) {
        throw new Error(content.auth.invalidCredentials);
      }

      setActivePortalUser(normalizedUsername);
      logPortalAccess(normalizedUsername);

      toast({
        title: content.auth.successTitle,
        description: content.auth.successDescription.replace("{{user}}", normalizedUsername),
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/#/auth`,
        },
      });

      const sanitizedUsername = username.trim();
      setActivePortalUser(sanitizedUsername);
      logPortalAccess(sanitizedUsername);

      toast({
        title: content.auth.successTitle,
        description: content.auth.successDescription.replace("{{user}}", sanitizedUsername),
      });

      navigate("/", { replace: true });
    } catch (error: any) {
      toast({
        title: content.auth.error,
        description: error.message ?? content.auth.genericError,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-6">
      <LanguageToggle language={language} onToggle={() => setLanguage(prev => prev === "en" ? "no" : "en")} />

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {content.auth.backToHome}
            </Button>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {content.auth.title}
          </CardTitle>
          <CardDescription>
            {content.auth.subtitle}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {domainHelper}
          {!hasUsers && (
            <Alert className="mb-4">
              <AlertTitle>{content.auth.missingUsersTitle}</AlertTitle>
              <AlertDescription>{content.auth.missingUsersMessage}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{content.auth.usernameLabel}</Label>
              <Input
                id="username"
                placeholder={content.auth.usernamePlaceholder}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{content.auth.passwordLabel}</Label>
              <Input
                id="password"
                type="password"
                placeholder={content.auth.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="current-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "..." : content.auth.loginButton}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
