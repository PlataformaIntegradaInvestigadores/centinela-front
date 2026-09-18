export interface UserPosture {
  id?: number; // ID de la postura (opcional)
  user: string; // ID del usuario (alfanumérico)
  debate: number; // ID del debate (numérico)
  posture: 'agree' | 'disagree' | 'neutral'; // Postura del usuario
  updated_at?: string; // Fecha de última actualización (opcional)
}
