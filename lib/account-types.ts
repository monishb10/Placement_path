export type StudyUser = {
  userId: string;
  displayName: string;
  provider: 'chatgpt' | 'github';
  githubId?: string;
  githubLogin?: string;
};
