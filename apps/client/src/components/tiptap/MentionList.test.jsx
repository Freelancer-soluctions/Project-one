import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { MentionList } from "./MentionList"

describe("MentionList", () => {
  const mockItems = [
    { id: "1", label: "User One" },
    { id: "2", label: "User Two" },
    { id: "3", label: "User Three" },
  ]

  const mockCommand = vi.fn()

  beforeEach(() => {
    mockCommand.mockClear()
  })

  it("renders mention items correctly", () => {
    render(<MentionList items={mockItems} command={mockCommand} />)
    
    expect(screen.getByText("User One")).toBeInTheDocument()
    expect(screen.getByText("User Two")).toBeInTheDocument()
    expect(screen.getByText("User Three")).toBeInTheDocument()
  })

  it("calls command with correct item when clicked", () => {
    render(<MentionList items={mockItems} command={mockCommand} />)
    
    fireEvent.click(screen.getByText("User Two"))
    
    expect(mockCommand).toHaveBeenCalledWith(mockItems[1])
  })

  it("calls command with correct item when mouse down event occurs", () => {
    render(<MentionList items={mockItems} command={mockCommand} />)
    
    const userThreeButton = screen.getByText("User Three")
    fireEvent.mouseDown(userThreeButton)
    
    expect(mockCommand).toHaveBeenCalledWith(mockItems[2])
  })

  it("shows no results message when items array is empty", () => {
    render(<MentionList items={[]} command={mockCommand} />)
    
    expect(screen.getByText("No se encontraron resultados")).toBeInTheDocument()
  })
})