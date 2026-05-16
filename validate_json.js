const fs = require('fs');
const paths = [
    'Astro_project/frontend/web/src/i18n/locales/es.json',
    'Astro_project/frontend/web/src/i18n/locales/ca.json',
    'Astro_project/frontend/web/src/i18n/locales/en.json'
];

paths.forEach(p => {
    try {
        const content = fs.readFileSync(p, 'utf8');
        JSON.parse(content);
        console.log(`✅ ${p} is valid JSON`);
    } catch (e) {
        console.error(`❌ ${p} is INVALID JSON: ${e.message}`);
        // Find position
        const posMatch = e.message.match(/at position (\d+)/);
        if (posMatch) {
            const pos = parseInt(posMatch[1]);
            const content = fs.readFileSync(p, 'utf8');
            const snippet = content.substring(Math.max(0, pos - 50), Math.min(content.length, pos + 50));
            console.error(`Snippet around error:\n...${snippet}...`);
        }
    }
});
