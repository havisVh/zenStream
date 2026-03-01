import { DatabaseSync } from 'node:sqlite';
const database = new DatabaseSync('/user.db');

const generateUserToken = (): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 16; i++) {
        token += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return token;
}

database.exec(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT NOT NULL UNIQUE,
    lastPlayed TEXT,
    currentTime INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);




const getUserData = (token: string) => {

    if (token != ""){
    const query = database.prepare(`
        SELECT * FROM users WHERE token = '${token}'`)

    const result = query.get();

    if(!result){
        const newToken = generateUserToken();
        database.exec(`
            INSERT INTO users (token,currentTime) VALUES ('${newToken}',0)
        `);
        return { token: newToken, lastPlayed: null, currentTime: 0 };
    }else{
        return { token: result.token, lastPlayed: result.lastPlayed, currentTime: result.currentTime };
    }
    }else{
        const newToken = generateUserToken();
        database.exec(`
            INSERT INTO users (token,currentTime) VALUES ('${newToken}',0)
        `);
        return { token: newToken, lastPlayed: null, currentTime: 0 };
        
    }
}


const setLastPlayed = (token: string, lastPlayed: string,currentTime:number) => {
    database.exec(`
        UPDATE users SET lastPlayed = '${lastPlayed}', currentTime = ${currentTime} WHERE token = '${token}'
    `);
}

export { getUserData, setLastPlayed  };