#!/usr/bin/env node
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { diffLines } from 'diff';
import chalk from 'chalk';
import { Object } from './object.mjs';

const META_DIRS = ["objects", "ref/heads"]
const META_FILES = ["index", "HEAD"]
const GIT_FOLDER = ".mygit"

export class MyGit {

    constructor()
    {
        this.indexPath = path.join(GIT_FOLDER, META_FILES[0]);
        this.objectsPath = path.join(GIT_FOLDER, META_DIRS[0]);
        this.headPath = path.join(GIT_FOLDER, META_FILES[1]);
        this.repoPath = GIT_FOLDER
        this.refHeadsPath = path.join(GIT_FOLDER, META_DIRS[1]);
    }

    // Initialize a folder with git
    async init(){
        if (fs.existsSync(GIT_FOLDER)) {
            console.log("Repo is already initialized")
        }
        await fs.promises.mkdir(GIT_FOLDER, {recursive:true});
        for (const mdir of META_DIRS){
            await fs.promises.mkdir(path.join(GIT_FOLDER, mdir),{recursive:true})
        }

        for (const mfile of META_FILES){
            var content = ''
            if((path.join(GIT_FOLDER, mfile) == this.indexPath) || (path.join(GIT_FOLDER, mfile) == this.headPath)){
                content = JSON.stringify([])
            }
            fs.writeFile(path.join(GIT_FOLDER, mfile), content , (err) => {
                if (err) {
                    console.error(`Error writing file : ${mfile}`, err);
                }
            });
        }

        // create main as default branch
        await this.createBranch("main");
        await this.checkoutBranch("main");
    }

    //create a hash for the content supplied
    hashObject(content){
        return crypto.createHash('sha1').update(content, 'utf-8').digest('hex');
    }

    //add file
    async add(fileToBeAddedPath){
        // Read the content of the file to be added
       const fileData = fs.readFileSync(fileToBeAddedPath, {encoding: 'utf-8'});
        // Generate a hash of the file data
       const fileHash =this.hashObject(fileData);
       // Create the new path using the hashed value
       const newFileHashedObjectPath=path.join(this.objectsPath, fileHash);
       // Write the file to the new location with the hashed filename
       await fs.writeFile(newFileHashedObjectPath,fileData, (err) => {
        if (err) {
            console.error(`Error creating branch : ${brachName}`, err);
        }
        });
       // add to index file
       this.updateIndex(fileToBeAddedPath, fileHash);
    }
    async updateIndex(filePath, fileHash){
        // read index file
        const index= JSON.parse(await fs.readFileSync(this.indexPath,{encoding:'utf-8'}));
        // update index file
        index.push({hash:fileHash, path:filePath});
        // save it again
        await fs.writeFile(this.indexPath, JSON.stringify(index), (err) => {
            if (err) {
                console.error(`Error creating branch : ${brachName}`, err);
            }
        });
    }

    async clearIndex(){
        await fs.writeFile(this.indexPath, JSON.stringify([]), (err) => {
            if (err) {
                console.error(`Error creating branch : ${brachName}`, err);
            }
        });
    }

    createIndexTree(index) {

        return index.reduce((obj, entry) => {
          const path = entry.path;
          const segments =  path.split(/[\/\\]/);  // regex matches both forward slash (/) and backslash (\)

          // Pop the last element/file and traverse the rest
          const lastSegment = segments.pop();
          
          // Traverse the path and build the nested object structure
          let leaf = segments.reduce((dct, segment) => {
            dct[segment] = dct[segment] || {};  // Create or access the nested object
            return dct[segment];
          }, obj);
      
          // Assign hash to the last element/file
          leaf[lastSegment] = entry.hash;
      
          return obj;
        }, {});
    }

    buildCommitTree(name, tree) {
        // Generate hash from the current time and name
        const hash = crypto.createHash('sha1').update(new Date().toISOString() + name).digest('hex');
        // create the changes tree root
        const object = new Object(hash, this.objectsPath);

        object.write((file) => {
        // Iterate through the tree
        for (const key in tree)
        {
            if (typeof tree[key] === 'object') 
            {
            // If the value is an object, recursively call buildCommitTree
            const dirSha = buildCommitTree(key, tree[key]);
            file.write(`tree ${dirSha} ${key}\n`);
            } 
            else 
            {
            // If the value is a string, it's a file with content (blob)
            file.write(`blob ${tree[key]} ${key}\n`);
            }
        }
        }); 
        // Return the SHA of this object
        return hash;
    }

    async updateRef(hash){
        const currBranch = await this.getCurrentBranch();
        const commitList = JSON.parse(await fs.readFileSync(currBranch, {encoding:'utf-8'}));
        commitList.push(hash)
        await fs.writeFile(currBranch, JSON.stringify(commitList), (err) => {
            if (err) {
                console.error(`Error creating branch : ${brachName}`, err);
            }
        });
    }

    
    async getCurrentBranch(){
        const res = JSON.parse(await fs.readFileSync(this.headPath, { encoding:'utf-8'}));
        return res[0]
    }

    async createBranch(brachName){
        if (fs.existsSync(path.join(this.refHeadsPath, brachName))) {
            console.log("Branch already exists")
            return;
        }
        await fs.writeFile(path.join(this.refHeadsPath, brachName), JSON.stringify([]) , (err) => {
            if (err) {
                console.error(`Error creating branch : ${brachName}`, err);
            }
        });
    }

    async checkoutBranch(brachName){
        if (!fs.existsSync(path.join(this.refHeadsPath, brachName))) {
            console.log(`Branch ${brachName} does not exist and hence cannot be chacked out`)
            return;
        }
        const head = JSON.stringify([`${this.refHeadsPath}/${brachName}`]);
        fs.writeFile(this.headPath, head, (err) => {
            if (err) {
                console.error(`Error creating branch : ${brachName}`, err);
            }
        });
    }

    async history(){
        const currBranch = await this.getCurrentBranch();
        const commitList = JSON.parse(await fs.readFileSync(currBranch, {encoding:'utf-8'}));
        console.log('------------- HISTORY ----------------\n')
        for (const commit of commitList){
            console.log("Commit", commit)
            const commitData = await fs.readFileSync(path.join(this.objectsPath, commit), {encoding:'utf-8'})
            console.log(`${commitData}\n`)
        }
    }

    async commit(message){
        const index =JSON.parse( await fs.readFileSync(this.indexPath, {encoding: 'utf-8'}));
        const indexSize = index.length;
        if(indexSize <= 0){
            console.log("Nothing to commit, please ensure you have added files");
            return;
        }
        const indexTree = this.createIndexTree(index);

        const rootHash = this.buildCommitTree('root', indexTree)
        const commitData = {
            timeStamp : new Date().toISOString(),
            message,
            rootHash,
            files: index
        };
        const commitHash =this.hashObject(JSON.stringify(commitData));
        const object = new Object(commitHash, this.objectsPath);
        object.write((file) => {
            file.write(JSON.stringify(commitData));
        });
        this.updateRef(commitHash)
        this.clearIndex()
        console.log('--------------------------------------------------\n')
        console.log(`Commit successfully created: ${commitHash}`);
        console.log('--------------------------------------------------\n')
        console.log(JSON.stringify(commitData))  
    }

    async getCommitData(commitHash){
        try{
            const fl = path.join(this.objectsPath, commitHash)
            const commitData = JSON.parse(await fs.readFileSync(fl, { encoding:'utf-8'}));
            return commitData
        }
        catch(err){
            console.log(`Failed to get data for commit with hash: ${commitHash}`)
            return null
        }
        
    }

    async showCommitDiff(commitHash)
    {
        const commitData = JSON.parse(await this.getCommitData(commitHash));
        if (!commitData){
            console.log(`Commit with commit hash ${commitHash} not found`);
            return;
        }
        console.log ('----------------------------------------------------------\n')
        for(const file of commitData.files)
        {
            console.log(`File: ${file.path}\n`);
            const fileContent = await fs.readFileSync(path.join(this.objectsPath, file.hash), {encoding:'utf-8'});
            if (commitData.parent){
                const parentCommitData =JSON.parse(await this.getCommitData(commitData,parent));
                const getParentFileContent = await this.getFileContent(parentCommitData,filePath);
                if (getParentFileContent !== undefined){
                    console.log ('\nDiff:')
                    const diff = diffLines(getParentFileContent,fileContent)
                    console.log (diff);
                    diff.forEach(part => {
                        if (part.added){
                            process.stdout.write(chalk.green( "++",part.value));
                        }else if(part.removed){
                            process.stdout.write(chalk.red("--",part.value));
                        }else{
                            process.stdout.write(chalk.gray(part.value));
                        }      
                });
                console.log();
                }else console.log ('New file in this commit');
            } 
            else
            {
                
            }
        }
    }
}
    