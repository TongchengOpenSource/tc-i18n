import fs from 'fs';

class File {
    existsSync(filePath: string) {
        return fs.existsSync(filePath);
    }

    readFileSync(filePath: string) {
        return fs.readFileSync(filePath, 'utf8');
    }
}

export default File;