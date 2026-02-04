import chalk from 'chalk';

export const logger = {
  info: (msg) => {
    console.log(`${chalk.blue.bold(' INFO')}    ${msg}`);
  },
  
  success: (msg) => {
    console.log(`${chalk.green.bold(' SUCCESS')} ${msg}`);
  },
  
  warn: (msg) => {
    console.log(`${chalk.yellow.bold(' WARN')}    ${msg}`);
  },
  
  error: (msg) => {
    console.log(`${chalk.red.bold(' ERROR')}   ${msg}`);
  },
  
  log: (msg) => {
    console.log(msg);
  }
};