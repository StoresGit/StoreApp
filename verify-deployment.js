const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Branch Settings pages...');

// Check what Branch Settings pages exist
const branchSettingsPath = path.join(__dirname, 'frontend', 'src', 'pages', 'BranchSettings');
const pages = fs.readdirSync(branchSettingsPath);

console.log('📁 Branch Settings pages found:');
pages.forEach(page => {
    console.log(`  - ${page}`);
});

// Check App.js for Branch Settings routes
const appJsPath = path.join(__dirname, 'frontend', 'src', 'App.js');
const appJsContent = fs.readFileSync(appJsPath, 'utf8');

// Extract Branch Settings routes from App.js
const branchSettingsRoutes = appJsContent.match(/\/branch-settings\/[^"'\s]+/g) || [];
console.log('\n🛣️  Branch Settings routes in App.js:');
branchSettingsRoutes.forEach(route => {
    console.log(`  - ${route}`);
});

// Check if there are any references to the old pages
const oldPages = ['BranchUnits', 'BranchUsers', 'BranchSection'];
const hasOldPages = oldPages.some(page => appJsContent.includes(page));

if (hasOldPages) {
    console.log('\n⚠️  WARNING: Found references to old Branch Settings pages!');
    oldPages.forEach(page => {
        if (appJsContent.includes(page)) {
            console.log(`  - Found reference to ${page}`);
        }
    });
} else {
    console.log('\n✅ No references to old Branch Settings pages found.');
}

console.log('\n📊 Summary:');
console.log(`  - Files in BranchSettings directory: ${pages.length}`);
console.log(`  - Routes defined in App.js: ${branchSettingsRoutes.length}`);
console.log(`  - Old pages referenced: ${hasOldPages ? 'Yes' : 'No'}`);

if (pages.length === 2 && branchSettingsRoutes.length === 2 && !hasOldPages) {
    console.log('\n✅ Deployment should show only 2 Branch Settings pages.');
} else {
    console.log('\n❌ Deployment might show more than 2 Branch Settings pages.');
} 