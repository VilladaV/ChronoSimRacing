'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getFirestore, doc, deleteDoc } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

// Helper function to initialize Firebase on the server, safely.
function getFirebaseAdmin() {
  if (getApps().length === 0) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

type ActionState = {
  message: string;
  error: boolean;
}

export async function deletePilotAction(pilotId: string): Promise<ActionState> {
  if (!pilotId) {
    return { message: 'Pilot ID is missing.', error: true };
  }

  try {
    const app = getFirebaseAdmin();
    const firestore = getFirestore(app);
    const pilotRef = doc(firestore, 'pilots', pilotId);
    await deleteDoc(pilotRef);
    revalidatePath('/dashboard/management/pilots');
    return { message: 'Pilot deleted successfully.', error: false };
  } catch (error: any) {
    console.error('Error deleting pilot:', error);
    return { 
        message: `Failed to delete pilot: ${error.message || 'An unknown error occurred.'}`, 
        error: true 
    };
  }
}
