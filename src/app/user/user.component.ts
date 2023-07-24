import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { User } from '../model/user';
import { UserService } from '../service/user.service';
import { NotificationService } from '../service/notification.service';
import { NotificationType } from '../enum/notification-type.enum';
import { HttpErrorResponse, HttpEvent, HttpEventType } from '@angular/common/http';
import { NgForm } from '@angular/forms';
import { CustomHttpResponse } from '../model/custom-http-response';
import { AuthenticationService } from '../service/authentication.service';
import { Router } from '@angular/router';
import { FileUploadStatus } from '../model/file-upload.status';


@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit, OnDestroy {

  private titleSubject = new BehaviorSubject<string>('Users'); //por default users
  private subscriptions: Subscription[] = [];
  private currentUsername: string;

  public user: User;
  public titleAction$ = this.titleSubject.asObservable();
  public users: User[];
  public refreshing: boolean;
  public selectedUser: User;
  public profileImage: File | null;
  public fileName: string | null;
  public editUser = new User();
  public fileStatus = new FileUploadStatus();

  constructor(private router: Router, private authenticationService: AuthenticationService, private userService: UserService, private notificationService: NotificationService) { }

  ngOnInit(): void {
    this.user = this.authenticationService.getUserFromLocalCache();
    this.getUsers(false);
    this.sendNotification(NotificationType.SUCCESS, `Log in successfull`);
    this.refreshing = false;
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
    this.clickButton('openUserInfo');
  }

  public onProfileImageChange(event: any): void {
    this.profileImage = event.target.files[0];
    this.fileName = this.profileImage!.name;
  }

  public saveNewUser(): void {
    this.clickButton('new-user-save');
  }

  public onAddNewUser(userForm: NgForm): void {
    console.log(userForm.value);
    const formData = this.userService.createUserFormData(null, userForm.value, this.profileImage!);
    this.subscriptions.push(
      this.userService.addUser(formData).subscribe(
        (response: User) => {
          this.clickButton('new-user-close');
          this.getUsers(false);
          this.fileName = null;
          this.profileImage = null;
          userForm.reset();
          this.sendNotification(NotificationType.SUCCESS, `${response.firstName} ${response.lastName} created succesfully`);
          }
        ,
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
          this.profileImage = null;
        }
      )
    )
  }

  public onUpdateUser(): void {
    console.log(this.editUser);
    const formData = this.userService.createUserFormData(this.currentUsername, this.editUser, this.profileImage!);
    this.subscriptions.push(
      this.userService.updateUser(formData).subscribe(
        (response: User) => {
          this.clickButton('closeEditUserModalButton');
          this.getUsers(false);
          this.fileName = null;
          this.profileImage = null;
          this.sendNotification(NotificationType.SUCCESS, `${response.firstName} ${response.lastName} updated succesfully`);
          }
        ,
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
          this.profileImage = null;
        }
      )
    )
  }

  public searchUsers(searchTerm: string): void {
    const results: User[] = [];
    for (const user of this.userService.getUsersFromLocalCache()!) {
      if(user.firstName.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1 || 
          user.lastName.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1 ||
            user.username.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1 ||
              user.userId.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1 || 
                user.email.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1) {
                results.push(user);
      }
    }
    this.users = results;
    if(!searchTerm) {
      this.users = this.userService.getUsersFromLocalCache()!;
    }
  }

  public onEditUser(editUser: User): void {
    this.editUser = editUser;
    this.currentUsername = editUser.username;
    this.clickButton('openUserEdit');
  }

  public onDeleteUser(username: string): void {
    this.subscriptions.push(
      this.userService.deleteUser(username).subscribe(
        (response: CustomHttpResponse) => {
          this.sendNotification(NotificationType.SUCCESS, response.message);
          this.getUsers(true);
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
        }
      )
    );
  }

  public onResetPassword(emailFrom: NgForm): void {
    this.refreshing = true;
    const emailAddress = emailFrom.value['reset-password-email'];
    this.subscriptions.push(
      this.userService.resetPassword(emailAddress).subscribe(
        (response: CustomHttpResponse) => {
          this.sendNotification(NotificationType.SUCCESS, response.message);
          this.refreshing = false;
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.WARNING, errorResponse.error.message);
          this.refreshing = false;
        },
        () => emailFrom.reset() //siempre se ejecuta, como un finally
      )
    );
  }

  public onUpdateCurrentUser(user: User): void {
    this.refreshing = true;
    this.currentUsername = this.authenticationService.getUserFromLocalCache().username;
    const formData = this.userService.createUserFormData(this.currentUsername, user, this.profileImage!);
    this.subscriptions.push(
      this.userService.updateUser(formData).subscribe(
        (response: User) => {
          this.authenticationService.addUserToLocalCache(response);
          this.getUsers(false);
          this.fileName = null;
          this.profileImage = null;
          this.refreshing = false;
          this.sendNotification(NotificationType.SUCCESS, `${response.firstName} ${response.lastName} updated succesfully`);
          }
        ,
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
          this.refreshing = false;
          this.profileImage = null;
        }
      )
    );
  }

  public onUpdateProfileImage():void {
    const formData = new FormData();
    formData.append('username', this.user.username);
    formData.append('profileImage', this.profileImage!);
    this.subscriptions.push(
      this.userService.updateProfileImage(formData).subscribe(
        (event: HttpEvent<any>) => {
          this.reportUploadProgress(event);
          }
        ,
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
          this.fileStatus.status = 'done';
        }
      )
    );
  }

  private reportUploadProgress(event: HttpEvent<any>):void {
    switch (event.type)  {
      case HttpEventType.UploadProgress: 
        this.fileStatus.percentage = Math.round(100 * event.loaded / event.total!);
        this.fileStatus.status = 'progress';
        break;
      case HttpEventType.Response:
        if(event.status === 200) {
          this.user.profileImgUrl = `${event.body.profileImgUrl}?time=${new Date().getTime()}`;
          this.sendNotification(NotificationType.SUCCESS, `${event.body.firstName} profile image updated sueccessfully`);
        }else{
          this.sendNotification(NotificationType.SUCCESS, `Unable to upload image. Please try again`);
        }
        this.fileStatus.status = 'done';
        break;
      default:
    }
  }

  public updateProfileImage(): void {
    this.clickButton('profile-image-input');
  }

  public onLogout(): void {
    this.authenticationService.logout();
    this.router.navigateByUrl('/login');
    this.sendNotification(NotificationType.SUCCESS, 'You have been successfully logged out');
  }

  private sendNotification(NotificationType: NotificationType, message: string): void {
    if(message) {
      this.notificationService.notify(NotificationType, message);
    } else { //Para errores de servidor apagado y eso, se usa esta parte porque no quermos mostrar contenido sensible
      this.notificationService.notify(NotificationType, 'An error occurred, please try again');
    }
  }

  private clickButton(buttonId: string): void {
    document.getElementById(buttonId)?.click();
  }
  
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

}
