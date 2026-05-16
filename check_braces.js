const fs = require('fs');

const files = [
    'Astro_project/frontend/web/src/components/games/RadarScan.vue',
    'Astro_project/frontend/web/src/components/games/RadioSignal.vue',
    'Astro_project/frontend/web/src/components/games/RhymeSquad.vue',
    'Astro_project/frontend/web/src/components/games/SpelledRosco.vue',
    'Astro_project/frontend/web/src/components/games/SyllableQuest.vue',
    'Astro_project/frontend/web/src/components/games/SymmetryBreaker.vue',
    'Astro_project/frontend/web/src/components/games/WordConstruction.vue'
];

files.forEach(f => {
    try {
        const content = fs.readFileSync(f, 'utf8');
        const scriptMatch = content.match(/<script setup>([\s\S]*?)<\/script>/);
        if (!scriptMatch) return;
        const script = scriptMatch[1];
        
        let stack = [];
        let inString = null;
        let escaped = false;
        
        for (let i = 0; i < script.length; i++) {
            const char = script[i];
            if (escaped) { escaped = false; continue; }
            if (char === '\\') { escaped = true; continue; }
            
            if (inString) {
                if (char === inString) inString = null;
                continue;
            }
            
            if (char === '"' || char === "'" || char === '`') {
                inString = char;
                continue;
            }
            
            if (char === '{') stack.push('{');
            if (char === '}') {
                if (stack.length === 0) {
                    console.error(`❌ ${f}: Extra closing brace at char ${i}`);
                    console.error(script.substring(i-50, i+50));
                } else {
                    stack.pop();
                }
            }
        }
        
        if (stack.length > 0) {
            console.error(`❌ ${f}: Unclosed braces: ${stack.length}`);
        } else {
            console.log(`✅ ${f}: Braces are balanced`);
        }
    } catch (e) {
        console.error(`Error processing ${f}: ${e.message}`);
    }
});
