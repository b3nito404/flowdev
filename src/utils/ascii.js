
/**
 * @fileoverview FlowDev  -  Intelligent CLI tool
 * @module flowdev
 * @version 1.2.0
 * * @license MIT
 * Copyright (c) 2026 FlowDev Technologies.
 * * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 */

import figlet from 'figlet';
import gradient from 'gradient-string';
import chalk from 'chalk';

export async function showLogo() {
  try {
    const text = 'FLOWDEV';
    const subTitle = "System intelligence & Workflow automation";
    
    const data = figlet.textSync(text, {
      font: 'ANSI Shadow',
      horizontalLayout: 'full',
    });

    const colors = [
      { color: '#fe0000', pos: 0 },   
      { color: '#f02e20', pos: 0.2 },
      { color: '#f35322', pos: 0.6 },  
      { color: '#ff6a00', pos: 1 }     
    ];

    const flowGradient = gradient(colors);

    const lines = data.split('\n').filter(line => line.trim() !== "");
    const maxLength = Math.max(...lines.map(l => l.length));
    
    const padding = "       "; 

    const b = (char) => chalk.whiteBright.bold(char); 

    console.log(""); 

             
    console.log(`${padding}${b('┏━')} ${" ".repeat(maxLength - 2)} ${b('━┓')}`);

    lines.forEach(line => {
      console.log(`${padding}   ${flowGradient(line)}`);
    });

    console.log(`${padding}   ${chalk.whiteBright.bold(subTitle)}`);

    console.log(`${padding}${b('┗━')} ${" ".repeat(maxLength - 2)} ${b('━┛')}`);
    
    console.log(""); 

  } catch (err) {
    console.log(chalk.red.bold('\n   FLOWDEV'));
  }
}