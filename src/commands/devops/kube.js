import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';

export async function kubeCommand() {
  const rootDir = process.cwd();
  const spinner = ora(chalk.cyan('Checking project readiness...')).start();

  try {
    const projectName = path.basename(rootDir).toLowerCase().replace(/[^a-z0-9]/g, '-');
    let port = 3000; 
    let hasDockerfile = await fs.pathExists(path.join(rootDir, 'Dockerfile'));

    
    if (hasDockerfile) {
      const dockerfile = await fs.readFile('Dockerfile', 'utf-8');
      const exposeMatch = dockerfile.match(/EXPOSE\s+(\d+)/);
      if (exposeMatch) port = exposeMatch[1];
      spinner.text = chalk.blue('Docker configuration detected. Syncing ports...');
    } else {
      
      spinner.text = chalk.yellow('No Dockerfile found. Using smart defaults...');
      if (await fs.pathExists('package.json')) {
        const pkg = await fs.readJson('package.json');
       
      }
    }

    spinner.text = chalk.magenta('Generating Kubernetes Manifests...');

    const k8sContent = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${projectName}
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ${projectName}
  template:
    metadata:
      labels:
        app: ${projectName}
    spec:
      containers:
      - name: ${projectName}
        image: ${projectName}:latest 
        ports:
        - containerPort: ${port}
---
apiVersion: v1
kind: Service
metadata:
  name: ${projectName}-service
spec:
  selector:
    app: ${projectName}
  ports:
    - protocol: TCP
      port: 80
      targetPort: ${port}
  type: LoadBalancer
`.trim();

    await fs.writeFile(path.join(rootDir, 'k8s.yaml'), k8sContent);
    
    spinner.succeed(chalk.green('Kubernetes manifests generated!'));

    
    if (!hasDockerfile) {
      console.log(chalk.yellow(`\n  Warning: No Dockerfile found in this directory.`));
      console.log(`Kubernetes needs a Docker image to run your app.`);
      console.log(`Recommended: Run ${chalk.bold('flowdev dockerize')} first.`);
    }

    console.log(chalk.gray('\nConfiguration details:'));
    console.log(`${chalk.blue('→ Deployment Name:')} ${projectName}`);
    console.log(`${chalk.blue('→ Target Port:')} ${port}`);
    console.log(`\nNext: ${chalk.yellow('kubectl apply -f k8s.yaml')}`);

  } catch (error) {
    spinner.fail(chalk.red('Kube generation failed.'));
    console.error(error);
  }
}