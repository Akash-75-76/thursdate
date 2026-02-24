#!/usr/bin/env node

/**
 * LinkedIn OAuth Production Test Script
 * 
 * This script helps you test if LinkedIn OAuth is properly configured
 * in your production environment.
 * 
 * Usage:
 *   node test-linkedin-oauth-production.js <frontend-url> <backend-url>
 * 
 * Example:
 *   node test-linkedin-oauth-production.js https://thursdate.vercel.app https://sundate-backend.onrender.com
 */

const https = require('https');
const http = require('http');

const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        
        protocol.get(url, { 
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000 
        }, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data,
                    redirected: res.headers.location
                });
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

async function testBackendHealth(backendUrl) {
    log('\n1️⃣  Testing Backend Health...', 'cyan');
    log('-'.repeat(60));
    
    try {
        const result = await fetchUrl(`${backendUrl}/health`);
        
        if (result.statusCode === 200) {
            log('✅ Backend is responding', 'green');
            try {
                const health = JSON.parse(result.body);
                log(`   Status: ${health.status}`, 'cyan');
                log(`   Environment: ${health.environment || 'not reported'}`, 'cyan');
            } catch (e) {
                // Non-JSON response
            }
            return true;
        } else {
            log(`❌ Backend returned status ${result.statusCode}`, 'red');
            return false;
        }
    } catch (error) {
        log(`❌ Backend not accessible: ${error.message}`, 'red');
        return false;
    }
}

async function testLinkedInAuthEndpoint(backendUrl) {
    log('\n2️⃣  Testing LinkedIn Auth Endpoint...', 'cyan');
    log('-'.repeat(60));
    
    try {
        const result = await fetchUrl(`${backendUrl}/auth/linkedin`);
        
        // Should redirect to LinkedIn (302 or 301)
        if (result.statusCode === 302 || result.statusCode === 301) {
            const redirectUrl = result.redirected || result.headers.location;
            
            if (redirectUrl && redirectUrl.includes('linkedin.com/oauth')) {
                log('✅ Auth endpoint redirects to LinkedIn', 'green');
                log(`   Redirect URL: ${redirectUrl.substring(0, 80)}...`, 'cyan');
                
                // Extract and display callback URL from redirect
                const callbackMatch = redirectUrl.match(/redirect_uri=([^&]+)/);
                if (callbackMatch) {
                    const callbackUrl = decodeURIComponent(callbackMatch[1]);
                    log(`   Callback URL: ${callbackUrl}`, 'cyan');
                    
                    // Check if callback uses HTTPS in production
                    if (backendUrl.startsWith('https') && callbackUrl.startsWith('http://')) {
                        log('⚠️  WARNING: Using HTTP callback with HTTPS backend', 'yellow');
                    } else {
                        log('✅ Callback URL protocol matches backend', 'green');
                    }
                }
                
                return true;
            } else {
                log('❌ Redirects but not to LinkedIn OAuth', 'red');
                log(`   Redirects to: ${redirectUrl}`, 'red');
                return false;
            }
        } else if (result.statusCode === 500) {
            log('❌ Server error (500)', 'red');
            log('   Likely cause: Environment variables not set', 'red');
            if (result.body.includes('not configured')) {
                log(`   Error: ${result.body}`, 'red');
            }
            return false;
        } else {
            log(`❌ Unexpected status code: ${result.statusCode}`, 'red');
            return false;
        }
    } catch (error) {
        log(`❌ Auth endpoint not accessible: ${error.message}`, 'red');
        return false;
    }
}

async function testLinkedInCallbackEndpoint(backendUrl) {
    log('\n3️⃣  Testing LinkedIn Callback Endpoint...', 'cyan');
    log('-'.repeat(60));
    
    try {
        // Test without code (should get error redirect)
        const result = await fetchUrl(`${backendUrl}/auth/linkedin/callback`);
        
        if (result.statusCode === 302 || result.statusCode === 301) {
            const redirectUrl = result.redirected || result.headers.location;
            
            if (redirectUrl && redirectUrl.includes('linkedin_no_code')) {
                log('✅ Callback endpoint exists and handles missing code', 'green');
                log(`   Redirects to: ${redirectUrl.substring(0, 80)}...`, 'cyan');
                return true;
            } else if (redirectUrl) {
                log('✅ Callback endpoint exists', 'green');
                log(`   Redirects to: ${redirectUrl.substring(0, 80)}...`, 'cyan');
                return true;
            } else {
                log('⚠️  Callback endpoint responds but doesn\'t redirect', 'yellow');
                return false;
            }
        } else if (result.statusCode === 500) {
            log('❌ Server error on callback', 'red');
            log('   Likely cause: Missing environment variables', 'red');
            return false;
        } else {
            log(`⚠️  Unexpected response: ${result.statusCode}`, 'yellow');
            return false;
        }
    } catch (error) {
        log(`❌ Callback endpoint not accessible: ${error.message}`, 'red');
        return false;
    }
}

async function testFrontend(frontendUrl) {
    log('\n4️⃣  Testing Frontend...', 'cyan');
    log('-'.repeat(60));
    
    try {
        const result = await fetchUrl(frontendUrl);
        
        if (result.statusCode === 200) {
            log('✅ Frontend is accessible', 'green');
            
            // Check if it's a SPA (should load React/Vite)
            if (result.body.includes('type="module"') || result.body.includes('vite')) {
                log('✅ Vite app detected', 'green');
            } else if (result.body.includes('react')) {
                log('✅ React app detected', 'green');
            }
            
            return true;
        } else {
            log(`❌ Frontend not accessible: ${result.statusCode}`, 'red');
            return false;
        }
    } catch (error) {
        log(`❌ Frontend error: ${error.message}`, 'red');
        return false;
    }
}

async function main() {
    const args = process.argv.slice(2);
    
    log('\n' + '='.repeat(60), 'blue');
    log('🔍 LinkedIn OAuth Production Test', 'blue');
    log('='.repeat(60), 'blue');
    
    let frontendUrl, backendUrl;
    
    if (args.length >= 2) {
        frontendUrl = args[0];
        backendUrl = args[1];
    } else {
        // Use defaults from environment or hardcoded production URLs
        frontendUrl = process.env.FRONTEND_URL || 'https://thursdate.vercel.app';
        backendUrl = process.env.BACKEND_URL || 'https://sundate-backend.onrender.com';
        
        log('\n⚠️  No URLs provided, using defaults:', 'yellow');
    }
    
    log(`\nTesting URLs:`, 'cyan');
    log(`  Frontend: ${frontendUrl}`, 'cyan');
    log(`  Backend:  ${backendUrl}`, 'cyan');
    
    // Run tests
    const results = {
        backendHealth: await testBackendHealth(backendUrl),
        linkedInAuth: await testLinkedInAuthEndpoint(backendUrl),
        linkedInCallback: await testLinkedInCallbackEndpoint(backendUrl),
        frontend: await testFrontend(frontendUrl)
    };
    
    // Summary
    log('\n' + '='.repeat(60), 'blue');
    log('📊 Test Results', 'blue');
    log('='.repeat(60), 'blue');
    
    const passed = Object.values(results).filter(Boolean).length;
    const total = Object.keys(results).length;
    
    Object.entries(results).forEach(([test, result]) => {
        const status = result ? '✅ PASS' : '❌ FAIL';
        const color = result ? 'green' : 'red';
        log(`${status} - ${test}`, color);
    });
    
    log('');
    log(`Passed: ${passed}/${total}`, passed === total ? 'green' : 'yellow');
    
    if (passed === total) {
        log('\n🎉 All tests passed! LinkedIn OAuth should work.', 'green');
        log('\n💡 Next Steps:', 'cyan');
        log('   1. Test manually: Click "Verify with LinkedIn" in your app', 'cyan');
        log('   2. Check browser console for any errors', 'cyan');
        log('   3. Verify user is redirected back after LinkedIn approval', 'cyan');
    } else {
        log('\n⚠️  Some tests failed. Review the errors above.', 'yellow');
        log('\n💡 Common Fixes:', 'cyan');
        log('   1. Make sure environment variables are set in Render Dashboard', 'cyan');
        log('   2. Redeploy backend after setting variables', 'cyan');
        log('   3. Check LinkedIn Developer Console for registered callback URLs', 'cyan');
        log('   4. Verify URLs are correct (https vs http)', 'cyan');
    }
    
    log('');
    
    process.exit(passed === total ? 0 : 1);
}

// Handle errors
process.on('unhandledRejection', (error) => {
    log(`\n❌ Unhandled error: ${error.message}`, 'red');
    process.exit(1);
});

// Run tests
main();
