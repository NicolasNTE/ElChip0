import type { JustificationPhoto } from '../types';

const API_ORIGIN = import.meta.env.VITE_API_URL;

export function photoUrl(photo: JustificationPhoto): string {
  const normalizedPath = photo.filePath.replace(/^\.?\/?/, '');
  return `${API_ORIGIN}/${normalizedPath}`;
}
