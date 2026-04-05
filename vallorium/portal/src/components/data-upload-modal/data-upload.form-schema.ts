import { z } from 'zod';

const uploadFileSchema = z.instanceof(File, {
  fatal: true,
  message: 'Fichier manquant ou invalide',
});

const locationSchema = z.object(
  {
    id: z.string().min(1, 'Identifiant de localisation requis'),
    label: z.string().optional(),
  },
  { required_error: 'Localisation requise' },
);

export const dataUploadFormSchema = z.object({
  file: uploadFileSchema,
  location: locationSchema,
});
