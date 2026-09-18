export interface Debate {
  id?: number; // Campo de solo lectura
  group: string; // Obligatorio
  title: string; // Obligatorio, longitud máxima: 255
  description: string; // Obligatorio
  created_at?: string; // Campo de solo lectura, formato ISO 8601
  end_time: string; // Obligatorio
  is_closed?: boolean; // Campo de solo lectura
}
