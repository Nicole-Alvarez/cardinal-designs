import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DraftNumberInput, DraftTextInput } from "./draft-inputs";
import { NumberInput } from "./inspector-controls";

describe("DraftNumberInput", () => {
  it("allows an empty draft and restores the value on blur", async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<DraftNumberInput aria-label="Width" value={120} min={16} onCommit={onCommit} />);

    const input = screen.getByLabelText("Width");
    await user.clear(input);
    expect(input).toHaveValue(null);
    expect(onCommit).not.toHaveBeenCalled();

    await user.tab();
    expect(input).toHaveValue(120);
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("commits a valid number once on blur", async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<DraftNumberInput aria-label="Width" value={120} min={16} onCommit={onCommit} />);

    const input = screen.getByLabelText("Width");
    await user.clear(input);
    await user.type(input, "240");
    await user.tab();

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(240);
  });

  it("reverts an out-of-range number", async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<DraftNumberInput aria-label="Grid" value={8} min={4} max={64} onCommit={onCommit} />);

    const input = screen.getByLabelText("Grid");
    await user.clear(input);
    await user.type(input, "2");
    await user.tab();

    expect(input).toHaveValue(8);
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("cancels with Escape", async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<DraftNumberInput aria-label="X" value={20} onCommit={onCommit} />);

    const input = screen.getByLabelText("X");
    await user.clear(input);
    await user.type(input, "99");
    await user.keyboard("{Escape}");

    expect(input).toHaveValue(20);
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("commits negative coordinates when no minimum is set", async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<DraftNumberInput aria-label="X" value={20} integer onCommit={onCommit} />);

    const input = screen.getByLabelText("X");
    await user.clear(input);
    await user.type(input, "-32");
    await user.tab();

    expect(onCommit).toHaveBeenCalledWith(-32);
  });
});

describe("DraftTextInput", () => {
  it("restores a required title when the draft is blank or whitespace", async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<DraftTextInput aria-label="Title" value="Member Card" required onCommit={onCommit} />);

    const input = screen.getByLabelText("Title");
    await user.clear(input);
    await user.tab();
    expect(input).toHaveValue("Member Card");

    await user.click(input);
    await user.clear(input);
    await user.type(input, "   ");
    await user.tab();

    expect(input).toHaveValue("Member Card");
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("trims and commits a valid title on Enter", async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<DraftTextInput aria-label="Title" value="Member Card" required onCommit={onCommit} />);

    const input = screen.getByLabelText("Title");
    await user.clear(input);
    await user.type(input, "  Updated Card  ");
    await user.keyboard("{Enter}");

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith("Updated Card");
  });

  it("cancels a title draft with Escape", async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<DraftTextInput aria-label="Title" value="Member Card" required onCommit={onCommit} />);

    const input = screen.getByLabelText("Title");
    await user.clear(input);
    await user.type(input, "Temporary");
    await user.keyboard("{Escape}");

    expect(input).toHaveValue("Member Card");
    expect(onCommit).not.toHaveBeenCalled();
  });
});

describe("NumberInput integration", () => {
  it("does not emit zero while cleared and commits a valid blur once", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumberInput aria-label="Overlay margin" value={12} min={0} onChange={onChange} />);

    const input = screen.getByLabelText("Overlay margin");
    await user.clear(input);
    expect(onChange).not.toHaveBeenCalled();

    await user.type(input, "24");
    await user.tab();

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(24);
  });
});
