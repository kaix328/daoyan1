const DB_NAME = 'StoryboardDirectorDB';
const DB_VERSION = 2; // Incremented version to force upgrade check if needed, though mostly for clean state ensure
const STORE_NAME = 'analysis_history';

let db = null;
let initPromise = null;

export async function initDB() {
    if (db) return db;
    if (initPromise) return initPromise;

    initPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('Database error:', event.target.error);
            initPromise = null;
            reject(event.target.error);
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('IndexedDB initialization successful');
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            console.log('IndexedDB upgrade needed');
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                objectStore.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };

        request.onblocked = (event) => {
            console.warn('IndexedDB blocked', event);
        };
    });

    return initPromise;
}

export async function saveAnalysis(data) {
    try {
        if (!db) await initDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            const record = {
                ...data,
                timestamp: new Date().toISOString()
            };

            const request = store.put(record); // Use put instead of add to support updates

            request.onsuccess = () => {
                console.log('Analysis saved to history successfully');
                resolve(request.result);
            };

            request.onerror = (event) => {
                console.error('Error saving execution:', event.target.error);
                reject(event.target.error);
            };
        });
    } catch (e) {
        console.error('Save Analysis wrapper error:', e);
        throw e;
    }
}

export async function getAllHistory() {
    try {
        if (!db) await initDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const index = store.index('timestamp');
            const request = index.openCursor(null, 'prev'); // Newest first

            const results = [];

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    results.push(cursor.value);
                    cursor.continue();
                } else {
                    console.log(`Loaded ${results.length} history items`);
                    resolve(results);
                }
            };

            request.onerror = (event) => {
                console.error('Error getting history:', event.target.error);
                reject(event.target.error);
            };
        });
    } catch (e) {
        console.error('Get All History wrapper error:', e);
        throw e;
    }
}

export async function deleteHistoryItem(id) {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}

export async function clearAllHistory() {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}

export async function updateHistoryItem(data) {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(data);

        request.onsuccess = () => {
            console.log('History item updated successfully');
            resolve(request.result);
        };
        request.onerror = (event) => reject(event.target.error);
    });
}

export async function getHistoryItemById(id) {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}
