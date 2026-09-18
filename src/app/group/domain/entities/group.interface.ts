import { UserG } from './user.interface';

export interface Group {
  id: string;
  title: string;
  description: string;
  owner?: string; // Este campo puede ser opcional y quemado en el frontend por ahora
  phase?: string; // Este campo también puede ser opcional y quemado
  admin_id: string;
  users: UserG[];
  voting_type: string;
}
