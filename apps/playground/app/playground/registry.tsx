import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Input,
  Label,
} from "@rdna/radiants/components/core";
import type { RegistryEntry } from "./types";

export const registry: RegistryEntry[] = [
  // ── Button ────────────────────────────────────────────────────────────
  {
    id: "button",
    label: "Button",
    group: "Core",
    Component: Button as RegistryEntry["Component"],
    defaultProps: {
      children: "Click me",
      variant: "primary",
      size: "md",
    },
    sourcePath: "packages/radiants/components/core/Button/Button.tsx",
    schemaPath: "packages/radiants/components/core/Button/Button.schema.json",
    propsInterface: `variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
size?: 'sm' | 'md' | 'lg'
fullWidth?: boolean
active?: boolean
icon?: React.ReactNode
children?: React.ReactNode`,
  },

  // ── Card ──────────────────────────────────────────────────────────────
  {
    id: "card",
    label: "Card",
    group: "Core",
    Component: (props: Record<string, unknown>) => {
      const variant = (props.variant as string) ?? "default";
      return (
        <Card variant={variant as "default" | "dark" | "raised"}>
          <CardHeader>{String(props.headerText ?? "Card Title")}</CardHeader>
          <CardBody>{String(props.bodyText ?? "Card content goes here. This is a preview of the Card component with header, body, and footer slots.")}</CardBody>
          <CardFooter>
            <Button size="sm" variant="secondary">Action</Button>
          </CardFooter>
        </Card>
      );
    },
    defaultProps: {
      variant: "default",
      headerText: "Card Title",
      bodyText: "Card content goes here. This is a preview of the Card component with header, body, and footer slots.",
    },
    sourcePath: "packages/radiants/components/core/Card/Card.tsx",
    schemaPath: "packages/radiants/components/core/Card/Card.schema.json",
    propsInterface: `variant?: 'default' | 'dark' | 'raised'
noPadding?: boolean
children: React.ReactNode
Subcomponents: CardHeader, CardBody, CardFooter`,
  },

  // ── Input ─────────────────────────────────────────────────────────────
  {
    id: "input",
    label: "Input",
    group: "Core",
    Component: (props: Record<string, unknown>) => {
      const size = (props.size as string) ?? "md";
      return (
        <div className="flex w-full flex-col gap-2">
          <Label htmlFor="playground-input">
            {String(props.labelText ?? "Full Name")}
          </Label>
          <Input
            id="playground-input"
            placeholder={String(props.placeholder ?? "Enter your name")}
            size={size as "sm" | "md" | "lg"}
          />
        </div>
      );
    },
    defaultProps: {
      size: "md",
      placeholder: "Enter your name",
      labelText: "Full Name",
    },
    sourcePath: "packages/radiants/components/core/Input/Input.tsx",
    schemaPath: "packages/radiants/components/core/Input/Input.schema.json",
    propsInterface: `size?: 'sm' | 'md' | 'lg'
error?: boolean
fullWidth?: boolean
icon?: React.ReactNode
placeholder?: string
Related: TextArea, Label`,
  },
];
