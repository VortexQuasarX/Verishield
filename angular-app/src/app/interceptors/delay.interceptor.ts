import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable, of, delay as rxDelay, switchMap } from 'rxjs';

export const delayInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const url = new URL(req.url, window.location.origin);
  const delayParam = url.searchParams.get('delay');
  const clientDelay = delayParam ? parseInt(delayParam, 10) : 0;

  if (clientDelay <= 0) {
    return next(req);
  }

  return of(null).pipe(
    rxDelay(clientDelay),
    switchMap(() => next(req))
  );
};
