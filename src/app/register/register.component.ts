import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from '../service/authentication.service';
import { NotificationService } from '../service/notification.service';
import { User } from '../model/user';
import { Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationType } from '../enum/notification-type.enum';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit, OnDestroy{
  showLoading: boolean;
  private subscriptions: Subscription[] = [];

  constructor(private router: Router, private authenticationService: AuthenticationService, 
    private notifier: NotificationService) { }

  ngOnInit(): void {
    if(this.authenticationService.isUserLoggedIn()) {
      this.router.navigateByUrl('/user/management');
    }
  }

  onRegister(user: User): void {
    this.showLoading = true;
    console.log(user);
    this.subscriptions.push(
      this.authenticationService.register(user).subscribe(
        (response: User) => {
          this.sendNotification(NotificationType.SUCCESS, `A new account was created for ${response.firstName}. 
            Please check your email for password to log in`);
          this.showLoading = false;
        },
        (httpErrorResponse : HttpErrorResponse) => {
          console.log(httpErrorResponse)
          this.sendNotification(NotificationType.ERROR, httpErrorResponse.error.message);
          this.showLoading = false;
        }
      )
    );
  }

  private sendNotification(NotificationType: NotificationType, message: string): void {
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
