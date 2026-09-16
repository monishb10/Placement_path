'use client';
import {createContext, useCallback, useContext} from 'react';
import type {StudyUser} from '@/lib/account-types';

const AccountContext = createContext<StudyUser | null>(null);
export function AccountProvider({user, children}: {user: StudyUser; children: React.ReactNode}) {
  return <AccountContext.Provider value={user}>{children}</AccountContext.Provider>;
}
export function useAccount() {
  const user = useContext(AccountContext);
  if (!user) throw new Error('A study account is required.');
  return user;
}
export function useStudyFetch() {
  const user = useAccount();
  return useCallback((input: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers);
    headers.set('X-Placement-Account', user.userId);
    return fetch(input, {...init, headers, credentials: 'same-origin'});
  }, [user.userId]);
}
