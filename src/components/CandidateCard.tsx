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
import { Candidate } from "@/types/candidate";
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
import {
  getUsers,
  recordCandidateView,
  recordScheduleRequest,
  updateUserEmail,
} from "@/lib/localDb";
import { useToast } from "@/hooks/use-toast";

interface CandidateCardProps {
  candidate: Candidate;
  content: AppContent;
}

type ScheduleStep = "email" | "availability" | "confirm";

const SCHEDULE_WEBHOOK_URL =
  "https://primary-production-cdb3.up.railway.app/webhook-test/6669a30e-b24c-46ac-a0d3-20859ffe133c";

export const CandidateCard = ({ candidate, content }: CandidateCardProps) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [employerProfile, setEmployerProfile] = useState<AppUser | null>(null);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [scheduleStep, setScheduleStep] = useState<ScheduleStep>("availability");
  const [scheduleEmployerEmail, setScheduleEmployerEmail] = useState("");
  const [scheduleCandidateEmail, setScheduleCandidateEmail] = useState(candidate.email);
  const [scheduleAvailability, setScheduleAvailability] = useState("");
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);

  const experienceHighlights = candidate.experience
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "user") {
      setEmployerProfile(null);
      setScheduleEmployerEmail("");
      return;
    }

    const matchedUser = getUsers().find(
      (user) => user.username.trim().toLowerCase() === currentUser.username.trim().toLowerCase(),
    );

    if (matchedUser) {
      setEmployerProfile(matchedUser);
      setScheduleEmployerEmail(matchedUser.email ?? "");
    } else {
      setEmployerProfile(null);
      setScheduleEmployerEmail("");
    }
  }, [currentUser]);

  const canSchedule = currentUser?.role === "user";

  const handleDialogOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) return;
      if (!currentUser || currentUser.role !== "user") return;

      recordCandidateView(currentUser.username, candidate.id, candidate.full_name);
    },
    [candidate.full_name, candidate.id, currentUser],
  );

  const resetScheduleState = () => {
    const storedEmail = employerProfile?.email?.trim();
    const fallbackEmail = scheduleEmployerEmail.trim();
    const nextEmail = storedEmail ?? fallbackEmail;

    setScheduleEmployerEmail(nextEmail);
    setScheduleCandidateEmail(candidate.email);
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
        const updatedUser = updateUserEmail(employerProfile.id, normalizedEmail);
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
    if (!currentUser) {
      toast({
        title: "Sesión requerida",
        description: "Debes iniciar sesión para completar la solicitud.",
        variant: "destructive",
      });
      return;
    }

    const normalizedEmployerEmail = scheduleEmployerEmail.trim();
    const normalizedCandidateEmail = scheduleCandidateEmail.trim();
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

    const payload = {
      emailEmpleador: normalizedEmployerEmail,
      emailCandidato: normalizedCandidateEmail,
      NombreCandidato: candidate.full_name,
      disponibilidad: normalizedAvailability,
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

      recordScheduleRequest({
        employerUsername: currentUser.username,
        employerEmail: normalizedEmployerEmail,
        employerName: employerProfile?.fullName,
        candidateId: candidate.id,
        candidateName: candidate.full_name,
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
            <h3 className="text-xl font-bold">{candidate.full_name}</h3>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {content.candidateCard.profession}
              </p>
              <p className="text-sm text-muted-foreground">{candidate.profession}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="icon"
              className="bg-emerald-500 text-white hover:bg-emerald-600"
              onClick={handleOpenScheduleDialog}
              disabled={!canSchedule}
              title={
                canSchedule
                  ? content.candidateCard.scheduleMeeting
                  : "Inicia sesión como empleador para agendar reuniones"
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
                  <DialogTitle>{candidate.full_name}</DialogTitle>
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
                        {candidate.education}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-primary mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                        {content.candidateCard.coverLetterFull}
                      </p>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {candidate.cover_letter_full}
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
            <p className="text-sm text-muted-foreground">{candidate.languages}</p>
          </div>
        </div>

        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-primary uppercase tracking-wide">
            {content.candidateCard.summary}
          </h4>
          <p className="text-sm text-muted-foreground whitespace-pre-line">
            {candidate.cover_letter_summary}
          </p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Briefcase className="w-4 h-4" />
              <span>{content.candidateCard.experiences}</span>
            </div>
            {candidate.experiences.length > 0 ? (
              <ul className="space-y-2">
                {candidate.experiences.map((experience, index) => (
                  <li key={`${candidate.id}-${index}`} className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{experience.title}</span>{" "}
                    <span className="italic">({experience.duration})</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {content.candidateCard.noExperience}
              </p>
            )}
          </div>

          {experienceHighlights.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-primary uppercase tracking-wide">
                {content.candidateCard.experienceOverview}
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {experienceHighlights.map((item, index) => (
                  <li key={`${candidate.id}-highlight-${index}`}>{item}</li>
                ))}
              </ul>
            </div>
          )}
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
                  <p className="font-semibold text-foreground">{candidate.full_name}</p>
                  <p className="text-muted-foreground">{candidate.profession}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`schedule-candidate-email-${candidate.id}`}>Correo del candidato</Label>
                  <Input
                    id={`schedule-candidate-email-${candidate.id}`}
                    type="email"
                    placeholder="candidato@correo.com"
                    value={scheduleCandidateEmail}
                    onChange={(event) => setScheduleCandidateEmail(event.target.value)}
                    required
                  />
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
                  <p className="text-muted-foreground">{candidate.full_name}</p>
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
    </Card>
  );
};
