import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OPENAPI_PATH = path.join(__dirname, 'openapi.yaml');

/**
 * Loads and parses the MedSlot OpenAPI 3.0.3 YAML specification.
 */
export function loadOpenApiSpec() {
  const raw = fs.readFileSync(OPENAPI_PATH, 'utf8');
  return YAML.parse(raw);
}
