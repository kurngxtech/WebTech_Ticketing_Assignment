/**
 * Database Migration System
 * Tracks and applies schema changes in a controlled manner
 */

const mongoose = require('mongoose');

// Migration record schema
const migrationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  appliedAt: {
    type: Date,
    default: Date.now,
  },
  checksum: {
    type: String,
    required: true,
  },
});

const Migration = mongoose.model('Migration', migrationSchema);

/**
 * Calculate simple checksum for migration content
 */
const calculateChecksum = (content) => {
  let hash = 0;
  const str = JSON.stringify(content);
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
};

/**
 * Get all migration files
 */
const getMigrationFiles = () => {
  const fs = require('fs');
  const path = require('path');
  const migrationsDir = path.join(__dirname);

  const files = fs.readdirSync(migrationsDir);
  return files
    .filter((f) => f.match(/^\d{3}_.*\.js$/) && f !== 'index.js')
    .sort()
    .map((f) => ({
      name: f.replace('.js', ''),
      path: path.join(migrationsDir, f),
    }));
};

/**
 * Get applied migrations
 */
const getAppliedMigrations = async () => {
  return Migration.find().sort({ name: 1 });
};

/**
 * Run pending migrations
 */
const runMigrations = async () => {
  console.log('\n📦 Running database migrations...\n');

  const files = getMigrationFiles();
  const applied = await getAppliedMigrations();
  const appliedNames = applied.map((m) => m.name);

  let migrationsRun = 0;

  for (const file of files) {
    if (appliedNames.includes(file.name)) {
      console.log(`  ⏭️  ${file.name} (already applied)`);
      continue;
    }

    try {
      console.log(`  ⏳ Running ${file.name}...`);
      const migration = require(file.path);

      // Run the migration
      await migration.up(mongoose.connection.db);

      // Record the migration
      await Migration.create({
        name: file.name,
        checksum: calculateChecksum(migration),
      });

      console.log(`  ✅ ${file.name} applied successfully`);
      migrationsRun++;
    } catch (error) {
      console.error(`  ❌ ${file.name} failed:`, error.message);
      throw error;
    }
  }

  if (migrationsRun === 0) {
    console.log('  ✨ All migrations are up to date\n');
  } else {
    console.log(`\n  ✅ ${migrationsRun} migration(s) applied\n`);
  }

  return migrationsRun;
};

/**
 * Rollback last migration
 */
const rollbackMigration = async () => {
  console.log('\n📦 Rolling back last migration...\n');

  const applied = await getAppliedMigrations();
  if (applied.length === 0) {
    console.log('  ⚠️  No migrations to rollback\n');
    return false;
  }

  const lastMigration = applied[applied.length - 1];
  const files = getMigrationFiles();
  const file = files.find((f) => f.name === lastMigration.name);

  if (!file) {
    console.error(`  ❌ Migration file not found: ${lastMigration.name}`);
    return false;
  }

  try {
    console.log(`  ⏳ Rolling back ${lastMigration.name}...`);
    const migration = require(file.path);

    if (typeof migration.down !== 'function') {
      console.log(`  ⚠️  No rollback function defined for ${lastMigration.name}`);
      return false;
    }

    await migration.down(mongoose.connection.db);
    await Migration.deleteOne({ name: lastMigration.name });

    console.log(`  ✅ ${lastMigration.name} rolled back successfully\n`);
    return true;
  } catch (error) {
    console.error(`  ❌ Rollback failed:`, error.message);
    throw error;
  }
};

/**
 * Show migration status
 */
const getMigrationStatus = async () => {
  const files = getMigrationFiles();
  const applied = await getAppliedMigrations();
  const appliedNames = applied.map((m) => m.name);

  return files.map((file) => {
    const isApplied = appliedNames.includes(file.name);
    const appliedMigration = applied.find((m) => m.name === file.name);

    return {
      name: file.name,
      status: isApplied ? 'applied' : 'pending',
      appliedAt: appliedMigration?.appliedAt || null,
    };
  });
};

module.exports = {
  runMigrations,
  rollbackMigration,
  getMigrationStatus,
  Migration,
};
