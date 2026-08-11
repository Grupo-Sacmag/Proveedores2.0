export class Invoice {
    constructor(
        public _id: string,
        public ordenTrabajoId: string,
        public rfcProveedor: string,
        public empresa: string,
        public uuid: string,
        public subtotal: number,
        public iva: number,
        public total: number,
        public moneda: string,
        public fechaEmision: string,
        public archivoXML: string,
        public archivoPDF: string,
        public estatusValidacion: string,
        public observacionesRechazo: string,
        public fechaCarga: string
    ) {}
}
