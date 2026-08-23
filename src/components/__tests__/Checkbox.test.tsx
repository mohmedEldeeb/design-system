import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Checkbox } from "../Checkbox";
import type { CheckboxHierarchy, CheckboxSize } from "../Checkbox";

const HIERARCHIES: CheckboxHierarchy[] = ["filled", "tint", "outline"];
const SIZES: CheckboxSize[] = ["small", "medium", "large"];

describe("variant matrix completeness", () => {
  // Regression net: any missing entry in UNCHECKED/CHECKED/DISABLED maps
  // throws during render (past real bug: missing UNCHECKED.tint).
  it.each(HIERARCHIES)("renders every size × state for %s", (hierarchy) => {
    for (const size of SIZES) {
      for (const state of [false, true, "indeterminate"] as const) {
        for (const disabled of [false, true]) {
          const { unmount } = render(
            <Checkbox
              hierarchy={hierarchy}
              size={size}
              checked={state === "indeterminate" ? false : state}
              indeterminate={state === "indeterminate"}
              disabled={disabled}
            />
          );
          expect(screen.getByRole("checkbox")).toBeInTheDocument();
          unmount();
        }
      }
    }
  });
});

describe("behavior", () => {
  it("toggles when clicked (uncontrolled)", async () => {
    const user = userEvent.setup();
    render(<Checkbox defaultChecked={false} />);
    const box = screen.getByRole("checkbox");
    expect(box).toHaveAttribute("aria-checked", "false");
    await user.click(box);
    expect(box).toHaveAttribute("aria-checked", "true");
    await user.click(box);
    expect(box).toHaveAttribute("aria-checked", "false");
  });

  it("stays on the controlled value until the prop changes", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Checkbox checked={false} />);
    const box = screen.getByRole("checkbox");
    await user.click(box);
    expect(box).toHaveAttribute("aria-checked", "false");
    rerender(<Checkbox checked />);
    expect(box).toHaveAttribute("aria-checked", "true");
  });

  it("transitions indeterminate → checked with onCheckedChange(true)", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Checkbox checked={false} indeterminate onCheckedChange={onCheckedChange} />);
    await user.click(screen.getByRole("checkbox"));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("disabled ignores clicks", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Checkbox disabled onCheckedChange={onCheckedChange} />);
    await user.click(screen.getByRole("checkbox"));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("space toggles via keyboard", async () => {
    const user = userEvent.setup();
    render(<Checkbox />);
    const box = screen.getByRole("checkbox");
    box.focus();
    await user.keyboard("[Space]");
    expect(box).toHaveAttribute("aria-checked", "true");
  });

  it("forwards id / aria-label / data-* to the root element", () => {
    render(
      <Checkbox
        id="terms"
        data-testid="forwarded"
        aria-label="Accept terms"
      />
    );
    const box = screen.getByTestId("forwarded");
    expect(box).toHaveAttribute("id", "terms");
    expect(box).toHaveAttribute("aria-label", "Accept terms");
  });

  it("onCheckedChange receives boolean | 'indeterminate'", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Checkbox defaultChecked={false} onCheckedChange={onCheckedChange} />);
    await user.click(screen.getByRole("checkbox"));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });
});
