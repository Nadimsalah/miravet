
import fs from 'fs';

const content = fs.readFileSync('c:/Users/dell/Desktop/Miravte/components/language-provider.tsx', 'utf8');
const lines = content.split('\n');

const keys = {};
let currentLang = '';

lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.includes('fr: {')) currentLang = 'fr';
    if (trimmed.includes('en: {')) currentLang = 'en';
    if (trimmed.includes('ar: {')) currentLang = 'ar';
    
    const match = trimmed.match(/^"([^"]+)":/);
    if (match && currentLang) {
        const key = match[1];
        const fullKey = `${currentLang}.${key}`;
        if (keys[fullKey]) {
            console.log(`Duplicate key found: ${fullKey} at lines ${keys[fullKey]} and ${index + 1}`);
        }
        keys[fullKey] = index + 1;
    }
});
