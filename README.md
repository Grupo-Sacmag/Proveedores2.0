# Portal de Proveedores - Grupo Sacmag (Rama: pochoclo) 🍿

Bienvenido a la rama experimental **pochoclo**. Esta rama contiene las últimas implementaciones y características del portal de proveedores antes de ser pasadas a producción.

## 🚀 Características Nuevas en esta Rama

- **Órdenes de Trabajo (ODT)**: Asignación de ODTs a proveedores.
- **Gestión de Contratos**: 
  - Subida de contratos en PDF.
  - Validación administrativa (Aprobar/Rechazar).
  - Solicitudes de modificación de contrato controladas por Administradores.
- **Carga Inteligente de Facturas (CFDI)**:
  - Extracción automática de datos desde el archivo físico XML (sin saturar la base de datos).
  - Visor detallado de XML (Conceptos, Emisor, Receptor, Traslados y Retenciones) mediante modal.
- **Centinela SAT**:
  - Verificación SOAP en tiempo real contra los servidores del SAT durante la subida de XML.
  - Bloqueo automático de facturas Canceladas, Apócrifas o Alteradas.

---
*Rama creada y mantenida bajo GitFlow.*
