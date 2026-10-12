'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { ChronoSimIcon } from '@/components/icons';
import Image from 'next/image';
import { useGameStore } from '@/store/game';
import type { Game } from '@/lib/types';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';


export default function SelectGamePage() {
  const router = useRouter();
  const { setGame } = useGameStore();
  const { firestore } = useFirebase();

  const gamesQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'games')) : null), [firestore]);
  const { data: games, isLoading } = useCollection<Game>(gamesQuery);

  useEffect(() => {
    // on mount, clear any existing theme to prevent flicker
    if(document.documentElement.dataset.theme) {
      document.documentElement.removeAttribute('data-theme');
    }
  }, []);

  const handleGameSelect = (game: Game) => {
    setGame(game);
    router.push('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 transition-colors duration-300">
      <div className="w-full max-w-6xl text-center">
        <ChronoSimIcon className="h-20 w-20 mx-auto mb-4 text-primary" />
        <h1 className="text-4xl md:text-5xl font-bold font-headline mb-2">
          Welcome to ChronoSim
        </h1>
        <p className="text-muted-foreground text-lg mb-12">
          Your command center for simulation racing. Select a game to begin.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-4 animate-pulse">
                    <div className="w-full h-80 rounded-lg bg-muted" />
                </div>
            ))
          ) : (
            games?.map(game => {
              const themeName = game.nombre.toLowerCase().replace('.drive', '').replace(' ', '');
              return (
                <div key={game.id} className="group relative"
                  onMouseEnter={() => document.documentElement.dataset.theme = themeName}
                  onMouseLeave={() => document.documentElement.removeAttribute('data-theme')}
                >
                    <Card
                      className="w-full h-80 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 cursor-pointer border-2 border-transparent focus-within:border-primary"
                      onClick={() => handleGameSelect(game)}
                    >
                      <CardContent className="relative h-full w-full p-0">
                          <Image
                          src={game.imageUrl || 'https://picsum.photos/seed/default-game/800/600'}
                          alt={game.nombre}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          data-ai-hint="sim racing"
                          priority={games.indexOf(game) < 3}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
                          <div className="absolute bottom-0 left-0 p-6">
                            <h3 className="text-3xl font-bold font-headline text-white">{game.nombre}</h3>
                            <p className="text-white/80">{game.desarrollador}</p>
                          </div>
                      </CardContent>
                    </Card>
                </div>
            )})
          )}
           {!isLoading && (!games || games.length === 0) && (
            <div className="col-span-1 md:col-span-3 text-center text-muted-foreground">
              <p>No games found. Add games in the management section.</p>
            </div>
           )}
        </div>
      </div>
    </div>
  );
}

    