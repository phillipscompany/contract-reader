import fs from "fs";
import path from "path";
import Handlebars from "handlebars";

/**
 * Loads a prompt file (plain text or Handlebars template) and injects variables.
 * Example:
 * const prompt = loadPrompt('contract-full-analysis.hbs', { finalContractType: 'NDA' })
 */
export function loadPrompt(filename: string, data: Record<string, any> = {}): string {
  const promptsDir = path.resolve(__dirname, "../prompts");
  const filePath = path.join(promptsDir, filename);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Prompt file not found: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, "utf8");

  // Compile with Handlebars so we can inject variables
  const template = Handlebars.compile(raw, { noEscape: true });
  return template(data);
}
