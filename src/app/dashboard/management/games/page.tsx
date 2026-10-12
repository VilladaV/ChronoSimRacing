'use client';

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import type { Game } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, doc, setDoc, deleteDoc } from 'firebase/firestore';
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
import { useToast } from '@/hooks/use-toast';

function GameForm({ game, onFinished }: { game?: Game | null; onFinished: () => void }) {
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const [nombre, setNombre] = useState(game?.nombre || '');
  const [desarrollador, setDesarrollador] = useState(game?.desarrollador || '');
  const [imageUrl, setImageUrl] = useState(game?.imageUrl || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!firestore) {
      toast({ title: 'Error', description: 'Firestore not available.', variant: 'destructive' });
      return;
    }

    if (!nombre || !desarrollador) {
      toast({ title: 'Error', description: 'Name and Developer are required.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      const gameRef = game?.id ? doc(firestore, 'games', game.id) : doc(collection(firestore, 'games'));
      const finalImageUrl = imageUrl || `https://picsum.photos/seed/${gameRef.id}/800/600`;

      await setDoc(
        gameRef,
        {
          id: gameRef.id,
          nombre,
          desarrollador,
          imageUrl: finalImageUrl,
        },
        { merge: true }
      );

      toast({
        title: 'Success',
        description: `Game ${game ? 'updated' : 'created'} successfully.`,
      });
      onFinished();
    } catch (error: any) {
      toast({
        title: 'Error saving game',
        description: error.message || 'An unknown error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="nombre" className="text-right">Name</Label>
          <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="desarrollador" className="text-right">Developer</Label>
          <Input id="desarrollador" value={desarrollador} onChange={(e) => setDesarrollador(e.target.value)} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="imageUrl" className="text-right">Image URL</Label>
          <Input id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="col-span-3" placeholder="https://..." />
        </div>
      </div>
      <SheetFooter>
        <SheetClose asChild><Button variant="outline">Cancel</Button></SheetClose>
        <Button onClick={handleSave} disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </SheetFooter>
    </div>
  );
}

function GamesPageSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-48 mt-2" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      </CardContent>
    </Card>
  );
}

export default function GamesPage() {
  const { firestore } = useFirebase();
  const gamesQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'games')) : null), [firestore]);
  const { data: games, isLoading } = useCollection<Game>(gamesQuery);
  
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  const handleAddClick = () => {
    setSelectedGame(null);
    setIsSheetOpen(true);
  };

  const handleEditClick = (game: Game) => {
    setSelectedGame(game);
    setIsSheetOpen(true);
  };

  const handleDeleteClick = async (game: Game) => {
    if (!firestore) return;
    if (window.confirm(`Are you sure you want to delete ${game.nombre}?`)) {
      await deleteDoc(doc(firestore, 'games', game.id));
    }
  };

  if (isLoading) {
    return <GamesPageSkeleton />;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Games</CardTitle>
              <CardDescription>Manage your collection of simulation games.</CardDescription>
            </div>
            <Button onClick={handleAddClick}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Game
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Developer</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {games?.map((game: Game) => (
                <TableRow key={game.id}>
                  <TableCell className="font-medium">{game.nombre}</TableCell>
                  <TableCell>{game.desarrollador}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditClick(game)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteClick(game)} className="text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{selectedGame ? 'Edit Game' : 'Add Game'}</SheetTitle>
            <SheetDescription>
              {selectedGame ? `Update details for ${selectedGame.nombre}.` : 'Add a new simulation game to your collection.'}
            </SheetDescription>
          </SheetHeader>
          <GameForm game={selectedGame} onFinished={() => setIsSheetOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}

    