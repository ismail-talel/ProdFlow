require('dotenv').config();
const mongoose = require('mongoose');

async function migrateRoles() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gestion-stock');
  console.log('Connecte a MongoDB');

  const users = mongoose.connection.db.collection('users');

  const migrations = [
    { old: 'superAdmin',  newRole: 'super_admin' },
    { old: 'adminMagasin', newRole: 'admin_magasin' },
    { old: 'admin',       newRole: 'admin_magasin' },
    { old: 'Admin',       newRole: 'admin_magasin' },
    { old: 'reception',   newRole: 'responsable_reception' },
    { old: 'Reception',   newRole: 'responsable_reception' },
    { old: 'expedition',  newRole: 'expedition_magasin' },
    { old: 'Expedition',  newRole: 'expedition_magasin' }
  ];

  for (const m of migrations) {
    const update = { $set: { role: m.newRole } };
    const result = await users.updateMany({ role: m.old }, update);
    if (result.modifiedCount > 0)
      console.log('Migre ' + result.modifiedCount + ' user(s): ' + m.old + ' -> ' + m.newRole);
  }

  const allUsers = await users.find({}, { projection: { email: 1, role: 1 } }).toArray();
  console.log('\nEtat final des utilisateurs:');
  allUsers.forEach(u => console.log(' -', u.email, '|', u.role));

  await mongoose.disconnect();
  console.log('\nTermine!');
}

migrateRoles().catch(console.error);
