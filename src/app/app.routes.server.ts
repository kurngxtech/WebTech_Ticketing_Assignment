import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Use client-side rendering for all routes to avoid prerendering issues
  {
    path: '**',
    renderMode: RenderMode.Client,
  },
];
