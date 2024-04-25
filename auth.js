const fs = require('fs').promises;

async function manageSession(page) {
    const sessionFile = 'session.json';
    let session = null;
    try {
        const sessionData = await fs.readFile(sessionFile);
        session = JSON.parse(sessionData);
    } catch (error) {
        console.log('Keine Session-Datei gefunden. Eine neue Session wird erstellt.');
    }

    if (session) {
        await page.evaluateOnNewDocument(session => {
            localStorage.clear();
            for (let key in session.storage) {
                localStorage.setItem(key, session.storage[key]);
            }
        }, session);
        await page.setCookie(...session.cookies);
        await page.goto('https://stake.com/casino/games/blackjack', { waitUntil: 'networkidle0' });
    } else {
        await page.goto('https://stake.com/');
        await page.waitForFunction(() => window.location.href.includes('/casino/games/mines'), { timeout: 180000 });
        session = await page.evaluate(() => {
            let session = {storage: {}};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                try {
                    session.storage[key] = localStorage.getItem(key);
                } catch (error) {
                    console.warn(`Fehler beim Speichern von localStorage-Schlüssel "${key}":`, error);
                }
            }
            return session;
        });
        session.cookies = await page.cookies();
        await fs.writeFile(sessionFile, JSON.stringify(session));
    }
    return session;
}

module.exports = { manageSession };
