import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { AuthGate } from "@/components/auth/AuthGate";
import { ProfileProvider } from "@/lib/profile-context";

import appCss from "../styles.css?url";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1" },
      { title: "LeadTracker | CRM para Cold Call" },
      { name: "description", content: "Aumente sua conversão em cold calls com o LeadTracker. CRM ultra-rápido para prospecção ativa." },
      { property: "og:title", content: "LeadTracker | CRM para Cold Call" },
      { name: "twitter:title", content: "LeadTracker | CRM para Cold Call" },
      { property: "og:description", content: "CRM ultra-rápido focado em performance para SDRs e Closers." },
      { name: "twitter:description", content: "CRM ultra-rápido focado em performance para SDRs e Closers." },
      { property: "og:type", content: "website" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Toaster position="top-center" />
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ProfileProvider>
        <AuthGate>
          <Outlet />
        </AuthGate>
      </ProfileProvider>
    </QueryClientProvider>
  );
}
