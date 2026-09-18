import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SharedModule } from './shared/shared.module';
import { ProfilePageRoutingModule } from './profile/profile-page-routing.module';
import { NetworkComponent } from './profile/presentation/components/network/network.component';
import { ContactComponent } from './profile/presentation/components/contact/contact.component';
import { ArticleComponent } from './profile/presentation/components/article/article.component';
import { FingerprintComponent } from './profile/presentation/components/fingerprint/fingerprint.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HomePageModule } from './search-engine/presentation/home-page/home-page.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MatTableModule } from '@angular/material/table';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import {
  BrowserAnimationsModule,
  NoopAnimationsModule,
} from '@angular/platform-browser/animations';
import { NgxPaginationModule } from 'ngx-pagination';
import { AboutUsModule } from './search-engine/presentation/about-us/about-us.module';
import { AboutUsRoutingModule } from './search-engine/presentation/about-us/about-us.routing.module';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthModalComponent } from './auth/presentation/auth-modal/auth-modal.component';
import { LoginFormComponent } from './auth/presentation/login-form/login-form.component';
import { RegisterFormComponent } from './auth/presentation/register-form/register-form.component';
import { CompanyRegisterFormComponent } from './auth/presentation/company-register-form/company-register-form.component';
import { RedirectComponent } from './auth/presentation/redirect/redirect.component';
import { AuthInterceptor } from './shared/interceptors/auth.interceptor';
import { MfaCodeInputComponent } from './auth/presentation/mfa-code-input/mfa-code-input.component';
import { MfaEnrollmentFormComponent } from './auth/presentation/mfa-enrollment-form/mfa-enrollment-form.component';
import { MfaVerifyFormComponent } from './auth/presentation/mfa-verify-form/mfa-verify-form.component';
@NgModule({
  declarations: [
    AppComponent,
    NetworkComponent,
    ContactComponent,
    ArticleComponent,
    FingerprintComponent,
    AuthModalComponent,
    LoginFormComponent,
    MfaCodeInputComponent,
    MfaEnrollmentFormComponent,
    MfaVerifyFormComponent,
    RegisterFormComponent,
    CompanyRegisterFormComponent,
    RedirectComponent,
  ],
  imports: [
    AppRoutingModule,
    RouterModule,
    SharedModule,
    ProfilePageRoutingModule,
    FontAwesomeModule,
    HomePageModule,
    NgbModule,
    ReactiveFormsModule,
    HttpClientModule,
    BrowserModule,
    NoopAnimationsModule,
    NgxPaginationModule,
    BrowserAnimationsModule,
    AboutUsModule,
    AboutUsRoutingModule,
    FormsModule,
    MatTableModule,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
