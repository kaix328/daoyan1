import { CONFIG } from '../config.js';

// 使用CONFIG中的API基础URL，如果没有则使用当前源
const API_BASE = CONFIG.API_BASE_URL || window.location.origin;

export const ScriptDB = {
    async getHistory() {
        try {
            const res = await fetch(`${API_BASE}/api/history`);
            if (!res.ok) throw new Error('Failed to fetch history');
            return await res.json();
        } catch (e) {
            console.error(e);
            return [];
        }
    },

    async saveScript(scriptData) {
        try {
            const res = await fetch(`${API_BASE}/api/scripts/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(scriptData)
            });
            if (!res.ok) throw new Error('Save failed');
            return await res.json();
        } catch (e) {
            console.error(e);
            throw e;
        }
    },

    async toggleFavorite(id) {
        try {
            const res = await fetch(`${API_BASE}/api/scripts/favorite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            if (!res.ok) throw new Error('Toggle failed');
            return await res.json();
        } catch (e) {
            console.error(e);
            throw e;
        }
    },

    async deleteScript(id) {
        try {
            const res = await fetch(`${API_BASE}/api/scripts/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            if (!res.ok) throw new Error('Delete failed');
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    },

    async updateScript(id, updates) {
        try {
            const res = await fetch(`${API_BASE}/api/scripts/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...updates })
            });
            if (!res.ok) throw new Error('Update failed');
            return await res.json();
        } catch (e) {
            console.error('Update script failed:', e);
            throw e;
        }
    },

    async exportDocx(content, filename) {
        try {
            const res = await fetch(`${API_BASE}/api/export/docx`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });
            if (!res.ok) throw new Error('Export failed');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || 'script.docx';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
            throw e;
        }
    }
};
