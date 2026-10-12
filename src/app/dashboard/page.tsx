'use client';
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
import {
  ArrowRight,
  Car as CarIcon,
  Flag,
  Gamepad2,
  Gauge,
  Trophy,
  Users,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/store/game';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import type { Game, Track, Car, Pilot, Event, Result, Team } from '@/lib/types';

function formatTime(ms: number) {
  if (ms >= 1800000) return 'ABANDONO';
  if (ms <= 0) return 'N/A';
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;
  return `${minutes.toString()}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}

function DashboardPageSkeleton() {
    return (
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-4 xl:col-span-2">
                <Skeleton className="h-9 w-1/2" />
                <div className="grid gap-4 sm:grid-cols-2">
                    <Card><CardHeader><Skeleton className="h-4 w-2/3" /></CardHeader><CardContent><Skeleton className="h-8 w-1/4" /><Skeleton className="h-3 w-full mt-2" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-4 w-2/3" /></CardHeader><CardContent><Skeleton className="h-8 w-1/4" /><Skeleton className="h-3 w-full mt-2" /></CardContent></Card>
                </div>
                <Card>
                    <CardHeader><Skeleton className="h-5 w-1/3" /><Skeleton className="h-4 w-2/3 mt-2" /></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-5">
                        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24" />)}
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-4">
                <Card className="xl:col-span-1"><CardHeader><Skeleton className="h-5 w-1/3" /><Skeleton className="h-4 w-2/3 mt-2" /></CardHeader><CardContent><Skeleton className="h-32" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-5 w-1/3" /></CardHeader><CardContent><Skeleton className="h-20" /></CardContent></Card>
            </div>
        </div>
    )
}


export default function DashboardPage() {
    const { game } = useGameStore();
    const { firestore } = useFirebase();

    // Data Fetching from Firestore
    const eventsQuery = useMemoFirebase(() => (firestore && game) ? query(collection(firestore, 'events'), where('juegoId', '==', game.id)) : null, [firestore, game]);
    const { data: gameEvents, isLoading: isLoadingEvents } = useCollection<Event>(eventsQuery);

    const allGamesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'games')) : null, [firestore]);
    const { data: allGames, isLoading: isLoadingAllGames } = useCollection<Game>(allGamesQuery);
    
    const tracksQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'tracks')) : null, [firestore]);
    const { data: tracks, isLoading: isLoadingTracks } = useCollection<Track>(tracksQuery);
    
    const carsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'cars')) : null, [firestore]);
    const { data: cars, isLoading: isLoadingCars } = useCollection<Car>(carsQuery);

    const pilotsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'pilots')) : null, [firestore]);
    const { data: pilots, isLoading: isLoadingPilots } = useCollection<Pilot>(pilotsQuery);

    const teamsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'teams')) : null, [firestore]);
    const { data: teams, isLoading: isLoadingTeams } = useCollection<Team>(teamsQuery);
    
    // We fetch latest results across all events for the dashboard
    const latestResultsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'events', 'event-1', 'results'), orderBy('fecha', 'desc'), limit(5)) : null, [firestore]);
    const { data: latestResults, isLoading: isLoadingResults } = useCollection<Result>(latestResultsQuery);

    const isLoading = isLoadingEvents || isLoadingAllGames || isLoadingTracks || isLoadingCars || isLoadingPilots || isLoadingTeams || isLoadingResults;

    const ongoingEvents = useMemo(() => {
        return gameEvents?.filter(e => e.estado === 'En curso') || [];
    }, [gameEvents]);
    
    const managementSections = useMemo(() => [
      { title: 'Games', count: allGames?.length ?? 0, icon: Gamepad2, href: '/dashboard/management/games' },
      { title: 'Tracks', count: tracks?.length ?? 0, icon: Flag, href: '/dashboard/management/tracks' },
      { title: 'Cars', count: cars?.length ?? 0, icon: CarIcon, href: '/dashboard/management/cars' },
      { title: 'Pilots', count: pilots?.length ?? 0, icon: Users, href: '/dashboard/management/pilots' },
      { title: 'Teams', count: teams?.length ?? 0, icon: Shield, href: '/dashboard/management/teams' },
    ], [allGames, tracks, cars, pilots, teams]);


    if (!game || isLoading) {
      return <DashboardPageSkeleton />;
    }

  return (
    <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
      <div className="space-y-4 xl:col-span-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          {game.nombre} Dashboard
        </h1>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Events In Progress
              </CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ongoingEvents.length}</div>
              <p className="text-xs text-muted-foreground">
                Currently active championships and time trials.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Cars in Garage
              </CardTitle>
              <Gauge className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cars?.length ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                Vehicles available across all games.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Management Hub</CardTitle>
            <CardDescription>
              Manage all entities of your racing universe.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {managementSections.map(section => (
              <Link key={section.title} href={section.href} className="group">
                <Card className="hover:bg-accent/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {section.title}
                    </CardTitle>
                    <section.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{section.count}</div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Latest Results</CardTitle>
            <CardDescription>
              The most recent times across all events.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pilot</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latestResults?.map(result => {
                  const event = gameEvents?.find(e => e.id === result.eventoId);
                  return (
                    <TableRow key={result.id}>
                      <TableCell>
                        <div className="font-medium">{result.pilotName}</div>
                        <div className="hidden text-sm text-muted-foreground md:inline">
                          in {event?.nombre || 'an event'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatTime(result.tiempoMilisegundos)}
                      </TableCell>
                    </TableRow>
                  );
                })}
                 {(!latestResults || latestResults.length === 0) && (
                    <TableRow>
                        <TableCell colSpan={2} className="text-center h-24 text-muted-foreground">
                            No results logged yet.
                        </TableCell>
                    </TableRow>
                 )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ongoing Events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ongoingEvents.map(event => (
              <div
                key={event.id}
                className="flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold">{event.nombre}</p>
                  <p className="text-sm text-muted-foreground">
                    {game?.nombre}
                  </p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dashboard/events/${event.id}`}>
                    View
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))}
            {ongoingEvents.length === 0 && <p className="text-sm text-muted-foreground">No ongoing events for {game.nombre}.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
