'use client';
import {LogOut, GitBranch, RefreshCw} from 'lucide-react';
import {DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem} from '@/components/ui/dropdown-menu';
import {useAccount} from './account-context';

export function AccountMenu() {
  const user = useAccount();
  const name = user.displayName || user.githubLogin || 'GitHub User';
  const initials = name.trim().split(/\s+/).slice(0,2).map(n => n[0]).join('').toUpperCase();
  return <DropdownMenu><DropdownMenuTrigger className="header-avatar account-trigger" aria-label={`Account: ${name}`} title={name}>{initials || 'GH'}</DropdownMenuTrigger><DropdownMenuContent align="end" className="study-account-menu">
    <DropdownMenuLabel><strong>{name}</strong><span><GitBranch size={14}/> @{user.githubLogin || name}</span></DropdownMenuLabel>
    <DropdownMenuSeparator/>
    <form action="/api/auth/logout" method="post"><DropdownMenuItem asChild><button type="submit"><RefreshCw size={15}/>Switch account</button></DropdownMenuItem></form>
    <form action="/api/auth/logout" method="post"><DropdownMenuItem asChild><button type="submit"><LogOut size={15}/>Sign out</button></DropdownMenuItem></form>
  </DropdownMenuContent></DropdownMenu>;
}
