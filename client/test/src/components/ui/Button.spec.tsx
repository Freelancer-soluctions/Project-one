import { Button } from "@/components/ui/button";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

describe("Button Component", () => {
  it("renders the default button", () => {
    render(<Button>Click Me</Button>);
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-zinc-900"); // Verifica la clase por defecto
  });

  it("renders a destructive button", () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole("button", { name: /delete/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-red-500"); // Verifica la clase destructiva
  });

  it("supports different sizes", () => {
    render(<Button size="lg">Large Button</Button>);
    const button = screen.getByRole("button", { name: /large button/i });
    expect(button).toHaveClass("h-10"); // Verifica el tamaño grande
  });
});
