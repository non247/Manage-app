import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withViewTransitions } from '@angular/router';
import { definePreset, palette } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';

const MyPreset = definePreset(Aura, {
  semantic: {
    primary: palette('{pink}'),
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withViewTransitions()),
    provideAnimations(),
    provideClientHydration(),

    // ✅ แก้ตรงนี้
    provideHttpClient(withFetch()),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: MyPreset,
        options: {
          darkModeSelector: 'none',
        },
      },
    }),
  ],
};
