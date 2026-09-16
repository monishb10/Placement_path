'use client';
import {LogOut, GitBranch, LockKeyhole} from 'lucide-react';
import {DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem} from '@/components/ui/dropdown-menu';
import {useAccount} from './account-context';

export function AccountMenu() {
  const user = useAccount();
  const initials = user.displayName.trim().split(/\s+/).slice(0,2).map(n => n[0]).join('').toUpperCase();
  return <DropdownMenu><DropdownMenuTrigger className="header-avatar account-trigger" aria-label={`Account: ${user.displayName}`} title={user.displayName}>{initials || 'U'}</DropdownMenuTrigger><DropdownMenuContent align="end" className="study-account-menu">
    <DropdownMenuLabel><strong>{user.displayName}</strong><span>{user.provider === 'github' ? <GitBranch size={14}/> : <LockKeyhole size={14}/>} {user.githubLogin ? '@' + user.githubLogin : 'Your study account'}</span></DropdownMenuLabel>
    <DropdownMenuSeparator/>
    {user.provider === 'github' ? <form action="/api/auth/logout" method="post"><DropdownMenuItem asChild><button type="submit"><LogOut size={16}/>Sign out</button></DropdownMenuItem></form> : <DropdownMenuItem asChild><a href="/signout-with-chatgpt?return_to=%2F" target="_top"><LogOut size={16}/>Sign out</a></DropdownMenuItem>}
  </DropdownMenuContent></DropdownMenu>;
}
