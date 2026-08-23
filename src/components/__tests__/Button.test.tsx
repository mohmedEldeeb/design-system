import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "../Button";
import type { ButtonHierarchy, ButtonSize, ButtonType } from "../Button";

const TYPES: ButtonType[] = ["brand", "neutral", "destructive"];
const HIERARCHIES: ButtonHierarchy[] = ["filled", "tint", "outlined", "ghost"];
const SIZES: ButtonSize[] = ["x-small", "small", "medium", "large", "x-large"];

describe("variant matrix completeness", () => {
  it.each(TYPES)("renders every hierarchy for %s", (type) => {
    for (const hierarchy of HIERARCHIES) {
      const { unmount } = render(<Button type={type} hierarchy={hierarchy} />);
      expect(screen.getByRole("button")).toBeInTheDocument();
      unmount();
    }
  });

  it("renders every size", () => {
    for (const size of SIZES) {
      const { unmount } = render(<Button size={size}>Continue</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
      unmount();
    }
  });

  it.each([true, false] as const)("renders fab=%s and disabled states without crashing", (fab) => {
    for (const disabled of [false, true]) {
      const { unmount } = render(
        <Button fab={fab} disabled={disabled} aria-label="Action">
          Continue
        </Button>
      );
      expect(screen.getByRole("button")).toBeInTheDocument();
      unmount();
    }
  });
});

describe("behavior", () => {
  it("click fires onClick; disabled does not", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { rerender } = render(<Button onClick={onClick}>Continue</Button>);
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(<Button onClick={onClick} disabled>Continue</Button>);
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("icons", () => {
  it("startIcon/endIcon render exactly two icon slots", () => {
    render(
      <Button startIcon={<span data-testid="start" />} endIcon={<span data-testid="end" />}>
        Continue
      </Button>
    );
    expect(screen.getByTestId("start")).toBeInTheDocument();
    expect(screen.getByTestId("end")).toBeInTheDocument();
  });

  it("deprecated leftIcon alias still works as startIcon fallback", () => {
    render(<Button leftIcon={<span data-testid="legacy" />}>Continue</Button>);
    expect(screen.getByTestId("legacy")).toBeInTheDocument();
  });
});

describe("consumer prop composition (spread-order regression guards)", () => {
  it("consumer onMouseEnter composes with internal hover tracking", async () => {
    const user = userEvent.setup();
    const consumerEnter = vi.fn();
    render(
      <Button onMouseEnter={consumerEnter} hierarchy="filled">
        Continue
      </Button>
    );
    await user.hover(screen.getByRole("button"));
    expect(consumerEnter).toHaveBeenCalledTimes(1);
    // internal hover style applied: filled default → vibrant hover bg
    expect(screen.getByRole("button").style.background).toContain(
      "var(--color-background-brand-vibrant-hover)"
    );
  });

  it("consumer style merges over computed styles without destroying variants", () => {
    render(<Button style={{ margin: "7px" }}>Continue</Button>);
    const btn = screen.getByRole("button");
    expect(btn.style.margin).toBe("7px");
    // variant styling survives the merge
    expect(btn.style.borderRadius).not.toBe("");
  });
});
