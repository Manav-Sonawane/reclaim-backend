import dotenv from 'dotenv';
dotenv.config();

// Test Google OAuth setup
console.log('🔍 Testing Google OAuth Configuration\n');

// Check environment variables
console.log('✓ Environment Variables:');
console.log(`  PORT: ${process.env.PORT}`);
console.log(`  MONGO_URI: ${process.env.MONGO_URI ? '✓ Set' : '✗ Missing'}`);
console.log(`  JWT_SECRET: ${process.env.JWT_SECRET ? '✓ Set' : '✗ Missing'}`);
console.log(`  GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? '✓ Set' : '✗ Missing'}`);
console.log(`  CORS_ORIGIN: ${process.env.CORS_ORIGIN}\n`);

// Check dependencies
console.log('✓ Checking Dependencies:');
try {
  await import('google-auth-library');
  console.log('  google-auth-library: ✓ Installed');
} catch (err) {
  console.log('  google-auth-library: ✗ Missing');
}

try {
  await import('express');
  console.log('  express: ✓ Installed');
} catch (err) {
  console.log('  express: ✗ Missing');
}

try {
  await import('jsonwebtoken');
  console.log('  jsonwebtoken: ✓ Installed');
} catch (err) {
  console.log('  jsonwebtoken: ✗ Missing');
}

try {
  await import('mongoose');
  console.log('  mongoose: ✓ Installed\n');
} catch (err) {
  console.log('  mongoose: ✗ Missing\n');
}

// Check auth routes
console.log('✓ Checking Auth Routes:');
try {
  const authController = await import('./src/controllers/authController.js');
  const functions = Object.keys(authController);
  console.log(`  Available functions: ${functions.join(', ')}`);
  
  if (functions.includes('googleAuth')) {
    console.log('  googleAuth endpoint: ✓ Implemented');
  } else {
    console.log('  googleAuth endpoint: ✗ Missing');
  }
} catch (err) {
  console.log(`  Error loading auth controller: ${err.message}`);
}

console.log('\n✓ Checking User Model:');
try {
  const User = (await import('./src/models/user.js')).default;
  const schema = User.schema.obj;
  
  console.log(`  googleId field: ${schema.googleId ? '✓ Present' : '✗ Missing'}`);
  console.log(`  profilePicture field: ${schema.profilePicture ? '✓ Present' : '✗ Missing'}`);
  console.log(`  password required: ${typeof schema.password.required === 'function' ? '✓ Conditional' : '✓ Always'}`);
} catch (err) {
  console.log(`  Error loading user model: ${err.message}`);
}

console.log('\n✅ Configuration Check Complete!');
console.log('\n📝 Next Steps:');
console.log('1. Make sure GOOGLE_CLIENT_ID matches your Google Cloud Console');
console.log('2. Start server: npm run dev');
console.log('3. Test endpoint: POST http://localhost:5001/api/auth/google');
console.log('4. Send body: { "token": "google_id_token" }');
