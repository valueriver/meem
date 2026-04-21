import { marked } from 'marked';

marked.setOptions({
    breaks: true,
    gfm: true,
});

export function renderMd(text) {
    if (!text) return '';
    try {
        return marked.parse(String(text));
    } catch {
        return escapeHtml(String(text));
    }
}

function escapeHtml(s) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
