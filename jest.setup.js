// jest.setup.js
// @ts-expect-error // Jest setup runs in CJS, require is expected
const dotenv = require('dotenv');
// @ts-expect-error // Jest setup runs in CJS, require is expected
const path = require('path');

// Load environment variables from .env.test
// @ts-expect-error // dotenv.config is part of CJS module
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });
