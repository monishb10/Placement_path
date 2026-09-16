declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    PLACEMENT_GITHUB_VAULT_KEY?: string;
    PLACEMENT_GITHUB_SETUP_TOKEN?: string;
    PLACEMENT_GITHUB_SETUP_USER_ID?: string;
    PLACEMENT_AUTH_MODE?: string;
    PLACEMENT_PUBLIC_ORIGIN?: string;
    PLACEMENT_GITHUB_CLIENT_ID?: string;
    PLACEMENT_GITHUB_CLIENT_SECRET?: string;
  }
}
