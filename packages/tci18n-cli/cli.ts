#!/usr/bin/env node

import { Command } from 'commander';
import { Init, Transform } from './index';
// import packageJson from './package.json';

const program = new Command();

program
    .command('transform')
    .description('将匹配的文件进行国际化转换')
    .action((options) => {
        new Transform().start(options);
    });

program
    .command('init')
    .description('初始化配置文件')
    .action(() => {
        new Init().start();
    });
program.parse();
