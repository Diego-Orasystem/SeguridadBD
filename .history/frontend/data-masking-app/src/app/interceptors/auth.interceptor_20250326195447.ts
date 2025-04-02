import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private router: Router) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Obtener el token del localStorage
    const token = localStorage.getItem('token');
    
    // Si hay un token, añadirlo al encabezado de autorización
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    // Continuar con la solicitud modificada
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Si recibimos un error 401 (no autorizado) o 403 (prohibido)
        if (error.status === 401 || error.status === 403) {
          // Limpiar datos de sesión
          localStorage.removeItem('token');
          localStorage.removeItem('currentUser');
          
          // Redirigir al login
          this.router.navigate(['/login']);
        }
        
        return throwError(() => error);
      })
    );
  }
} 