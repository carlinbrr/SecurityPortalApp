import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from '../service/authentication.service';
import { NotificationService } from '../service/notification.service';
import { User } from '../model/user';
import { Subscription } from 'rxjs';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { NotificationType } from '../enum/notification-type.enum';
import { HeaderType } from '../enum/header-type.enum';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy{
  showLoading: boolean; //Public by default
  private subscriptions: Subscription[] = [];

  constructor(private router: Router, private authenticationService: AuthenticationService, 
    private notifier: NotificationService) { }

  ngOnInit(): void {
    if(this.authenticationService.isUserLoggedIn()) {
      this.router.navigateByUrl('/user/management');
    } else {
      this.router.navigateByUrl('/login');
    }
  }

  onLogin(user: User): void {
    this.showLoading = true;
    console.log(user);
    this.subscriptions.push(
      this.authenticationService.login(user).subscribe(
        (response: HttpResponse<User>) => {
          const token = response.headers.get(HeaderType.JWT_TOKEN);
          this.authenticationService.saveToken(token!);
          this.authenticationService.addUserToLocalCache(response.body!);
          this.router.navigateByUrl('/user/management');
          this.showLoading = false;
        },
        (httpErrorResponse : HttpErrorResponse) => {
          console.log(httpErrorResponse)
          this.sendErrorNotification(NotificationType.ERROR, httpErrorResponse.error.message);
          this.showLoading = false;
        }
      )
    );
  }

  private sendErrorNotification(NotificationType: NotificationType, message: string): void {
    if(message) {
      this.notifier.notify(NotificationType, message);
    } else { //Para errores de servidor apagado y eso, se usa esta parte porque no quermos mostrar contenido sensible
      this.notifier.notify(NotificationType, 'An error occures, please try again');
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

}
