# Week 1 Reflection - Support Intake CLI

## Issue Encountered
When running the CLI, I got:
`TypeError: inquirer.prompt is not a function`

## Root Cause
The installed version of Inquirer (v13) changed its export system.  
The default CommonJS import (`require("inquirer")`) did not expose `prompt` directly.

## Fix Applied
I fixed the issue by importing Inquirer like this:

```js
const inquirer = require("inquirer").default;