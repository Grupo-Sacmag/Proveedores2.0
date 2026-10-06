"use strict";

const { LOGO_CID } = require("../mailer");

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
function card(content) {
  return `
    <div style="background:#f7f9fc; border:1px solid #d9e2ec; border-radius:8px; padding:20px; margin:20px 0; " >
      ${content}
    </div>
  `;
}

function layoutProveedor({
  titulo,
  contenido,
  botonTexto,
  botonUrl,
}) {
  return `
  <!DOCTYPE html>
  <html>
    <body style="margin:0; padding:0; background:#f3f6fa; font-family:Arial, Helvetica, sans-serif; " >
      <table width="100%" cellpadding="0" cellspacing="0" style=" background:#f3f6fa; padding:30px 10px; " >
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:650px; width:100%; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 3px 12px rgba(0,0,0,0.08); " >
              <tr>
                <td style="background:#003b75; border-bottom:5px solid #f9a825; text-align:center; padding:30px;" >
                  <img src="cid:${LOGO_CID}" alt="Grupo SACMAG" style="max-width:220px; height:auto; display:block; margin:0 auto;">
                </td>
              </tr>
              <tr>
                <td style="padding:40px; font-size:15px; line-height:1.7; color:#444444; " >
                  <h2 style="color:#003b75; margin-top:0; margin-bottom:25px; font-size:26px; line-height:1.3; ">
                    ${titulo}
                  </h2>
                    ${contenido}
                  ${
                    botonUrl
                      ? `
                        <div style="margin-top:30px; text-align:center; ">
                          ${botonUrl}
                          ${botonTexto}
                          </a>
                        </div>
                        `
                        : ""
                      
                      }
                  </td>
                </tr>
                <tr>
                  <td style="background:#f1f1f1; padding:25px; text-align:center; color:#666666; font-size:12px; line-height:1.6;" >

                  <strong>
                    Portal de Proveedores
                  </strong>

                  <br><br>

                  Grupo SACMAG

                  <br><br>

                  Este correo fue generado automáticamente.

                  <br>

                  Favor de no responder este mensaje.

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

function generarListaArchivosHtml(archivos = []) {
  if (!Array.isArray(archivos) || archivos.length === 0) {
    return "";
  }

  const nombresArchivos = {
    1: "Formato requisitado para alta del proveedor",
    2: "Constancia de situación fiscal SAT",
    3: "Alta IMSS registro patronal",
    4: "INE representante legal",
    5: "Acta constitutiva y modificaciones",
    6: "Comprobante de domicilio fiscal",
    7: "Estado de cuenta con CLABE",
    8: "Opinión de cumplimiento SAT",
    9: "Opinión de cumplimiento IMSS",
    10: "Opinión de cumplimiento INFONAVIT",
    11: "Currículum",
    12: "REPSE",
    13: "Calibraciones y certificaciones",
    14: "Código de ética",
    15: "Última declaración anual"
  };

  return `
    <ul style="padding-left:20px;">
      ${archivos
        .map(
          id =>
            `<li>${escapeHtml(
              nombresArchivos[id] || `Documento ${id}`
            )}</li>`
        )
        .join("")}
    </ul>
  `;
}

function emailBienvenida({
  empresa,
  razonSocial,
  usuario,
  password,
  archivosRequeridos = []
}) {

  const portalUrl =
    "https://proveedores-grupo-sacmag.com.mx/";

  const contenido = `
  
    <p>
      Bienvenido al Portal de Proveedores de Grupo SACMAG.
    </p>

    <p>
      Se ha creado correctamente el acceso para:
      <strong>${escapeHtml(razonSocial)}</strong>
    </p>

    <div style="
      background:#f7f9fc;
      border:1px solid #d9e2ec;
      border-radius:6px;
      padding:20px;
      margin:20px 0;
    ">

      <h3 style="
        margin-top:0;
        color:#003b75;
      ">
        Credenciales de acceso
      </h3>

      <p>
        <strong>Empresa:</strong>
        ${escapeHtml(String(empresa).toUpperCase())}
      </p>

      <p>
        <strong>Usuario:</strong>
        ${escapeHtml(usuario)}
      </p>

      <p>
        <strong>Contraseña:</strong>
        ${escapeHtml(password)}
      </p>

    </div>

    <div style="
      background:#f7f9fc;
      border:1px solid #d9e2ec;
      border-radius:6px;
      padding:20px;
      margin:20px 0;
    ">

      <h3 style="
        margin-top:0;
        color:#003b75;
      ">
        Documentación requerida
      </h3>

      ${generarListaArchivosHtml(archivosRequeridos)}

    </div>

    <div style="
      background:#fff8e8;
      border-left:4px solid #f5a623;
      padding:15px;
      margin-top:20px;
    ">
      <strong>Importante:</strong>

      <ul>
        <li>Todos los documentos deben cargarse en PDF.</li>
        <li>El tamaño máximo permitido es el definido por la plataforma.</li>
        <li>Si algún documento no aplica, subir un PDF indicando "No aplica".</li>
      </ul>
    </div>

  `;

  const html = layoutProveedor({
    titulo: "Bienvenido al Portal de Proveedores",
    contenido,
    botonTexto: "Ingresar al Portal",
    botonUrl: portalUrl,
  });

  const text =
`Bienvenido al Portal de Proveedores de Grupo SACMAG.

Empresa: ${empresa}
Proveedor: ${razonSocial}

Usuario: ${usuario}
Contraseña: ${password}

Portal:
${portalUrl}`;

  return {
    subject:
      `Accesos Portal de Proveedores (${String(empresa).toUpperCase()})`,
    html,
    text,
  };
}

function emailDocumentosPendientesAdmin({
  rfc,
  razonSocial,
  empresa,
  proveedorId
}) {

  const urlProveedor = `https://proveedores-grupo-sacmag.com.mx/proveedor/${proveedorId}`;

  const contenido = `  
    <p>
      Se recibieron documentos para validación.
    </p>

    <div style="
      background:#f7f9fc;
      border:1px solid #d9e2ec;
      border-radius:6px;
      padding:20px;
      margin:20px 0;
    ">

      <p>
        <strong>Proveedor:</strong>
        ${escapeHtml(razonSocial)}
      </p>

      <p>
        <strong>RFC:</strong>
        ${escapeHtml(rfc.toUpperCase())}
      </p>

      <p>
        <strong>Empresa:</strong>
        ${escapeHtml(empresa)}
      </p>

    </div>

    <p>
      Los documentos se encuentran pendientes de revisión.
    </p>

  `;

  const html = layoutProveedor({
    titulo: "Documentos pendientes de validación",
    contenido,
    botonTexto: "Revisar proveedor",
    botonUrl: urlProveedor,
  });

  const text = `
Se recibieron documentos para validación.

Proveedor: ${razonSocial}
RFC: ${rfc}
Empresa: ${empresa}

Accede al portal:
${urlProveedor}
`;

  return {
    subject:
      `Documentos pendientes - ${rfc.toUpperCase()}`,
    html,
    text,
  };
}

function emailEstatusVerificacion({
  razonSocial,
  estatus,
  motivo = ""
}) {

  const aprobado =
    estatus === "APROBADO";

  const color =
    aprobado
      ? "#2e7d32"
      : "#c62828";

  const mensajeEstado =
    aprobado
      ? `
        <p>
          Tus documentos han sido validados correctamente.
        </p>

        <p>
          Ya eres un proveedor autorizado dentro de la plataforma.
        </p>
      `
      : `
        <p>
          La documentación enviada fue rechazada.
        </p>

        <div style="
          background:#fff5f5;
          border-left:4px solid #c62828;
          padding:15px;
          margin-top:15px;
        ">
          <strong>Motivo:</strong>
          ${escapeHtml(motivo)}
        </div>
      `;

  const contenido = `

    <p>
      Proveedor:
      <strong>${escapeHtml(razonSocial)}</strong>
    </p>

    <div style="
      background:${aprobado ? "#f1fff3" : "#fff7f7"};
      border:1px solid ${color};
      border-radius:6px;
      padding:20px;
      margin:20px 0;
    ">

      <strong style="
        color:${color};
      ">
        ${estatus}
      </strong>

    </div>

    ${mensajeEstado}

  `;

  const html = layoutProveedor({
    titulo: "Resultado de Verificación",
    contenido,
    botonTexto: "Ingresar al Portal",
    botonUrl:
      "https://proveedores-grupo-sacmag.com.mx/",
  });

  const text =
`
Proveedor: ${razonSocial}

Estatus: ${estatus}

${motivo ? "Motivo: " + motivo : ""}
`;

  return {
    subject:
      aprobado
        ? "Validación exitosa de documentos"
        : "Documentación rechazada",
    html,
    text,
  };
}

function emailDocumentoRechazado({
  razonSocial,
  documento
}) {
    const contenido = `
    <p>
      Se detectó una observación en uno de los documentos cargados.
    </p>

    <p>
      Proveedor:
      <strong>${escapeHtml(razonSocial)}</strong>
    </p>

    <div style="
      background:#fff7f7;
      border:1px solid #c62828;
      border-radius:6px;
      padding:20px;
      margin:20px 0;
    ">

      <strong style="color:#c62828;">
        Documento rechazado
      </strong>

      <br><br>

      ${escapeHtml(documento)}

    </div>

    <p>
      Ingresa al portal para cargar nuevamente el archivo corregido.
    </p>

  `;

  const html = layoutProveedor({
    titulo: "Documento rechazado",
    contenido,
    botonTexto: "Ir al Portal",
    botonUrl:
      "https://proveedores-grupo-sacmag.com.mx/",
  });

  const text =
`Documento rechazado

Proveedor: ${razonSocial}

Documento:
${documento}

Ingresa nuevamente al portal para actualizarlo.`;

  return {
    subject: `Documento rechazado: ${documento}`,
    html,
    text,
  };
}

function emailRecuperacionPassword({
  usuario,
  urlRecuperacion
}) {

  const contenido = `

    <p>
      Se recibió una solicitud para recuperar la contraseña de la cuenta:
    </p>

    <div style="
      background:#f7f9fc;
      border:1px solid #d9e2ec;
      border-radius:6px;
      padding:20px;
      margin:20px 0;
    ">
      <strong>
        ${escapeHtml(usuario)}
      </strong>
    </div>

    <p>
      Si tú realizaste la solicitud, utiliza el siguiente botón para continuar.
    </p>

    <p>
      Si no reconoces esta actividad simplemente ignora este correo.
    </p>

  `;

  const html = layoutProveedor({
    titulo: "Recuperación de contraseña",
    contenido,
    botonTexto: "Restablecer contraseña",
    botonUrl: urlRecuperacion,
  });

  const text =
`Recuperación de contraseña

Usuario:
${usuario}

Accede al siguiente enlace:

${urlRecuperacion}`;

  return {
    subject: "Recuperación de contraseña",
    html,
    text,
  };
}

function emailCredencialesUsuario({
  usuario,
  nombre,
  empresa,
  password
}) {
  const contenido = `

    <p>
      Se ha creado correctamente una cuenta en la plataforma.
    </p>

    <div
      style="
        background:#f7f9fc;
        border:1px solid #d9e2ec;
        border-radius:8px;
        padding:20px;
        margin:20px 0;
      "
    >

      <h3
        style="
          margin-top:0;
          color:#003b75;
        "
      >
        Credenciales de acceso
      </h3>

      <p>
        <strong>Nombre:</strong>
        ${escapeHtml(nombre)}
      </p>

      <p>
        <strong>Empresa:</strong>
        ${escapeHtml(String(empresa).toUpperCase())}
      </p>

      <p>
        <strong>Usuario:</strong>
        ${escapeHtml(usuario)}
      </p>

      <p>
        <strong>Contraseña temporal:</strong>
        ${escapeHtml(password)}
      </p>

    </div>

    <p>
      Utiliza estas credenciales para acceder al portal.
    </p>

  `;

  const html = layoutProveedor({
    titulo: "Nuevas credenciales de acceso",
    contenido,
    botonTexto: "Ingresar al Portal",
    botonUrl: "https://proveedores-grupo-sacmag.com.mx/",
  });

  const text = `
    Usuario: ${usuario}
    Empresa: ${empresa}
    Contraseña: ${password}

    Portal:
    https://proveedores-grupo-sacmag.com.mx/
    `;

  return {
    subject: "Accesos para entrar a la plataforma de Proveedores",
    html,
    text,
  };
}

module.exports = {
  layoutProveedor,
  card,
  emailBienvenida,
  emailDocumentosPendientesAdmin,
  emailEstatusVerificacion,
  emailDocumentoRechazado,
  emailRecuperacionPassword,
  emailCredencialesUsuario,
};