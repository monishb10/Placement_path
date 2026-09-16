import {sqliteTable,text,integer,primaryKey,index} from 'drizzle-orm/sqlite-core';
export const studyStates=sqliteTable('study_states',{
  userId:text('user_id').primaryKey(),
  payload:text('payload').notNull(),
  version:integer('version').notNull().default(1),
  updatedAt:text('updated_at').notNull(),
});
export const codingAttempts=sqliteTable('coding_attempts',{
  userId:text('user_id').notNull(),
  taskId:text('task_id').notNull(),
  payload:text('payload').notNull(),
  version:integer('version').notNull().default(1),
  accepted:integer('accepted').notNull().default(0),
  updatedAt:text('updated_at').notNull(),
},table=>[primaryKey({columns:[table.userId,table.taskId]})]);
export const githubConnections=sqliteTable('github_connections',{
  userId:text('user_id').primaryKey(),
  encryptedToken:text('encrypted_token').notNull(),
  repository:text('repository').notNull().default('monishb10/Placement_path'),
  githubId:text('github_id'),
  githubLogin:text('github_login'),
  branch:text('branch').notNull(),
  updatedAt:text('updated_at').notNull(),
  lockId:text('lock_id'),
  lockUntil:integer('lock_until').notNull().default(0),
});
export const githubSaves=sqliteTable('github_saves',{
  userId:text('user_id').notNull(),
  taskId:text('task_id').notNull(),
  repository:text('repository').notNull().default('monishb10/Placement_path'),
  sourceHash:text('source_hash').notNull(),
  blobSha:text('blob_sha').notNull(),
  fileUrl:text('file_url').notNull(),
  commitUrl:text('commit_url'),
  savedAt:text('saved_at').notNull(),
},table=>[primaryKey({columns:[table.userId,table.taskId]})]);
export const codingActivity=sqliteTable('coding_activity',{
  userId:text('user_id').notNull(),
  date:text('date').notNull(),
},table=>[primaryKey({columns:[table.userId,table.date]})]);
export const githubUsers=sqliteTable('github_users',{
  userId:text('user_id').primaryKey(),
  githubId:text('github_id').notNull().unique(),
  login:text('login').notNull(),
  displayName:text('display_name').notNull(),
  createdAt:integer('created_at').notNull(),
  updatedAt:integer('updated_at').notNull(),
});
export const authSessions=sqliteTable('auth_sessions',{
  sessionHash:text('session_hash').primaryKey(),
  userId:text('user_id').notNull(),
  expiresAt:integer('expires_at').notNull(),
},table=>[index('auth_sessions_expiry_idx').on(table.expiresAt)]);
export const oauthStates=sqliteTable('oauth_states',{
  stateHash:text('state_hash').primaryKey(),
  challenge:text('challenge').notNull(),
  expiresAt:integer('expires_at').notNull(),
},table=>[index('oauth_states_expiry_idx').on(table.expiresAt)]);
