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