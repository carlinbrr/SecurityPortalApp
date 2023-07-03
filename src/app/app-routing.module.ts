import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { UserComponent } from './user/user.component';
import { AuthenticationGuard } from './guard/authentication.guard';

const routes: Routes = [
  {path: 'login', component: LoginComponent},
  {path: 'register', component: RegisterComponent},
  {path: 'user/management', component: UserComponent, canActivate: [AuthenticationGuard]},
  {path: '', redirectTo: '/login', pathMatch: 'full'} //redirigir si se da una ruta que no existe, poner al final siempre (sigue orden)
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
