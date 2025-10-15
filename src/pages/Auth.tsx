import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LanguageToggle } from "@/components/LanguageToggle";
import { englishContent } from "@/content/english";
import { norwegianContent } from "@/content/norwegian";
import { useAuth } from "@/context/AuthContext";

const Auth = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<"en" | "no">("en");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { currentUser, login, loading: sessionLoading } = useAuth();

  const content = language === "en" ? englishContent : norwegianContent;

  useEffect(() => {
    if (sessionLoading) return;

    if (currentUser?.role === "admin") {
      navigate("/admin", { replace: true });
    } else if (currentUser) {
      navigate("/", { replace: true });
    }
  }, [currentUser, navigate, sessionLoading]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const user = await login(username, password);

      toast({
        title: user.role === "admin" ? content.auth.successAdmin : content.auth.successUser,
      });

      navigate(user.role === "admin" ? "/admin" : "/", { replace: true });
    } catch (error: unknown) {
      const description = error instanceof Error ? error.message : content.auth.error;

      toast({
        title: content.auth.error,
        description,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 flex items-center justify-center px-6 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-25"
        style={{ backgroundImage: "url('/globalworking-logo.svg')" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-950/95 via-slate-900/70 to-primary/30"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.35),transparent_60%)]"
      />

      <div className="absolute top-6 right-6 z-20">
        <LanguageToggle language={language} onToggle={() => setLanguage((prev) => (prev === "en" ? "no" : "en"))} />
      </div>

      <Card className="relative z-10 w-full max-w-md border-primary/30 bg-background/90 backdrop-blur-xl shadow-2xl shadow-primary/20">
        <CardHeader className="space-y-4 text-center">
          <img
            src="/globalworking-logo.svg"
            alt="Global Working"
            className="mx-auto h-14 w-auto"
          />
          <CardTitle className="text-3xl font-bold text-foreground">
            {content.auth.title}
          </CardTitle>
          <CardDescription className="text-base">
            {content.auth.subtitle}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2 text-left">
              <Label htmlFor="username">{content.auth.usernameLabel}</Label>
              <Input
                id="username"
                type="text"
                placeholder={content.auth.usernamePlaceholder}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2 text-left">
              <Label htmlFor="password">{content.auth.passwordLabel}</Label>
              <Input
                id="password"
                type="password"
                placeholder={content.auth.passwordPlaceholder}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? content.auth.loading : content.auth.loginButton}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
