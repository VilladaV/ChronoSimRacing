'use client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, PlusCircle, Calendar, Users, Flag, Gamepad2 } from 'lucide-react';
import Link from 'next/link';
import { useGameStore } from '@/store/game';
import type { Event } from '@/lib/types';
import { events, games } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';

export default function EventsPage() {
    const { game } = useGameStore();

    const filteredEvents = game ? events.filter(e => e.juegoId === game.id) : events;

    const eventCategories = {
        'En curso': filteredEvents.filter(e => e.estado === 'En curso'),
        'Planificado': filteredEvents.filter(e => e.estado === 'Planificado'),
        'Finalizado': filteredEvents.filter(e => e.estado === 'Finalizado'),
    };

    const isLoading = !game;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Events</h1>
          <p className="text-muted-foreground">
            Browse and manage championships for {game?.nombre || 'all games'}.
          </p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Event
        </Button>
      </div>

      {isLoading ? (
        Object.keys(eventCategories).map(status => (
             <div key={status}>
                <h2 className="text-2xl font-semibold tracking-tight font-headline mb-4">{status}</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64" />)}
                </div>
            </div>
        ))
      ) : (
        Object.entries(eventCategories).map(([status, eventsInCategory]) => (
            <div key={status}>
            <h2 className="text-2xl font-semibold tracking-tight font-headline mb-4">{status}</h2>
            {eventsInCategory.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {eventsInCategory.map(event => {
                    const gameData = games.find(g => g.id === event.juegoId);
                    const fechaInicio = new Date(event.fechaInicio);

                    return (
                    <Card key={event.id} className="flex flex-col">
                        <CardHeader>
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{event.nombre}</CardTitle>
                            <Badge
                            variant={
                                event.estado === 'En curso'
                                ? 'destructive'
                                : event.estado === 'Planificado'
                                ? 'secondary'
                                : 'outline'
                            }
                            >
                            {event.tipo}
                            </Badge>
                        </div>
                        <CardDescription className="flex items-center gap-2 pt-2">
                            <Gamepad2 className="h-4 w-4" />
                            {gameData?.nombre || 'Unknown Game'}
                        </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Starts: {fechaInicio.toLocaleDateString()}</span>
                        </div>
                            <div className="flex items-center gap-2">
                            <Flag className="h-4 w-4" />
                            <span>{event.pistas.length} Tracks</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{event.participantes.length} Participants</span>
                        </div>
                        </CardContent>
                        <CardFooter>
                        <Button asChild className="w-full">
                            <Link href={`/dashboard/events/${event.id}`}>
                            View Details <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                        </CardFooter>
                    </Card>
                    );
                })}
                </div>
            ) : (
                <p className="text-muted-foreground">No {status.toLowerCase()} events.</p>
            )}
            </div>
        ))
      )}
    </div>
  );
}
