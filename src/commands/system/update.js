import chalk from "chalk";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function updateCommand() {
    const spinner = ora(chalk.cyan('Checking for update ...')).start();

    try {
        const packageJsonPath = path.resolve(__dirname, '../../../package.json');
        const pkg = await fstat.readJson(packageJsonPath);

        const currentVersion = pkg.version;
        const packageName = pkg.name;
        let latestVersion;
        try {
            latestVersion = execSync(`npm views ${packageName} version` , {encoding : 'utf-8'}).trim();

        } catch(e) {
            spinner.warn(chalk.yellow('Could not found registry'));
        }

        if (latestVersion == currentVersion) {
            ora(chalk.green(`Flowdev is up to date ! You are already using the latest version ${currentVersion}`));
        }
    }

    catch(error){

    }

}