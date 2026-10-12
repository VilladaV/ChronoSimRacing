'use client';
import type { ReactNode } from 'react';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { DashboardHeader } from '@/components/dashboard-header';
import { useGameStore } from '@/store/game';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { games } from '@/lib/data';

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const { game, setGame } = useGameStore();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedGameId = localStorage.getItem('activeGameId');
        let activeGame = game;

        if (!activeGame && storedGameId) {
            const foundGame = games.find(g => g.id === storedGameId);
            if (foundGame) {
                setGame(foundGame);
                activeGame = foundGame;
            } else {
                 router.push('/select-game');
                 return;
            }
        } else if (!activeGame) {
            router.push('/select-game');
            return;
        }

        if (activeGame) {
            const themeName = activeGame.nombre.toLowerCase().replace('.drive', '').replace(' ', '');
            document.documentElement.dataset.theme = themeName;
        }

        setIsLoading(false);

        return () => {
             // Clean up theme when leaving dashboard
             document.documentElement.removeAttribute('data-theme');
        }
    }, [game, setGame, router]);

    if (isLoading || !game) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-lg font-semibold">Loading ChronoSim Dashboard...</div>
            </div>
        )
    }

  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <SidebarInset>
        <DashboardHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
