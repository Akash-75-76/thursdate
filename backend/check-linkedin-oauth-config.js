/**
 * Production Readiness Check for LinkedIn OAuth
 * 
 * Run this script to verify all environment variables are correctly configured
 * before deploying to production.
 * 
 * Usage:
 *   node check-linkedin-oauth-config.js
 */

require('dotenv').config();

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

const checkmark = '✅';
const crossmark = '❌';
const warning = '⚠️';

let errorCount = 0;
let warningCount = 0;

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
    errorCount++;
    log(`${crossmark} ${message}`, 'red');
}

function success(message) {
    log(`${checkmark} ${message}`, 'green');
}

function warn(message) {
    warningCount++;
    log(`${warning} ${message}`, 'yellow');
}

function info(message) {
    log(`${message}`, 'cyan');
}

function checkEnvVar(name, required = true, validator = null) {
    const value = process.env[name];
    
    if (!value) {
        if (required) {
            error(`${name} is not set`);
            return false;
        } else {
            warn(`${name} is not set (optional)`);
            return false;
        }
    }
    
    if (validator) {
        const validationResult = validator(value);
        if (validationResult !== true) {
            error(`${name} is invalid: ${validationResult}`);
            return false;
        }
    }
    
    success(`${name} is set`);
    return true;
}

console.log('\n' + '='.repeat(60));
log('🔍 LinkedIn OAuth Configuration Check', 'blue');
console.log('='.repeat(60) + '\n');

// Check Node environment
info(`Environment: ${process.env.NODE_ENV || 'development'}`);
info(`Port: ${process.env.PORT || 5000}\n`);

// Section 1: LinkedIn OAuth Configuration
log('📱 LinkedIn OAuth Credentials:', 'yellow');
console.log('-'.repeat(60));

checkEnvVar('LINKEDIN_CLIENT_ID', true, (value) => {
    if (value === 'your-linkedin-client-id') {
        return 'Still using placeholder value';
    }
    if (value.length < 10) {
        return 'Client ID seems too short';
    }
    return true;
});

checkEnvVar('LINKEDIN_CLIENT_SECRET', true, (value) => {
    if (value === 'your-linkedin-client-secret') {
        return 'Still using placeholder value';
    }
    if (value.length < 10) {
        return 'Client Secret seems too short';
    }
    return true;
});

checkEnvVar('LINKEDIN_CALLBACK_URL', true, (value) => {
    if (value === 'http://localhost:5000/auth/linkedin/callback') {
        warn('Using localhost callback URL - make sure this is correct for your environment');
    }
    if (!value.startsWith('http://') && !value.startsWith('https://')) {
        return 'Must start with http:// or https://';
    }
    if (!value.includes('/auth/linkedin/callback')) {
        return 'Should end with /auth/linkedin/callback';
    }
    if (process.env.NODE_ENV === 'production' && value.startsWith('http://')) {
        warn('Production should use HTTPS, not HTTP');
    }
    return true;
});

console.log('');

// Section 2: Frontend Configuration
log('🎨 Frontend Configuration:', 'yellow');
console.log('-'.repeat(60));

checkEnvVar('FRONTEND_URL', true, (value) => {
    if (value === 'http://localhost:5173') {
        warn('Using localhost frontend URL - make sure this is correct for your environment');
    }
    if (!value.startsWith('http://') && !value.startsWith('https://')) {
        return 'Must start with http:// or https://';
    }
    if (process.env.NODE_ENV === 'production' && value.startsWith('http://')) {
        warn('Production should use HTTPS, not HTTP');
    }
    return true;
});

console.log('');

// Section 3: Other Required Configuration
log('🔧 Other Required Configuration:', 'yellow');
console.log('-'.repeat(60));

checkEnvVar('JWT_SECRET', true, (value) => {
    if (value === 'your-super-secret-jwt-key' || value === 'your-secret-key') {
        return 'Still using placeholder/default value - SECURITY RISK!';
    }
    if (value.length < 32) {
        warn('JWT_SECRET should be at least 32 characters for security');
    }
    return true;
});

checkEnvVar('DB_HOST', true);
checkEnvVar('DB_USER', true);
checkEnvVar('DB_PASSWORD', true);
checkEnvVar('DB_NAME', true);

console.log('');

// Section 4: Optional but Recommended
log('📦 Optional Configuration:', 'yellow');
console.log('-'.repeat(60));

checkEnvVar('CLOUDINARY_CLOUD_NAME', false);
checkEnvVar('CLOUDINARY_API_KEY', false);
checkEnvVar('CLOUDINARY_API_SECRET', false);
checkEnvVar('SENDGRID_API_KEY', false);

console.log('');

// Section 5: URL Consistency Check
log('🔗 URL Consistency Check:', 'yellow');
console.log('-'.repeat(60));

const callbackUrl = process.env.LINKEDIN_CALLBACK_URL;
const frontendUrl = process.env.FRONTEND_URL;

if (callbackUrl && frontendUrl) {
    const callbackIsHttps = callbackUrl.startsWith('https://');
    const frontendIsHttps = frontendUrl.startsWith('https://');
    
    if (callbackIsHttps !== frontendIsHttps) {
        warn('Callback URL and Frontend URL use different protocols (HTTP vs HTTPS)');
    } else {
        success('Callback and Frontend URLs use consistent protocols');
    }
    
    // Extract domains for comparison (basic check)
    const callbackDomain = callbackUrl.split('/')[2];
    const frontendDomain = frontendUrl.split('/')[2];
    
    if (callbackDomain && frontendDomain) {
        info(`  Backend domain: ${callbackDomain}`);
        info(`  Frontend domain: ${frontendDomain}`);
    }
}

console.log('');

// Final Summary
console.log('='.repeat(60));
log('📊 Summary:', 'blue');
console.log('='.repeat(60));

if (errorCount === 0 && warningCount === 0) {
    success('All checks passed! ✨ Configuration looks good.');
} else {
    if (errorCount > 0) {
        error(`Found ${errorCount} error(s) that must be fixed.`);
    }
    if (warningCount > 0) {
        warn(`Found ${warningCount} warning(s) that should be reviewed.`);
    }
}

console.log('');

// Deployment Platform Reminders
if (process.env.NODE_ENV === 'production' || errorCount > 0 || warningCount > 0) {
    log('💡 Important Reminders:', 'cyan');
    console.log('-'.repeat(60));
    console.log('1. Environment variables must be set in your deployment platform:');
    console.log('   - Render.com: Dashboard → Environment tab');
    console.log('   - Vercel: Dashboard → Settings → Environment Variables');
    console.log('');
    console.log('2. LinkedIn Developer Console must have callback URL registered:');
    console.log('   - Go to: https://www.linkedin.com/developers/apps');
    console.log('   - Auth tab → Redirect URLs');
    console.log(`   - Add: ${callbackUrl || 'your-callback-url'}`);
    console.log('');
    console.log('3. After setting environment variables:');
    console.log('   - Redeploy your application');
    console.log('   - Variables need a restart to take effect');
    console.log('');
}

// Exit code
if (errorCount > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
