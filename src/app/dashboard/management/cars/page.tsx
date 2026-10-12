'use client';

import React, { useState, useMemo } from 'react';
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
import { MoreHorizontal, PlusCircle, Trash2, Upload, Weight, Gauge, ArrowUpDown, ArrowDown, ArrowUp } from 'lucide-react';
import type { Car } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, doc, setDoc, deleteDoc, writeBatch, getDocs } from 'firebase/firestore';
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
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import imageCompression from 'browser-image-compression';
import { ScrollArea } from '@/components/ui/scroll-area';
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


function CarForm({ car, onFinished }: { car?: Car | null; onFinished: () => void }) {
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [nombre, setNombre] = useState(car?.nombre || '');
  const [notasRendimiento, setNotasRendimiento] = useState(car?.notasRendimiento || '');
  const [imageUrl, setImageUrl] = useState(car?.imageUrl || '');
  const [potenciaCV, setPotenciaCV] = useState(car?.potenciaCV?.toString() || '');
  const [pesoKG, setPesoKG] = useState(car?.pesoKG?.toString() || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const options = {
      maxSizeMB: 0.5, // The compressed image will be under 0.5MB
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    }

    try {
      toast({
        title: "Compressing image...",
        description: "Please wait while the image is being optimized.",
      });

      const compressedFile = await imageCompression(file, options);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
        toast({
          title: "Image ready!",
          description: "The optimized image is now ready to be saved.",
        });
      };
      reader.readAsDataURL(compressedFile);

    } catch (error) {
      console.error(error);
      toast({
          title: "Compression failed",
          description: "Could not compress the image. Please try another one.",
          variant: "destructive",
        });
    }
  };
  
  const handleSave = async () => {
    if (!firestore || !nombre) {
      toast({ title: 'Error', description: 'Name is required.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      const carRef = car?.id ? doc(firestore, 'cars', car.id) : doc(collection(firestore, 'cars'));
      // Use a placeholder only if our own imageUrl is not set
      const finalImageUrl = imageUrl || `https://picsum.photos/seed/${carRef.id}/600/400`;

      await setDoc(
        carRef,
        {
          id: carRef.id,
          nombre,
          notasRendimiento,
          imageUrl: finalImageUrl,
          potenciaCV: Number(potenciaCV) || 0,
          pesoKG: Number(pesoKG) || 0,
        },
        { merge: true }
      );

      toast({
        title: 'Success',
        description: `Car ${car ? 'updated' : 'created'} successfully.`,
      });
      onFinished();
    } catch (error: any) {
      console.error('Error saving car:', error);
      let description = 'An unknown error occurred.';
      if (error.message.includes('Firestore document is too large')) {
        description = 'The final image is still too large. Please try a smaller image or higher compression.'
      } else if (error.message) {
        description = error.message;
      }
      
      toast({
        title: 'Error saving car',
        description: description,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ScrollArea className="h-[calc(100vh-8rem)]">
        <div className="grid gap-4 py-4 pr-6">
            <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nombre" className="text-right">Name</Label>
            <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="imageUrl" className="text-right pt-2">Image</Label>
            <div className="col-span-3 space-y-2">
                <Input
                id="image-upload"
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
                />
                <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                >
                <Upload className="mr-2 h-4 w-4" />
                Upload Image
                </Button>
                {imageUrl && (
                <div className="relative w-full aspect-video rounded-md overflow-hidden border">
                    <Image src={imageUrl} alt="Preview" fill className="object-cover" />
                </div>
                )}
            </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="potenciaCV" className="text-right">Power (CV)</Label>
            <Input id="potenciaCV" type="number" value={potenciaCV} onChange={(e) => setPotenciaCV(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="pesoKG" className="text-right">Weight (KG)</Label>
            <Input id="pesoKG" type="number" value={pesoKG} onChange={(e) => setPesoKG(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="notasRendimiento" className="text-right pt-2">Perf. Notes</Label>
            <Textarea id="notasRendimiento" value={notasRendimiento} onChange={(e) => setNotasRendimiento(e.target.value)} className="col-span-3" />
            </div>
        </div>
      </ScrollArea>
      <SheetFooter>
        <SheetClose asChild><Button variant="outline">Cancel</Button></SheetClose>
        <Button onClick={handleSave} disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </SheetFooter>
    </>
  );
}

function DeleteCarDialog({ car, onFinished }: { car: Car; onFinished: () => void }) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const { firestore } = useFirebase();

  const handleDelete = async () => {
    if (!firestore) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(firestore, 'cars', car.id));
      toast({
        title: 'Success',
        description: 'Car deleted successfully.',
      });
      onFinished();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete car.',
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
        <AlertDialogDescription>This action cannot be undone. This will permanently delete {car.nombre}.</AlertDialogDescription>
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

function ClearCarsDialog({ onFinished }: { onFinished: () => void }) {
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleClear = async () => {
    if (!firestore) return;
    setIsDeleting(true);
    try {
      const carsCollectionRef = collection(firestore, 'cars');
      const carsSnapshot = await getDocs(carsCollectionRef);
      const batch = writeBatch(firestore);
      carsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      toast({
        title: 'Success',
        description: 'All cars have been deleted.',
      });
      onFinished();
    } catch (error: any) {
      console.error('Error clearing cars:', error);
      toast({
        title: 'Error clearing cars',
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
        <AlertDialogDescription>This action cannot be undone. This will permanently delete ALL cars from the catalog.</AlertDialogDescription>
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

function CarsPageSkeleton() {
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
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
            </CardContent>
        </Card>
    )
}

type SortKey = 'nombre' | 'potenciaCV' | 'pesoKG' | 'pwr';
type SortDirection = 'asc' | 'desc';


export default function CarsPage() {
    const { firestore } = useFirebase();
    const carsQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'cars')) : null), [firestore]);
    const { data: cars, isLoading: isLoadingCars } = useCollection<Car>(carsQuery);
    
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedCar, setSelectedCar] = useState<Car | null>(null);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [isClearAlertOpen, setIsClearAlertOpen] = useState(false);
    const [sortKey, setSortKey] = useState<SortKey>('nombre');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');


    const handleAddClick = () => {
        setSelectedCar(null);
        setIsSheetOpen(true);
    };

    const handleEditClick = (car: Car) => {
        setSelectedCar(car);
        setIsSheetOpen(true);
    };

    const handleDeleteClick = (car: Car) => {
        setSelectedCar(car);
        setIsAlertOpen(true);
    };

    const handleDeleteDialogClose = () => {
      setIsAlertOpen(false);
      setSelectedCar(null);
    };

    const handleClearDialogClose = () => {
      setIsClearAlertOpen(false);
    };
    
    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };
    
    const sortedCars = useMemo(() => {
        if (!cars) return [];
        return [...cars].sort((a, b) => {
            let valA: string | number = '';
            let valB: string | number = '';

            if (sortKey === 'pwr') {
                valA = (a.pesoKG && a.potenciaCV) ? a.pesoKG / a.potenciaCV : Infinity;
                valB = (b.pesoKG && b.potenciaCV) ? b.pesoKG / b.potenciaCV : Infinity;
            } else {
                valA = a[sortKey] || '';
                valB = b[sortKey] || '';
            }

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [cars, sortKey, sortDirection]);

    const isLoading = isLoadingCars;

    if(isLoading) {
        return <CarsPageSkeleton />
    }

    const renderSortIcon = (key: SortKey) => {
        if (sortKey !== key) {
            return <ArrowUpDown className="ml-2 h-4 w-4" />;
        }
        return sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
    };

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>Cars</CardTitle>
                <CardDescription>Manage your garage of virtual vehicles. {cars ? `(${cars.length} total)` : ''}</CardDescription>
            </div>
            <div className='flex gap-2'>
                <Button onClick={handleAddClick}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Car
                </Button>
                <AlertDialog open={isClearAlertOpen} onOpenChange={setIsClearAlertOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={!cars || cars.length === 0}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Clear All
                    </Button>
                  </AlertDialogTrigger>
                  <ClearCarsDialog onFinished={handleClearDialogClose} />
                </AlertDialog>
            </div>
        </div>
         <div className="flex items-center gap-2 pt-4">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <Button variant={sortKey === 'nombre' ? 'secondary' : 'ghost'} size="sm" onClick={() => handleSort('nombre')}>Name {renderSortIcon('nombre')}</Button>
            <Button variant={sortKey === 'potenciaCV' ? 'secondary' : 'ghost'} size="sm" onClick={() => handleSort('potenciaCV')}>Power {renderSortIcon('potenciaCV')}</Button>
            <Button variant={sortKey === 'pesoKG' ? 'secondary' : 'ghost'} size="sm" onClick={() => handleSort('pesoKG')}>Weight {renderSortIcon('pesoKG')}</Button>
            <Button variant={sortKey === 'pwr' ? 'secondary' : 'ghost'} size="sm" onClick={() => handleSort('pwr')}>kg/CV {renderSortIcon('pwr')}</Button>
        </div>
      </CardHeader>
      <CardContent>
         <AlertDialog open={isAlertOpen} onOpenChange={handleDeleteDialogClose}>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Power</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>
                    <span className="sr-only">Actions</span>
                </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {sortedCars.map((car: Car) => {
                    const pwr = (car.pesoKG && car.potenciaCV) ? (car.pesoKG / car.potenciaCV).toFixed(2) : null;
                    return (
                        <TableRow key={car.id}>
                            <TableCell className="font-medium flex items-center gap-3">
                                <Image src={car.imageUrl || `https://picsum.photos/seed/${car.id}/200/100`} alt={car.nombre} width={100} height={50} className="rounded-md object-cover" />
                                <div>
                                    {car.nombre}
                                    {pwr && (
                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Weight className='h-3 w-3'/> {pwr} kg/CV
                                        </div>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                {car.potenciaCV ? `${car.potenciaCV} CV` : 'N/A'}
                            </TableCell>
                            <TableCell>
                                {car.pesoKG ? `${car.pesoKG} kg` : 'N/A'}
                            </TableCell>
                            <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditClick(car)}>Edit</DropdownMenuItem>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className="text-destructive cursor-pointer" onSelect={e => { e.preventDefault(); handleDeleteClick(car); }}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
            </Table>
            {selectedCar && <DeleteCarDialog car={selectedCar} onFinished={handleDeleteDialogClose} />}
        </AlertDialog>
      </CardContent>
    </Card>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{selectedCar ? 'Edit Car' : 'Add New Car'}</SheetTitle>
            <SheetDescription>
              {selectedCar ? `Update details for ${selectedCar.nombre}.` : 'Add a new vehicle to your collection.'}
            </SheetDescription>
          </SheetHeader>
          <CarForm car={selectedCar} onFinished={() => setIsSheetOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
