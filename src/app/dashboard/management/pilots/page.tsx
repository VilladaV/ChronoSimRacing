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
import { MoreHorizontal, PlusCircle, Trash2 } from 'lucide-react';
import type { Pilot } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, doc, setDoc, writeBatch, getDocs, deleteDoc } from 'firebase/firestore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import Image from 'next/image';
import { getFlagUrl } from '@/lib/utils';

function PilotForm({ pilot, onFinished }: { pilot?: Pilot | null; onFinished: () => void }) {
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const [nombre, setNombre] = useState(pilot?.nombre || '');
  const [nacionalidad, setNacionalidad] = useState(pilot?.nacionalidad || '');
  const [biografia, setBiografia] = useState(pilot?.biografia || '');
  const [avatarUrl, setAvatarUrl] = useState(pilot?.avatarUrl || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!firestore) {
      toast({ title: 'Error', description: 'Firestore not available.', variant: 'destructive' });
      return;
    }

    if (!nombre || !nacionalidad) {
      toast({ title: 'Error', description: 'Name and Nationality are required.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      const pilotRef = pilot?.id ? doc(firestore, 'pilots', pilot.id) : doc(collection(firestore, 'pilots'));
      const finalAvatarUrl = avatarUrl || `https://picsum.photos/seed/${pilotRef.id}/100/100`;

      await setDoc(
        pilotRef,
        {
          id: pilotRef.id,
          nombre,
          nacionalidad,
          biografia,
          esJugador: pilot?.esJugador || false,
          avatarUrl: finalAvatarUrl,
        },
        { merge: true }
      );

      toast({
        title: 'Success',
        description: `Pilot ${pilot ? 'updated' : 'created'} successfully.`,
      });
      onFinished();
    } catch (error: any) {
      console.error('Error saving pilot:', error);
      toast({
        title: 'Error saving pilot',
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
          <Label htmlFor="nombre" className="text-right">
            Name
          </Label>
          <Input id="nombre" name="nombre" value={nombre} onChange={e => setNombre(e.target.value)} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="nacionalidad" className="text-right">
            Nationality
          </Label>
          <Input id="nacionalidad" name="nacionalidad" value={nacionalidad} onChange={e => setNacionalidad(e.target.value)} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="avatarUrl" className="text-right">
            Avatar URL
          </Label>
          <Input id="avatarUrl" name="avatarUrl" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} className="col-span-3" placeholder="https://..." />
        </div>
        <div className="grid grid-cols-4 items-start gap-4">
          <Label htmlFor="biografia" className="text-right pt-2">
            Biography
          </Label>
          <div className="col-span-3 space-y-2">
            <Textarea
              id="biografia"
              name="biografia"
              placeholder="Pilot biography..."
              className="min-h-[120px]"
              value={biografia}
              onChange={e => setBiografia(e.target.value)}
            />
          </div>
        </div>
      </div>
      <SheetFooter>
        <SheetClose asChild>
          <Button variant="outline">Cancel</Button>
        </SheetClose>
        <Button onClick={handleSave} disabled={isSubmitting}>
          {isSubmitting ? (pilot ? 'Saving...' : 'Creating...') : pilot ? 'Save Changes' : 'Create Pilot'}
        </Button>
      </SheetFooter>
    </div>
  );
}

function DeletePilotDialog({ pilot, onFinished }: { pilot: Pilot; onFinished: () => void }) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const { firestore } = useFirebase();

  const handleDelete = async () => {
    if (!firestore) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(firestore, 'pilots', pilot.id));
      toast({
        title: 'Success',
        description: 'Pilot deleted successfully.',
      });
      onFinished();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete pilot.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
        <AlertDialogDescription>This action cannot be undone. This will permanently delete {pilot.nombre}.</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
          {isDeleting ? 'Deleting...' : 'Delete'}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}

function ClearPilotsDialog({ onFinished }: { onFinished: () => void }) {
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleClear = async () => {
    if (!firestore) return;
    setIsDeleting(true);
    try {
      const pilotsCollectionRef = collection(firestore, 'pilots');
      const pilotsSnapshot = await getDocs(pilotsCollectionRef);
      const batch = writeBatch(firestore);
      pilotsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      toast({
        title: 'Success',
        description: 'All pilots have been deleted.',
      });
      onFinished();
    } catch (error: any) {
      console.error('Error clearing pilots:', error);
      toast({
        title: 'Error clearing pilots',
        description: error.message || 'An unknown error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
        <AlertDialogDescription>This action cannot be undone. This will permanently delete ALL pilots from the catalog.</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={handleClear} className="bg-destructive hover:bg-destructive/90">
          {isDeleting ? 'Deleting all...' : 'Delete All'}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}

function PilotsPageSkeleton() {
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
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function PilotsPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isClearAlertOpen, setIsClearAlertOpen] = useState(false);
  const [selectedPilot, setSelectedPilot] = useState<Pilot | null>(null);

  const { firestore } = useFirebase();
  const pilotsQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'pilots')) : null), [firestore]);
  const { data: pilots, isLoading } = useCollection<Pilot>(pilotsQuery);

  const handleAddClick = () => {
    setSelectedPilot(null);
    setIsSheetOpen(true);
  };

  const handleEditClick = (pilot: Pilot) => {
    setSelectedPilot(pilot);
    setIsSheetOpen(true);
  };

  const handleDeleteClick = (pilot: Pilot) => {
    setSelectedPilot(pilot);
    setIsAlertOpen(true);
  };

  const handleDeleteDialogClose = () => {
    setIsAlertOpen(false);
    setSelectedPilot(null);
  };

  const handleClearDialogClose = () => {
    setIsClearAlertOpen(false);
  };

  if (isLoading) {
    return <PilotsPageSkeleton />;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pilots</CardTitle>
              <CardDescription>Manage the drivers in your universe. {pilots ? `(${pilots.length} total)` : ''}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddClick}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Pilot
              </Button>
              <AlertDialog open={isClearAlertOpen} onOpenChange={setIsClearAlertOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={!pilots || pilots.length === 0}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear All
                  </Button>
                </AlertDialogTrigger>
                <ClearPilotsDialog onFinished={handleClearDialogClose} />
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AlertDialog open={isAlertOpen} onOpenChange={handleDeleteDialogClose}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pilot</TableHead>
                  <TableHead>Nationality</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pilots?.map((pilot: Pilot) => (
                  <TableRow key={pilot.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar>
                            <AvatarImage src={pilot.avatarUrl} alt={pilot.nombre} data-ai-hint="racing pilot" />
                            <AvatarFallback>
                              {pilot.nombre
                                .split(' ')
                                .map(n => n[0])
                                .join('')}
                            </AvatarFallback>
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
                          {pilot.nombre}
                          {pilot.esJugador && (
                            <Badge variant="destructive" className="ml-2">
                              Player
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{pilot.nacionalidad}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditClick(pilot)}>Edit</DropdownMenuItem>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive cursor-pointer" onSelect={e => { e.preventDefault(); handleDeleteClick(pilot); }}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {selectedPilot && <DeletePilotDialog pilot={selectedPilot} onFinished={handleDeleteDialogClose} />}
          </AlertDialog>
        </CardContent>
      </Card>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{selectedPilot ? 'Edit Pilot' : 'Add a New Pilot'}</SheetTitle>
            <SheetDescription>{selectedPilot ? "Update the pilot's profile." : 'Create a new pilot profile for your racing universe.'}</SheetDescription>
          </SheetHeader>
          <PilotForm pilot={selectedPilot} onFinished={() => setIsSheetOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
