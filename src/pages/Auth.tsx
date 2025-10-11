import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/browse`,
        },
      });

      if (error) throw error;

      toast({
        title: content.auth.checkEmail,
      });
    } catch (error: any) {
      toast({
        title: content.auth.error,
        description: error.message,
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
              onClick={() => navigate("/browse")}
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
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
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
