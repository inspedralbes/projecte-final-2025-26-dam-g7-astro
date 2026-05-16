const fs = require('fs');

const f = 'Astro_project/frontend/web/src/components/games/RadioSignal.vue';
const content = fs.readFileSync(f, 'utf8');

// Check template balance
const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/);
if (templateMatch) {
    const template = templateMatch[1];
    let tags = [];
    const tagRegex = /<(\/?[a-z0-9-]+)/gi;
    let match;
    while ((match = tagRegex.exec(template)) !== null) {
        const tag = match[1];
        if (tag.startsWith('/')) {
            const last = tags.pop();
            if (last !== tag.substring(1)) {
                console.error(`❌ Mismatched tag: expected </${last}>, found <${tag}>`);
            }
        } else {
            // Check if self-closing
            const start = match.index;
            const end = template.indexOf('>', start);
            if (template[end-1] !== '/') {
                tags.push(tag);
            }
        }
    }
    if (tags.length > 0) {
        console.error(`❌ Unclosed tags: ${tags.join(', ')}`);
    } else {
        console.log(`✅ Template tags are balanced`);
    }
}

// Check script balance
const scriptMatch = content.match(/<script setup>([\s\S]*?)<\/script>/);
if (scriptMatch) {
    const script = scriptMatch[1];
    let stack = [];
    for (let i = 0; i < script.length; i++) {
        if (script[i] === '{') stack.push('{');
        if (script[i] === '}') {
            if (stack.length === 0) console.error(`❌ Extra } at script char ${i}`);
            else stack.pop();
        }
    }
    if (stack.length > 0) console.error(`❌ Unclosed { in script: ${stack.length}`);
    else console.log(`✅ Script braces are balanced`);
}
