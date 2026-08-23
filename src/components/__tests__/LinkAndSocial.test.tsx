import { describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LinkButton } from "../LinkButton";
import { SocialButton } from "../SocialButton";
import type { LinkButtonType } from "../LinkButton";
import type { SocialBrand, SocialHierarchy } from "../SocialButton";

const LINK_TYPES: LinkButtonType[] = [
  "primary",
  "information",
  "neutral",
  "success",
  "colored",
  "inverted",
];

const BRANDS: SocialBrand[] = ["apple", "google", "facebook", "linkedin", "x", "github"];
const SOCIAL_HIERARCHIES: SocialHierarchy[] = ["filled", "tint", "outlined"];

describe("LinkButton", () => {
  it.each(LINK_TYPES)("renders every type: %s", (type) => {
    render(<LinkButton type={type}>Learn more</LinkButton>);
    expect(screen.getByRole("button")).toBeInTheDocument();
    cleanup();
  });

  it("click fires onClick; disabled does not", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { rerender } = render(<LinkButton onClick={onClick}>Learn more</LinkButton>);
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(
      <LinkButton onClick={onClick} disabled>
        Learn more
      </LinkButton>
    );
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
    cleanup();
  });

  it("consumer style merges without destroying computed styles", () => {
    render(<LinkButton style={{ margin: "3px" }}>Learn more</LinkButton>);
    const btn = screen.getByRole("button");
    expect(btn.style.margin).toBe("3px");
    expect(btn.style.textDecoration).toBe("none");
  });
});

describe("SocialButton", () => {
  it.each(BRANDS)("renders every brand: %s", (brand) => {
    render(<SocialButton brand={brand}>Continue</SocialButton>);
    expect(screen.getByRole("button")).toBeInTheDocument();
    cleanup();
  });

  it.each(SOCIAL_HIERARCHIES)("renders every hierarchy: %s", (hierarchy) => {
    for (const disabled of [false, true]) {
      render(
        <SocialButton hierarchy={hierarchy} disabled={disabled}>
          Continue
        </SocialButton>
      );
      expect(screen.getByRole("button")).toBeInTheDocument();
      cleanup();
    }
  });

  it("click fires onClick", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<SocialButton brand="github" onClick={onClick} />);
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
