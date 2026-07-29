import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next-themes", () => ({
  useTheme: vi.fn(() => ({ theme: "light", setTheme: vi.fn() })),
}));

import { useTheme } from "next-themes";
import { ThemeToggle } from "@/components/ThemeToggle";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ThemeToggle", () => {
  it("renders a button when mounted", () => {
    render(<ThemeToggle />);
    expect(screen.getByRole("button", { name: /toggle theme/i })).toBeInTheDocument();
  });

  it("calls setTheme with 'dark' when current theme is light", async () => {
    const setTheme = vi.fn();
    vi.mocked(useTheme).mockReturnValue({ theme: "light", setTheme } as unknown as ReturnType<typeof useTheme>);

    const user = userEvent.setup();
    render(<ThemeToggle />);
    await user.click(screen.getByRole("button"));
    expect(setTheme).toHaveBeenCalledWith("dark");
  });

  it("calls setTheme with 'light' when current theme is dark", async () => {
    const setTheme = vi.fn();
    vi.mocked(useTheme).mockReturnValue({ theme: "dark", setTheme } as unknown as ReturnType<typeof useTheme>);

    const user = userEvent.setup();
    render(<ThemeToggle />);
    await user.click(screen.getByRole("button"));
    expect(setTheme).toHaveBeenCalledWith("light");
  });
});
