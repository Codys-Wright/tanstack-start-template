# AGENTS.md

<!-- effect-solutions:start -->

## Effect Solutions Usage

The Effect Solutions CLI provides curated best practices and patterns for Effect TypeScript. Before working on Effect code, check if there's a relevant topic that covers your use case.

- `bunx effect-solutions list` - List all available topics
- `bunx effect-solutions show <slug...>` - Read one or more topics
- `bunx effect-solutions search <term>` - Search topics by keyword

**Local Effect Source:** The Effect repository is cloned to `~/.local/share/effect-solutions/effect` for reference. Use this to explore APIs, find usage examples, and understand implementation details when the documentation isn't enough.

<!-- effect-solutions:end -->

## Code Style

- **Runtime**: Bun only. No Node.js, npm, pnpm, vite, dotenv.
- **TypeScript**: Strict mode enabled. ESNext target.
- **Effect**: Use `Effect.gen` for async code, `BunRuntime.runMain` for entry points.
- **Imports**: External packages first, then local. Use `.ts` extensions for local imports.
- **Bun APIs**: Prefer `Bun.file`, `Bun.serve`, `bun:sqlite`, `Bun.$` over Node equivalents.
- **Testing**: Use `bun:test` with `import { test, expect } from "bun:test"`.

## Scripts

- run `bun check` to check for errors

## Error Handling

- Use Effect's error channel for typed errors.
- Use `Effect.tryPromise` for async operations, `Effect.try` for sync.
- Pipe errors through Effect combinators, don't throw.

## btca

When the user says "use btca", use btca before you answer the question. It will give you up to date information about the technology.

Run:

- btca ask -t <tech> -q "<question>"

Available <tech>: svelte, tailwindcss, opentui, runed, effect, shiki

## ShadCN Component Pattern

All compound UI components use a **namespace pattern** via `Object.assign()`. This provides a cleaner API and better discoverability.

### Pattern Example

```tsx
// Import only the root component
import { Card, Dialog, DropdownMenu } from "@shadcn"

// Access sub-components via dot notation
<Card>
  <Card.Header>
    <Card.Title>Title</Card.Title>
    <Card.Description>Description</Card.Description>
  </Card.Header>
  <Card.Content>Content here</Card.Content>
  <Card.Footer>Footer</Card.Footer>
</Card>

<Dialog>
  <Dialog.Trigger asChild>
    <Button>Open</Button>
  </Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Title</Dialog.Title>
    </Dialog.Header>
  </Dialog.Content>
</Dialog>

<DropdownMenu>
  <DropdownMenu.Trigger asChild>
    <Button>Menu</Button>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content>
    <DropdownMenu.Item>Item 1</DropdownMenu.Item>
    <DropdownMenu.Separator />
    <DropdownMenu.Item>Item 2</DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu>
```

### Component Reference

| Component      | Common Sub-components                                                                        |
| -------------- | -------------------------------------------------------------------------------------------- |
| `Card`         | `.Header`, `.Title`, `.Description`, `.Content`, `.Footer`, `.Action`                        |
| `Dialog`       | `.Trigger`, `.Content`, `.Header`, `.Title`, `.Description`, `.Footer`, `.Close`             |
| `DropdownMenu` | `.Trigger`, `.Content`, `.Item`, `.Separator`, `.Label`, `.Group`                            |
| `AlertDialog`  | `.Trigger`, `.Content`, `.Header`, `.Title`, `.Description`, `.Footer`, `.Action`, `.Cancel` |
| `Tabs`         | `.List`, `.Trigger`, `.Content`                                                              |
| `Avatar`       | `.Image`, `.Fallback`                                                                        |
| `Alert`        | `.Title`, `.Description`                                                                     |
| `Sheet`        | `.Trigger`, `.Content`, `.Header`, `.Title`, `.Description`, `.Footer`, `.Close`             |
| `Popover`      | `.Trigger`, `.Content`, `.Anchor`                                                            |
| `Table`        | `.Header`, `.Body`, `.Row`, `.Head`, `.Cell`, `.Footer`, `.Caption`                          |
| `Select`       | `.Trigger`, `.Value`, `.Content`, `.Item`, `.Group`, `.Label`, `.Separator`                  |
| `Accordion`    | `.Item`, `.Trigger`, `.Content`                                                              |
| `Form`         | `.Control`, `.Label`, `.Error`, `.FieldInput`, `.FieldTextarea`, `.FieldSelect`              |

### Simple Components (No Sub-components)

These are used directly without dot notation:
`Button`, `Input`, `Textarea`, `Checkbox`, `Switch`, `Label`, `Badge`, `Separator`, `Skeleton`, `Spinner`, `Progress`, `Slider`, `Toggle`, `Kbd`
