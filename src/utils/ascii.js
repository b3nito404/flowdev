import figlet from 'figlet';
import gradient from 'gradient-string';
import { promisify } from 'util';

const figletPromise = promisify(figlet);

export async function showLogo() {
  try {
   
    const data = await figletPromise('FLOWDEV', {
      font: 'ANSI Shadow', 
      horizontalLayout: 'full',
    });

    const Gradient = gradient([
      { color: '#00f2fe', pos: 0 },   
      { color: '#7db9e8', pos: 0.2 },
      { color: '#ee0979', pos: 0.6 },  
      { color: '#ff6a00', pos: 1 }     
    ]);

    console.log('\n' + Gradient.multiline(data));
    console.log(  gradient.atlas('System intelligence & Workflow automation'));
  } catch (err) {
    console.error('Erreur logo:', err);
  }
}