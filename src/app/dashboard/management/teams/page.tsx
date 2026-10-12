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
import { MoreHorizontal, PlusCircle, Trash2, Sparkles } from 'lucide-react';
import type { Team } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { collection, query, doc, setDoc, deleteDoc, writeBatch, getDocs } from 'firebase/firestore';
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
import { generateTeamDetails } from '@/ai/flows/generate-team-details';

function TeamForm({ team, onFinished }: { team?: Team | null; onFinished: () => void }) {
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const [nombre, setNombre] = useState(team?.nombre || '');
  const [logoUrl, setLogoUrl] = useState(team?.logoUrl || '');
  const [lema, setLema] = useState(team?.lema || '');
  const [descripcion, setDescripcion] = useState(team?.descripcion || '');
  const [colorPrimario, setColorPrimario] = useState(team?.colorPrimario || '#000000');
  const [colorSecundario, setColorSecundario] = useState(team?.colorSecundario || '#FFFFFF');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateDetails = async () => {
    if (!nombre) {
        toast({ title: 'Name required', description: 'Please enter a team name before generating details.', variant: 'destructive'});
        return;
    }
    setIsGenerating(true);
    toast({ title: 'Generating with AI...', description: 'Creating motto and description for the team.' });
    try {
        const details = await generateTeamDetails({ teamName: nombre });
        setLema(details.lema);
        setDescripcion(details.descripcion);
    } catch (error: any) {
        toast({ title: 'Error', description: error.message || 'Failed to generate details.', variant: 'destructive'});
    } finally {
        setIsGenerating(false);
    }
  }

  const handleSave = async () => {
    if (!firestore || !nombre) {
      toast({ title: 'Error', description: 'Name is required.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      const isNewTeam = !team?.id;
      const teamRef = isNewTeam ? doc(collection(firestore, 'teams')) : doc(firestore, 'teams', team.id);
      const finalLogoUrl = logoUrl || `https://picsum.photos/seed/${teamRef.id}/200/200`;

      const teamData = {
          id: teamRef.id,
          nombre,
          logoUrl: finalLogoUrl,
          lema,
          descripcion,
          colorPrimario,
          colorSecundario,
      };

      await setDoc(teamRef, teamData, { merge: true });

      toast({
        title: 'Success',
        description: `Team ${isNewTeam ? 'created' : 'updated'} successfully.`,
      });
      onFinished();
    } catch (error: any) {
      console.error('Error saving team:', error);
      toast({
        title: 'Error saving team',
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
          <Input id="nombre" value={nombre} onChange={e => setNombre(e.target.value)} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="logoUrl" className="text-right">Logo URL</Label>
          <Input id="logoUrl" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} className="col-span-3" placeholder="https://..." />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="lema" className="text-right">Motto</Label>
          <div className="col-span-3 flex items-center gap-2">
            <Input id="lema" value={lema} onChange={e => setLema(e.target.value)} className="flex-grow"/>
            <Button variant="outline" size="icon" onClick={handleGenerateDetails} disabled={isGenerating}>
                <Sparkles className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-4 items-start gap-4">
          <Label htmlFor="descripcion" className="text-right pt-2">Description</Label>
           <div className="col-span-3 flex items-start gap-2">
            <Textarea id="descripcion" value={descripcion} onChange={e => setDescripcion(e.target.value)} className="flex-grow min-h-[100px]" />
             <Button variant="outline" size="icon" onClick={handleGenerateDetails} disabled={isGenerating}>
                <Sparkles className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="colorPrimario" className="text-right">Primary Color</Label>
          <Input id="colorPrimario" type="color" value={colorPrimario} onChange={e => setColorPrimario(e.target.value)} className="col-span-3 h-10 p-1" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="colorSecundario" className="text-right">Secondary Color</Label>
          <Input id="colorSecundario" type="color" value={colorSecundario} onChange={e => setColorSecundario(e.target.value)} className="col-span-3 h-10 p-1" />
        </div>
      </div>
      <SheetFooter>
        <SheetClose asChild>
          <Button variant="outline">Cancel</Button>
        </SheetClose>
        <Button onClick={handleSave} disabled={isSubmitting || isGenerating}>
          {isSubmitting ? (team ? 'Saving...' : 'Creating...') : team ? 'Save Changes' : 'Create Team'}
        </Button>
      </SheetFooter>
    </div>
  );
}

function DeleteTeamDialog({ team, onFinished }: { team: Team | null; onFinished: () => void }) {
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);
    const { firestore } = useFirebase();

    const handleDelete = async () => {
        if (!firestore || !team) return;
        setIsDeleting(true);
        try {
            await deleteDoc(doc(firestore, 'teams', team.id));
            toast({ title: 'Success', description: 'Team deleted successfully.' });
            onFinished();
        } catch (error: any) {
            toast({ title: 'Error', description: error.message || 'Failed to delete team.', variant: 'destructive' });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the team {team?.nombre}.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90" disabled={isDeleting}>
                    {isDeleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    );
}

function ClearTeamsDialog({ onFinished }: { onFinished: () => void }) {
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleClear = async () => {
    if (!firestore) return;
    setIsDeleting(true);
    try {
      const teamsCollectionRef = collection(firestore, 'teams');
      const teamsSnapshot = await getDocs(teamsCollectionRef);
      const batch = writeBatch(firestore);
      teamsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      toast({
        title: 'Success',
        description: 'All teams have been deleted.',
      });
      onFinished();
    } catch (error: any) {
      console.error('Error clearing teams:', error);
      toast({
        title: 'Error clearing teams',
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
        <AlertDialogDescription>This action cannot be undone. This will permanently delete ALL teams from the catalog.</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={handleClear} className="bg-destructive hover:bg-destructive/90" disabled={isDeleting}>
          {isDeleting ? 'Deleting all...' : 'Delete All'}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}


function TeamsPageSkeleton() {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div> <Skeleton className="h-8 w-24" /> <Skeleton className="h-4 w-48 mt-2" /> </div>
            <Skeleton className="h-10 w-28" />
          </div>
        </CardHeader>
        <CardContent> <div className="space-y-2"> {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)} </div> </CardContent>
      </Card>
    );
}

export default function TeamsPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isClearAlertOpen, setIsClearAlertOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const { firestore } = useFirebase();
  const teamsQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'teams')) : null), [firestore]);
  const { data: teams, isLoading } = useCollection<Team>(teamsQuery);

  const handleAddClick = () => {
    setSelectedTeam(null);
    setIsSheetOpen(true);
  };

  const handleEditClick = (team: Team) => {
    setSelectedTeam(team);
    setIsSheetOpen(true);
  };

  const handleDeleteClick = (team: Team) => {
    setSelectedTeam(team);
    setIsDeleteAlertOpen(true);
  };
  
  const handleDeleteDialogClose = () => {
    setIsDeleteAlertOpen(false);
    setSelectedTeam(null);
  }
  
  const handleClearDialogClose = () => {
    setIsClearAlertOpen(false);
  };


  if (isLoading) {
    return <TeamsPageSkeleton />;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Teams</CardTitle>
              <CardDescription>Manage your racing teams. {teams ? `(${teams.length} total)` : ''}</CardDescription>
            </div>
             <div className="flex gap-2">
                <Button onClick={handleAddClick}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Team
                </Button>
                 <AlertDialog open={isClearAlertOpen} onOpenChange={setIsClearAlertOpen}>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" disabled={!teams || teams.length === 0}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear All
                      </Button>
                    </AlertDialogTrigger>
                    <ClearTeamsDialog onFinished={handleClearDialogClose} />
                </AlertDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
           <AlertDialog open={isDeleteAlertOpen} onOpenChange={handleDeleteDialogClose}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Motto</TableHead>
                    <TableHead><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams?.map((team: Team) => (
                    <TableRow key={team.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={team.logoUrl} alt={team.nombre} />
                            <AvatarFallback>{team.nombre.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {team.nombre}
                        </div>
                      </TableCell>
                      <TableCell>{team.lema}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditClick(team)}>Edit</DropdownMenuItem>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={() => handleDeleteClick(team)} className="text-destructive cursor-pointer">
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
              <DeleteTeamDialog team={selectedTeam} onFinished={handleDeleteDialogClose} />
          </AlertDialog>
        </CardContent>
      </Card>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{selectedTeam ? 'Edit Team' : 'Add a New Team'}</SheetTitle>
            <SheetDescription>{selectedTeam ? "Update the team's profile." : 'Create a new team for your racing universe.'}</SheetDescription>
          </SheetHeader>
          <TeamForm team={selectedTeam} onFinished={() => setIsSheetOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
