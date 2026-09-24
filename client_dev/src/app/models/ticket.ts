export interface Ticket {
  _id?: string;
  folio?: string;
  usuario?: string;
  rfc?: string;
  empresa?: string;
  correoSolicitante?: string;
  asunto: string;
  descripcion: string;
  modulo?: string;
  prioridad?: string;
  estatus?: string;
  asignadoA?: string;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}
