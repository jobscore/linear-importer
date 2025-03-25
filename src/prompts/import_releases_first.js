import inquirer from "inquirer";
import { detailedLogger } from "../../logger/logger_instance.js";

async function importReleasesFirst() {
  const { shouldImportReleasesFirst } = await inquirer.prompt([
    {
      type: "list",
      name: "shouldImportReleasesFirst",
      message: "Do you want to import release markers first? Importing them first will allow you to assign sub issues. If you choose not to import them first, you will keep them in the same order as the original source.",
      choices: [
        { name: "Yes", value: true },
        { name: "No", value: false },
      ],
      default: true,
    },
  ]);

  detailedLogger.info(`shouldImportComments: ${shouldImportReleasesFirst}`);

  return shouldImportReleasesFirst;
}

export default importReleasesFirst;
