require('dotenv').config();
const mongoose = require('mongoose');
const { User, UserRoles } = require('./models/User');

const usersData = [
    {
        firstName: 'Super',
        lastName: 'Admin',
        email: 'superadmin@example.com',
        password: 'SuperAdmin123!',
        phone: '0612345678',
        role: UserRoles.SUPER_ADMIN
    },
    {
        firstName: 'Admin',
        lastName: 'Magasin',
        email: 'admin@magasin.com',
        password: 'T220499I',
        phone: '0623456789',
        role: UserRoles.ADMIN_MAGASIN
    },
    {
        firstName: 'Responsable',
        lastName: 'Reception',
        email: 'reception@magasin.com',
        password: 'Reception123!',
        phone: '0634567890',
        role: UserRoles.RESPONSABLE_RECEPTION
    },
    {
        firstName: 'Expedition',
        lastName: 'Magasin',
        email: 'expedition@magasin.com',
        password: 'Expedition123!',
        phone: '0645678901',
        role: UserRoles.EXPEDITION_MAGASIN
    }
];

async function seedRoles() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gestion-stock');
        console.log('✅ Connecté à MongoDB');

        for (const userData of usersData) {
            try {
                const existing = await User.findOne({ email: userData.email });
                if (existing) {
                    console.log(`⚠️ ${userData.email} existe déjà (rôle: ${existing.role})`);
                } else {
                    const user = new User(userData);
                    await user.save();
                    console.log(`✅ ${userData.email} créé avec le rôle ${userData.role}`);
                }
            } catch (error) {
                console.error(`❌ Erreur pour ${userData.email}:`, error.message);
            }
        }

        console.log('\n🔑 Comptes créés avec les rôles disponibles :');
        console.log('   📧 superadmin@example.com / 🔐 SuperAdmin123! (super_admin)');
        console.log('   📧 admin@magasin.com / 🔐 Admin123! (admin_magasin)');
        console.log('   📧 reception@magasin.com / 🔐 Reception123! (responsable_reception)');
        console.log('   📧 expedition@magasin.com / 🔐 Expedition123! (expedition_magasin)');

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

seedRoles();