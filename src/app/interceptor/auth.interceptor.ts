import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthenticationService } from '../service/authentication.service';

/* Para evitar poner el token en las llamadas creamos este interceptor, que coge la request 
antes de llegar servidor*/

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authenticationService: AuthenticationService) {}

  intercept(httpRequest: HttpRequest<unknown>, httpHandler: HttpHandler): Observable<HttpEvent<any>> {
    if(httpRequest.url.includes('login') || httpRequest.url.includes('register') || 
        httpRequest.url.includes('reset-password')) {
      return httpHandler.handle(httpRequest);
    } 
    this.authenticationService.loadToken();
    const token = this.authenticationService.getToken();
    //request es inmutable, hay que clonarlo, modificarlo y enviarlo
    const request = httpRequest.clone({setHeaders: {Authorization: `Bearer ${token}`}});
    return httpHandler.handle(request);
  }

}
