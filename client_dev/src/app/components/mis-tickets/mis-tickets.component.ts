import { Component, OnInit } from '@angular/core';
import { ProjectService } from '../../services/project.service';
import { Ticket } from '../../models/ticket';
import { TicketMessage } from '../../models/ticketMessage';

@Component({
  selector: 'app-mis-tickets',
  templateUrl: './mis-tickets.component.html',
  styleUrls: ['./mis-tickets.component.css']
})
export class MisTicketsComponent implements OnInit {

  public tickets: Ticket[] = [];
  public cargando = false;
  public error: string = '';
  public exito: string = '';

  // Formulario nuevo ticket
  public mostrarFormulario = false;
  public nuevoAsunto = '';
  public nuevaDescripcion = '';
  public nuevoModulo = '';
  public nuevaPrioridad = 'Media';
  public prioridades = ['Baja', 'Media', 'Alta'];
  public enviando = false;

  // Detalle (solo lectura para el solicitante)
  public ticketSeleccionado: Ticket | null = null;
  public mensajes: TicketMessage[] = [];
  public cargandoDetalle = false;

  constructor(private _projectService: ProjectService) { }

  ngOnInit(): void {
    this.cargarMisTickets();
  }

  cargarMisTickets(): void {
    this.cargando = true;
    this.error = '';
    this._projectService.getMisTickets().subscribe({
      next: (response) => {
        this.tickets = response.tickets || [];
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar tus tickets.';
        this.cargando = false;
      }
    });
  }

  toggleFormulario(): void {
    this.mostrarFormulario = !this.mostrarFormulario;
    this.error = '';
    this.exito = '';
  }

  crearTicket(): void {
    if (!this.nuevoAsunto.trim() || !this.nuevaDescripcion.trim()) {
      this.error = 'Asunto y descripción son obligatorios.';
      return;
    }

    this.enviando = true;
    this.error = '';
    this.exito = '';

    const ticket = {
      asunto: this.nuevoAsunto.trim(),
      descripcion: this.nuevaDescripcion.trim(),
      modulo: this.nuevoModulo.trim(),
      prioridad: this.nuevaPrioridad
    };

    this._projectService.crearTicket(ticket).subscribe({
      next: (response) => {
        this.exito = `Ticket ${response.ticket.folio} creado correctamente. Te llegará un correo de confirmación.`;
        this.nuevoAsunto = '';
        this.nuevaDescripcion = '';
        this.nuevoModulo = '';
        this.nuevaPrioridad = 'Media';
        this.mostrarFormulario = false;
        this.enviando = false;
        this.cargarMisTickets();
      },
      error: () => {
        this.error = 'No se pudo crear el ticket. Intenta de nuevo.';
        this.enviando = false;
      }
    });
  }

  verDetalle(ticket: Ticket): void {
    this.ticketSeleccionado = ticket;
    this.mensajes = [];
    this.cargandoDetalle = true;

    this._projectService.getTicketDetail(ticket._id as string).subscribe({
      next: (response) => {
        this.ticketSeleccionado = response.ticket;
        this.mensajes = response.mensajes || [];
        this.cargandoDetalle = false;
      },
      error: () => {
        this.error = 'No se pudo cargar el detalle del ticket.';
        this.cargandoDetalle = false;
      }
    });
  }

  cerrarDetalle(): void {
    this.ticketSeleccionado = null;
    this.mensajes = [];
  }
}
