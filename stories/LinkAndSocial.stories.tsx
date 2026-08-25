import { action } from "@storybook/addon-actions";
import { LinkButton } from "../src/components/LinkButton";
import { SocialButton } from "../src/components/SocialButton";
import { ChevronIcon } from "../src/components/icons";
import type {
  LinkButtonSize,
  LinkButtonType,
} from "../src/components/LinkButton";
import type { SocialBrand, SocialHierarchy } from "../src/components/SocialButton";

const LINK_TYPES: LinkButtonType[] = ["primary", "information", "neutral", "success", "colored", "inverted"];
const BRANDS: SocialBrand[] = ["apple", "google", "facebook", "linkedin", "x", "github"];

// ---------------------------------------------------------------------------
// Link Button
// ---------------------------------------------------------------------------
function LinkPlaygroundRender({
  type,
  size,
  label,
  fab,
  disabled,
  startIcon,
  endIcon,
}: {
  type?: LinkButtonType;
  size?: LinkButtonSize;
  label?: string;
  fab?: boolean;
  disabled?: boolean;
  startIcon?: boolean;
  endIcon?: boolean;
}) {
  return (
    <div style={{ padding: "40px", background: type === "inverted" ? "var(--color-background-fill-inverted-default)" : "var(--color-background-surface-secondary)" }}>
      <LinkButton
        type={type}
        size={size}
        fab={fab}
        disabled={disabled}
        startIcon={startIcon ? <ChevronIcon /> : undefined}
        endIcon={endIcon ? <ChevronIcon style={{ transform: "rotate(180deg)" }} /> : undefined}
        onClick={action("link-click")}
      >
        {label}
      </LinkButton>
    </div>
  );
}

export const LinkPlayground = {
  args: {
    type: "primary",
    size: "medium",
    label: "Learn more",
    fab: false,
    disabled: false,
    startIcon: false,
    endIcon: false,
  },
  argTypes: {
    type: { control: "select", options: LINK_TYPES },
    size: { control: "select", options: ["x-small", "small", "medium", "large", "x-large"] },
    label: { control: "text", if: { arg: "fab", truthy: false } },
    fab: { control: "boolean", description: "Icon-only link" },
    disabled: { control: "boolean" },
    startIcon: { control: "boolean" },
    endIcon: { control: "boolean" },
  },
  render: LinkPlaygroundRender,
};

export function LinkAllStates() {
  return (
    <div style={{ padding: "32px 40px", maxWidth: "1280px" }}>
      <h1 style={{ font: "700 28px/1.3 system-ui, sans-serif", marginBottom: "4px" }}>Link Button</h1>
      <p style={{ font: "400 14px/1.5 system-ui, sans-serif", opacity: 0.6, marginBottom: "24px" }}>
        Synced from the Figma “LINK BUTTON” page (Type × State × Size). Hover to see states.
      </p>

      {LINK_TYPES.map((type) => (
        <section
          key={type}
          style={{
            marginBottom: "32px",
            padding: "20px",
            borderRadius: "12px",
            background: type === "inverted" ? "var(--color-background-fill-inverted-default)" : "transparent",
          }}
        >
          <h2 style={{ font: "600 15px/1.4 system-ui, sans-serif", margin: "0 0 10px", textTransform: "capitalize", color: type === "inverted" ? "#fff" : undefined }}>
            {type}
          </h2>
          <div style={{ display: "flex", gap: "24px", alignItems: "center", flexWrap: "wrap" }}>
            {["enabled", "hovered", "disabled"].map((state) => (
              <div key={state} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <span style={{ width: "56px", fontFamily: "system-ui, sans-serif", fontSize: "11px", opacity: 0.6 }}>{state}</span>
                <span
                  onMouseEnter={(e) => {
                    const btn = e.currentTarget.querySelector("button");
                    btn?.dispatchEvent(new MouseEvent("mouseenter"));
                  }}
                  style={{ display: "inline-flex" }}
                >
                  <LinkButton
                    type={type}
                    size="medium"
                    disabled={state === "disabled"}
                    startIcon={<ChevronIcon />}
                    onClick={action(`link-${type}-${state}`)}
                  >
                    Learn more
                  </LinkButton>
                </span>
              </div>
            ))}
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              {(["x-small", "small", "medium", "large", "x-large"] as LinkButtonSize[]).map((s) => (
                <LinkButton key={s} type={type} size={s} endIcon={<ChevronIcon style={{ transform: "rotate(180deg)" }} />} onClick={action(`link-${type}-${s}`)}>
                  {s}
                </LinkButton>
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

LinkAllStates.parameters = { layout: "fullscreen" };

// ---------------------------------------------------------------------------
// Social Buttons
// ---------------------------------------------------------------------------
function SocialPlaygroundRender({
  brand,
  hierarchy,
  label,
  iconOnly,
  disabled,
}: {
  brand?: SocialBrand;
  hierarchy?: SocialHierarchy;
  label?: string;
  iconOnly?: boolean;
  disabled?: boolean;
}) {
  return (
    <div style={{ padding: "40px", background: "var(--color-background-surface-secondary)", display: "flex", gap: "16px", flexWrap: "wrap" }}>
      <SocialButton brand={brand} hierarchy={hierarchy} disabled={disabled} onClick={action("social-click")}>
        {iconOnly ? null : label ?? undefined}
      </SocialButton>
    </div>
  );
}

export const SocialPlayground = {
  args: {
    brand: "google",
    hierarchy: "filled",
    label: "",
    iconOnly: true,
    disabled: false,
  },
  argTypes: {
    brand: { control: "select", options: BRANDS },
    hierarchy: { control: "radio", options: ["filled", "tint", "outlined"] },
    label: {
      control: "text",
      description: "Custom label — leave empty for the brand default (“Continue with …”)",
      if: { arg: "iconOnly", truthy: false },
    },
    iconOnly: { control: "boolean", description: "Hide label (FAB-style square button)" },
    disabled: { control: "boolean" },
  },
  render: SocialPlaygroundRender,
};

export function SocialAllStates() {
  return (
    <div style={{ padding: "32px 40px", maxWidth: "1100px", background: "var(--color-background-surface-secondary)", minHeight: "100vh" }}>
      <h1 style={{ font: "700 28px/1.3 system-ui, sans-serif", marginBottom: "4px" }}>Social Buttons</h1>
      <p style={{ font: "400 14px/1.5 system-ui, sans-serif", opacity: 0.6, marginBottom: "24px" }}>
        Synced from the Figma “SOCIAL BUTTONS” page (Hierarchy × Brand × State).
      </p>

      {(["filled", "tint", "outlined"] as SocialHierarchy[]).map((hierarchy) => (
        <section key={hierarchy} style={{ marginBottom: "32px" }}>
          <h2 style={{ font: "600 15px/1.4 system-ui, sans-serif", margin: "0 0 10px", textTransform: "capitalize" }}>{hierarchy}</h2>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "12px" }}>
            {BRANDS.map((b) => (
              <SocialButton key={b} brand={b} hierarchy={hierarchy} onClick={action(`social-${hierarchy}-${b}`)} />
            ))}
          </div>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "12px" }}>
            {BRANDS.map((b) => (
              <SocialButton key={b} brand={b} hierarchy={hierarchy} disabled />
            ))}
          </div>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            {BRANDS.map((b) => (
              <SocialButton key={b} brand={b} hierarchy={hierarchy} aria-label={`Continue with ${b}`} onClick={action(`social-fab-${b}`)} />
            ))}
            <span style={{ fontFamily: "system-ui, sans-serif", fontSize: "11px", opacity: 0.5, alignSelf: "center" }}>↑ icon-only (FAB)</span>
          </div>
        </section>
      ))}
    </div>
  );
}

SocialAllStates.parameters = { layout: "fullscreen" };

export default {
  title: "Components/Buttons",
  component: LinkButton,
  parameters: { layout: "centered" },
};
