# Install dependencies

cd cli && npm install

# Build

npm run build

# Configure AI provider

node dist/index.js config

# Start interactive chat

node dist/index.js chat

# Review code

node dist/index.js review --all
node dist/index.js review src/app.ts src/utils.ts

# Fix bugs

node dist/index.js fix src/buggy-file.ts

# Refactor

node dist/index.js refactor src/old-code.ts -s "use modern async/await"

# Install globally

npm link
code-agent chat

code-agent --help
code-agent config
code-agent chat
code-agent review --all
