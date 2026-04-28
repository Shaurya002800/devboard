const db = require('./index')

async function migrate() {
  await db.query(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      bio TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      poster_id UUID REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      tech_stack TEXT[] DEFAULT '{}',
      budget INTEGER CHECK (budget >= 0),
      deadline DATE,
      status TEXT DEFAULT 'open',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS applications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
      applicant_id UUID REFERENCES users(id) ON DELETE CASCADE,
      pitch TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(project_id, applicant_id)
    );

    CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_projects_budget ON projects (budget);
    CREATE INDEX IF NOT EXISTS idx_projects_tech_stack ON projects USING GIN (tech_stack);
    CREATE INDEX IF NOT EXISTS idx_applications_project_id ON applications (project_id);
    CREATE INDEX IF NOT EXISTS idx_applications_applicant_id ON applications (applicant_id);
  `)
  console.log('Migration complete')
  process.exit()
}

migrate().catch(console.error)
