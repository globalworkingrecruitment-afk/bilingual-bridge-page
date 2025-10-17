import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CandidateLocale, Candidate } from "@/types/candidate";
import type { AppContent } from "@/types/content";
import { AppUser } from "@/types/auth";
import {
  Briefcase,
  CalendarClock,
  FileText,
  GraduationCap,
  Languages,
  Plus,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { buildExperienceSummary, getCandidateProfile } from "@/lib/candidates";
import {
  getUserByIdentifier,
  recordCandidateView,
  recordScheduleRequest,
  updateUserEmail,
} from "@/lib/localDb";
import { useToast } from "@/hooks/use-toast";
import { getScheduleWebhookUrl } from "@/lib/env";

interface CandidateCardProps {
  candidate: Candidate;
  content: AppContent;
  locale: CandidateLocale;
}

type ScheduleStep = "email" | "availability" | "confirm";

const SCHEDULE_WEBHOOK_URL = getScheduleWebhookUrl();

export const CandidateCard = ({ candidate, content, locale }: CandidateCardProps) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [employerProfile, setEmployerProfile] = useState<AppUser | null>(null);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [scheduleStep, setScheduleStep] = useState<ScheduleStep>("availability");
  const [scheduleEmployerEmail, setScheduleEmployerEmail] = useState("");
  const [scheduleAvailability, setScheduleAvailability] = useState("");
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);

  const profile = getCandidateProfile(candidate, locale);
  const experienceSummary = buildExperienceSummary(profile);
  const experienceLines = experienceSummary
    .split(/\r?\n+/)
    .map(line => line.trim())
    .map(line => line.replace(/^[:•\-\u2022]+\s*/, ""))
    .filter(Boolean);
  const languagesLabel = profile.languages.join(", ");
  const educationLabel = profile.education ?? content.candidateCard.noEducation;
  const summaryText = profile.cover_letter_summary ?? content.candidateCard.noSummary;
  const coverLetterText =
    profile.cover_letter_full ?? profile.cover_letter_summary ?? content.candidateCard.noCoverLetter;
  const languagesText = languagesLabel || content.candidateCard.noLanguages;

  useEffect(() => {
    let active = true;

    const loadEmployerProfile = async () => {
      if (!currentUser || currentUser.role !== "user") {
        if (!active) return;
        setEmployerProfile(null);
        setScheduleEmployerEmail("");
        return;
      }

      try {
        const matchedUser = await getUserByIdentifier(currentUser.username);
        if (!active) return;

        if (matchedUser) {
          setEmployerProfile(matchedUser);
          setScheduleEmployerEmail(matchedUser.email ?? "");
        } else {
          setEmployerProfile(null);
          setScheduleEmployerEmail("");
        }
      } catch (error) {
        console.error("No se pudo cargar el perfil del empleador", error);
      }
    };

    void loadEmployerProfile();

    return () => {
      active = false;
    };
  }, [currentUser]);

  const canSchedule = currentUser?.role === "user";

  const handleDialogOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) return;
      if (!currentUser || currentUser.role !== "user") return;

      void (async () => {
        try {
          await recordCandidateView(currentUser.username, candidate.id, candidate.fullName);
        } catch (error) {
          console.warn("No se pudo registrar la vista del candidato", error);
        }
      })();
    },
    [candidate.fullName, candidate.id, currentUser],
  );

  const resetScheduleState = () => {
    const storedEmail = employerProfile?.email?.trim();
    const fallbackEmail = scheduleEmployerEmail.trim();
    const nextEmail = storedEmail ?? fallbackEmail;

    setScheduleEmployerEmail(nextEmail);
    setScheduleAvailability("");
    setScheduleStep(nextEmail ? "availability" : "email");
    setIsSubmittingSchedule(false);
  };

  const handleOpenScheduleDialog = () => {
    if (!canSchedule) {
      toast({
        title: "Acción no disponible",
        description: "Debes iniciar sesión como empleador para agendar reuniones.",
        variant: "destructive",
      });
      return;
    }

    if (!SCHEDULE_WEBHOOK_URL) {
      toast({
        title: "Servicio no configurado",
        description: "No se encontró la URL segura del webhook para agendar reuniones.",
        variant: "destructive",
      });
      return;
    }

    resetScheduleState();
    setIsScheduleDialogOpen(true);
  };

  const closeScheduleDialog = () => {
    resetScheduleState();
    setIsScheduleDialogOpen(false);
  };

  const handleEmployerEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = scheduleEmployerEmail.trim();

    if (!normalizedEmail) {
      toast({
        title: "Correo requerido",
        description: "Incluye un correo electrónico para continuar con la solicitud.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (employerProfile) {
        const updatedUser = await updateUserEmail(employerProfile.id, normalizedEmail);
        if (updatedUser) {
          setEmployerProfile(updatedUser);
          setScheduleEmployerEmail(updatedUser.email ?? "");
        }
      } else {
        setScheduleEmployerEmail(normalizedEmail);
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

    const normalizedAvailability = scheduleAvailability.trim();

    if (!normalizedAvailability) {
      toast({
        title: "Disponibilidad requerida",
        description: "Describe la disponibilidad propuesta para la reunión.",
        variant: "destructive",
      });
      return;
    }

    setScheduleAvailability(normalizedAvailability);
    setScheduleStep("confirm");
  };

  const handleConfirmSchedule = async () => {
    if (!currentUser) {
      toast({
        title: "Sesión requerida",
        description: "Debes iniciar sesión para completar la solicitud.",
        variant: "destructive",
      });
      return;
    }

    if (!SCHEDULE_WEBHOOK_URL) {
      toast({
        title: "Servicio no disponible",
        description: "El webhook seguro para agendar reuniones no está configurado.",
        variant: "destructive",
      });
      return;
    }

    const normalizedEmployerEmail = scheduleEmployerEmail.trim();
    const normalizedAvailability = scheduleAvailability.trim();

    setScheduleEmployerEmail(normalizedEmployerEmail);

    if (!normalizedEmployerEmail) {
      setScheduleStep("email");
      toast({
        title: "Correo requerido",
        description: "Agrega un correo electrónico del empleador antes de continuar.",
        variant: "destructive",
      });
      return;
    }

    const normalizedCandidateEmail = candidate.email.trim();
    const normalizedEmployerName = employerProfile?.fullName?.trim();

    const payload = {
      emailEmpleador: normalizedEmployerEmail,
      usuarioEmpleador: currentUser.username.trim(),
      nombreEmpleador: normalizedEmployerName ?? currentUser.username.trim(),
      emailCandidato: normalizedCandidateEmail,
      NombreCandidato: candidate.fullName,
      disponibilidad: normalizedAvailability,
    };

    setIsSubmittingSchedule(true);

    try {
      const response = await fetch(SCHEDULE_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "omit",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "El servicio de agenda respondió con un error.");
      }

      await recordScheduleRequest({
        employerUsername: currentUser.username,
        employerEmail: normalizedEmployerEmail,
        employerName: employerProfile?.fullName,
        candidateId: candidate.id,
        candidateName: candidate.fullName,
        candidateEmail: normalizedCandidateEmail,
        availability: normalizedAvailability,
      });

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

  return (
    <Card className="hover:shadow-glow transition-all duration-300 border-2 hover:border-primary/50 group">
      <CardHeader className="pb-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <h3 className="text-xl font-bold">{candidate.fullName}</h3>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {content.candidateCard.profession}
              </p>
              <p className="text-sm text-muted-foreground">{profile.profession}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="icon"
              className="bg-emerald-500 text-white hover:bg-emerald-600"
              onClick={handleOpenScheduleDialog}
              disabled={!canSchedule || !SCHEDULE_WEBHOOK_URL}
              title={
                !canSchedule
                  ? "Inicia sesión como empleador para agendar reuniones"
                  : SCHEDULE_WEBHOOK_URL
                    ? content.candidateCard.scheduleMeeting
                    : "Configura la URL segura del servicio de agenda para habilitar esta acción"
              }
              aria-label={content.candidateCard.scheduleMeeting}
            >
              <CalendarClock className="h-4 w-4" />
            </Button>
            <Dialog onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={content.candidateCard.openDetails}
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{candidate.fullName}</DialogTitle>
                  <DialogDescription>{content.candidateCard.detailDescription}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <GraduationCap className="w-5 h-5 text-primary mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                        {content.candidateCard.education}
                      </p>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {educationLabel}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Briefcase className="w-5 h-5 text-primary mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                        {content.candidateCard.experienceOverview}
                      </p>
                      {experienceLines.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          {experienceLines.map((line, index) => (
                            <li key={index}>{line}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {content.candidateCard.noExperience}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-primary mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                        {content.candidateCard.coverLetterFull}
                      </p>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {coverLetterText}
                      </p>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex items-start gap-3">
          <Languages className="w-5 h-5 text-primary mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              {content.candidateCard.languages}
            </p>
            <p className="text-sm text-muted-foreground">{languagesText}</p>
          </div>
        </div>

        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-primary uppercase tracking-wide">
            {content.candidateCard.summary}
          </h4>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{summaryText}</p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Briefcase className="w-4 h-4" />
              <span>{content.candidateCard.experiences}</span>
            </div>
            {experienceLines.length > 0 ? (
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {experienceLines.map((line, index) => (
                  <li key={index}>{line}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                {content.candidateCard.noExperience}
              </p>
            )}
          </div>
        </div>

      </CardContent>

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
                  Comparte tu correo electrónico para recibir la confirmación de la reunión.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor={`schedule-employer-email-${candidate.id}`}>Tu correo electrónico</Label>
                <Input
                  id={`schedule-employer-email-${candidate.id}`}
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
                  Indica la información que enviaremos al candidato seleccionado.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-foreground">{candidate.fullName}</p>
                  <p className="text-muted-foreground">{profile.profession}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`schedule-availability-${candidate.id}`}>Disponibilidad propuesta</Label>
                  <Textarea
                    id={`schedule-availability-${candidate.id}`}
                    placeholder="Indica fechas y horarios sugeridos para la reunión"
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
                  <p className="text-muted-foreground">{employerProfile?.fullName || currentUser?.username}</p>
                  <p className="text-muted-foreground">{scheduleEmployerEmail}</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Candidato</p>
                  <p className="text-muted-foreground">{candidate.fullName}</p>
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
    </Card>
  );
};
