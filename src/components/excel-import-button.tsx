'use client';
import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Pilot, RawResult, Team, Car } from '@/lib/types';
import { getFirestore, collection, writeBatch, doc, getDocs, query, updateDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { generatePilotNationalities } from '@/ai/flows/generate-pilot-nationality';
import { generateMultipleTeamDetails } from '@/ai/flows/generate-team-details';
import { useGameStore } from '@/store/game';

interface ExcelImportButtonProps {
  eventId: string;
  onImportComplete: () => void;
}

const timeToMs = (timeValue: string | number): number => {
    if (timeValue === undefined || timeValue === null || timeValue === '') return 0;
    
    if (typeof timeValue === 'number') {
        if (timeValue <= 0) return 0;
        const totalSeconds = timeValue * 86400;
        const minutes = Math.floor(totalSeconds / 60);
        if (minutes >= 30) return 1800000;
        return Math.round(totalSeconds * 1000);
    }

    if (typeof timeValue !== 'string') return 0;

    const trimmedTime = timeValue.trim();
    if (trimmedTime.toUpperCase() === 'ABANDONO' || trimmedTime.startsWith('30:00')) return 1800000;

    const match = trimmedTime.match(/(\d+):(\d{2})[.:](\d{3}|\d{2})/);
    if (match) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        let milliseconds = parseInt(match[3], 10);

        if (match[3].length === 2) {
          milliseconds *= 10;
        }
        
        const totalMs = (minutes * 60 * 1000) + (seconds * 1000) + milliseconds;
        
        if (totalMs >= 1800000) return 1800000;

        return totalMs;
    }

    return 0;
};


export function ExcelImportButton({ eventId, onImportComplete }: ExcelImportButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const { game: activeGame } = useGameStore();
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !firestore || !activeGame) return;

    setIsImporting(true);
    toast({ title: 'Importando archivo...', description: 'Procesando el archivo Excel.' });

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true, cellNF: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null, raw: false });
        
        const headerRowIndex = rows.findIndex(r => r.includes('Equipos'));
        if (headerRowIndex === -1) throw new Error('Header row with "Equipos" not found.');
        
        const headerRow = rows[headerRowIndex];
        const colMap: { [key: string]: number } = {};
        headerRow.forEach((header, index) => {
            if(typeof header === 'string') colMap[header.trim()] = index;
        });

        const dataRows = rows.slice(headerRowIndex + 1);

        const newResults: Omit<RawResult, 'id' | 'eventoId'>[] = [];
        
        dataRows.forEach((row) => {
            const teamName = row[colMap['Equipos']];
            if (!row.some(cell => cell !== null) || !teamName) {
                return;
            }

            for(let i=1; i<=3; i++) {
                const pilotAndCar = row[colMap[`Piloto ${i}`]];
                const timeValue = row[colMap[`T1 Piloto ${i}`]];
                
                if (pilotAndCar && typeof pilotAndCar === 'string' && pilotAndCar.includes('--')) {
                    const [pilotName, carInfo] = pilotAndCar.split(' -- ');

                    if (pilotName && pilotName.trim() !== '' && carInfo && pilotName.trim().length > 2) {
                         const carName = carInfo.replace(/\s*\(\d+\)$/, '').trim();
                         const tiempoMilisegundos = timeToMs(timeValue);
                         
                        newResults.push({
                            teamName: teamName.trim(),
                            pilotName: pilotName.trim(),
                            carName: carName,
                            tiempoMilisegundos,
                            posicion: tiempoMilisegundos >= 1800000 || tiempoMilisegundos === 0 ? 999 : 0, 
                        });
                    }
                }
            }
        });
        
        const sortedResults = newResults
            .filter(r => r.tiempoMilisegundos > 0 && r.tiempoMilisegundos < 1800000)
            .sort((a, b) => a.tiempoMilisegundos - b.tiempoMilisegundos);

        const otherResults = newResults.filter(r => r.tiempoMilisegundos === 0 || r.tiempoMilisegundos >= 1800000);
        
        let finalPos = 1;
        const finalResults = [
            ...sortedResults.map(r => ({ ...r, posicion: finalPos++ })),
            ...otherResults
        ];

        const batch = writeBatch(firestore);

        const teamsSnapshot = await getDocs(collection(firestore, 'teams'));
        const teamsMap = new Map<string, string>(teamsSnapshot.docs.map(d => [d.data().nombre.toLowerCase(), d.id]));
        const teamNamesToCreate = Array.from(new Set(finalResults.map(r => r.teamName)))
            .filter(name => !teamsMap.has(name.toLowerCase()));
        
        if (teamNamesToCreate.length > 0) {
            toast({ title: 'AI en progreso...', description: `Generando detalles para ${teamNamesToCreate.length} nuevos equipos.`});
            try {
                const teamDetailsResult = await generateMultipleTeamDetails({ teamNames: teamNamesToCreate });
                const detailsMap = new Map(teamDetailsResult.teams.map(t => [t.teamName, t]));

                for (const teamName of teamNamesToCreate) {
                     const newTeamRef = doc(collection(firestore, 'teams'));
                     const details = detailsMap.get(teamName);
                     const newTeamData: Team = {
                        id: newTeamRef.id,
                        nombre: teamName,
                        logoUrl: `https://picsum.photos/seed/${newTeamRef.id}/200/200`,
                        lema: details?.lema || 'Lema pendiente',
                        descripcion: details?.descripcion || 'Descripción pendiente',
                     };
                     batch.set(newTeamRef, newTeamData);
                     teamsMap.set(teamName.toLowerCase(), newTeamRef.id);
                }
            } catch (aiError: any) {
                console.error("Error generating team details with AI:", aiError);
                toast({ title: 'Error de IA', description: `No se pudieron generar los detalles del equipo: ${aiError.message}`, variant: 'destructive'});
                throw new Error("Failed to generate AI team details, import stopped.");
            }
        }


        const pilotsSnapshot = await getDocs(collection(firestore, 'pilots'));
        const pilotsMap = new Map<string, {id: string, data: Pilot}>(pilotsSnapshot.docs.map(d => [d.data().nombre.toLowerCase(), {id: d.id, data: d.data() as Pilot}]));

        const pilotNamesToCreate = Array.from(new Set(finalResults.map(r => r.pilotName)))
            .filter(name => !pilotsMap.has(name.toLowerCase()));

        if (pilotNamesToCreate.length > 0) {
            toast({ title: 'AI en progreso...', description: `Generando nacionalidades para ${pilotNamesToCreate.length} nuevos pilotos.`});
            const nationalityResults = await generatePilotNationalities({ names: pilotNamesToCreate });
            const nationalitiesMap = new Map(nationalityResults.results.map(r => [r.name, r.nationality]));
            
            for (const pilotName of pilotNamesToCreate) {
                const newPilotRef = doc(collection(firestore, 'pilots'));
                const newPilotData = {
                    id: newPilotRef.id,
                    nombre: pilotName,
                    nacionalidad: nationalitiesMap.get(pilotName) || 'Unknown',
                    biografia: "Biografía pendiente.",
                    esJugador: false,
                    avatarUrl: `https://picsum.photos/seed/${newPilotRef.id}/100/100`,
                    teamId: '',
                };
                batch.set(newPilotRef, newPilotData);
                pilotsMap.set(pilotName.toLowerCase(), {id: newPilotRef.id, data: newPilotData as Pilot});
            }
        }

        const carsSnapshot = await getDocs(collection(firestore, 'cars'));
        const carsMap = new Map<string, string>(carsSnapshot.docs.map(d => [d.data().nombre.toLowerCase(), d.id]));
        const carNamesToCreate = Array.from(new Set(finalResults.map(r => r.carName)))
            .filter(name => !carsMap.has(name.toLowerCase()));

        for (const carName of carNamesToCreate) {
            const newCarRef = doc(collection(firestore, 'cars'));
            const newCarData: Omit<Car, 'id'> = {
                nombre: carName,
                imageUrl: `https://picsum.photos/seed/${newCarRef.id}/600/400`,
                potenciaCV: 0,
                pesoKG: 0,
            };
            batch.set(newCarRef, { id: newCarRef.id, ...newCarData });
        }
        
        for (const result of finalResults) {
            const teamId = teamsMap.get(result.teamName.toLowerCase());
            
            const pilotInfo = pilotsMap.get(result.pilotName.toLowerCase());
            if (pilotInfo && teamId && pilotInfo.data.teamId !== teamId) {
                const pilotRef = doc(firestore, 'pilots', pilotInfo.id);
                batch.update(pilotRef, { teamId });
            }
            
            const newDocRef = doc(collection(firestore, 'events', eventId, 'results'));
            batch.set(newDocRef, { ...result, fecha: new Date().toISOString() });
        }

        await batch.commit();

        onImportComplete();
        toast({
          title: 'Importación exitosa',
          description: `${finalResults.length} resultados guardados. ${pilotNamesToCreate.length} nuevos pilotos, ${teamNamesToCreate.length} nuevos equipos y ${carNamesToCreate.length} nuevos coches añadidos.`,
        });
      } catch (error: any) {
        console.error('Error processing or saving to Firestore:', error);
        toast({
          title: 'Error',
          description: error.message || 'No se pudo procesar o guardar el archivo en Firestore.',
          variant: 'destructive',
        });
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsArrayBuffer(file);
    
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".xlsx, .xls"
        disabled={isImporting}
      />
      <Button size="sm" variant="outline" onClick={handleButtonClick} disabled={isImporting}>
        <Upload className="mr-2 h-4 w-4" />
        {isImporting ? 'Importing...' : 'Import from Excel'}
      </Button>
    </>
  );
}
