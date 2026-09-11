export class WorkOrder {
    constructor(
        public _id: string,
        public folio: string,
        public numeroProyecto: string,
        public rfcProveedor: string,
        public empresa: string,
        public descripcion: string,
        public montoTotal: number,
        public estatus: string,
        public fechaCreacion: string,
        // Campos de contrato
        public archivoContrato?: string,
        public estatusContrato?: string,
        public observacionesContrato?: string,
        public costoContrato?: number,
        public fechaTerminoContrato?: Date,
        public anexos?: Array<{
            archivoAnexo: string;
            archivoXML?: string;
            monto: number;
            fechaTermino: Date;
            fechaSubida: Date;
        }>
    ) {}
}
