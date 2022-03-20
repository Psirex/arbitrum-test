import dotenv from "dotenv";

export function loadEnvVariables(variableNames: string[]) {
  dotenv.config();
  const res: Record<string, string> = {};
  for (const variableName of variableNames) {
    const value = process.env[variableName];
    if (!value) {
      throw new Error(
        `Error: set your '${variableName}' environmental variable `
      );
    }
    res[variableName] = value;
  }
  return res;
}

export const requireEnvVariables = (envVars: string[]) => {
  for (const envVar of envVars) {
    if (!process.env[envVar]) {
      throw new Error(`Error: set your '${envVar}' environmental variable `);
    }
  }
  console.log("Environmental variables properly set 👍");
};
