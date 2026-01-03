/**
 * Migration: Add Activity Logs Collection
 * Creates indexes for efficient activity log queries
 */

module.exports = {
  name: '001_add_activity_logs',

  /**
   * Apply migration
   */
  up: async (db) => {
    // Create activity_logs collection with indexes
    const collectionExists = await db
      .listCollections({ name: 'activitylogs' })
      .toArray()
      .then((cols) => cols.length > 0);

    if (!collectionExists) {
      await db.createCollection('activitylogs');
      console.log('    Created activitylogs collection');
    }

    // Create indexes
    const collection = db.collection('activitylogs');

    await collection.createIndex({ userId: 1 }, { background: true });
    await collection.createIndex({ action: 1 }, { background: true });
    await collection.createIndex({ resource: 1, resourceId: 1 }, { background: true });
    await collection.createIndex({ timestamp: -1 }, { background: true });
    await collection.createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 90 * 24 * 60 * 60, background: true }
    );

    console.log('    Created indexes for activitylogs');
  },

  /**
   * Rollback migration
   */
  down: async (db) => {
    await db.collection('activitylogs').drop();
    console.log('    Dropped activitylogs collection');
  },
};
