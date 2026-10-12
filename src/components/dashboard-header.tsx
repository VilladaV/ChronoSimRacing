'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { User, Replace, Shield } from 'lucide-react';
import { SidebarTrigger } from './ui/sidebar';
import { useGameStore } from '@/store/game';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function DashboardHeader() {
  const router = useRouter();
  const { game, setGame } = useGameStore();

  const handleGameChange = () => {
      setGame(null);
      router.push('/select-game');
  }

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <SidebarTrigger />
      <div className="flex items-center gap-2">
          {game && (
            <Button variant="outline" size="sm" onClick={handleGameChange}>
                <Replace className="mr-2 h-4 w-4" />
                Change Game ({game.nombre})
            </Button>
          )}
           <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/management/teams">
                    <Shield className="mr-2 h-4 w-4" />
                    Teams
                </Link>
           </Button>
      </div>
      <div className="flex-1" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage
                src="https://picsum.photos/seed/admin/100/100"
                alt="Anonymous User"
                data-ai-hint="person face"
              />
              <AvatarFallback>A</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>User</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

    