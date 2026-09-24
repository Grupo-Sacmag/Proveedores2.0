export interface TicketMessage {
  _id?: string;
  ticketId?: string;
  folioTicket?: string;
  tipo?: string; // 'CREACION' | 'RESPUESTA' | 'CAMBIO_ESTATUS'
  remitente?: string;
  destinatarios?: string[];
  asunto?: string;
  cuerpoHtml?: string;
  cuerpoTexto?: string;
  autor?: string;
  fecha?: string;
  enviado?: boolean;
  errorEnvio?: string | null;
}
