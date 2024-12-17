import chalk, { Chalk }  from 'chalk';

const log = (fn: Chalk) => {
    return (...args: string[]) => {
        console.log(fn(...args));
    }
}

export default {
    success: log(chalk.green),
    info: log(chalk.black),
    error: log(chalk.red),
    warn: log(chalk.yellow),
    blue: log(chalk.blue),
    cyan: log(chalk.cyan),
};