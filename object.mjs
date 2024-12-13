import path, { join } from 'path';
import { createWriteStream } from 'fs'

export class Object {
    constructor(sha, objectsPath) {
      this.sha = sha;
      this.filePath = path.join(objectsPath, sha)
    }
  
    async write(cb) {
        const writeStream = createWriteStream(this.filePath);
        cb(writeStream);
        writeStream.end();
    }
  }