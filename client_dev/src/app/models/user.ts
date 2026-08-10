export class Usuario{
    constructor(
        public _id:string,
        public usuario:string,
        public password:string,
        public correo: string,
        public rol: string,
        public nombre: string,
        public apellidoP: string,
        public apellidoM: string,
        public rfc : string,
        public empresa: string,
        public borrado: boolean
    ){

    }

}