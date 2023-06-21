import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { User } from '../model/user';
import { UserService } from '../service/user.service';
import { NotificationService } from '../service/notification.service';
import { NotificationType } from '../enum/notification-type.enum';
import { HttpErrorResponse } from '@angular/common/http';
import { NgForm } from '@angular/forms';


@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit, OnDestroy {

  private titleSubject = new BehaviorSubject<string>('Users'); //por default users
  private subscriptions: Subscription[] = [];

  public titleAction$ = this.titleSubject.asObservable();
  public users: User[];
  public refreshing: boolean;
  public selectedUser: User;
  public profileImage: File | null;
  public fileName: string | null;
  

  constructor(private userService: UserService, private notificationService: NotificationService) { }

  ngOnInit(): void {
    this.getUsers(true);
  }
  
  public changeTitle(title: string): void {
    this.titleSubject.next(title)
  }

  public getUsers(showNotification: boolean): void {
    this.refreshing = true;
    this.subscriptions.push(
      this.userService.getUsers().subscribe(
        (response: User[]) => {
          this.userService.addUsersToLocalCache(response);
          this.users = response;
          this.refreshing = false;
          if(showNotification) {
            this.sendNotification(NotificationType.SUCCESS, `${response.length} user(s) loeades successfully.`);
          }
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
          this.refreshing = false;
        }
      )
    );
  }

  public onSelectUser(selectUser: User): void {
    this.selectedUser = selectUser;
    document.getElementById('openUserInfo')?.click();
  }

  public onProfileImageChange(event: any): void {
    this.profileImage = event.target.files[0];
    this.fileName = this.profileImage!.name;
    
  }

  public saveNewUser(): void {
    document.getElementById('new-user-save')?.click();
  }

  public onAddNewUser(userForm: NgForm): void {
    console.log(userForm.value);
    const formData = this.userService.createUserFormData(null, userForm.value, this.profileImage!);
    this.subscriptions.push(
      this.userService.addUser(formData).subscribe(
        (response: User) => {
          document.getElementById('new-user-close')?.click();
          this.getUsers(false);
          this.fileName = null;
          this.profileImage = null;
          userForm.reset();
          this.sendNotification(NotificationType.SUCCESS, `${response.firstName} ${response.lastName} created succesfully`);
          }
        ,
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
        }
      )
    )
  }

  private sendNotification(NotificationType: NotificationType, message: string): void {
    if(message) {
      this.notificationService.notify(NotificationType, message);
    } else { //Para errores de servidor apagado y eso, se usa esta parte porque no quermos mostrar contenido sensible
      this.notificationService.notify(NotificationType, 'An error occurred, please try again');
    }
  }
  
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

}
