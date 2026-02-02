-- Agent Marketplace 社区功能数据库迁移 SQL
-- 执行命令: psql 'postgresql://neondb_owner:npg_iQ0Ld4MoEhNS@ep-twilight-bird-ahyj1ipo-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require' < migration.sql

-- 1. Vote 表（多态投票）
CREATE TABLE IF NOT EXISTS "Vote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "value" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "voterId" TEXT NOT NULL,
    "taskId" TEXT,
    "reviewId" TEXT,
    "commentId" TEXT,
    CONSTRAINT "Vote_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "Agent"("id") ON DELETE CASCADE,
    CONSTRAINT "Vote_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE,
    CONSTRAINT "Vote_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "TaskReview"("id") ON DELETE CASCADE,
    CONSTRAINT "Vote_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Vote_voterId_taskId_key" ON "Vote"("voterId", "taskId");
CREATE UNIQUE INDEX IF NOT EXISTS "Vote_voterId_reviewId_key" ON "Vote"("voterId", "reviewId");
CREATE UNIQUE INDEX IF NOT EXISTS "Vote_voterId_commentId_key" ON "Vote"("voterId", "commentId");
CREATE INDEX IF NOT EXISTS "Vote_voterId_idx" ON "Vote"("voterId");
CREATE INDEX IF NOT EXISTS "Vote_taskId_idx" ON "Vote"("taskId");
CREATE INDEX IF NOT EXISTS "Vote_reviewId_idx" ON "Vote"("reviewId");
CREATE INDEX IF NOT EXISTS "Vote_commentId_idx" ON "Vote"("commentId");

-- 2. Comment 表（嵌套评论）
CREATE TABLE IF NOT EXISTS "Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "parentId" TEXT,
    CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Agent"("id") ON DELETE CASCADE,
    CONSTRAINT "Comment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE,
    CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Comment_taskId_idx" ON "Comment"("taskId");
CREATE INDEX IF NOT EXISTS "Comment_authorId_idx" ON "Comment"("authorId");
CREATE INDEX IF NOT EXISTS "Comment_parentId_idx" ON "Comment"("parentId");

-- 3. Follow 表（关注关系）
CREATE TABLE IF NOT EXISTS "Follow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "Agent"("id") ON DELETE CASCADE,
    CONSTRAINT "Follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "Agent"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Follow_followerId_followingId_key" ON "Follow"("followerId", "followingId");
CREATE INDEX IF NOT EXISTS "Follow_followerId_idx" ON "Follow"("followerId");
CREATE INDEX IF NOT EXISTS "Follow_followingId_idx" ON "Follow"("followingId");

-- 4. Skill 表（技能）
CREATE TABLE IF NOT EXISTS "Skill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "slug" TEXT NOT NULL UNIQUE,
    "category" TEXT
);

CREATE INDEX IF NOT EXISTS "Skill_category_idx" ON "Skill"("category");

-- 5. TaskSkill 表（任务-技能关联）
CREATE TABLE IF NOT EXISTS "TaskSkill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    CONSTRAINT "TaskSkill_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE,
    CONSTRAINT "TaskSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "TaskSkill_taskId_skillId_key" ON "TaskSkill"("taskId", "skillId");
CREATE INDEX IF NOT EXISTS "TaskSkill_taskId_idx" ON "TaskSkill"("taskId");
CREATE INDEX IF NOT EXISTS "TaskSkill_skillId_idx" ON "TaskSkill"("skillId");

-- 6. AgentSkill 表（Agent-技能关联）
CREATE TABLE IF NOT EXISTS "AgentSkill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "proficiency" INTEGER DEFAULT 0,
    "agentId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    CONSTRAINT "AgentSkill_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE,
    CONSTRAINT "AgentSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "AgentSkill_agentId_skillId_key" ON "AgentSkill"("agentId", "skillId");
CREATE INDEX IF NOT EXISTS "AgentSkill_agentId_idx" ON "AgentSkill"("agentId");
CREATE INDEX IF NOT EXISTS "AgentSkill_skillId_idx" ON "AgentSkill"("skillId");

-- 7. Seed 初始技能数据
INSERT INTO "Skill" ("id", "name", "slug", "category") VALUES
    ('skill_react', 'React', 'react', 'Frontend'),
    ('skill_nextjs', 'Next.js', 'nextjs', 'Frontend'),
    ('skill_vue', 'Vue.js', 'vue', 'Frontend'),
    ('skill_angular', 'Angular', 'angular', 'Frontend'),
    ('skill_typescript', 'TypeScript', 'typescript', 'Frontend'),
    ('skill_javascript', 'JavaScript', 'javascript', 'Frontend'),
    ('skill_nodejs', 'Node.js', 'nodejs', 'Backend'),
    ('skill_python', 'Python', 'python', 'Backend'),
    ('skill_django', 'Django', 'django', 'Backend'),
    ('skill_flask', 'Flask', 'flask', 'Backend'),
    ('skill_java', 'Java', 'java', 'Backend'),
    ('skill_spring', 'Spring Boot', 'spring', 'Backend'),
    ('skill_golang', 'Go', 'golang', 'Backend'),
    ('skill_rust', 'Rust', 'rust', 'Backend'),
    ('skill_postgresql', 'PostgreSQL', 'postgresql', 'Database'),
    ('skill_mysql', 'MySQL', 'mysql', 'Database'),
    ('skill_mongodb', 'MongoDB', 'mongodb', 'Database'),
    ('skill_redis', 'Redis', 'redis', 'Database'),
    ('skill_docker', 'Docker', 'docker', 'DevOps'),
    ('skill_kubernetes', 'Kubernetes', 'kubernetes', 'DevOps'),
    ('skill_aws', 'AWS', 'aws', 'DevOps'),
    ('skill_gcp', 'Google Cloud', 'gcp', 'DevOps'),
    ('skill_figma', 'Figma', 'figma', 'Design'),
    ('skill_photoshop', 'Photoshop', 'photoshop', 'Design'),
    ('skill_illustrator', 'Illustrator', 'illustrator', 'Design'),
    ('skill_uiux', 'UI/UX Design', 'uiux', 'Design')
ON CONFLICT (slug) DO NOTHING;

-- Migration complete!
-- Next: Run `pnpm prisma generate` to regenerate Prisma Client
