export const GITHUB_REPOSITORY = 'monishb10/Placement_path';
export const GITHUB_REPOSITORY_URL = `https://github.com/${GITHUB_REPOSITORY}`;
export type GitHubSave = {
  status: 'saved' | 'error' | 'busy' | 'not_accepted' | 'disconnected';
  repository?: string; sourceHash?: string; fileUrl?: string; commitUrl?: string; savedAt?: string; message?: string;
};
export type GitHubConnection = {
  configured: boolean; connected: boolean; branch?: string; repository: string; githubLogin?: string; suggestedRepository?: string; save?: GitHubSave; setupError?: string;
};
