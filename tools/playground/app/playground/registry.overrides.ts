/**
 * Playground-specific overrides for components whose best demo props
 * or prompt context cannot be inferred automatically from schema.json.
 *
 * These overrides layer on top of the shared registry and manifest data.
 * Only add entries here when the auto-generated metadata is insufficient
 * for the playground iteration/generation workflow.
 */

export interface PlaygroundOverride {
  /** Props interface description for iteration prompt context */
  propsInterface?: string;
  /** Override default props when manifest/schema defaults are insufficient */
  defaultProps?: Record<string, unknown>;
}

/**
 * Keyed by PascalCase component name from the shared registry.
 *
 * propsInterface strings are human-readable prop descriptions
 * used in the iteration prompt. They intentionally diverge from
 * schema.json when the prompt needs different framing.
 */
export const playgroundOverrides: Record<string, PlaygroundOverride> = {
  Button: {
    propsInterface: `mode?: 'solid' | 'flat' | 'ghost' | 'text' | 'pattern'
tone?: 'accent' | 'danger' | 'success' | 'neutral' | 'cream' | 'white' | 'info' | 'tinted'
size?: 'sm' | 'md' | 'lg'
rounded?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
fullWidth?: boolean
active?: boolean
iconOnly?: boolean
textOnly?: boolean
disabled?: boolean
icon?: string | React.ReactNode
children?: React.ReactNode`,
  },

  Card: {
    propsInterface: `variant?: 'default' | 'inverted' | 'raised'
rounded?: 'sm' | 'md' | 'lg'
children: React.ReactNode
Subcomponents: CardHeader, CardBody, CardFooter`,
  },

  Input: {
    propsInterface: `size?: 'sm' | 'md' | 'lg'
error?: boolean
fullWidth?: boolean
icon?: React.ReactNode
placeholder?: string
Related: TextArea, Label`,
  },

  Badge: {
    propsInterface: `variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
children: React.ReactNode`,
  },

  Alert: {
    propsInterface: `Namespace API: Alert.Root, Alert.Content, Alert.Title, Alert.Description
variant implied by content`,
  },

  Checkbox: {
    propsInterface: `checked: boolean
onChange: (e) => void
label?: string`,
  },

  Switch: {
    propsInterface: `checked: boolean
onChange: (checked: boolean) => void
label?: string`,
  },

  Slider: {
    propsInterface: `value: number
onChange: (value: number) => void
min?: number
max?: number`,
  },

  Tooltip: {
    propsInterface: `content: string
children: React.ReactNode (trigger element)`,
  },

  Breadcrumbs: {
    propsInterface: `items: Array<{ label: string, href?: string }>`,
  },

  Divider: {
    propsInterface: `variant?: 'solid' | 'dashed' | 'decorated'`,
  },
};
