"use strict";

var URL_PORTAL = "https://proveedores-grupo-sacmag.com.mx";


/* ============================================================
   UTILIDADES
   ============================================================ */

function escapeHtml(value) {

  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function textoHtml(value) {

  return escapeHtml(value)
    .replace(/\r?\n/g, "<br>");
}


/* ============================================================
   TARJETA DE DATO
   ============================================================ */

function tarjetaDato(label, value, color) {

  return `
    <td width="50%" valign="top" style="padding:6px;">

      <div style="
        background-color:#f8fafc;
        border:1px solid #e2e8f0;
        border-radius:9px;
        padding:15px;
      ">

        <div style="
          font-size:10px;
          font-weight:bold;
          letter-spacing:1px;
          color:#64748b;
          text-transform:uppercase;
          margin-bottom:7px;
        ">
          ${escapeHtml(label)}
        </div>

        <div style="
          font-size:15px;
          font-weight:bold;
          color:${color || "#1e293b"};
          line-height:1.4;
        ">
          ${escapeHtml(value || "N/A")}
        </div>

      </div>

    </td>
  `;
}


/* ============================================================
   RENDER DE DATOS
   ============================================================ */

function renderDatos(datos) {

  var html = "";

  for (var i = 0; i < datos.length; i += 2) {

    var primero = datos[i];
    var segundo = datos[i + 1];

    html += `
      <tr>
        ${tarjetaDato(
          primero.label,
          primero.value,
          primero.color
        )}

        ${
          segundo
            ? tarjetaDato(
                segundo.label,
                segundo.value,
                segundo.color
              )
            : `
              <td width="50%" style="padding:6px;"></td>
            `
        }
      </tr>
    `;
  }

  return html;
}


/* ============================================================
   LAYOUT GENERAL
   ============================================================ */

function layoutTicket(opts) {

  var datosHtml = renderDatos(opts.datos || []);

  var contenidoPrincipal = "";

  /* ----------------------------------------------------------
     ASUNTO + DESCRIPCIÓN
     Se utilizan únicamente cuando el correo los necesita.
     ---------------------------------------------------------- */

  if (opts.asunto) {

    contenidoPrincipal += `
      <div style="
        margin-top:24px;
        padding:18px 20px;
        background-color:#f8fafc;
        border:1px solid #e2e8f0;
        border-radius:9px;
      ">

        <div style="
          font-size:10px;
          color:#64748b;
          font-weight:bold;
          letter-spacing:1.2px;
          margin-bottom:8px;
        ">
          ASUNTO
        </div>

        <div style="
          font-size:16px;
          color:#0f172a;
          font-weight:bold;
          line-height:1.4;
        ">
          ${escapeHtml(opts.asunto)}
        </div>

      </div>
    `;
  }


  if (opts.descripcion) {

    contenidoPrincipal += `
      <div style="margin-top:24px;">

        <div style="
          font-size:10px;
          color:#64748b;
          font-weight:bold;
          letter-spacing:1.2px;
          margin-bottom:9px;
        ">
          DESCRIPCIÓN DEL REPORTE
        </div>

        <div style="
          background-color:#ffffff;
          border-left:4px solid #2563eb;
          border-top:1px solid #e2e8f0;
          border-right:1px solid #e2e8f0;
          border-bottom:1px solid #e2e8f0;
          border-radius:0 8px 8px 0;
          padding:18px 20px;
          font-size:14px;
          line-height:1.65;
          color:#475569;
        ">
          ${opts.descripcion}
        </div>

      </div>
    `;
  }


  /* ----------------------------------------------------------
     MENSAJE
     Para el correo de confirmación al solicitante.
     ---------------------------------------------------------- */

  if (opts.mensaje) {

    contenidoPrincipal += `
      <div style="
        margin-top:25px;
        font-size:15px;
        line-height:1.7;
        color:#475569;
      ">
        ${opts.mensaje}
      </div>
    `;
  }


  /* ----------------------------------------------------------
     BOTÓN
     ---------------------------------------------------------- */

  var ctaHtml = "";

  if (opts.ctaUrl) {

    ctaHtml = `
      <div style="
        text-align:center;
        margin-top:30px;
      ">

        <a href="${escapeHtml(opts.ctaUrl)}"
           style="
             display:inline-block;
             background-color:#1d4ed8;
             color:#ffffff;
             text-decoration:none;
             padding:13px 28px;
             border-radius:7px;
             font-size:14px;
             font-weight:bold;
           ">
          ${escapeHtml(opts.ctaText || "Ver ticket")}
        </a>

      </div>
    `;
  }


  /* ==========================================================
     HTML COMPLETO
     ========================================================== */

  return `
<!DOCTYPE html>

<html>

<head>

  <meta charset="UTF-8">

  <meta name="viewport"
        content="width=device-width, initial-scale=1.0">

  <title>${escapeHtml(opts.tituloPlano || "Ticket")}</title>

</head>


<body style="
  margin:0;
  padding:0;
  background-color:#f1f5f9;
  font-family:Arial, Helvetica, sans-serif;
  color:#1e293b;
">


<table width="100%"
       cellpadding="0"
       cellspacing="0"
       border="0"
       style="
         background-color:#f1f5f9;
         padding:30px 15px;
       ">

<tr>

<td align="center">


<!-- ========================================================
     TARJETA PRINCIPAL
     ======================================================== -->

<table width="650"
       cellpadding="0"
       cellspacing="0"
       border="0"
       style="
         width:100%;
         max-width:650px;
         background-color:#ffffff;
         border-radius:14px;
         overflow:hidden;
         border:1px solid #e2e8f0;
       ">


<!-- ========================================================
     ENCABEZADO
     ======================================================== -->

<tr>

<td style="
  background-color:#172554;
  padding:28px 32px;
">


<div style="
  font-size:11px;
  font-weight:bold;
  letter-spacing:1.5px;
  color:#93c5fd;
  text-transform:uppercase;
  margin-bottom:8px;
">
  PORTAL DE PROVEEDORES
</div>


<div style="
  font-size:22px;
  font-weight:bold;
  color:#ffffff;
  line-height:1.3;
">

  ${escapeHtml(opts.tituloPlano || "")}

  <span style="
    color:#facc15;
  ">
    ${escapeHtml(opts.tituloResaltado || "")}
  </span>

</div>


</td>

</tr>


<!-- ========================================================
     FOLIO
     ======================================================== -->

<tr>

<td style="
  background-color:#eff6ff;
  border-bottom:1px solid #dbeafe;
  padding:20px 32px;
">


<div style="
  font-size:10px;
  color:#64748b;
  font-weight:bold;
  letter-spacing:1.5px;
  text-transform:uppercase;
  margin-bottom:5px;
">
  FOLIO DEL TICKET
</div>


<div style="
  font-size:25px;
  color:#1e3a8a;
  font-weight:bold;
  letter-spacing:1px;
">
  ${escapeHtml(opts.folio)}
</div>


</td>

</tr>


<!-- ========================================================
     CONTENIDO
     ======================================================== -->

<tr>

<td style="
  padding:26px;
">


<!-- DATOS -->

<table width="100%"
       cellpadding="0"
       cellspacing="0"
       border="0">

  ${datosHtml}

</table>


<!-- CONTENIDO ADICIONAL -->

${contenidoPrincipal}


<!-- BOTÓN -->

${ctaHtml}


</td>

</tr>


<!-- ========================================================
     PIE
     ======================================================== -->

<tr>

<td style="
  background-color:#f8fafc;
  border-top:1px solid #e2e8f0;
  padding:20px 25px;
  text-align:center;
">


<div style="
  font-size:11px;
  color:#94a3b8;
  line-height:1.6;
">

  Este mensaje fue generado automáticamente por el

  <strong style="color:#64748b;">
    Portal de Proveedores - Grupo SACMAG
  </strong>.

  <br>

  Por favor, no respondas directamente a este correo.

</div>


</td>

</tr>


</table>


</td>

</tr>

</table>


</body>

</html>
`;
}


/* ============================================================
   NUEVO TICKET → DESARROLLO / SOPORTE
   ============================================================ */

function emailNuevoTicketAdmin(ticket) {

  var html = layoutTicket({

    tituloPlano: "Nuevo",
    tituloResaltado: "Ticket Registrado",

    folio: ticket.folio,

    datos: [

      {
        label: "SOLICITANTE",
        value: (ticket.usuario || "N/A").toUpperCase(),
        color: "#1e293b"
      },

      {
        label: "EMPRESA",
        value: (ticket.empresa || "N/A").toUpperCase(),
        color: "#1e293b"
      },

      {
        label: "PRIORIDAD",
        value: ticket.prioridad || "N/A",
        color: "#dc2626"
      },

      {
        label: "MÓDULO",
        value: ticket.modulo || "N/A",
        color: "#7c3aed"
      }

    ],

    asunto: ticket.asunto || "Sin asunto",

    descripcion:
      textoHtml(ticket.descripcion || "Sin descripción"),

    ctaText: "Ver ticket en el Dashboard",

    ctaUrl:
      URL_PORTAL +
      "/admin/tickets/" +
      ticket._id
  });


  return {

    subject:
      `[Ticket ${ticket.folio}] Nuevo reporte: ${ticket.asunto}`,

    html: html

  };
}


/* ============================================================
   CONFIRMACIÓN → SOLICITANTE
   ============================================================ */

function emailConfirmacionSolicitante(ticket) {

  var html = layoutTicket({

    tituloPlano: "Ticket",
    tituloResaltado: "Recibido",

    folio: ticket.folio,

    datos: [

      {
        label: "ESTATUS",
        value: ticket.estatus || "Pendiente",
        color: "#2563eb"
      },

      {
        label: "PRIORIDAD",
        value: ticket.prioridad || "N/A",
        color: "#dc2626"
      }

    ],

    mensaje:
      `Hemos recibido tu reporte y quedó registrado con el folio
      <strong style="color:#1e3a8a;">
        ${escapeHtml(ticket.folio)}
      </strong>.
      <br><br>
      Nuestro equipo lo revisará y te notificaremos por este medio
      cualquier avance.`,

    ctaText: "Ver mi ticket",

    ctaUrl:
      URL_PORTAL +
      "/mis-tickets/" +
      ticket._id
  });


  return {

    subject:
      `[Ticket ${ticket.folio}] Hemos recibido tu reporte`,

    html: html

  };
}


/* ============================================================
   RESPUESTA DEL ADMIN → SOLICITANTE
   ============================================================ */

function emailRespuestaTicket(
  ticket,
  mensajeAdmin,
  autorAdmin
) {

  var html = layoutTicket({

    tituloPlano: "Respuesta a tu",
    tituloResaltado: "Ticket",

    folio: ticket.folio,

    datos: [

      {
        label: "ESTATUS",
        value: ticket.estatus || "N/A",
        color: "#2563eb"
      },

      {
        label: "PRIORIDAD",
        value: ticket.prioridad || "N/A",
        color: "#dc2626"
      }

    ],

    asunto: ticket.asunto || "Sin asunto",

    descripcion:
      `
      <strong style="color:#1e3a8a;">
        ${escapeHtml(autorAdmin)}
      </strong>
      respondió a tu ticket:
      <br><br>
      ${textoHtml(mensajeAdmin)}
      `,

    ctaText: "Ver conversación completa",

    ctaUrl:
      URL_PORTAL +
      "/mis-tickets/" +
      ticket._id
  });


  return {

    subject:
      `[Ticket ${ticket.folio}] Nueva respuesta a tu reporte`,

    html: html

  };
}


/* ============================================================
   CAMBIO DE ESTATUS → SOLICITANTE
   ============================================================ */

function emailCambioEstatusTicket(
  ticket,
  estatusAnterior,
  observaciones
) {

  var descripcionHtml = "";

  if (observaciones) {

    descripcionHtml = `
      <strong style="color:#64748b;">
        Observaciones:
      </strong>

      <br><br>

      ${textoHtml(observaciones)}
    `;

  } else {

    descripcionHtml =
      "El estatus de tu ticket ha sido actualizado.";

  }


  var html = layoutTicket({

    tituloPlano: "Actualización de",
    tituloResaltado: "Estatus",

    folio: ticket.folio,

    datos: [

      {
        label: "ESTATUS",
        value: ticket.estatus || "N/A",
        color: "#2563eb"
      },

      {
        label: "PRIORIDAD",
        value: ticket.prioridad || "N/A",
        color: "#dc2626"
      }

    ],

    descripcion: descripcionHtml,

    ctaText: "Ver mi ticket",

    ctaUrl:
      URL_PORTAL +
      "/mis-tickets/" +
      ticket._id
  });


  return {

    subject:
      `[Ticket ${ticket.folio}] Cambio de estatus: ${ticket.estatus}`,

    html: html

  };
}


/* ============================================================
   EXPORTACIONES
   ============================================================ */

module.exports = {

  emailNuevoTicketAdmin:
    emailNuevoTicketAdmin,

  emailConfirmacionSolicitante:
    emailConfirmacionSolicitante,

  emailRespuestaTicket:
    emailRespuestaTicket,

  emailCambioEstatusTicket:
    emailCambioEstatusTicket

};