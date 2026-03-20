import { defineComponentMeta } from "@rdna/preview/define-component-meta";

type AvatarSize = "sm" | "md" | "lg" | "xl";
type AvatarShape = "circle" | "square";

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
}

export const AvatarMeta = defineComponentMeta<AvatarProps>()({
  name: "Avatar",
  description:
    "User profile image with automatic fallback to initials when the image is unavailable or not provided.",
  props: {
    src: {
      type: "string",
      description: "URL of the avatar image. Falls back to initials when omitted or fails to load.",
    },
    alt: {
      type: "string",
      default: "",
      description: "Accessible alt text for the avatar image",
    },
    fallback: {
      type: "string",
      default: "",
      description: "Initials or short text shown when the image is unavailable",
    },
    size: {
      type: "enum",
      values: ["sm", "md", "lg", "xl"],
      default: "md",
      description: "Size preset controlling width, height, and text size",
    },
    shape: {
      type: "enum",
      values: ["circle", "square"],
      default: "circle",
      description: "Border-radius shape of the avatar",
    },
  },
  slots: {},
  examples: [
    {
      name: "Image avatar",
      code: '<Avatar src="/avatars/user.jpg" alt="Jane Doe" />',
    },
    {
      name: "Fallback initials",
      code: '<Avatar fallback="JD" />',
    },
    {
      name: "Large square",
      code: '<Avatar src="/avatars/user.jpg" alt="Jane Doe" size="lg" shape="square" />',
    },
  ],
  tokenBindings: {
    base: {
      border: "line",
    },
    image: {
      objectFit: "cover",
    },
    fallback: {
      background: "tinted",
      text: "main",
      font: "monospace",
    },
  },
  registry: {
    category: "data-display",
    tags: ["avatar", "user", "image", "profile"],
    renderMode: "custom",
  },
});
