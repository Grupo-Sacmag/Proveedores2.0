import { Injectable, Component } from '@angular/core';
import {Global} from './global';
import { Params } from '@angular/router';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { ignoreElements } from 'rxjs/operators';


@Injectable(
)
export class UploadService{
    public url: string;

    constructor(){
        this.url=Global.url;

    }

    makeFileRequest(url: string, params: Array<string>, files:Array<File[]>){
        var token: any;
        token= localStorage.getItem('token');
        return new Promise( function(resolve, reject){
            var formData: any = new FormData();
            //console.log(files);
            var xhr = new XMLHttpRequest();

            var archivo: string = 'archivo1';
            for(var i = 0; i< files.length; i++){
               /*  console.log(files[i][0]+ '  '+files[i][0].name); */
               if(i==1 ){
                   archivo = 'archivo2';
               }
               if(i==2){
                   archivo = 'archivo3';
               }

               if(i==3){
                   archivo = 'archivo4';
               }

               if(i==4){
                archivo = 'archivo5';
               }
               if(i==5){
                archivo = 'archivo6';
               }
               if(i==6){
                archivo = 'archivo7';
               }
               if(i==7){
                archivo = 'archivo8';
               }
               if(i==8){
                archivo = 'archivo9';
               }
               if(i==9){
                archivo = 'archivo10';
               }
               if(i==10){
                archivo = 'archivo11';
               }
               if(i==11){
                archivo = 'archivo12';
               }
               if(i==12){
                archivo = 'archivo13';
               }
               if(i==13){
                archivo = 'archivo14';
               }
               if(i==14){
                archivo = 'archivo15';
               }
               if(i == 4 && files[4]== undefined){
                   continue;
               }




               formData.append(archivo, files[i][0], files[i][0].name);

            }



            xhr.onreadystatechange = function(){
                if(xhr.readyState == 4){
                    if(xhr.status == 200){
                        resolve(JSON.parse(xhr.response));
                    }else{
                        reject(xhr.response);
                    }
                }
            }


            xhr.open('POST', url, true);

            xhr.setRequestHeader('Authorization', token);

            xhr.send(formData);
        })
    }



}
