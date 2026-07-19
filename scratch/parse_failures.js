import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const jsonPath = path.join(__dirname, 'test_output.json');

try {
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const failures = [];
  
  if (data.testResults) {
    for (const testSuite of data.testResults) {
      if (testSuite.assertionResults) {
        for (const test of testSuite.assertionResults) {
          if (test.status === 'failed') {
            failures.push({
              fullName: test.fullName,
              title: test.title,
              error: test.failureMessages ? test.failureMessages.join('\n') : ''
            });
          }
        }
      }
    }
  }

  console.log(`Found ${failures.length} failures:\n`);
  failures.forEach((f, i) => {
    console.log(`--- Failure #${i + 1} ---`);
    console.log(`FullName: ${f.fullName}`);
    console.log(`Title: ${f.title}`);
    console.log(`Error:\n${f.error.substring(0, 500)}...\n`);
  });
} catch (e) {
  console.error(e);
}
