import { MyGit } from './myGit.mjs'
import { Command } from 'commander'

const program =  new Command()
const myGit =  new MyGit()

program.command('init').action(async () => await myGit.init());

program.command('add')
.argument('<file>', 'the name of file to add')
.action(async file => await myGit.add(file));

program.command('commit')
.argument('<message>', 'commit message')
.action(async message =>await myGit.commit(message));

program.command('history')
.action(async () => await myGit.history());

program.command('branch')
.argument('<branch>', 'branch name')
.action(async branch => await myGit.createBranch(branch));

program.command('checkout')
.argument('<branch>', 'branch name')
.action(async branch => await myGit.checkoutBranch(branch));

program.parse(process.argv)