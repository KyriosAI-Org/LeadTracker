import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  BarChart3,
  History,
  Trophy,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  PhoneCall,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";

interface SDRLayoutProps {
  children: React.ReactNode;
  userProfile: any;
}

export function SDRLayout({ children, userProfile }: SDRLayoutProps) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const menuItems = [
    {
      label: "Registrar Call",
      icon: PhoneCall,
      path: "/sdr/new",
    },
    {
      label: "Meu Dashboard",
      icon: BarChart3,
      path: "/sdr",
    },
    {
      label: "Histórico",
      icon: History,
      path: "/sdr/history",
    },
    {
      label: "Ranking",
      icon: Trophy,
      path: "/sdr/ranking",
    },
    {
      label: "Perfil",
      icon: User,
      path: "/sdr/profile",
    },
  ];

  return (
    <SidebarProvider>
    <div className="flex h-screen bg-background w-full">
      {/* Sidebar */}
      <Sidebar collapsible="icon" className="border-r">
        <SidebarContent>
          {/* Logo */}
          <div className="flex items-center justify-between px-4 py-6 border-b">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="LeadTrack" className="w-8 h-8" />
              {sidebarOpen && <span className="font-bold text-lg">LeadTrack</span>}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>

          {/* Navigation */}
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      onClick={() => navigate({ to: item.path })}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-4 h-4" />
                        {sidebarOpen && <span>{item.label}</span>}
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center justify-between px-6 py-4">
            <h1 className="text-lg font-semibold text-foreground">
              Bem-vindo, {userProfile?.full_name || "SDR"}
            </h1>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                    {userProfile?.full_name?.[0]?.toUpperCase() || "S"}
                  </div>
                  {userProfile?.full_name && <span>{userProfile.full_name}</span>}
                  <ChevronDown className="w-4 h-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  {userProfile?.email}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/sdr/profile" })}>
                  👤 Perfil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-background/50">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
    </SidebarProvider>
  );
}
