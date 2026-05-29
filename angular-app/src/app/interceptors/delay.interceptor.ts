import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable, of, delay as rxDelay, switchMap, tap } from 'rxjs';

export const delayInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  // Read the `delay` query parameter from the request URL
  const url = new URL(req.url, window.location.origin);
  const delayParam = url.searchParams.get('delay');
  const clientDelay = delayParam ? parseInt(delayParam, 10) : 0;

  const method = req.method;
  const path = url.pathname + url.search;
  const startTime = Date.now();

  console.log(`[VeriShield API] ${method} ${path} — started`);

  return of(null).pipe(
    // Apply client-side delay BEFORE making the request if delay param is present
    rxDelay(clientDelay),
    switchMap(() => next(req)),
    tap({
      next: () => {
        const duration = Date.now() - startTime;
        console.log(
          `[VeriShield API] ${method} ${path} — completed in ${duration}ms (client delay: ${clientDelay}ms)`
        );
      },
      error: (err) => {
        const duration = Date.now() - startTime;
        console.warn(
          `[VeriShield API] ${method} ${path} — failed in ${duration}ms (client delay: ${clientDelay}ms)`,
          err.status
        );
      }
    })
  );
};
