import { Pipe, PipeTransform } from '@angular/core';
import { VendorsComponent } from '../components/vendors/vendors.component';

@Pipe({
  name: 'search'
})
export class SearchPipe implements PipeTransform {

  transform(lista: any[], texto:string): any {
    if(!texto) return lista
    return lista.filter(vendor => vendor.razonSocial.toUpperCase().includes(texto.toUpperCase()) || vendor.rfc.toUpperCase().includes(texto.toUpperCase()))
  }

}
