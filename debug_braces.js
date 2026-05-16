const fs = require('fs');
const f = 'Astro_project/frontend/web/src/components/games/RadioSignal.vue';
const content = fs.readFileSync(f, 'utf8');
const scriptMatch = content.match(/<script setup>([\s\S]*?)<\/script>/);
const script = scriptMatch[1];
const lines = script.split('\n');
let stack = [];
lines.forEach((line, lineIdx) => {
    for (let charIdx = 0; charIdx < line.length; charIdx++) {
        const char = line[charIdx];
        if (char === '{') stack.push({line: lineIdx + 1, char: charIdx + 1});
        if (char === '}') {
            if (stack.length === 0) {
                console.log(`❌ Extra } at script line ${lineIdx + 1}, char ${charIdx + 1}`);
                console.log(`Context: ${line}`);
            } else {
                stack.pop();
            }
        }
    }
});
if (stack.length > 0) {
    stack.forEach(s => console.log(`❌ Unclosed { at script line ${s.line}, char ${s.char}`));
} else {
    console.log(`✅ Script braces are balanced`);
}
