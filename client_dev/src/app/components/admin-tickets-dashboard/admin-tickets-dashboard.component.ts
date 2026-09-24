import { Component, OnInit } from '@angular/core';
import { ProjectService } from '../../services/project.service';
import { Ticket } from '../../models/ticket';
import { TicketMessage } from '../../models/ticketMessage';

@Component({
  selector: 'app-admin-tickets-dashboard',
  templateUrl: './admin-tickets-dashboard.component.html',
  styleUrls: ['./admin-tickets-dashboard.component.css']
})
export class AdminTicketsDashboardComponent implements OnInit {

  public tickets: Ticket[] = [];
  public ticketSeleccionado: Ticket | null = null;
  public mensajes: TicketMessage[] = [];
  public cargando = false;
  public cargandoDetalle = false;
  public error: string = '';

  // Filtros (Criterio 4)
  public filtroEstatus: string = '';
  public filtroEmpresa: string = '';
  public filtroUsuario: string = '';
  public filtroDesde: string = '';
  public filtroHasta: string = '';

  public estatusDisponibles = ['Abierto', 'En Proceso', 'Resuelto', 'Cerrado'];

  // Respuesta
  public mensajeRespuesta: string = '';
  public estatusRespuesta: string = '';
  public enviandoRespuesta = false;

  constructor(private _projectService: ProjectService) { }

  ngOnInit(): void {
    this.cargarTickets();
  }

  cargarTickets(): void {
    this.cargando = true;
    this.error = '';
    const filtros = {
      estatus: this.filtroEstatus,
      empresa: this.filtroEmpresa,
      usuario: this.filtroUsuario,
      desde: this.filtroDesde,
      hasta: this.filtroHasta
    };

    this._projectService.getAllTicketsAdmin(filtros).subscribe({
      next: (response) => {
        this.tickets = response.tickets || [];
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar los tickets.';
        this.cargando = false;
      }
    });
  }

  limpiarFiltros(): void {
    this.filtroEstatus = '';
    this.filtroEmpresa = '';
    this.filtroUsuario = '';
    this.filtroDesde = '';
    this.filtroHasta = '';
    this.cargarTickets();
  }

  verDetalle(ticket: Ticket): void {
    this.ticketSeleccionado = ticket;
    this.mensajes = [];
    this.mensajeRespuesta = '';
    this.estatusRespuesta = '';
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

  enviarRespuesta(): void {
    if (!this.mensajeRespuesta.trim() || !this.ticketSeleccionado) return;

    this.enviandoRespuesta = true;
    this._projectService.responderTicket(
      this.ticketSeleccionado._id as string,
      this.mensajeRespuesta.trim(),
      this.estatusRespuesta || undefined
    ).subscribe({
      next: (response) => {
        this.ticketSeleccionado = response.ticket;
        this.mensajes.push(response.mensaje);
        this.mensajeRespuesta = '';
        this.estatusRespuesta = '';
        this.enviandoRespuesta = false;
        this.cargarTickets(); // refresca el listado por si cambió el estatus
      },
      error: () => {
        this.error = 'No se pudo enviar la respuesta.';
        this.enviandoRespuesta = false;
      }
    });
  }
}
