export class WorkOrder {
    constructor(
        public _id: string,
        public folio: string,
        public rfcProveedor: string,
        public empresa: string,
        public descripcion: string,
        public montoTotal: number,
        public estatus: string,
        public fechaCreacion: string,
        // Campos de contrato
        public archivoContrato?: string,
        public estatusContrato?: string,
        public observacionesContrato?: string
    ) {}
}
