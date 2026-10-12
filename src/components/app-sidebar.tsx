'use client';

import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import { ChronoSimIcon } from './icons';
import {
  Gauge,
  Trophy,
  Settings,
  Gamepad2,
  Map,
  Car,
  Users,
  ChevronDown,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './ui/collapsible';
import { cn } from '@/lib/utils';

const managementLinks = [
  { href: '/dashboard/management/games', label: 'Games', icon: Gamepad2 },
  { href: '/dashboard/management/tracks', label: 'Tracks', icon: Map },
  { href: '/dashboard/management/cars', label: 'Cars', icon: Car },
  { href: '/dashboard/management/pilots', label: 'Pilots', icon: Users },
  { href: '/dashboard/management/teams', label: 'Teams', icon: Shield },
];

export function AppSidebar() {
  const pathname = usePathname();
  const isManagementActive = managementLinks.some(link => pathname.startsWith(link.href));

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
          <ChronoSimIcon className="h-8 w-8 text-primary" />
          <div className="flex flex-col">
            <h2 className="text-lg font-headline font-semibold leading-none text-sidebar-foreground">
              ChronoSim
            </h2>
            <p className="text-xs text-sidebar-foreground/70">Racing Universe</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === '/dashboard'}
              tooltip={{ children: 'Dashboard' }}
            >
              <Link href="/dashboard">
                <Gauge />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith('/dashboard/events')}
              tooltip={{ children: 'Events' }}
            >
              <Link href="/dashboard/events">
                <Trophy />
                <span>Events</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem asChild>
            <Collapsible defaultOpen={isManagementActive}>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  isActive={isManagementActive}
                  className="justify-between"
                  tooltip={{ children: 'Management' }}
                >
                  <div className="flex items-center gap-2">
                    <Settings />
                    <span>Management</span>
                  </div>
                  <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 [&[data-state=open]]:-rotate-180" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {managementLinks.map(link => (
                    <SidebarMenuSubItem key={link.href}>
                      <SidebarMenuSubButton
                        asChild
                        isActive={pathname.startsWith(link.href)}
                      >
                        <Link href={link.href}>
                          <link.icon />
                          <span>{link.label}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}

    