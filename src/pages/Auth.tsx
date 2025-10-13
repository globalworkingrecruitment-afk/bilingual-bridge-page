import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LanguageToggle } from "@/components/LanguageToggle";
import { englishContent } from "@/content/english";
import { norwegianContent } from "@/content/norwegian";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<"en" | "no">("en");
  const { toast } = useToast();
  const navigate = useNavigate();

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
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/#/auth`,
        },
      });

      if (error) throw error;

      toast({
        title: content.auth.checkEmail,
      });
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
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-10"
        style={{ backgroundImage: "url('/globalworking-logo.svg')" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-background/95 via-background/80 to-primary/40"
      />

      <div className="absolute top-6 right-6 z-20">
        <LanguageToggle language={language} onToggle={() => setLanguage(prev => prev === "en" ? "no" : "en")} />
      </div>

      <Card className="relative z-10 w-full max-w-md border-primary/30 bg-background/90 backdrop-blur-xl shadow-2xl">
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
              <Label htmlFor="email">{content.auth.emailLabel}</Label>
              <Input
                id="email"
                type="email"
                placeholder={content.auth.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
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
