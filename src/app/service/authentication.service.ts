import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { environment } from '../../environments/environment'
import { Observable } from 'rxjs';
import { User } from '../model/user';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable({providedIn: 'root'}) //con el provideIn: root no hacer falta wirearlo en el app.module
export class AuthenticationService {

  public host = environment.apiUrl; //host: String (redundante porque apiUrl ya es string)
  private token: string | null;
  private loggedUsername: string | null;
  private jwtHelper = new JwtHelperService();

  constructor(private http: HttpClient) {}

  //'public' tambien redundante, pero se ha dejado
  public login(user: User): Observable<HttpResponse<any> | HttpErrorResponse> {
    return this.http.post<HttpResponse<any> | HttpErrorResponse>
    (`${this.host}/user/login`, user, {observe: 'response'}); //response: devuelve TODA la response HTTP, headers, body, etc. (por default solo devuelve el body)
  }

  public register(user: User): Observable<User | HttpErrorResponse> {
    return this.http.post<User | HttpErrorResponse> (`${this.host}/user/register`, user); //solo queremos el body
  }

  public logout(): void {
    this.token = null;
    this.loggedUsername = null;
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('users');
  }

  public saveToken(token : string): void {
    this.token = token;
    localStorage.setItem('token', token);
  }

  public addUserToLocalCache(user : User): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  public getUserFromLocalCache(): User {
    return JSON.parse(localStorage.getItem('user')!);
  }

  public loadToken(): void {
    this.token = localStorage.getItem('token');
  }

  public getToken(): string | null{
    return this.token;
  }

  public isUserLoggedIn(): boolean {
    this.loadToken();
    if (this.token != null && this.token !== '') {
      if(this.jwtHelper.decodeToken(this.token).sub != null || '') {
        if(!this.jwtHelper.isTokenExpired(this.token)) {
          this.loggedUsername = this.jwtHelper.decodeToken(this.token).sub;
          return true;
        }
      }
    } else {
      this.logout();
      return false;
    }
    return false;
  }

}
