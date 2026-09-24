"use strict";

var URL_PORTAL = "https://proveedores-grupo-sacmag.com.mx";

function renderFilas(filas) {
  var rows = "";
  for (var i = 0; i < filas.length; i += 2) {
    var izq = filas[i];
    var der = filas[i + 1];
    rows += `
      <tr>
          <td width="50%" valign="top" style="padding-bottom: 20px;">
              <p style="font-size: 11px; margin: 0 0 5px 0; color: #9e9e9e; font-weight: bold; letter-spacing: 1px;">${izq.label}</p>
              <p style="margin: 0; font-size: 15px; color: #333333;">${izq.value}</p>
          </td>
          ${der
            ? `<td width="50%" valign="top" style="padding-bottom: 20px;">
              <p style="font-size: 11px; margin: 0 0 5px 0; color: #9e9e9e; font-weight: bold; letter-spacing: 1px;">${der.label}</p>
              <p style="margin: 0; font-size: 15px; color: #333333;">${der.value}</p>
          </td>`
            : `<td width="50%"></td>`
          }
      </tr>`;
  }
  return rows;
}

/**
 * Layout base compartido por los correos de tickets. Todo el CSS va inline
 * a propósito (nada de <style> en el head) para que sobreviva a Gmail/Outlook.
 */
function layoutTicket(opts) {
  var filasHtml = renderFilas(opts.filas || []);
  var ctaHtml = opts.ctaUrl
    ? `
      <div style="text-align: center; margin-top: 30px;">
          <a href="${opts.ctaUrl}" style="display: inline-block; background-color: #1a237e; color: #ffffff; text-decoration: none; padding: 12px 25px; font-weight: bold; border-radius: 4px; font-size: 14px;">${opts.ctaText || "Ver ticket"}</a>
      </div>`
    : "";

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; color: #333333; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
        <div style="background-color: #1a237e; color: #ffffff; padding: 40px 30px; text-align: center;">
            <p style="font-size: 12px; margin: 0 0 10px 0; color: #9fa8da; letter-spacing: 1px; text-transform: uppercase;">
                PORTAL DE PROVEEDORE<span style="background-color: #ffeb3b; color: #1a237e; padding: 0 2px;">S -</span> GRUPO SACMAG
            </p>
            <h1 style="margin: 0; font-size: 28px; font-weight: normal; font-family: 'Times New Roman', Times, serif;">
                ${opts.tituloPlano} <span style="background-color: #ffeb3b; color: #1a237e; padding: 0 5px; font-weight: bold;">${opts.tituloResaltado}</span>
            </h1>
        </div>

        <div style="background-color: #e8eaf6; padding: 20px 30px;">
            <p style="font-size: 12px; margin: 0 0 5px 0; color: #7986cb; letter-spacing: 1px; font-weight: bold;">FOLIO DE TICKET</p>
            <h2 style="margin: 0; font-size: 24px; color: #1a237e; font-family: 'Times New Roman', Times, serif; letter-spacing: 1px;">
                ${opts.folio}
            </h2>
        </div>

        <div style="padding: 30px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 10px;">
                ${filasHtml}
            </table>

            <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0 25px 0;" />

            ${opts.mensajeHtml || ""}
            ${ctaHtml}
        </div>

        <div style="background-color: #f5f5f5; padding: 20px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #999999;">
                Mensaje automático — Portal de Proveedores - Grupo SACMAG
            </p>
        </div>
    </div>
  `;
}

// --- Correo: ticket recién creado (notificación al equipo de administradores) ---
function emailNuevoTicketAdmin(ticket) {
  var html = layoutTicket({
    tituloPlano: "Nuevo",
    tituloResaltado: "Ticket Registrado",
    folio: ticket.folio,
    filas: [
      { label: "SOLICITANTE", value: ticket.usuario.toUpperCase() },
      { label: "EMPRESA", value: (ticket.empresa || "N/A").toUpperCase() },
      { label: "PRIORIDAD", value: ticket.prioridad },
      { label: "MÓDULO", value: ticket.modulo || "N/A" },
    ],
    mensajeHtml: `
      <p style="font-size: 11px; margin: 0 0 10px 0; color: #9e9e9e; font-weight: bold; letter-spacing: 1px;">ASUNTO</p>
      <p style="margin: 0 0 20px 0; font-size: 15px; color: #333333;">${ticket.asunto}</p>
      <p style="font-size: 11px; margin: 0 0 10px 0; color: #9e9e9e; font-weight: bold; letter-spacing: 1px;">DESCRIPCIÓN</p>
      <div style="background-color: #fafafa; border-left: 4px solid #1a237e; padding: 15px; font-size: 14px; color: #444; white-space: pre-wrap;">${ticket.descripcion}</div>
    `,
    ctaText: "Ver en el Dashboard",
    ctaUrl: URL_PORTAL + "/admin/tickets/" + ticket._id,
  });
  return { subject: `[Ticket ${ticket.folio}] Nuevo reporte: ${ticket.asunto}`, html: html };
}

// --- Correo: confirmación de recepción al solicitante ---
function emailConfirmacionSolicitante(ticket) {
  var html = layoutTicket({
    tituloPlano: "Ticket",
    tituloResaltado: "Recibido",
    folio: ticket.folio,
    filas: [
      { label: "ESTATUS", value: ticket.estatus },
      { label: "PRIORIDAD", value: ticket.prioridad },
    ],
    mensajeHtml: `<p style="font-size: 15px; color: #555; line-height: 1.5;">Hemos recibido tu reporte y quedó registrado con el folio <strong>${ticket.folio}</strong>. Nuestro equipo lo revisará y te notificaremos por este medio cualquier avance.</p>`,
    ctaText: "Ver mi ticket",
    ctaUrl: URL_PORTAL + "/mis-tickets/" + ticket._id,
  });
  return { subject: `[Ticket ${ticket.folio}] Hemos recibido tu reporte`, html: html };
}

// --- Correo: respuesta de un administrador al solicitante ---
function emailRespuestaTicket(ticket, mensajeAdmin, autorAdmin) {
  var html = layoutTicket({
    tituloPlano: "Respuesta a tu",
    tituloResaltado: "Ticket",
    folio: ticket.folio,
    filas: [
      { label: "ESTATUS ACTUAL", value: ticket.estatus },
      { label: "ATENDIDO POR", value: autorAdmin.toUpperCase() },
    ],
    mensajeHtml: `
      <p style="font-size: 11px; margin: 0 0 10px 0; color: #9e9e9e; font-weight: bold; letter-spacing: 1px;">MENSAJE</p>
      <div style="background-color: #fafafa; border-left: 4px solid #1a237e; padding: 15px; font-size: 14px; color: #444; white-space: pre-wrap;">${mensajeAdmin}</div>
    `,
    ctaText: "Ver conversación completa",
    ctaUrl: URL_PORTAL + "/mis-tickets/" + ticket._id,
  });
  return { subject: `[Ticket ${ticket.folio}] Nueva respuesta a tu reporte`, html: html };
}

// --- Correo: cambio de estatus ---
function emailCambioEstatusTicket(ticket, estatusAnterior, observaciones) {
  var html = layoutTicket({
    tituloPlano: "Actualización de",
    tituloResaltado: "Estatus",
    folio: ticket.folio,
    filas: [
      { label: "ESTATUS ANTERIOR", value: estatusAnterior },
      { label: "ESTATUS NUEVO", value: ticket.estatus },
    ],
    mensajeHtml: observaciones
      ? `<p style="font-size: 11px; margin: 0 0 10px 0; color: #9e9e9e; font-weight: bold; letter-spacing: 1px;">OBSERVACIONES</p>
         <div style="background-color: #fafafa; border-left: 4px solid #1a237e; padding: 15px; font-size: 14px; color: #444; white-space: pre-wrap;">${observaciones}</div>`
      : "",
    ctaText: "Ver mi ticket",
    ctaUrl: URL_PORTAL + "/mis-tickets/" + ticket._id,
  });
  return { subject: `[Ticket ${ticket.folio}] Cambio de estatus: ${ticket.estatus}`, html: html };
}

module.exports = {
  emailNuevoTicketAdmin: emailNuevoTicketAdmin,
  emailConfirmacionSolicitante: emailConfirmacionSolicitante,
  emailRespuestaTicket: emailRespuestaTicket,
  emailCambioEstatusTicket: emailCambioEstatusTicket,
};
