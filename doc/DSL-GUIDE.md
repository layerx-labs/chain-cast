# ChainCast DSL Programming Guide

This guide explains how to write event processing pipelines using the ChainCast Domain-Specific Language (DSL), compile them, and deploy them as ChainCasts.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Language Structure](#language-structure)
3. [Instructions Reference](#instructions-reference)
4. [Compilation](#compilation)
5. [Creating a ChainCast](#creating-a-chaincast)
6. [Examples](#examples)
7. [Best Practices](#best-practices)

---

## Quick Start

### 1. Create a DSL File

Create a file named `my-pipeline.yaml`:

```yaml
version: "1.0"
name: "ERC20 Transfer Monitor"
description: "Monitor and log all Transfer events"

program:
  - filter-events:
      events: ["Transfer"]

  - debug:
      variables: [event]

  - webhook:
      url: "https://api.example.com/events"
      body: event
```

### 2. Validate Your Pipeline

```bash
bun run castc validate my-pipeline.yaml
```

### 3. Compile to JSON

```bash
# Output to file
bun run castc compile my-pipeline.yaml -o output.json

# Output base64 (for ChainCast API)
bun run castc compile my-pipeline.yaml --base64
```

### 4. Create a ChainCast

Use the compiled output with the ChainCast GraphQL API to create your event processor.

---

## Language Structure

Every DSL file has this structure:

```yaml
version: "1.0"          # Required: DSL version
name: "Pipeline Name"    # Optional: Human-readable name
description: "..."       # Optional: Description

program:                 # Required: List of instructions
  - instruction1:
      arg1: value1
  - instruction2:
      arg2: value2
```

### Key Concepts

- **Instructions** execute sequentially from top to bottom
- **Variables** store intermediate values (use dot notation: `event.returnValues.amount`)
- **Branches** allow conditional execution paths
- Built-in variables: `event` (current blockchain event), `cast` (ChainCast metadata)

---

## Instructions Reference

### Event Filtering

#### `filter-events`

Filters which events to process. Halts execution for non-matching events.

```yaml
- filter-events:
    events: ["Transfer", "Approval"]  # Array of event names
```

### Variable Management

#### `set`

Sets a global variable to a value.

```yaml
- set:
    variable: threshold
    value: 1000

# Complex values
- set:
    variable: config
    value:
      enabled: true
      limit: 100
```

#### `debug`

Logs variables for debugging.

```yaml
- debug:
    variables: [event, cast, myVariable]
```

### String Transformations

#### `transform-string`

Transforms string values.

```yaml
- transform-string:
    from: event.returnValues.name
    transform: uppercase  # See available transforms below
    to: formattedName

# With delimiter for split
- transform-string:
    from: csvData
    transform: split
    delimiter: ","
    to: dataArray
```

**Available transforms:**
- `capitalize` - First letter uppercase
- `lowercase` - All lowercase
- `uppercase` - All uppercase
- `trim` - Remove whitespace
- `camelize` - camelCase
- `underscore` - snake_case
- `dasherize` - kebab-case
- `bigint` - Convert to bigint string
- `int` - Convert to integer
- `number` - Convert to number
- `split` - Split string (requires `delimiter`)

### Number Transformations

#### `transform-number`

Performs arithmetic operations.

```yaml
- transform-number:
    left: event.returnValues.amount
    right: divisor
    transform: divide
    to: normalizedAmount
```

**Available transforms:**
- `add` - Addition
- `subtract` - Subtraction
- `multiply` - Multiplication
- `divide` - Division
- `pow` - Power/exponentiation
- `bigint` - Convert to BigInt

### Object Transformations

#### `transform-object`

Manipulates objects.

```yaml
# Get all keys
- transform-object:
    from: event.returnValues
    transform: keys
    to: eventKeys

# Get specific value
- transform-object:
    from: event.returnValues
    transform: value
    key: amount
    to: eventAmount

# Delete a key
- transform-object:
    from: myObject
    transform: delete
    key: sensitiveData
    to: cleanedObject
```

**Available transforms:**
- `keys` - Get object keys as array
- `values` - Get object values as array
- `value` - Get single key value (requires `key`)
- `delete` - Delete a key (requires `key`)

### Array Transformations

#### `transform-array`

Manipulates arrays.

```yaml
# Get length
- transform-array:
    from: myArray
    transform: length
    to: arrayLength

# Get element at position
- transform-array:
    from: myArray
    transform: at
    position: 0
    to: firstElement

# Remove last element
- transform-array:
    from: myArray
    transform: pop
    to: lastElement
```

**Available transforms:**
- `length` - Get array length
- `at` - Get element at position (requires `position`)
- `pop` - Remove and return last element
- `shift` - Remove and return first element

### Template Transformations

#### `transform-template`

Creates strings using Handlebars templates.

```yaml
- transform-template:
    context:
      - event.returnValues.from
      - event.returnValues.to
      - event.returnValues.amount
    template: "Transfer: {{var0}} -> {{var1}}: {{var2}} tokens"
    to: message
```

Context variables are accessed as `{{var0}}`, `{{var1}}`, etc.

### Conditional Logic

#### `condition`

Executes different branches based on conditions.

```yaml
- condition:
    when:
      all:  # AND conditions (use 'any' for OR)
        - variable: event.returnValues.amount
          operator: ">"
          compareTo: threshold
    then: branch_0
    else: branch_1
    branches:
      branch_0:
        - webhook:
            url: "https://api.example.com/high-value"
            body: event
      branch_1:
        - debug:
            variables: [event]
```

**Available operators:**
- `>` - Greater than
- `>=` - Greater than or equal
- `<` - Less than
- `<=` - Less than or equal
- `=` - Equal
- `!=` - Not equal

### Integrations

#### `webhook`

Sends HTTP POST request to a URL.

```yaml
- webhook:
    url: "https://api.example.com/events"
    body: event
    auth: apiKeyVariable  # Optional: Variable containing auth token
```

#### `bullmq`

Adds a message to a BullMQ queue.

```yaml
- bullmq:
    queue: "event-processor"
    body: event
```

#### `elasticsearch`

Indexes a document in Elasticsearch.

```yaml
- elasticsearch:
    url: elasticUrl          # Variable containing ES URL
    username: elasticUser    # Variable containing username
    password: elasticPass    # Variable containing password
    index: "blockchain-events"
    body: event
```

#### `spreadsheet`

Appends data to a Google Sheet.

```yaml
- spreadsheet:
    auth: googleAuthBase64   # Base64-encoded Google credentials
    spreadsheetId: "1234567890abcdef"
    range: "Sheet1!A:Z"
    body: rowData
```

---

## Compilation

### CLI Commands

```bash
# Validate without compiling
bun run castc validate input.yaml

# Compile to JSON
bun run castc compile input.yaml -o output.json

# Compile to base64 (for API)
bun run castc compile input.yaml --base64

# Compile with minified output
bun run castc compile input.yaml --minify -o output.json

# Watch mode (auto-recompile on changes)
bun run castc watch input.yaml -o output.json

# Convert JSON back to DSL
bun run castc decompile input.json -o output.yaml
```

### Programmatic Usage

```typescript
import { compile, validate } from '@/dsl';

const source = `
version: "1.0"
name: "My Pipeline"
program:
  - filter-events:
      events: ["Transfer"]
`;

// Validate
const validation = validate(source);
if (!validation.success) {
  console.error(validation.errors);
}

// Compile
const result = compile(source, { base64: true });
if (result.success) {
  console.log(result.data.base64);  // Use this with ChainCast API
}
```

---

## Creating a ChainCast

Once you have compiled your DSL to base64, create a ChainCast using the GraphQL API:

### GraphQL Mutation

```graphql
mutation CreateChainCast {
  createContractCast(input: {
    name: "My Event Monitor"
    description: "Monitor ERC20 transfers"
    chainId: 1
    contractAddress: "0x..."
    abi: "[{\"type\":\"event\",\"name\":\"Transfer\",...}]"
    eventNames: ["Transfer"]
    program: "WwogIHsKICAgICJuYW1lIjog..."  # Base64 from castc
    fromBlock: "latest"
    enabled: true
  }) {
    id
    name
    enabled
  }
}
```

### Using the API

```typescript
import { compile } from '@/dsl';
import { createContractCast } from '@/lib/api';

// 1. Compile DSL
const dslSource = fs.readFileSync('my-pipeline.yaml', 'utf-8');
const result = compile(dslSource, { base64: true });

if (!result.success) {
  throw new Error('Compilation failed');
}

// 2. Create ChainCast
const cast = await createContractCast({
  name: 'My Monitor',
  chainId: 1,
  contractAddress: '0x...',
  abi: '[...]',
  eventNames: ['Transfer'],
  program: result.data.base64,
  fromBlock: 'latest',
  enabled: true,
});

console.log('Created ChainCast:', cast.id);
```

---

## Examples

### Example 1: High-Value Transfer Alerting

```yaml
version: "1.0"
name: "High Value Transfer Monitor"
description: "Alert on transfers over 1 million tokens"

program:
  # Only process Transfer events
  - filter-events:
      events: ["Transfer"]

  # Set threshold
  - set:
      variable: threshold
      value: 1000000000000000000000000  # 1M tokens (with 18 decimals)

  # Convert amount to number for comparison
  - transform-string:
      from: event.returnValues.value
      transform: bigint
      to: amount

  # Check if high value
  - condition:
      when:
        all:
          - variable: amount
            operator: ">"
            compareTo: threshold
      then: branch_0
      else: branch_1
      branches:
        branch_0:
          # High value - send alert
          - transform-template:
              context:
                - event.returnValues.from
                - event.returnValues.to
                - event.returnValues.value
              template: "ALERT: Large transfer from {{var0}} to {{var1}}: {{var2}}"
              to: alertMessage

          - webhook:
              url: "https://api.example.com/alerts"
              body: event

        branch_1:
          # Normal value - just log
          - debug:
              variables: [amount]
```

### Example 2: Event Indexing Pipeline

```yaml
version: "1.0"
name: "Event Indexer"
description: "Index all events to Elasticsearch"

program:
  # Transform event for indexing
  - transform-object:
      from: event.returnValues
      transform: keys
      to: eventFields

  # Create indexed document
  - set:
      variable: indexDoc
      value:
        timestamp: "${event.blockNumber}"
        txHash: "${event.transactionHash}"
        eventName: "${event.event}"
        data: "${event.returnValues}"

  # Index to Elasticsearch
  - elasticsearch:
      url: esUrl
      username: esUser
      password: esPassword
      index: "blockchain-events"
      body: event
```

### Example 3: Multi-Destination Routing

```yaml
version: "1.0"
name: "Event Router"
description: "Route events to multiple destinations"

program:
  # Filter events
  - filter-events:
      events: ["Transfer", "Approval"]

  # Route based on event type
  - condition:
      when:
        all:
          - variable: event.event
            operator: "="
            compareTo: "Transfer"
      then: branch_0
      else: branch_1
      branches:
        branch_0:
          # Transfer events go to queue
          - bullmq:
              queue: "transfers"
              body: event

        branch_1:
          # Approval events go to webhook
          - webhook:
              url: "https://api.example.com/approvals"
              body: event

  # All events get logged
  - debug:
      variables: [event]
```

---

## Best Practices

### 1. Always Filter Events First

```yaml
program:
  - filter-events:
      events: ["Transfer"]  # Filter early to avoid unnecessary processing
  - # ... rest of pipeline
```

### 2. Use Meaningful Variable Names

```yaml
- transform-string:
    from: event.returnValues.value
    transform: number
    to: transferAmount  # Descriptive name
```

### 3. Add Debug Instructions During Development

```yaml
- debug:
    variables: [event, myVariable]  # Helps troubleshoot issues
```

### 4. Handle Both Branches in Conditions

```yaml
- condition:
    when:
      all:
        - variable: amount
          operator: ">"
          compareTo: threshold
    then: branch_0
    else: branch_1
    branches:
      branch_0:
        - webhook:
            url: "..."
            body: event
      branch_1:
        - debug:
            variables: [amount]  # Don't leave empty
```

### 5. Validate Before Deploying

Always validate your DSL before creating a ChainCast:

```bash
bun run castc validate my-pipeline.yaml
```

### 6. Use Version Control

Keep your `.yaml` DSL files in version control alongside your other code.

---

## Troubleshooting

### Common Errors

**"Unknown instruction"**
- Check spelling of instruction name
- Valid instructions: `filter-events`, `set`, `debug`, `condition`, `transform-string`, `transform-number`, `transform-object`, `transform-array`, `transform-template`, `webhook`, `bullmq`, `elasticsearch`, `spreadsheet`

**"Missing required field"**
- Ensure all required fields are present
- Check indentation (YAML is indentation-sensitive)

**"Invalid operator"**
- Valid operators: `>`, `>=`, `<`, `<=`, `=`, `!=`

### Getting Help

- Check the [ChainCast documentation](./README.md)
- Review the [instruction reference](#instructions-reference) above
- Use `castc validate` to check for errors

---

## Version History

- **1.0** - Initial DSL release with all 13 instructions
