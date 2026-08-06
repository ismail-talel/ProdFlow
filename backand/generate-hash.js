const bcrypt = require('bcryptjs');

async function generateHash() {
    const password = 'SuperAdmin123!';
    const hash = await bcrypt.hash(password, 10);
    console.log('🔑 Mot de passe:', password);
    console.log('📝 Hash généré:');
    console.log(hash);
    console.log('\n📋 Copiez ce hash et mettez-le à jour dans MongoDB');
}

generateHash();