
'use client';
import { use, useState, useEffect, useMemo, Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Calendar,
  Flag,
  Gamepad2,
  Users,
  FileText,
  Trophy,
  Shield,
  User,
  Trash2,
  Car as CarIcon,
  PlusCircle,
  Pencil,
  Sparkles,
  Gauge,
  Weight,
  CalendarDays,
  Bot,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { games } from '@/lib/data';
import { ExcelImportButton } from '@/components/excel-import-button';
import type { Result, Pilot, Event, Team, Car } from '@/lib/types';
import { useCollection, useMemoFirebase, useFirebase, useDoc } from '@/firebase';
import { collection, query, writeBatch, getDocs, doc, setDoc, updateDoc, where } from 'firebase/firestore';
import { getFlagUrl } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { generateRaceChronicle } from '@/ai/flows/automate-race-chronicles';
import { queryEventData } from '@/ai/flows/query-event-data';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';


function formatTime(ms: number) {
    if (ms === 0) return 'Sin Tiempo Registrado';
    if (ms >= 1800000) return 'ABANDONO';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;
    return `${minutes.toString()}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}

function formatTotalTime(ms: number) {
    if (ms === 0) return 'Sin Tiempos';
    const totalSeconds = ms / 1000;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const milliseconds = ms % 1000;

    let timeString = '';
    if (hours > 0) {
        timeString += `${hours.toString()}:`;
    }
    timeString += `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
    return timeString;
}


const timeToMs = (timeString: string): number => {
    if (!timeString) return 0;
    if (timeString.toUpperCase() === 'ABANDONO') return 1800000;

    const parts = timeString.split(/[.:]/);
    if (parts.length !== 3) return 0;

    const minutes = parseInt(parts[0], 10) || 0;
    const seconds = parseInt(parts[1], 10) || 0;
    const milliseconds = parseInt(parts[2], 10) || 0;

    return (minutes * 60 * 1000) + (seconds * 1000) + milliseconds;
};

function TeamDetailsSheet({ teamId, open, onOpenChange }: { teamId: string | null; open: boolean, onOpenChange: (open: boolean) => void }) {
    const { firestore } = useFirebase();

    const teamRef = useMemoFirebase(() => (firestore && teamId ? doc(firestore, 'teams', teamId) : null), [firestore, teamId]);
    const { data: team, isLoading: isLoadingTeam } = useDoc<Team>(teamRef);

    const pilotsQuery = useMemoFirebase(() => (firestore && teamId ? query(collection(firestore, 'pilots'), where('teamId', '==', teamId)) : null), [firestore, teamId]);
    const { data: pilots, isLoading: isLoadingPilots } = useCollection<Pilot>(pilotsQuery);
    
    const carsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'cars') : null), [firestore]);
    const { data: allCars, isLoading: isLoadingCars } = useCollection<Car>(carsQuery);
    
    const resultsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'events', 'event-1', 'results') : null), [firestore]); // This is a bit hardcoded, maybe improve later
    const { data: eventResults, isLoading: isLoadingResults } = useCollection<Result>(resultsQuery);


    const isLoading = isLoadingTeam || isLoadingPilots || isLoadingCars || isLoadingResults;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-lg">
                <SheetHeader>
                     <SheetTitle className="flex items-center gap-3">
                        {isLoading || !team ? (
                            <>
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <Skeleton className="h-8 w-48" />
                            </>
                        ) : (
                            <>
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={team.logoUrl} alt={team.nombre} />
                                    <AvatarFallback>{team.nombre.charAt(0)}</AvatarFallback>
                                </Avatar>
                                {team.nombre}
                            </>
                        )}
                    </SheetTitle>
                    <SheetDescription>
                        {isLoading || !team ? <Skeleton className="h-4 w-64" /> : (team.lema || "This team has no motto.")}
                    </SheetDescription>
                </SheetHeader>
                <div className="py-4 space-y-6">
                    <div>
                        <h4 className="mb-2 text-lg font-medium leading-none">About the Team</h4>
                        {isLoading || !team ? (
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-4/5" />
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground whitespace-pre-line">
                                {team.descripcion || "No description provided."}
                            </p>
                        )}
                    </div>
                    
                    <div>
                        <h4 className="mb-4 text-lg font-medium leading-none">Team Roster</h4>
                        {isLoading ? (
                            <div className="space-y-4">
                                {[...Array(2)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="space-y-1">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-3 w-16" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <Accordion type="single" collapsible className="w-full">
                               {(pilots && pilots.length > 0) ? pilots.map(pilot => {
                                   const pilotResult = eventResults?.find(r => r.pilotName === pilot.nombre);
                                   const pilotCar = allCars?.find(c => c.nombre === pilotResult?.carName);

                                   return (
                                    <AccordionItem value={pilot.id} key={pilot.id}>
                                        <AccordionTrigger>
                                             <div className="flex items-center gap-3 text-sm">
                                                <div className="relative">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarImage src={pilot.avatarUrl} alt={pilot.nombre} />
                                                        <AvatarFallback>{pilot.nombre.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <Image
                                                        src={getFlagUrl(pilot.nacionalidad, 20)}
                                                        alt={pilot.nacionalidad}
                                                        width={20}
                                                        height={15}
                                                        className="absolute -bottom-1 -right-1 rounded-sm border-2 border-background object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-left">{pilot.nombre}</p>
                                                    <p className="text-muted-foreground text-xs text-left">{pilot.nacionalidad}</p>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="space-y-4">
                                            <p className="text-sm text-muted-foreground whitespace-pre-line">
                                                {pilot.biografia || "No biography available."}
                                            </p>
                                            {pilotCar && (
                                                <div className='pt-4 border-t'>
                                                    <h5 className='mb-2 font-medium'>Vehicle</h5>
                                                    <div className='flex gap-4'>
                                                        <Image src={pilotCar.imageUrl || `https://picsum.photos/seed/${pilotCar.id}/600/400`} alt={pilotCar.nombre} width={150} height={100} className='rounded-md object-cover' />
                                                        <div className='space-y-2 text-xs'>
                                                            <p className='font-semibold text-sm'>{pilotCar.nombre}</p>
                                                            {pilotCar.potenciaCV && pilotCar.pesoKG ? (
                                                                <p className='text-muted-foreground'>{(pilotCar.pesoKG / pilotCar.potenciaCV).toFixed(2)} kg/CV</p>
                                                            ) : null}
                                                            <div className='flex items-center gap-2 text-muted-foreground'>
                                                                <Gauge className='w-3 h-3'/> {pilotCar.potenciaCV || 'N/A'} CV
                                                            </div>
                                                            <div className='flex items-center gap-2 text-muted-foreground'>
                                                                <Weight className='w-3 h-3'/> {pilotCar.pesoKG || 'N/A'} kg
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </AccordionContent>
                                    </AccordionItem>
                                )}) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">No pilots assigned to this team yet.</p>
                                )}
                            </Accordion>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

function ParticipantForm({
  event,
  participant,
  teams,
  pilots,
  cars,
  onFinished,
  existingPilotIds,
  eventResults,
  teamOccupancy
}: {
  event: { id: string; nombre: string };
  participant: Partial<Result> | null;
  teams: Team[];
  pilots: Pilot[];
  cars: Car[];
  onFinished: () => void;
  existingPilotIds: string[];
  eventResults: Result[];
  teamOccupancy: Record<string, number>;
}) {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [pilotId, setPilotId] = useState(pilots.find(p => p.nombre === participant?.pilotName)?.id || '');
  const [teamId, setTeamId] = useState(teams.find(t => t.nombre === participant?.teamName)?.id || '');
  const [carId, setCarId] = useState(cars.find(c => c.nombre === participant?.carName)?.id || '');
  const [time, setTime] = useState(participant?.tiempoMilisegundos ? formatTime(participant.tiempoMilisegundos) : '');
  const [newTeamName, setNewTeamName] = useState('');

  const currentCarId = useMemo(() => cars.find(c => c.nombre === participant?.carName)?.id, [cars, participant]);

  const usedCarIds = useMemo(() => {
      return eventResults
          .map(r => cars.find(c => c.nombre === r.carName)?.id)
          .filter((id): id is string => !!id && id !== currentCarId);
  }, [eventResults, cars, currentCarId]);
  
  const currentTeamId = useMemo(() => teams.find(t => t.nombre === participant?.teamName)?.id, [teams, participant]);


  const handleSave = async () => {
    if (!firestore || !pilotId || (!teamId && !newTeamName) || !carId) {
        toast({ title: 'Error', description: 'Piloto, Equipo y Coche son requeridos.', variant: 'destructive' });
        return;
    }
    setIsSubmitting(true);
    
    const pilot = pilots.find(p => p.id === pilotId);
    const car = cars.find(c => c.id === carId);
    if(!pilot || !car) return;

    try {
        let finalTeamId = teamId;
        let finalTeamName = teams.find(t => t.id === teamId)?.nombre || '';

        if (newTeamName) {
            const existingTeam = teams.find(t => t.nombre.toLowerCase() === newTeamName.toLowerCase());
            if (existingTeam) {
                finalTeamId = existingTeam.id;
                finalTeamName = existingTeam.nombre;
            } else {
                const newTeamRef = doc(collection(firestore, 'teams'));
                const newTeam: Team = {
                    id: newTeamRef.id,
                    nombre: newTeamName,
                    logoUrl: `https://picsum.photos/seed/${newTeamRef.id}/200/200`,
                };
                await setDoc(newTeamRef, newTeam);
                finalTeamId = newTeamRef.id;
                finalTeamName = newTeamName;
            }
        }

        const docId = participant?.id || doc(collection(firestore, 'events', event.id, 'results')).id;
        const resultRef = doc(firestore, 'events', event.id, 'results', docId);

        const newResultData: Omit<Result, 'id'> = {
            eventoId: event.id,
            pilotName: pilot.nombre,
            teamName: finalTeamName,
            carName: car.nombre,
            tiempoMilisegundos: timeToMs(time),
            posicion: participant?.posicion || 999,
            fecha: participant?.fecha || new Date().toISOString()
        };
        await setDoc(resultRef, newResultData, { merge: true });

        if (finalTeamId && pilot.teamId !== finalTeamId) {
            const pilotRef = doc(firestore, 'pilots', pilotId);
            await updateDoc(pilotRef, { teamId: finalTeamId });
        }

        toast({ title: 'Éxito', description: `Participante ${participant?.id ? 'actualizado' : 'añadido'}.` });
        onFinished();
    } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }
  };


  return (
    <div className="space-y-4 py-4">
        <div className='space-y-2'>
            <Label htmlFor="pilot">Piloto</Label>
            <Select value={pilotId} onValueChange={setPilotId}>
                <SelectTrigger id="pilot">
                    <SelectValue placeholder="Seleccionar piloto..." />
                </SelectTrigger>
                <SelectContent>
                    {pilots.map(p => {
                        const isExisting = existingPilotIds.includes(p.id) && p.id !== (pilots.find(p => p.nombre === participant?.pilotName)?.id);
                        return (
                            <SelectItem key={p.id} value={p.id} disabled={isExisting} className={isExisting ? 'text-muted-foreground' : ''}>
                                {p.nombre} {isExisting && '(ya en el evento)'}
                            </SelectItem>
                        )
                    })}
                </SelectContent>
            </Select>
        </div>

        <div className='space-y-2'>
            <Label htmlFor="team">Equipo</Label>
            <Select value={teamId} onValueChange={(value) => { setTeamId(value); setNewTeamName(''); }}>
                <SelectTrigger id="team">
                    <SelectValue placeholder="Seleccionar equipo..." />
                </SelectTrigger>
                <SelectContent>
                    {teams.map(t => {
                        const occupancy = teamOccupancy[t.nombre] || 0;
                        const isFull = occupancy >= 3;
                        const isCurrentTeam = t.id === currentTeamId;
                        const isDisabled = isFull && !isCurrentTeam;

                        return (
                            <SelectItem key={t.id} value={t.id} disabled={isDisabled}>
                                {t.nombre} {isDisabled ? '(Equipo Lleno)' : `(${occupancy}/3)`}
                            </SelectItem>
                        )
                    })}
                </SelectContent>
            </Select>
        </div>

        <div className='space-y-2'>
            <Label htmlFor="new-team">O Crear Nuevo Equipo</Label>
            <Input id="new-team" placeholder="Nombre del nuevo equipo" value={newTeamName} onChange={(e) => { setNewTeamName(e.target.value); setTeamId(''); }} />
        </div>

        <div className='space-y-2'>
            <Label htmlFor="car">Coche</Label>
            <Select value={carId} onValueChange={setCarId}>
                <SelectTrigger id="car">
                    <SelectValue placeholder="Seleccionar coche..." />
                </SelectTrigger>
                <SelectContent>
                    {cars.map(c => {
                        const isUsed = usedCarIds.includes(c.id);
                        return (
                             <SelectItem key={c.id} value={c.id} disabled={isUsed}>
                                {c.nombre} {isUsed && '(en uso)'}
                            </SelectItem>
                        )
                    })}
                </SelectContent>
            </Select>
        </div>

        <div className='space-y-2'>
            <Label htmlFor="time">Tiempo (mm:ss.ms)</Label>
            <Input id="time" placeholder="Ej: 1:23.456 o ABANDONO" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>

      <SheetFooter className='pt-4'>
        <SheetClose asChild>
          <Button variant="outline">Cancelar</Button>
        </SheetClose>
        <Button onClick={handleSave} disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </SheetFooter>
    </div>
  );
}

function AiChat({ event, eventResults }: { event: Event, eventResults: Result[] }) {
    const { toast } = useToast();
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [isAsking, setIsAsking] = useState(false);

    const handleAsk = async () => {
        if (!question || !event || !eventResults) {
            toast({ title: 'Pregunta requerida', description: 'Por favor, escribe una pregunta.', variant: 'destructive'});
            return;
        }

        setIsAsking(true);
        setAnswer('');
        try {
            const result = await queryEventData({
                eventName: event.nombre,
                results: eventResults.map(r => ({
                    pilotName: r.pilotName,
                    teamName: r.teamName,
                    carName: r.carName,
                    tiempoMilisegundos: r.tiempoMilisegundos,
                    posicion: r.posicion
                })),
                question: question
            });
            setAnswer(result.answer);
        } catch (error: any) {
            console.error('Error querying AI:', error);
            toast({ title: 'Error', description: error.message || 'No se pudo obtener una respuesta de la IA.', variant: 'destructive'});
        } finally {
            setIsAsking(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bot className="w-5 h-5"/>Análisis Interactivo</CardTitle>
                <CardDescription>Hazle una pregunta a nuestro analista de IA sobre el evento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="ai-question">Tu Pregunta</Label>
                    <Textarea 
                        id="ai-question" 
                        placeholder="Ej: ¿Quién tuvo la vuelta más rápida?"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        disabled={isAsking}
                    />
                </div>
                <Button onClick={handleAsk} disabled={isAsking || !question}>
                    {isAsking ? 'Pensando...' : 'Preguntar al Analista'}
                </Button>

                {(isAsking || answer) && (
                     <div className="pt-4 border-t">
                        <h4 className="font-semibold mb-2">Respuesta del Analista:</h4>
                        {isAsking ? (
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-4/5" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-2/3" />
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground whitespace-pre-line">{answer}</p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function EventDetailPageContent({ params }: { params: { id: string } }) {
  const eventId = params.id;
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const [importCounter, setImportCounter] = useState(0);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Partial<Result> | null>(null);
  const [isGeneratingChronicle, setIsGeneratingChronicle] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [isTeamSheetOpen, setIsTeamSheetOpen] = useState(false);

  const eventRef = useMemoFirebase(() => (firestore ? doc(firestore, 'events', eventId) : null), [firestore, eventId]);
  const { data: event, isLoading: isLoadingEvent } = useDoc<Event>(eventRef);

  const resultsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'events', eventId, 'results')) : null),
    [firestore, eventId, importCounter]
  );
  const { data: eventResults, isLoading: isLoadingResults } = useCollection<Result>(resultsQuery);
  
  const pilotsQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'pilots')) : null), [firestore]);
  const { data: allPilots, isLoading: isLoadingPilots } = useCollection<Pilot>(pilotsQuery);

  const teamsQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'teams')) : null), [firestore]);
  const { data: allTeams, isLoading: isLoadingTeams } = useCollection<Team>(teamsQuery);
  
  const carsQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'cars')) : null), [firestore]);
  const { data: allCars, isLoading: isLoadingCars } = useCollection<Car>(carsQuery);
  
  const pilotStandings = useMemo(() => {
    if (!eventResults || !allPilots || !allCars) return [];
    return (eventResults || []).map(result => {
    const teamData = allTeams?.find(t => t.nombre === result.teamName);
    const pilotData = allPilots?.find(p => p.nombre === result.pilotName);
    const carData = allCars?.find(c => c.nombre === result.carName);

    return {
      ...result,
      pilot: { 
          id: pilotData?.id || result.pilotName, 
          nombre: result.pilotName, 
          avatarUrl: pilotData?.avatarUrl || `https://picsum.photos/seed/${result.pilotName}/100/100`,
          nacionalidad: pilotData?.nacionalidad || 'Unknown',
      },
      team: teamData,
      car: carData || { nombre: result.carName },
      time: result.tiempoMilisegundos,
      points: result.posicion, 
      status: result.tiempoMilisegundos >= 1800000 ? 'ABANDONO' : result.tiempoMilisegundos > 0 ? 'Finalizado' : 'Sin Tiempo',
    };
  }).sort((a, b) => {
    if (a.time === 0 && b.time > 0) return 1;
    if (a.time > 0 && b.time === 0) return -1;
    if (a.status === 'ABANDONO' && b.status !== 'ABANDONO') return 1;
    if (a.status !== 'ABANDONO' && b.status === 'ABANDONO') return -1;
    if (a.time === 0 && b.time === 0) return a.pilot.nombre.localeCompare(b.pilot.nombre);
    if (a.status === 'ABANDono' && b.status === 'ABANDONO') return a.pilot.nombre.localeCompare(b.pilot.nombre);
    return a.time - b.time;
  })}, [eventResults, allTeams, allPilots, allCars]);

  const teamStandings = useMemo(() => {
    if (!pilotStandings || !allTeams) return [];
    const teamsMap = new Map<string, { team: Team | undefined, pilots: typeof pilotStandings, totalTime: number, finishedPilotsCount: number }>();

    pilotStandings.forEach(p => {
        const teamName = p.teamName;
        if (!teamsMap.has(teamName)) {
            const teamData = allTeams.find(t => t.nombre === teamName);
            teamsMap.set(teamName, {
                team: teamData,
                pilots: [],
                totalTime: 0,
                finishedPilotsCount: 0,
            });
        }
        const teamStanding = teamsMap.get(teamName)!;
        teamStanding.pilots.push(p);
        if (p.time > 0) { // Includes ABANDONO times
            teamStanding.finishedPilotsCount += 1;
            if (p.time < 1800000) { // Only add real times to totalTime
                teamStanding.totalTime += p.time;
            }
        }
    });

    return Array.from(teamsMap.values()).map(standing => ({
        ...standing,
        team: standing.team || { id: standing.pilots[0].teamName, nombre: standing.pilots[0].teamName, logoUrl: `https://picsum.photos/seed/${standing.pilots[0].teamName}/200` },
        pilots: standing.pilots.sort((a, b) => {
            if (a.time === 0 && b.time > 0) return 1;
            if (b.time === 0 && a.time > 0) return -1;
            if (a.time === 0 && b.time === 0) return 0;
            return a.time - b.time;
        }),
    })).sort((a, b) => {
          if (a.finishedPilotsCount !== b.finishedPilotsCount) {
              return b.finishedPilotsCount - a.finishedPilotsCount;
          }
          if (a.totalTime === 0 && b.totalTime > 0) return 1;
          if (b.totalTime === 0 && a.totalTime > 0) return -1;
          if (a.totalTime !== b.totalTime) {
              return a.totalTime - b.totalTime;
          }
          return a.team.nombre.localeCompare(b.team.nombre);
      });
}, [pilotStandings, allTeams]);
  
  const teamOccupancy = useMemo(() => {
    return (eventResults || []).reduce<Record<string, number>>((acc, result) => {
        acc[result.teamName] = (acc[result.teamName] || 0) + 1;
        return acc;
    }, {});
  }, [eventResults]);

  const isLoading = isLoadingEvent || isLoadingResults || isLoadingPilots || isLoadingTeams || isLoadingCars;

  useEffect(() => {
    if (firestore && eventResults && eventResults.length > 0) {
        const sorted = [...eventResults]
            .filter(r => r.tiempoMilisegundos > 0 && r.tiempoMilisegundos < 1800000)
            .sort((a, b) => a.tiempoMilisegundos - b.tiempoMilisegundos);

        const batch = writeBatch(firestore);
        let changed = false;

        sorted.forEach((result, index) => {
            const newPosition = index + 1;
            if (result.posicion !== newPosition) {
                const docRef = doc(firestore, 'events', eventId, 'results', result.id);
                batch.update(docRef, { posicion: newPosition });
                changed = true;
            }
        });
        
        if (changed) {
            batch.commit().then(() => console.log('Positions updated automatically.'));
        }
    }
  }, [eventResults, firestore, eventId]);

  const handleGenerateChronicle = async () => {
    if (!event || !eventResults || eventResults.length === 0) {
        toast({ title: 'Datos insuficientes', description: 'No hay resultados para generar una crónica.', variant: 'destructive'});
        return;
    }
    setIsGeneratingChronicle(true);
    toast({ title: 'Generando Crónica con IA...', description: 'Esto puede tardar unos segundos.' });

    try {
        const analysis = await generateRaceChronicle({
            eventName: event.nombre,
            results: eventResults.map(r => ({
                pilotName: r.pilotName,
                teamName: r.teamName,
                carName: r.carName,
                tiempoMilisegundos: r.tiempoMilisegundos,
                posicion: r.posicion
            }))
        });

        if (firestore) {
            await updateDoc(doc(firestore, 'events', eventId), {
                chronicle: analysis.chronicle
            });
        }
        toast({ title: 'Crónica generada', description: 'El análisis de la carrera ha sido actualizado.' });

    } catch(error: any) {
        console.error('Error generating chronicle:', error);
        toast({ title: 'Error', description: error.message || 'No se pudo generar la crónica.', variant: 'destructive'});
    } finally {
        setIsGeneratingChronicle(false);
    }
  };
  
  if (isLoading) {
    return <div>Cargando evento...</div>;
  }

  if (!event) {
    notFound();
    return null;
  }

  const game = games.find(g => g.id === event.juegoId);
  const fechaInicio = new Date(event.fechaInicio);
  
    const handleAddParticipant = () => {
        setSelectedParticipant(null);
        setIsSheetOpen(true);
    }
    const handleEditParticipant = (result: Result) => {
        setSelectedParticipant(result);
        setIsSheetOpen(true);
    }

    const handleTeamClick = (teamId: string) => {
        setSelectedTeamId(teamId);
        setIsTeamSheetOpen(true);
    }
    
    const existingPilotIds = (eventResults || []).map(r => allPilots?.find(p => p.nombre === r.pilotName)?.id).filter((id): id is string => !!id);
    
    const leaderTime = pilotStandings.find(p => p.time > 0 && p.status !== 'ABANDONO')?.time || 0;
    
    const leaderTeamTime = teamStandings?.find(t => t.totalTime > 0 && t.finishedPilotsCount > 0)?.totalTime || 0;
    
    const handleClearResults = async () => {
       if (!firestore || !eventResults || !window.confirm('¿Estás seguro de que quieres borrar TODOS los resultados de este evento? Los pilotos y equipos se mantendrán en el catálogo global.')) return;
       const batch = writeBatch(firestore);
       const resultsCollectionRef = collection(firestore, 'events', eventId, 'results');
       
       const docsSnapshot = await getDocs(resultsCollectionRef);
       docsSnapshot.forEach(doc => {
         batch.delete(doc.ref);
       });
       
       await batch.commit();
       setImportCounter(c => c + 1);
       toast({ title: 'Resultados borrados', description: 'Todos los resultados del evento han sido eliminados para la nueva temporada.' });
    };
  
    return (
    <>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
              <div>
                   <h1 className="text-3xl font-bold tracking-tight font-headline">{event.nombre}</h1>
                  <p className="text-muted-foreground">Vista detallada y gestión del evento.</p>
              </div>
          </div>
  
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500" />Clasificación del Evento</CardTitle>
              <div className="flex justify-between items-center mt-2">
                  <CardDescription>Resultados actuales y tiempos.</CardDescription>
                  <div className='flex gap-2'>
                      <Button size="sm" onClick={handleAddParticipant}><PlusCircle className="mr-2 h-4 w-4" /> Añadir Participante</Button>
                      <ExcelImportButton eventId={event.id} onImportComplete={() => setImportCounter(c => c + 1)} />
                       <Button size="sm" variant="destructive" onClick={handleClearResults} disabled={!eventResults || eventResults.length === 0}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Limpiar
                      </Button>
                  </div>
              </div>
            </CardHeader>
            <CardContent>
               <Tabs defaultValue="teams">
                  <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="teams"><Shield className="mr-2 h-4 w-4"/>Equipos</TabsTrigger>
                      <TabsTrigger value="pilots"><User className="mr-2 h-4 w-4"/>Pilotos</TabsTrigger>
                  </TabsList>
                  <TabsContent value="teams" className="pt-4">
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead className="w-[50px]">Pos</TableHead>
                                  <TableHead>Equipo</TableHead>
                                  <TableHead>Piloto 1</TableHead>
                                  <TableHead>Piloto 2</TableHead>
                                  <TableHead>Piloto 3</TableHead>
                                  <TableHead className="text-right">Tiempo Total</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                             {teamStandings?.map((standing, index) => {
                                 if (!standing) return null;
                                 const diff = standing.totalTime > 0 && leaderTeamTime > 0 && standing.finishedPilotsCount > 0 ? standing.totalTime - leaderTeamTime : 0;
                                 const pilots = standing.pilots.slice(0, 3);
                                 
                                 return (
                                  <TableRow key={standing.team.id}>
                                      <TableCell className="font-bold text-lg text-center">{index + 1}</TableCell>
                                      <TableCell>
                                          <button onClick={() => handleTeamClick(standing.team.id)} className="flex items-center gap-3 text-left hover:bg-muted/50 p-1 rounded-md transition-colors">
                                              <Avatar className="h-8 w-8">
                                                  <AvatarImage src={standing.team.logoUrl} alt={standing.team.nombre} />
                                                  <AvatarFallback>{standing.team.nombre.charAt(0)}</AvatarFallback>
                                              </Avatar>
                                              <span className="font-semibold">{standing.team.nombre}</span>
                                          </button>
                                      </TableCell>
                                      {[0, 1, 2].map(i => {
                                        const pilot = pilots[i];
                                        return (
                                          <TableCell key={i} className="font-mono text-xs">
                                              {pilot ? (
                                                  <div className="flex items-center gap-2">
                                                      <Image src={getFlagUrl(pilot.pilot.nacionalidad, 20)} alt={pilot.pilot.nacionalidad} width={20} height={15} className="rounded-sm" />
                                                      <div>
                                                        <p>{pilot.pilot?.nombre}</p>
                                                        <p className={pilot.status === 'ABANDONO' ? 'text-destructive' : 'text-muted-foreground'}>
                                                            {formatTime(pilot.time)}
                                                        </p>
                                                        <div className="text-muted-foreground/80 flex items-center gap-1">
                                                          <CarIcon className="w-3 h-3" />
                                                          {pilot.car.nombre}
                                                        </div>
                                                      </div>
                                                  </div>
                                              ) : '-'}
                                          </TableCell>
                                        )
                                      })}
                                      <TableCell className="text-right font-mono">
                                         <div>
                                              {formatTotalTime(standing.totalTime)}
                                          </div>
                                          {index > 0 && standing.finishedPilotsCount > 0 && diff > 0 && (
                                              <div className="text-xs text-muted-foreground">+{formatTotalTime(diff)}</div>
                                          )}
                                      </TableCell>
                                  </TableRow>
                                 )
                             })}
                             {(!eventResults || eventResults.length === 0) && (
                                  <TableRow>
                                      <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                                          Importa resultados desde Excel para ver la clasificación.
                                      </TableCell>
                                  </TableRow>
                             )}
                          </TableBody>
                      </Table>
                  </TabsContent>
                  <TabsContent value="pilots" className="pt-4">
                      <Table>
                          <TableHeader>
                              <TableRow>
                              <TableHead className="w-[50px]">Pos</TableHead>
                              <TableHead>Piloto</TableHead>
                              <TableHead>Coche</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead className="text-right">Tiempo</TableHead>
                              <TableHead className='w-[50px]'></TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {pilotStandings.map((standing, index) => {
                                  const diff = standing.time - leaderTime;
                                  const position = standing.time > 0 && standing.status !== 'ABANDONO' ? pilotStandings.filter(p => p.time > 0 && p.status !== 'ABANDONO').indexOf(standing) + 1 : '-';
                                  return (
                                      <TableRow key={standing.id}>
                                      <TableCell className="font-bold text-lg text-center">
                                          {position}
                                      </TableCell>
                                      <TableCell>
                                          <div className="flex items-center gap-3">
                                          <div className="relative">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={standing.pilot?.avatarUrl} alt={standing.pilot?.nombre} />
                                                <AvatarFallback>{standing.pilot?.nombre.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                             <Image
                                                src={getFlagUrl(standing.pilot.nacionalidad, 20)}
                                                alt={standing.pilot.nacionalidad}
                                                width={20}
                                                height={15}
                                                className="absolute -bottom-1 -right-1 rounded-sm border-2 border-background object-cover"
                                            />
                                          </div>
                                          <div>
                                              <span className="font-semibold">{standing.pilot?.nombre || 'N/A'}</span>
                                              <div className="text-xs text-muted-foreground">{standing.team?.nombre || 'Sin equipo'}</div>
                                          </div>
                                          </div>
                                      </TableCell>
                                      <TableCell className="text-sm text-muted-foreground">{standing.car?.nombre}</TableCell>
                                      <TableCell>
                                          <Badge variant={standing.status === 'ABANDONO' ? 'destructive' : standing.time > 0 ? 'default' : 'secondary'}>
                                              {standing.status}
                                          </Badge>
                                      </TableCell>
                                      <TableCell className="text-right font-mono">
                                          <div>{formatTime(standing.time)}</div>
                                          {index > 0 && standing.status !== 'ABANDONO' && leaderTime > 0 && standing.time > 0 && (
                                              <div className="text-xs text-muted-foreground">+{formatTime(diff)}</div>
                                          )}
                                      </TableCell>
                                      <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => handleEditParticipant(standing as Result)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                      </TableCell>
                                      </TableRow>
                                  );
                              })}
                               {(!eventResults || eventResults.length === 0) && (
                                  <TableRow>
                                      <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                                          Importa resultados desde Excel para ver la clasificación.
                                      </TableCell>
                                  </TableRow>
                             )}
                          </TableBody>
                      </Table>
                  </TabsContent>
               </Tabs>
            </CardContent>
          </Card>
          
          <Card>
                <CardHeader>
                    <div className='flex justify-between items-start'>
                        <div>
                            <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5"/>Crónica de IA</CardTitle>
                            <CardDescription>Resumen generado por IA de los puntos destacados de la carrera.</CardDescription>
                        </div>
                        <Button size="sm" variant="outline" onClick={handleGenerateChronicle} disabled={isGeneratingChronicle || !eventResults || eventResults.length === 0}>
                            <Sparkles className="mr-2 h-4 w-4" />
                            {isGeneratingChronicle ? 'Analizando...' : 'Analizar con IA'}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground whitespace-pre-line">
                   {isLoading && 'Cargando crónica...'}
                   {!isLoading && isGeneratingChronicle && 'Generando nuevo análisis...'}
                   {!isLoading && !isGeneratingChronicle && (event.chronicle || 'Genera una crónica para ver el análisis aquí.')}
                </CardContent>
          </Card>

          <AiChat event={event} eventResults={eventResults || []} />

        </div>
  
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detalles del Evento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Estado</span>
                  <Badge
                      variant={
                      event.estado === 'En curso'
                          ? 'destructive'
                          : event.estado === 'Planificado'
                          ? 'secondary'
                          : 'outline'
                      }
                  >
                      {event.estado}
                  </Badge>
              </div>
               <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Tipo</span>
                  <span>{event.tipo}</span>
              </div>
              <div className="flex items-center gap-2">
                  <Gamepad2 className="h-4 w-4 text-muted-foreground" />
                  <span>{game?.nombre || 'Juego Desconocido'}</span>
              </div>
              <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Inicio: {fechaInicio.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-muted-foreground" />
                  <span>{(event.pistas || []).length} Pistas</span>
              </div>
              <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{eventResults ? pilotStandings.length : 0} Participantes</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Participantes</CardTitle>
            </CardHeader>
            <CardContent>
               <ul className="space-y-3">
                  {pilotStandings.map(result => {
                      if (!result.pilot) return null;
                      return (
                          <li key={result.id} className="flex items-center gap-3 text-sm">
                               <div className="relative">
                                  <Avatar className="h-9 w-9">
                                      <AvatarImage src={result.pilot.avatarUrl} alt={result.pilot.nombre} />
                                      <AvatarFallback>{result.pilot.nombre.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                   <Image
                                      src={getFlagUrl(result.pilot.nacionalidad, 20)}
                                      alt={result.pilot.nacionalidad}
                                      width={20}
                                      height={15}
                                      className="absolute -bottom-1 -right-1 rounded-sm border-2 border-background object-cover"
                                  />
                               </div>
                             <div>
                                  <p className="font-semibold">{result.pilot.nombre}</p>
                                  <p className="text-muted-foreground text-xs">{result.car.nombre}</p>
                             </div>
                          </li>
                      )
                  })}
                   {(!eventResults || eventResults.length === 0) && (
                        <p className='text-sm text-muted-foreground'>Importa resultados para ver participantes.</p>
                   )}
               </ul>
            </CardContent>
          </Card>
        </div>
      </div>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
            <SheetHeader>
                <SheetTitle>{selectedParticipant ? 'Editar Participante' : 'Añadir Participante'}</SheetTitle>
                <SheetDescription>
                    {selectedParticipant ? 'Actualiza los detalles del participante.' : `Añade un nuevo participante a ${event.nombre}.`}
                </SheetDescription>
            </SheetHeader>
            <ParticipantForm 
                event={event}
                participant={selectedParticipant}
                teams={allTeams || []}
                pilots={allPilots || []}
                cars={allCars || []}
                existingPilotIds={existingPilotIds}
                eventResults={eventResults || []}
                teamOccupancy={teamOccupancy}
                onFinished={() => {
                    setIsSheetOpen(false);
                    setImportCounter(c => c + 1);
                }}
            />
        </SheetContent>
      </Sheet>
      <TeamDetailsSheet teamId={selectedTeamId} open={isTeamSheetOpen} onOpenChange={setIsTeamSheetOpen} />
    </>
    );
  }

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const resolvedParams = use(params);
  return (
    <Suspense fallback={<div>Cargando detalles del evento...</div>}>
      <EventDetailPageContent params={resolvedParams} />
    </Suspense>
  )
}
